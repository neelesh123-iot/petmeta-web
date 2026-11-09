import { initializeApp, getApps } from 'firebase/app';
import { getAuth,connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore,connectFirestoreEmulator } from 'firebase/firestore';
const app = getApps()[0] ?? initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD1lzGMHdGx9zLnPSN9CLow1-M5K7jZnls',
  authDomain: 'petmeta-e8470.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'petmeta-e8470',
  appId: '1:377577010830:web:3a8f87e87c148a88c8fbdf',
  messagingSenderId: '377577010830',
});
export const firebaseReady = true;
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
if(typeof window!=='undefined'&&process.env.NEXT_PUBLIC_FIREBASE_EMULATORS==='true'){
  try{connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8089);}catch{}
}
