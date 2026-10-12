// ===== TRANG QUẢN TRỊ: CRUD theo bảng cho dishes, chefs, ingredients =====
//   GET    /admin/:resource             danh sách + khung chi tiết bên phải (?page=2&sel=ID mở sẵn món ID)
//   GET    /admin/:resource/new         form thêm
//   POST   /admin/:resource             thêm            -> 303
//   PATCH  /admin/:resource/:id         sửa (form nằm trong khung chi tiết) -> 303
//   DELETE /admin/:resource/:id         xóa (xác nhận ngay trong khung chi tiết) -> 303
// Form HTML chỉ có GET/POST nên PATCH/DELETE đi qua method-override (?_method=...),
// hoàn toàn phía server, không dùng fetch/AJAX/JS client.
const express = require("express");
const resources = require("../admin/resources");
const { parseId, asyncHandler } = require("../utils/format");
const { khop, layQ } = require("../utils/tim-kiem");

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

// Vẽ trang danh sách. sel = id đang mở ở khung chi tiết; sua = { values, errors } khi form sửa trả lỗi.
async function renderList(
  req,
  res,
  r,
  { sel = null, sua = null, status = 200, loi = null } = {},
) {
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
  const options = await r.loadOptions();
  const chan = {}; // id -> lý do không được xóa
  for (const row of rows)
    chan[row.id] = r.blockDelete ? await r.blockDelete(row) : null;
  const selId = sel || parseId(req.query.sel);
  res.status(status).render("admin/list", {
    r,
    rows,
    q,
    page,
    totalPages,
    total: all.length,
    options,
    chan,
    sel: rows.some((x) => x.id === selId) ? selId : null,
    sua,
    loi,
  });
}

Object.values(resources).forEach((r) => {
  const base = `/${r.key}`;
  const trang = (req) =>
    parseInt(req.query.page, 10) > 1 ? parseInt(req.query.page, 10) : 1;

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

  router.post(
    base,
    asyncHandler(async (req, res) => {
      const { errors, values, data } = await r.parse(req.body, null);
      if (Object.keys(errors).length) {
        return renderForm(res, r, { values, errors, status: 400 });
      }
      const record = await r.model.create(data);
      if (r.afterSave) await r.afterSave(record, data);
      res.redirect(303, `/admin${base}?success=created`);
    }),
  );

  router.patch(
    `${base}/:id`,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      const { errors, values, data } = await r.parse(req.body, record);
      if (Object.keys(errors).length) {
        return renderList(req, res, r, {
          sel: record.id,
          sua: { values, errors },
          status: 400,
        });
      }
      await record.update(data);
      if (r.afterSave) await r.afterSave(record, data);
      res.redirect(
        303,
        `/admin${base}?page=${trang(req)}&sel=${record.id}&success=updated`,
      );
    }),
  );

  router.delete(
    `${base}/:id`,
    asyncHandler(async (req, res, next) => {
      const record = await findRecord(r, req.params.id);
      if (!record) return next();
      const blockReason = r.blockDelete ? await r.blockDelete(record) : null;
      if (blockReason) {
        return renderList(req, res, r, {
          sel: record.id,
          status: 409,
          loi: blockReason,
        });
      }
      await record.destroy();
      res.redirect(303, `/admin${base}?page=${trang(req)}&success=deleted`);
    }),
  );
});

module.exports = router;
