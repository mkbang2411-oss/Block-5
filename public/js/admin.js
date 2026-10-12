// Trang danh sách quản trị: bấm một ô -> lưới (và dãy số trang) trượt sang trái, khung chi tiết hiện bên phải.
// Sửa / xóa làm ngay trong khung (form thật, gửi lên server). Không có JS vẫn dùng được: ô là link ?sel=ID.
(() => {
  const chia = $("#chia");
  if (!chia) return;
  const khoi = [...chia.querySelectorAll(".ct")],
    o = [...chia.querySelectorAll(".o")];
  let dang = (khoi.find((k) => !k.hidden) || {}).dataset?.id || null;

  function dat(id) {
    dang = id;
    chia.classList.toggle("co-chon", !!id);
    o.forEach((x) => x.classList.toggle("chon", x.dataset.id === id));
    khoi.forEach((k) => {
      const mo = k.dataset.id === id;
      k.hidden = !mo;
      if (!mo) k.classList.remove("dang-sua", "dang-xoa"); // đóng thì thôi chế độ sửa / hỏi xóa
    });
    try {
      const u = new URL(location.href);
      u.searchParams.delete("success");
      id ? u.searchParams.set("sel", id) : u.searchParams.delete("sel");
      history.replaceState(null, "", u);
    } catch (e) {}
  }

  o.forEach((x) =>
    x.addEventListener("click", (e) => {
      e.preventDefault();
      dat(dang === x.dataset.id ? null : x.dataset.id);
    }),
  );
  chia.querySelector(".chi-tiet").addEventListener("click", (e) => {
    const a = e.target.dataset && e.target.dataset.a;
    const k = e.target.closest && e.target.closest(".ct");
    if (!a || !k) return;
    const xoa = k.querySelector(".ct-xoa"),
      thao = k.querySelector(".ct-thao-tac");
    if (a === "dong") dat(null);
    if (a === "sua") k.classList.add("dang-sua");
    if (a === "huy") k.classList.remove("dang-sua");
    if (a === "xoa") {
      xoa.hidden = false;
      thao.hidden = true;
    }
    if (a === "khong-xoa") {
      xoa.hidden = true;
      thao.hidden = false;
    }
  });
  addEventListener("keydown", (e) => e.key === "Escape" && dang && dat(null));
})();
