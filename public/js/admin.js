// ===== TRANG QUẢN TRỊ (phía trình duyệt): khung chi tiết bên phải =====
// Server (src/routes/admin.js) đã dựng sẵn từng khối chi tiết `.ct` (đang ẩn);
// file này chỉ lo các nút: Đóng (×), Sửa, Hủy, Xóa (có pop up xác nhận).
(() => {
  const chia = $("#chia");
  if (!chia) return;

  // ---- Đóng khung chi tiết ----
  function dongCT() {
    chia.classList.remove("co-chon");
    chia.querySelectorAll(".o.chon").forEach((o) => o.classList.remove("chon"));
    // chờ khung thu lại xong mới ẩn nội dung cho mượt
    setTimeout(() => {
      if (chia.classList.contains("co-chon")) return;
      chia.querySelectorAll(".ct").forEach((s) => {
        s.hidden = true;
        s.classList.remove("dang-sua");
      });
    }, 600);
    // bỏ ?sel= khỏi thanh địa chỉ (chỉ khi đang ở trang danh sách, tránh làm hỏng URL sau khi form báo lỗi)
    if (/^\/admin\/[^/]+\/?$/.test(location.pathname)) {
      const u = new URL(location.href);
      u.searchParams.delete("sel");
      history.replaceState(null, "", u);
    }
  }

  // ---- Pop up xác nhận xóa ----
  function hoiXoa(sec) {
    const ten =
      sec.querySelector(".ct-dau h2")?.textContent.trim() || "mục này";
    const form = sec.querySelector(".ct-xoa form");
    const lyDo = sec.querySelector(".ct-xoa .bao-loi"); // server báo không được xóa

    if (!form || lyDo) {
      const h = hop(`<h2>Không thể xóa</h2>
        <p>${esc(lyDo ? lyDo.textContent.trim() : "Mục này hiện không thể xóa.")}</p>
        <div class="nut-hang"><button type="button" class="nut" data-a="dong">Đóng</button></div>`);
      h.el.addEventListener("click", (e) => {
        if (e.target.dataset.a === "dong") h.dong();
      });
      return;
    }

    const h = hop(`<h2>Xác nhận xóa</h2>
      <p>Bạn có chắc chắn muốn xóa <b>${esc(ten)}</b> không?</p>
      <p class="phu-chu-nho">Hành động này không thể hoàn tác.</p>
      <div class="nut-hang">
        <button type="button" class="nut nut-phu" data-a="khong">Không xóa</button>
        <button type="button" class="nut" data-a="xoa">Xóa luôn</button>
      </div>`);
    h.el.querySelector('[data-a="khong"]').focus(); // mặc định chọn "Không xóa" cho an toàn
    h.el.addEventListener("click", (e) => {
      const a = e.target.dataset.a;
      if (a === "khong") h.dong();
      if (a === "xoa") {
        h.dong();
        form.submit(); // gửi DELETE qua ?_method=DELETE (đã nằm sẵn trong action)
      }
    });
  }

  // ---- Các nút trong khung chi tiết ----
  chia.addEventListener("click", (e) => {
    const nut = e.target.closest("[data-a]");
    if (!nut) return;
    const sec = nut.closest(".ct");
    switch (nut.dataset.a) {
      case "dong":
        dongCT();
        break;
      case "sua":
        sec.classList.add("dang-sua");
        sec
          .querySelector(".ct-sua input, .ct-sua select, .ct-sua textarea")
          ?.focus();
        break;
      case "huy":
        sec.classList.remove("dang-sua");
        break;
      case "xoa":
        hoiXoa(sec);
        break;
    }
  });
})();
