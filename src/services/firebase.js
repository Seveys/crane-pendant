import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// --- CONFIGURATION ---
let app = null;
let auth = null;
let db = null;
let analytics = null;
let storage = null;

// Get App ID or default
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
    // 1. Try to load from Environment Variables (Vite standard for local dev/GitHub)
    const envConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };

    // 2. Check for Global Injection (Legacy/Embedded Method fallback)
    const globalConfigStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    
    let finalConfig = null;

    // Use environment variables if the API key is present
    if (envConfig.apiKey) {
        finalConfig = envConfig;
    } 
    // Fallback to global variable if env var is missing
    else if (globalConfigStr) {
        finalConfig = JSON.parse(globalConfigStr);
    }

    if (finalConfig) {
        app = initializeApp(finalConfig);
        auth = getAuth(app);
        
        // --- FIRESTORE INITIALIZATION FIX ---
        // Try to initialize with settings, fallback to existing instance if already running
        try {
            db = initializeFirestore(app, {
                localCache: persistentLocalCache({ 
                    tabManager: persistentMultipleTabManager() 
                }),
            });
        } catch (err) {
            // Check if error is due to re-initialization (common in dev/HMR)
            if (err.message.includes('initializeFirestore') || err.code === 'failed-precondition') {
                db = getFirestore(app);
            } else {
                console.error("Firestore init error:", err);
                throw err; // Re-throw other errors
            }
        }

        // Initialize Storage
        storage = getStorage(app);

        // Initialize Analytics only if supported/enabled
        if (typeof window !== 'undefined' && finalConfig.measurementId) {
             analytics = getAnalytics(app);
        }

        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase config not found. App running in offline/demo mode.");
    }
} catch (e) {
    console.error("Firebase Initialization Error:", e);
}

/**
 * Helper to handle initial authentication strategy.
 * Checks for a custom token (e.g., from an embedded environment) or falls back to anonymous.
 */
export const initializeAuth = async () => {
    if (!auth) return;

    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { 
            await signInWithCustomToken(auth, __initial_auth_token); 
            console.log("Signed in with custom token.");
        } catch(e) { 
            console.error("Custom token auth failed:", e);
            // Fallback to anonymous if custom token fails
            if (!auth.currentUser) await signInAnonymously(auth);
        }
    } else {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log("Signed in anonymously.");
        }
    }
};

// Export the initialized instances
export { app, auth, db, analytics, storage, appId };