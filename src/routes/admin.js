// ===== TRANG QUẢN TRỊ: CRUD theo bảng cho dishes, chefs, ingredients =====
//   GET    /admin/:resource             danh sách + khung chi tiết bên phải (?page=2&sel=ID mở sẵn món ID)
//   GET    /admin/:resource/new         form thêm
//   GET    /admin/:resource/:id/edit    form sửa (200 | 404)
//   GET    /admin/:resource/:id/delete  trang xác nhận xóa (200 | 404)
//   POST   /admin/:resource             thêm            -> 303
//   PATCH  /admin/:resource/:id         sửa             -> 303 (lỗi: 400 + form sửa)
//   DELETE /admin/:resource/:id         xóa sau khi xác nhận -> 303 (bị chặn: 409)
// Form HTML chỉ có GET/POST nên PATCH/DELETE đi qua method-override (?_method=...),
// hoàn toàn phía server, không dùng fetch/AJAX/JS client.
const express = require("express");
const resources = require("../admin/resources");
const { parseId, asyncHandler } = require("../utils/format");
const { khop, layQ } = require("../utils/tim-kiem");
const multer = require("multer");
const { uploadImage, removeImage, EXT } = require("../utils/storage");

// nhận ảnh trong RAM (không ghi ra đĩa vì Render xóa đĩa mỗi lần deploy), tối đa 3MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXT[file.mimetype]) req.loiAnh = "Chỉ nhận ảnh JPG, PNG hoặc WEBP";
    cb(null, !!EXT[file.mimetype]);
  },
});
// lỗi ảnh không làm sập request mà đưa vào errors.image để form báo lại
const nhanAnh = (req, res, next) =>
  upload.single("image")(req, res, (err) => {
    if (err)
      req.loiAnh =
        err.code === "LIMIT_FILE_SIZE"
          ? "Ảnh tối đa 3MB"
          : "Không đọc được ảnh, vui lòng thử lại";
    next();
  });
const router = express.Router();
const PER_PAGE = 9; // lưới 3x3
const navResources = Object.values(resources).map(({ key, title }) => ({
  key,
  title,
}));
const FLASH = {
  created: "Thêm thành công.",
  updated: "Cập nhật thành công.",
  deleted: "Xóa thành công.",
};

router.use((req, res, next) => {
  res.locals.navResources = navResources;
  res.locals.flash = FLASH[req.query.success] || null;
  next();
});

router.get("/", (req, res) => res.redirect(303, "/admin/dishes"));

async function findRecord(r, idParam) {
  const id = parseId(idParam);
  if (!id) return null;
  return r.model.findByPk(id, { include: r.include });
}

async function renderForm(
  res,
  r,
  { record = null, values, errors = {}, status = 200 },
) {
  const options = await r.loadOptions();
  res
    .status(status)
    .render("admin/form", { r, record, values, errors, options });
}

// Trang xác nhận xóa (phía server). loi = lý do không được xóa (nếu có).
async function renderConfirm(res, r, record, { status = 200 } = {}) {
  const loi = r.blockDelete ? await r.blockDelete(record) : null;
  res.status(status).render("admin/xoa", { r, record, loi });
}

// Vẽ trang danh sách. sel = id đang mở ở khung chi tiết.
async function renderList(req, res, r, { sel = null, status = 200 } = {}) {
  const q = layQ(req);
  // tìm theo tên (không phân biệt hoa/thường và dấu), dùng chung với trang khách
  const all = (
    await r.model.findAll({ include: r.include, order: r.order })
  ).filter((x) => khop(r.label(x), q));
  // phân trang phía server: /admin/dishes?page=2
  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const asked = parseInt(req.query.page, 10);
  const page = Math.min(
    Math.max(Number.isInteger(asked) ? asked : 1, 1),
    totalPages,
  );
  const rows = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const selId = sel || parseId(req.query.sel);
  res.status(status).render("admin/list", {
    r,
    rows,
    q,
    page,
    totalPages,
    total: all.length,
    sel: rows.some((x) => x.id === selId) ? selId : null,
  });
}

Object.values(resources).forEach((r) => {
  const base = `/${r.key}`;

  router.get(
    base,
    asyncHandler((req, res) => renderList(req, res, r)),
  );

  router.get(
    `${base}/new`,
    asyncHandler(async (req, res) => {
      const empty = Object.fromEntries(
        r.fields.map((f) => [
          f.name,
          f.type === "multiselect" ? [] : f.type === "checkbox" ? true : "",
        ]),
      );
      await renderForm(res, r, { values: empty });
    }),
  );

  router.get(
    `${base}/:id/edit`,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      await renderForm(res, r, { record, values: r.toValues(record) });
    }),
  );

  router.get(
    `${base}/:id/delete`,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      await renderConfirm(res, r, record);
    }),
  );

  router.post(
    base,
    nhanAnh,
    asyncHandler(async (req, res) => {
      const { errors, values, data } = await r.parse(req.body, null);
      if (req.loiAnh) errors.image = req.loiAnh;
      if (Object.keys(errors).length) {
        return renderForm(res, r, { values, errors, status: 400 });
      }
      if (req.file) {
        const img = await uploadImage(req.file);
        data.imageUrl = img.url;
        data.imagePath = img.path;
      }
      const record = await r.model.create(data);
      if (r.afterSave) await r.afterSave(record, data);
      res.redirect(303, `/admin${base}?success=created`);
    }),
  );

  router.patch(
    `${base}/:id`,
    nhanAnh,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      const { errors, values, data } = await r.parse(req.body, record);
      if (req.loiAnh) errors.image = req.loiAnh;
      if (Object.keys(errors).length) {
        return renderForm(res, r, { record, values, errors, status: 400 });
      }
      const anhCu = record.imagePath;
      if (req.file) {
        const img = await uploadImage(req.file);
        data.imageUrl = img.url;
        data.imagePath = img.path;
      }
      await record.update(data);
      if (req.file) await removeImage(anhCu); // lưu DB xong mới xóa ảnh cũ
      if (r.afterSave) await r.afterSave(record, data);
      res.redirect(303, `/admin${base}?sel=${record.id}&success=updated`);
    }),
  );

  router.delete(
    `${base}/:id`,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      const blockReason = r.blockDelete ? await r.blockDelete(record) : null;
      if (blockReason) return renderConfirm(res, r, record, { status: 409 });
      await record.destroy();
      if (r.hasImage) await removeImage(record.imagePath);
      res.redirect(303, `/admin${base}?success=deleted`);
    }),
  );
});

module.exports = router;
