// Optional image hosting on Cloudinary. Enabled when CLOUDINARY_URL is set in .env
// (Cloudinary dashboard → API Keys → "API environment variable": cloudinary://KEY:SECRET@CLOUD_NAME).
import { v2 as cloudinary } from 'cloudinary';

export const enabled = () => Boolean(process.env.CLOUDINARY_URL);

const FOLDER = process.env.CLOUDINARY_FOLDER || 'blog';

// Serve every image in the best format/quality for the visitor's browser
const optimized = (url) => url.replace('/upload/', '/upload/f_auto,q_auto/');

export const isCloudinary = (url) => /^https:\/\/res\.cloudinary\.com\//.test(url || '');

// Cloudinary downloads the image from the URL itself
export async function uploadFromUrl(url, publicId) {
  const result = await cloudinary.uploader.upload(url, { folder: FOLDER, public_id: publicId, overwrite: false });
  return optimized(result.secure_url);
}

export function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: FOLDER }, (err, result) => (err ? reject(err) : resolve(optimized(result.secure_url))))
      .end(buffer);
  });
}
