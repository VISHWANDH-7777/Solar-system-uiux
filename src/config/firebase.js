import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const readEnv = (key) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }

  return value;
};

const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
  measurementId: readEnv('VITE_FIREBASE_MEASUREMENT_ID'),
  firestoreDatabaseId: readEnv('VITE_FIREBASE_DATABASE_ID'),
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

let analytics = null;
let analyticsReady = Promise.resolve(false);

if (typeof window !== 'undefined') {
  analyticsReady = isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }

      return supported;
    })
    .catch(() => false);
}

const trackEvent = async (eventName, eventParams = {}) => {
  try {
    const supported = await analyticsReady;

    if (!supported || !analytics) {
      return;
    }

    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.warn('Analytics event skipped:', error);
  }
};

export { app, auth, db, analytics, trackEvent };