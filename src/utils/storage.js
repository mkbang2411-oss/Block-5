// Lưu ảnh món ăn lên Supabase Storage (bucket "dish-images"), DB chỉ giữ URL.
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

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
  const path = `${crypto.randomUUID()}.${EXT[file.mimetype]}`;
  const { error } = await supabase()
    .storage.from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  const { data } = supabase().storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function removeImage(path) {
  if (path) await supabase().storage.from(BUCKET).remove([path]);
}

module.exports = { uploadImage, removeImage, EXT };