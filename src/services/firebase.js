import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // <--- Import Storage
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
} from 'firebase/firestore';

// --- CONFIGURATION ---
let app = null;
let auth = null;
let db = null;
let analytics = null;
let storage = null; // <--- Define Storage

const appId = 'default-app-id';

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCwNeDAVc8Cv-I5FbvNE2PnuBJfXuwdxqk",
  authDomain: "crane-pendant.firebaseapp.com",
  projectId: "crane-pendant",
  storageBucket: "crane-pendant.firebasestorage.app",
  messagingSenderId: "963136530916",
  appId: "1:963136530916:web:45840150d404722efe7ff1",
  measurementId: "G-7W3TKEFZ3W"
};

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        analytics = getAnalytics(app);
        storage = getStorage(app); // <--- Initialize Storage
        
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
        
        console.log("Firebase initialized with Storage, Persistence, and Analytics.");
    } else {
        // ... (Offline fallback logic remains the same)
        const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        if (configStr) {
            const injectedConfig = JSON.parse(configStr);
            app = initializeApp(injectedConfig);
            auth = getAuth(app);
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
            });
        }
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

export const initializeAuth = async () => {
    if (!auth) return;
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { 
            await signInWithCustomToken(auth, __initial_auth_token); 
        } catch(e) { 
            if (!auth.currentUser) await signInAnonymously(auth);
        }
    } else {
        if (!auth.currentUser) await signInAnonymously(auth);
    }
};

// Export storage
export { app, auth, db, analytics, storage, appId };