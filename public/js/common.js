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
  const v2 = document.createElement("div"); // cành phụ từ phía đối diện
  v2.className = "canh-cay phu " + huong;
  document.body.append(v2, v);
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

// Chuyển cảnh bằng ĐĨA TRẮNG (tròn/vuông ngẫu nhiên) trượt ngang qua màn hình: dùng giữa bàn chọn món / danh sách / chi tiết món.
// Bố cục đĩa được lưu vào sessionStorage để trang đích dựng lại y hệt rồi cho đĩa trượt đi tiếp (xem head.ejs + CSS html[data-dia]).
function dungDia(ds) {
  const lop = document.createElement("div");
  lop.className = "dq-lop";
  ds.forEach((d) => {
    const e = document.createElement("i");
    e.className = "dq" + (d.v ? " vuong" : "");
    e.style.cssText = `left:${d.x}px;top:${d.y}px;width:${d.s}px;height:${d.s}px;transform:rotate(${d.r}deg)`;
    lop.append(e);
  });
  document.body.append(lop);
  return lop;
}
// huong: "phai" = đĩa từ PHẢI quét vào rồi trượt đi sang trái (tiến tới) | "trai" = ngược lại (quay lại)
let dangChuyenDia = false; // chỉ chặn bấm lần 2 khi đang quét vào, không chặn khi đĩa còn đang trượt đi ở trang mới
function chuyenDia(url, huong = "phai") {
  if (dangChuyenDia) return;
  dangChuyenDia = true;
  document.querySelectorAll(".dq-lop").forEach((x) => x.remove());
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    location.href = url;
    return;
  }
  const W = innerWidth,
    H = innerHeight,
    p = Math.max(H * 0.2, W / 9), // bước lưới; đĩa to 1.0–1.3 bước nên phủ kín không hở
    cols = Math.ceil(W / p) + 1,
    rows = Math.ceil(H / p) + 1,
    ds = [],
    tu = huong === "trai" ? -1 : 1; // 1: đĩa bay vào từ phải, -1: từ trái
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < rows; r++) {
      const s = p * (1.05 + Math.random() * 0.3);
      ds.push({
        c,
        x: Math.round(c * p - s / 2 + (Math.random() - 0.5) * p * 0.1),
        y: Math.round(r * p - s / 2 + (Math.random() - 0.5) * p * 0.1),
        s: Math.round(s),
        r: Math.round((Math.random() - 0.5) * 50),
        v: Math.random() < 0.45 ? 1 : 0,
      });
    }
  const lop = dungDia(ds);
  Am.phat("vut");
  [...lop.children].forEach((e, i) => {
    const c = tu > 0 ? cols - ds[i].c : ds[i].c + 1; // cột đi đầu bay vào trước
    e.animate(
      [
        {
          transform: `translateX(${tu * (W + 200)}px) ${e.style.transform}`,
          opacity: 1,
        },
        { transform: e.style.transform, opacity: 1 },
      ],
      {
        duration: 520,
        delay: c * 45 + Math.random() * 140,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "backwards",
      },
    );
  });
  try {
    sessionStorage.setItem("dia", JSON.stringify({ h: huong, ds }));
  } catch (e) {}
  setTimeout(() => (location.href = url), cols * 45 + 700);
}
// Hướng theo ngữ cảnh: sang tab/trang sau = từ phải; về tab/trang trước, "Hủy" = từ trái
function huongDia(a) {
  if (a.dataset.huong) return a.dataset.huong;
  const so = (el) => parseInt(el.textContent, 10);
  const pt = a.closest(".phan-trang");
  if (pt) {
    const on = pt.querySelector(".on"),
      cur = on ? so(on) : 1,
      u = new URL(a.href, location.href),
      toi = parseInt(u.searchParams.get("page"), 10) || 1;
    return toi < cur ? "trai" : "phai";
  }
  if (a.classList.contains("tab")) {
    const tabs = [...document.querySelectorAll(".tab")];
    return tabs.indexOf(a) < tabs.findIndex((t) => t.classList.contains("on"))
      ? "trai"
      : "phai";
  }
  return /^\s*(Hủy|Quay lại|Danh sách món)/.test(a.textContent)
    ? "trai"
    : "phai";
}
document.addEventListener("click", (e) => {
  const a = e.target.closest && e.target.closest("a[href]");
  if (
    !a ||
    e.defaultPrevented ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    a.target === "_blank" ||
    a.classList.contains("tat") ||
    a.closest(".phan-trang, .tim") // đổi số trang / xóa tìm kiếm: tải thẳng, không chuyển cảnh
  )
    return;
  const u = new URL(a.href, location.href);
  if (
    u.origin !== location.origin ||
    !/^\/(dishes|khach|admin)(\/|$)/.test(u.pathname)
  )
    return;
  e.preventDefault();
  chuyenDia(u.pathname + u.search, huongDia(a));
});
addEventListener("pageshow", (e) => {
  if (e.persisted) {
    dangChuyenDia = false;
    document.querySelectorAll(".dq-lop").forEach((x) => x.remove());
  }
});
// Trang đích: dựng lại đúng các đĩa đã phủ màn hình rồi cho trượt đi tiếp theo cùng hướng
try {
  const j = sessionStorage.getItem("dia");
  if (j) {
    sessionStorage.removeItem("dia");
    const sv = JSON.parse(j),
      ds = Array.isArray(sv) ? sv : sv.ds,
      tu = sv.h === "trai" ? -1 : 1,
      lop = dungDia(ds),
      W = innerWidth,
      cols = Math.max(...ds.map((d) => d.c)) + 1;
    document.documentElement.removeAttribute("data-dia");
    let xong = 0;
    [...lop.children].forEach((e, i) => {
      const c = tu > 0 ? ds[i].c : cols - 1 - ds[i].c; // đĩa phía trước hướng đi rời màn hình trước
      e.animate(
        [
          { transform: e.style.transform },
          {
            transform: `translateX(${-tu * (W + 300)}px) ${e.style.transform} rotate(${-tu * 40}deg)`,
          },
        ],
        {
          duration: 620,
          delay: 60 + c * 40 + Math.random() * 120,
          easing: "cubic-bezier(.6,0,.8,.4)",
          fill: "both",
        },
      ).finished.then(() => {
        if (++xong === ds.length) lop.remove();
      });
    });
    setTimeout(() => lop.remove(), 2500);
  }
} catch (e) {
  document.documentElement.removeAttribute("data-dia");
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
