const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const { attachRole, requireAdmin } = require("./middleware/auth");
const { formatPrice, dishIcon, dishThumb } = require("./utils/format");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const PUBLIC = path.join(__dirname, "..", "public");
// ảnh ít đổi -> cho trình duyệt giữ 7 ngày (khỏi hỏi lại server mỗi lần chuyển cảnh)
app.use("/img", express.static(path.join(PUBLIC, "img"), { maxAge: "7d" }));
app.use(express.static(PUBLIC));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// <form method="POST" action="...?_method=PATCH|DELETE"> -> req.method = PATCH|DELETE
app.use(methodOverride("_method"));
app.use(attachRole);
app.use((req, res, next) => {
  res.locals.formatPrice = formatPrice;
  res.locals.dishIcon = dishIcon;
  res.locals.dishThumb = dishThumb;
  next();
});

app.use(require("./routes/pages"));
app.use(require("./routes/auth"));
app.use(require("./routes/public"));
app.use("/admin", requireAdmin, require("./routes/admin"));

// id sai / không có / đường dẫn lạ -> 404
app.use((req, res) => {
  res.status(404).render("error", {
    status: 404,
    message: "Không tìm thấy trang hoặc dữ liệu bạn yêu cầu.",
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .render("error", { status: 500, message: "Có lỗi xảy ra phía máy chủ." });
});

module.exports = app;