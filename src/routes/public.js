// ===== TRANG NGƯỜI DÙNG (chỉ đọc) =====
const express = require("express");
const { Dish, Chef } = require("../models");
const { parseId, asyncHandler } = require("../utils/format");
const { khop, layQ } = require("../utils/tim-kiem");

const router = express.Router();
const PER_PAGE = 9; // lưới 3x3 giống trang đầu bếp

// GET /dishes?q=...  -> danh sách món, tìm theo tên bằng query q
router.get(
  "/dishes",
  asyncHandler(async (req, res) => {
    const q = layQ(req);
    const options = {
      include: [{ model: Chef, as: "chef" }],
      order: [["name", "ASC"]],
    };
    // tìm không phân biệt hoa/thường và dấu tiếng Việt (dùng chung với trang đầu bếp)
    const all = (await Dish.findAll(options)).filter((d) => khop(d.name, q));
    // phân trang phía server: /dishes?q=...&page=2 (giống trang quản trị)
    const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
    const asked = parseInt(req.query.page, 10);
    const page = Math.min(totalPages, asked > 0 ? asked : 1);
    const dishes = all.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    // ?sel=ID mở sẵn khung chi tiết (khi không có JS); chỉ nhận món nằm trong trang hiện tại
    const selId = parseId(req.query.sel);
    const sel = dishes.some((d) => d.id === selId) ? selId : null;
    res.render("public/dishes", { dishes, q, page, totalPages, sel });
  }),
);

// GET /dishes/:id -> chi tiết món (không có nguyên liệu); id sai hoặc không có -> 404
router.get(
  "/dishes/:id",
  asyncHandler(async (req, res, next) => {
    const id = parseId(req.params.id);
    if (!id) return next();
    // khách không xem nguyên liệu nên không nạp Ingredient
    const dish = await Dish.findByPk(id, {
      include: [{ model: Chef, as: "chef" }],
    });
    if (!dish) return next();
    res.render("public/dish-detail", { dish });
  }),
);

module.exports = router;
