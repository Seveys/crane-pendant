import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager,
    // Add enablePersistence for completeness, though initializeFirestore handles it
} from 'firebase/firestore';

// --- CONFIGURATION ---
let app = null;
let auth = null;
let db = null;
let analytics = null;
let storage = null;

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
        storage = getStorage(app);
        
        // --- OFFLINE PERSISTENCE ACTIVATED HERE ---
        db = initializeFirestore(app, {
            // Use persistentLocalCache to enable storage of data on the device
            localCache: persistentLocalCache({ 
                // Use persistentMultipleTabManager to share the cache across browser tabs
                tabManager: persistentMultipleTabManager() 
            }),
            // NOTE: The cache is automatically enabled when using persistentLocalCache,
            // which tells Firestore to fetch from cache first and only update changes.
        });
        
        console.log("Firebase initialized with Storage, Persistence, and Analytics.");
    } else {
        // Fallback logic for offline/local environment
        const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
        if (configStr) {
            const injectedConfig = JSON.parse(configStr);
            app = initializeApp(injectedConfig);
            auth = getAuth(app);
            db = initializeFirestore(app, {
                // Keep persistence enabled even in the injected context if possible
                localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
            });
        }
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

// ... rest of the file (initializeAuth and exports) ...

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

export { app, auth, db, analytics, storage, appId };