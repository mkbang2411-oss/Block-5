// Lưu ảnh món ăn lên Supabase Storage (bucket "dish-images"), DB chỉ giữ URL.
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const sharp = require("sharp");

const BUCKET = "dish-images";
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// tạo client lúc cần dùng, thiếu biến môi trường thì chỉ lỗi khi upload chứ không sập cả app
let client = null;
function supabase() {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }
  return client;
}

async function uploadImage(file) {
  // thu nhỏ về tối đa 800px, đổi sang WEBP (ảnh điện thoại 3MB thường còn ~50-100KB), tự xoay đúng chiều
  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: 800,
      height: 800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await supabase()
    .storage.from(BUCKET)
    // tên file là UUID (không bao giờ đổi nội dung) nên cho trình duyệt giữ 1 năm
    .upload(path, buffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
    });
  if (error) throw error;
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function removeImage(path) {
  if (path) await supabase().storage.from(BUCKET).remove([path]);
}

module.exports = { uploadImage, removeImage, EXT };
