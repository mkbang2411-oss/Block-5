// Tìm món trực tiếp (dùng chung trang khách + đầu bếp): gõ tới đâu lọc tới đó.
// Lấy lại trang từ server (?q=...) rồi thay lưới + phân trang + khung chi tiết, ô gõ giữ nguyên nên không mất con trỏ.
// Không có JS thì form vẫn hoạt động bình thường (bấm Tìm).
(() => {
  const form = document.querySelector("form[data-tim]"),
    chia = document.querySelector("#chia");
  if (!form || !chia) return;
  const inp = form.elements.q,
    xoa = form.querySelector("[data-xoa]");
  let hen = null,
    stt = 0,
    ctl = null;

  async function tim() {
    const q = inp.value.trim(),
      id = ++stt;
    if (ctl) ctl.abort();
    ctl = new AbortController();
    const u = new URL(form.getAttribute("action"), location.href);
    if (q) u.searchParams.set("q", q);
    if (xoa) xoa.hidden = !q;
    try {
      const res = await fetch(u, { signal: ctl.signal });
      if (!res.ok) throw new Error(res.status);
      const doc = new DOMParser().parseFromString(
          await res.text(),
          "text/html",
        ),
        moi = doc.querySelector("#chia");
      if (!moi) throw new Error("khong-co-luoi");
      if (id !== stt) return; // đã có lần gõ mới hơn
      const cot = chia.querySelector(".cot-luoi"),
        cotMoi = moi.querySelector(".cot-luoi"),
        giu = cot.querySelector(".dau-khach"); // phần chứa ô tìm kiếm: không thay
      [...cot.children].forEach((c) => c !== giu && c.remove());
      [...cotMoi.children].forEach(
        (c) =>
          !c.classList.contains("dau-khach") &&
          cot.append(document.importNode(c, true)),
      );
      chia.querySelector(".chi-tiet").innerHTML =
        moi.querySelector(".chi-tiet").innerHTML;
      chia.classList.remove("co-chon");
      history.replaceState(null, "", u.pathname + u.search);
      chia.dispatchEvent(new Event("luoi-doi"));
    } catch (e) {
      if (e.name !== "AbortError" && id === stt) location.href = u; // lỗi mạng: quay về cách tải trang thường
    }
  }

  inp.addEventListener("input", () => {
    clearTimeout(hen);
    hen = setTimeout(tim, 180);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearTimeout(hen);
    tim();
  });
  if (xoa)
    xoa.addEventListener("click", (e) => {
      e.preventDefault();
      inp.value = "";
      tim();
      inp.focus();
    });
})();
