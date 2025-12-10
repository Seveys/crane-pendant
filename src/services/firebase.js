import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURATION ---
// We try to load config from global variables (often injected by hosting providers)
// but default to null to prevent crashes in development.
let app = null;
let auth = null;
let db = null;

// Get App ID or default
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
    const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
    
    if (configStr) {
        const firebaseConfig = JSON.parse(configStr);
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
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
export { app, auth, db, appId };