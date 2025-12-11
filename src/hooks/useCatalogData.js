import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { 
  INITIAL_MANUFACTURERS, INITIAL_SERIES_DATA, INITIAL_COMPONENTS, 
  INITIAL_CABLES, INITIAL_ACCESSORIES, INITIAL_CORD_GRIPS, INITIAL_FOOTER_CONFIG 
} from '../data/initialData';

export function useCatalogData(db, appId) {
    // --- STATE ---
    const [manufacturers, setManufacturers] = useState(INITIAL_MANUFACTURERS);
    const [seriesData, setSeriesData] = useState(INITIAL_SERIES_DATA);
    const [componentTypes, setComponentTypes] = useState(INITIAL_COMPONENTS);
    const [cables, setCables] = useState(INITIAL_CABLES);
    const [cordGrips, setCordGrips] = useState(INITIAL_CORD_GRIPS);
    const [accessories, setAccessories] = useState(INITIAL_ACCESSORIES);
    const [footerConfig, setFooterConfig] = useState(INITIAL_FOOTER_CONFIG);

    // --- ACTIONS ---
    // DEFINED BEFORE USE to prevent "ReferenceError: Cannot access before initialization"
    const loadDefaults = () => {
        setManufacturers(INITIAL_MANUFACTURERS);
        setSeriesData(INITIAL_SERIES_DATA);
        setComponentTypes(INITIAL_COMPONENTS);
        setCables(INITIAL_CABLES);
        setCordGrips(INITIAL_CORD_GRIPS);
        setAccessories(INITIAL_ACCESSORIES);
        setFooterConfig(INITIAL_FOOTER_CONFIG);
        console.log("Loaded default catalog data (Offline/Fallback).");
    };

    // --- EFFECTS ---
    useEffect(() => {
        // 1. If DB is not ready, load defaults immediately
        if (!db) {
            loadDefaults();
            return;
        }

        // 2. Define Real-time Listeners
        const unsubMfg = onSnapshot(collection(db, 'artifacts', appId, 'manufacturers'), (snap) => {
            if (!snap.empty) setManufacturers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, err => console.warn("Mfg fetch fail:", err));

        const unsubSeries = onSnapshot(collection(db, 'artifacts', appId, 'series_data'), (snap) => {
            if (!snap.empty) {
                const map = {};
                snap.forEach(doc => map[doc.id] = doc.data());
                setSeriesData(map);
            }
        }, err => console.warn("Series fetch fail:", err));

        const unsubComps = onSnapshot(collection(db, 'artifacts', appId, 'components'), (snap) => {
            if (!snap.empty) setComponentTypes(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, err => console.warn("Components fetch fail:", err));

        const unsubCables = onSnapshot(collection(db, 'artifacts', appId, 'cables'), (snap) => {
            if (!snap.empty) setCables(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, err => console.warn("Cables fetch fail:", err));

        const unsubAcc = onSnapshot(collection(db, 'artifacts', appId, 'accessories'), (snap) => {
            if (!snap.empty) setAccessories(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, err => console.warn("Accessories fetch fail:", err));

        const unsubGrips = onSnapshot(collection(db, 'artifacts', appId, 'cord_grips'), (snap) => {
            if (!snap.empty) setCordGrips(snap.docs.map(d => ({ ...d.data(), id: d.id })));
        }, err => console.warn("Grips fetch fail:", err));

        // 3. Cleanup Listeners on Unmount
        return () => {
            unsubMfg(); unsubSeries(); unsubComps(); 
            unsubCables(); unsubAcc(); unsubGrips();
        };
    }, [db, appId]);

    return {
        manufacturers, setManufacturers,
        seriesData, setSeriesData,
        componentTypes, setComponentTypes,
        cables, setCables,
        cordGrips, setCordGrips,
        accessories, setAccessories,
        footerConfig, setFooterConfig,
        loadDefaults
    };
}