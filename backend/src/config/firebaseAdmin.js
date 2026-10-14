const { initializeApp, getApps, getApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const env = require('./env');

// When FIREBASE_AUTH_EMULATOR_HOST is set, the Admin SDK automatically
// routes auth verification calls to the local emulator instead of the
// real Firebase Auth backend. No service account credentials are needed
// in that mode — this is the standard Firebase local-dev workflow.
if (env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = env.FIREBASE_AUTH_EMULATOR_HOST;
}

let app;

if (!getApps().length) {
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    // Production: real service account credentials.
    app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
    });
  } else {
    // Development: emulator mode, demo project, no real credentials required.
    app = initializeApp({
      projectId: env.FIREBASE_PROJECT_ID || 'demo-digi-closet',
    });
  }
} else {
  app = getApp();
}

module.exports = {
  app,
  auth: getAuth(app),
  getBucket: (bucketName) => getStorage(app).bucket(bucketName),
};
