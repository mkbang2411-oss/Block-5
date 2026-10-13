// ===== Khung chi tiết bên phải (admin + danh sách món): chỉ nút Đóng (×) =====
// Sửa / Xóa là link sang trang riêng do server dựng (/:id/edit, /:id/delete), không dùng popup hay fetch.
(() => {
  const chia = $("#chia");
  if (!chia) return;
  chia.addEventListener("click", (e) => {
    if (!e.target.closest('[data-a="dong"]')) return;
    chia.classList.remove("co-chon");
    chia.querySelectorAll(".o.chon").forEach((o) => o.classList.remove("chon"));
    // chờ khung thu lại xong mới ẩn nội dung cho mượt
    setTimeout(() => {
      if (chia.classList.contains("co-chon")) return;
      chia.querySelectorAll(".ct").forEach((s) => (s.hidden = true));
    }, 600);
    // bỏ ?sel= khỏi thanh địa chỉ
    const u = new URL(location.href);
    u.searchParams.delete("sel");
    history.replaceState(null, "", u);
  });
})();
