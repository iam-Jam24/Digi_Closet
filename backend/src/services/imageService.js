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
  async storeImage(buffer, { uid, folder, mimetype }) {
    const ext = mimetype === 'image/png' ? 'png' : mimetype === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${crypto.randomUUID()}.${ext}`;

    if (this.isCloudConfigured) {
      const { getBucket } = require('../config/firebaseAdmin');
      const bucket = getBucket(env.FIREBASE_STORAGE_BUCKET);
      const filePath = `users/${uid}/${folder}/${filename}`;
      const file = bucket.file(filePath);
      await file.save(buffer, { contentType: mimetype });
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      });
      return { url, path: filePath };
    }

    const userDir = path.join(UPLOAD_ROOT, uid, folder);
    fs.mkdirSync(userDir, { recursive: true });
    const filePath = path.join(userDir, filename);
    fs.writeFileSync(filePath, buffer);
    const relativePath = path.posix.join(uid, folder, filename);
    return { url: `/uploads/${relativePath}`, path: relativePath };
  }

  async deleteImage(storedPath) {
    if (this.isCloudConfigured) {
      const { getBucket } = require('../config/firebaseAdmin');
      const bucket = getBucket(env.FIREBASE_STORAGE_BUCKET);
      await bucket.file(storedPath).delete({ ignoreNotFound: true });
      return;
    }
    const fullPath = path.join(UPLOAD_ROOT, storedPath);
    fs.rm(fullPath, { force: true }, () => {});
  }
}

module.exports = new ImageService();
