const $ = (s, r = document) => r.querySelector(s);
const vnd = (n) => Number(n).toLocaleString("vi-VN") + "đ";
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const SAC_LA = ["#5d9a52", "#7db35f", "#3f7d46", "#c9a43a"];

function bao(t) {
  const d = document.createElement("div");
  d.className = "bao";
  d.textContent = t;
  document.body.append(d);
  setTimeout(() => d.remove(), 2400);
}

// Pop up dùng chung: trả về { el, dong }
function hop(html) {
  Am.phat("mo");
  const o = document.createElement("div");
  o.className = "lop";
  o.innerHTML = `<div class="hop" role="dialog" aria-modal="true">${html}</div>`;
  const k = (e) => e.key === "Escape" && dong();
  const dong = () => {
    o.remove();
    document.removeEventListener("keydown", k);
  };
  document.addEventListener("keydown", k);
  o.addEventListener("pointerdown", (e) => {
    if (e.target === o) dong();
  });
  document.body.append(o);
  return { el: o.firstChild, dong };
}

// Lá bay; burst = bung ra khi chuyển cảnh (từ bên phải, hoặc bên trái nếu trai = true)
function thaLa(n = 1, burst = false, trai = false) {
  for (let i = 0; i < n; i++) {
    const l = document.createElement("i");
    const s = 9 + Math.random() * 11;
    const x = trai ? Math.random() * 45 : 55 + Math.random() * 45;
    l.className = "la";
    l.style.cssText =
      `left:${burst ? x : Math.random() * 100}vw;` +
      (burst ? `top:${Math.random() * 60}vh;` : "") +
      `width:${s}px;height:${s}px;--dx:${(Math.random() - 0.5) * 180}px;` +
      `--t:${burst ? 2.5 + Math.random() * 2 : 7 + Math.random() * 6}s;--c:${SAC_LA[i % 4]}`;
    l.onanimationend = () => l.remove();
    document.body.append(l);
  }
}

// Chuyển cảnh bằng cành cây (ảnh /img/canh-cay.webp, CSS .canh-cay):
//   huong = "len"   : trang cũ lướt lên, cành từ PHẢI quét vào (vào quán)
//   huong = "xuong" : trang cũ lướt xuống, cành từ TRÁI quét vào (ra phố)
// xong: đường dẫn (chuyển trang) hoặc hàm (vd. gửi form) chạy khi cành đã phủ kín màn hình.
// Hướng được nhớ trong sessionStorage để trang đích chạy tiếp hiệu ứng (xem head.ejs + CSS html[data-vao]).
function chuyenCanh(xong, huong = "len") {
  const v = document.createElement("div");
  v.className = "canh-cay " + huong;
  document.body.append(v);
  document.body.classList.add(huong === "xuong" ? "di-xuong" : "di-len");
  Am.phat("vut");
  thaLa(40, true, huong === "xuong");
  try {
    sessionStorage.setItem("huong", huong);
  } catch (e) {}
  setTimeout(
    () => (typeof xong === "function" ? xong() : (location.href = xong)),
    1300,
  );
}

// Trang đích đã đọc cờ "huong" (head.ejs) -> xoá đi để lần tải lại sau không chạy hiệu ứng nữa
try {
  sessionStorage.removeItem("huong");
} catch (e) {}

// Về phố (link "Ra phố" và nút Đăng xuất / Đổi vai) -> hiệu ứng chiều ngược lại
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest('a[href="/"]');
  if (
    !a ||
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey
  )
    return;
  e.preventDefault();
  if (!document.body.classList.contains("di-xuong")) chuyenCanh("/", "xuong");
});
document.addEventListener("submit", (e) => {
  const f = e.target;
  if (!f.matches || !f.matches('form[action="/logout"]') || e.defaultPrevented)
    return;
  e.preventDefault();
  if (!document.body.classList.contains("di-xuong"))
    chuyenCanh(() => f.submit(), "xuong"); // submit() không kích hoạt lại sự kiện
});

if (document.body.hasAttribute("data-la")) setInterval(() => thaLa(1), 900);
