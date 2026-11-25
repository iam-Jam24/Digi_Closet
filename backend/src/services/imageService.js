/**
 * Image Storage Service
 *
 * Handles storing uploaded images (wardrobe items, try-on photos).
 *
 * - Production (FIREBASE_STORAGE_BUCKET configured): uploads go to
 *   Firebase Cloud Storage, scoped under users/{uid}/..., matching
 *   storage.rules which restrict access to the owning user.
 * - Development (no bucket configured): files are written to a local
 *   `backend/uploads/` directory and served via the `/uploads` static
 *   route. This is real file storage, not a simulation — just not
 *   cloud-backed. Switching to Firebase Storage requires no code changes
 *   in callers, only setting FIREBASE_STORAGE_BUCKET.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

// The browser-reported MIME type is just a claim; check the file's magic bytes.
function matchesSignature(buffer, mimetype) {
  if (!buffer || buffer.length < 12) return false;
  switch (mimetype) {
    case 'image/jpeg': return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png': return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp': return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    default: return false;
  }
}

class ImageService {
  constructor() {
    this.isCloudConfigured = Boolean(env.FIREBASE_STORAGE_BUCKET);
    if (!this.isCloudConfigured) {
      fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    }
  }

  /**
   * Store an uploaded image buffer for a given user and logical folder
   * (e.g. 'wardrobe', 'tryon-user', 'tryon-garment', 'tryon-result').
   * @returns {Promise<{ url: string, path: string }>}
   */
  // Throws a 400 unless the bytes really are the claimed image type.
  assertValidImage(buffer, mimetype) {
    if (!matchesSignature(buffer, mimetype)) {
      const err = new Error('The file is not a valid JPEG, PNG, or WebP image.');
      err.statusCode = 400;
      throw err;
    }
  }

  async storeImage(buffer, { uid, folder, mimetype }) {
    this.assertValidImage(buffer, mimetype);
    const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;

    if (this.isCloudConfigured) {
      const { getBucket } = require('../config/firebaseAdmin');
      const bucket = getBucket(env.FIREBASE_STORAGE_BUCKET);
      const filePath = `users/${uid}/${folder}/${filename}`;
      // The URL is stored in the database, so it must not expire. A Firebase
      // download token gives a permanent, unguessable URL (what the client
      // SDK's getDownloadURL returns) instead of a 7-day signed URL.
      const token = crypto.randomUUID();
      await bucket.file(filePath).save(buffer, {
        contentType: mimetype,
        metadata: { metadata: { firebaseStorageDownloadTokens: token } },
      });
      const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;
      return { url, path: filePath };
    }

    const userDir = path.join(UPLOAD_ROOT, uid, folder);
    fs.mkdirSync(userDir, { recursive: true });
    const filePath = path.join(userDir, filename);
    fs.writeFileSync(filePath, buffer);
    const relativePath = path.posix.join(uid, folder, filename);
    return { url: `/uploads/${relativePath}`, path: relativePath };
  }

  /**
   * Reads a stored image back, e.g. to send wardrobe photos to an AI model.
   * @returns {Promise<{ buffer: Buffer, mimeType: string }>}
   */
  async readImage(storedPath) {
    const ext = path.extname(storedPath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    if (this.isCloudConfigured) {
      const { getBucket } = require('../config/firebaseAdmin');
      const [buffer] = await getBucket(env.FIREBASE_STORAGE_BUCKET).file(storedPath).download();
      return { buffer, mimeType };
    }

    const fullPath = path.join(UPLOAD_ROOT, storedPath);
    if (!fullPath.startsWith(UPLOAD_ROOT + path.sep)) throw new Error('Invalid image path.');
    return { buffer: await fs.promises.readFile(fullPath), mimeType };
  }

  async deleteImage(storedPath) {
    if (this.isCloudConfigured) {
      const { getBucket } = require('../config/firebaseAdmin');
      const bucket = getBucket(env.FIREBASE_STORAGE_BUCKET);
      await bucket.file(storedPath).delete({ ignoreNotFound: true });
      return;
    }
    const fullPath = path.join(UPLOAD_ROOT, storedPath);
    if (!fullPath.startsWith(UPLOAD_ROOT + path.sep)) return;
    await fs.promises.rm(fullPath, { force: true });
  }
}

module.exports = new ImageService();
