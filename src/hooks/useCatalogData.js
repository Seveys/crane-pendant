import { useState, useEffect } from 'react';
import { 
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, 
  query, limit, orderBy, onSnapshot 
} from 'firebase/firestore';
import { 
  INITIAL_MANUFACTURERS, INITIAL_SERIES_DATA, INITIAL_COMPONENTS, 
  INITIAL_CABLES, INITIAL_ACCESSORIES, INITIAL_CORD_GRIPS, INITIAL_FOOTER_CONFIG 
} from '../data/initialData';

export function useCatalogData(db, appId) {
    // --- STATE ---
    const [manufacturers, setManufacturers] = useState([]);
    const [seriesData, setSeriesData] = useState({});
    const [componentTypes, setComponentTypes] = useState([]);
    const [cables, setCables] = useState([]);
    const [cordGrips, setCordGrips] = useState([]);
    const [accessories, setAccessories] = useState([]);
    const [footerConfig, setFooterConfig] = useState(INITIAL_FOOTER_CONFIG);
    
    const [popularConfigs, setPopularConfigs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- FETCHING LOGIC ---
    useEffect(() => {
        if (!db) {
            loadDefaults();
            return;
        }

        const fetchOrFallback = async (colName, isDoc = false) => {
            try {
                const ref = isDoc ? doc(db, colName) : collection(db, colName);
                const snap = await (isDoc ? getDoc(ref, { source: 'cache' }) : getDocs(ref, { source: 'cache' }));
                if (isDoc ? snap.exists() : !snap.empty) return snap;
                return await (isDoc ? getDoc(ref) : getDocs(ref));
            } catch (e) {
                console.warn(`Fetch failed for ${colName}, using fallback.`);
                return null;
            }
        };

        const loadDefaults = () => {
            setManufacturers(INITIAL_MANUFACTURERS);
            setSeriesData(INITIAL_SERIES_DATA);
            setComponentTypes(INITIAL_COMPONENTS);
            setCables(INITIAL_CABLES);
            setCordGrips(INITIAL_CORD_GRIPS);
            setAccessories(INITIAL_ACCESSORIES);
            setIsLoading(false);
        };

        const fetchCatalog = async () => {
            setIsLoading(true);
            try {
                const [mfgSnap, seriesSnap, compSnap, cableSnap, accSnap, footerSnap] = await Promise.all([
                    fetchOrFallback('catalog_manufacturers'),
                    fetchOrFallback('catalog_series'),
                    fetchOrFallback('catalog_components'),
                    fetchOrFallback('catalog_cables'),
                    fetchOrFallback('catalog_accessories'),
                    fetchOrFallback('catalog_settings/footer', true)
                ]);

                if (!mfgSnap || mfgSnap.empty) {
                    if (mfgSnap && mfgSnap.empty) { await seedDatabase(); return; }
                    loadDefaults();
                    return;
                }

                setManufacturers(mfgSnap.docs.map(d => d.data()).sort((a, b) => (a.order || 0) - (b.order || 0)));

                if (seriesSnap && !seriesSnap.empty) {
                    const seriesObj = {};
                    seriesSnap.forEach(doc => { seriesObj[doc.id] = doc.data(); });
                    setSeriesData(seriesObj);
                } else setSeriesData(INITIAL_SERIES_DATA);

                if (compSnap && !compSnap.empty) setComponentTypes(compSnap.docs.map(d => d.data()));
                else setComponentTypes(INITIAL_COMPONENTS);

                if (cableSnap && !cableSnap.empty) setCables(cableSnap.docs.map(d => d.data()));
                else setCables(INITIAL_CABLES);

                if (accSnap && !accSnap.empty) setAccessories(accSnap.docs.map(d => d.data()));
                else setAccessories(INITIAL_ACCESSORIES);

                if (footerSnap && footerSnap.exists()) setFooterConfig(footerSnap.data());

                fetchTrending();
            } catch (e) {
                console.error("Critical Error fetching catalog:", e);
                loadDefaults();
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTrending = async () => {
            try {
                const qPublic = query(collection(db, 'artifacts', appId, 'public_builds'), orderBy('timestamp', 'desc'), limit(50));
                const publicSnap = await getDocs(qPublic);
                const builds = []; 
                publicSnap.forEach(doc => builds.push(doc.data()));
                
                const counts = {};
                builds.forEach(build => {
                    const sig = build.signature; 
                    if (!counts[sig]) counts[sig] = { count: 0, data: build };
                    counts[sig].count++;
                });
                setPopularConfigs(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5).map(c => c.data));
            } catch (e) { console.log("Trending stats unavailable"); }
        };

        fetchCatalog();
    }, [db, appId]);

    // --- SEEDING ---
    const seedDatabase = async () => {
        console.log("Seeding Database...");
        const batch = writeBatch(db);
        INITIAL_MANUFACTURERS.forEach(m => batch.set(doc(db, 'catalog_manufacturers', m.id), m));
        Object.entries(INITIAL_SERIES_DATA).forEach(([key, val]) => batch.set(doc(db, 'catalog_series', key), val));
        INITIAL_COMPONENTS.forEach(c => batch.set(doc(db, 'catalog_components', c.id), c));
        INITIAL_CABLES.forEach(c => batch.set(doc(db, 'catalog_cables', c.part.replace(/[^a-zA-Z0-9]/g, '_')), c));
        INITIAL_ACCESSORIES.forEach(a => batch.set(doc(db, 'catalog_accessories', a.id), a));
        batch.set(doc(db, 'catalog_settings', 'footer'), INITIAL_FOOTER_CONFIG);
        await batch.commit();
        window.location.reload();
    };

    // --- DB ACTIONS ---
    const dbActions = {
        saveManufacturer: async (data) => {
            if (!db) return;
            setManufacturers(prev => {
                let newList = [];
                const idx = prev.findIndex(m => m.id === data.id);
                if (idx >= 0) { const copy = [...prev]; copy[idx] = data; newList = copy; } 
                else { newList = [...prev, data]; }
                return newList.sort((a, b) => (a.order || 0) - (b.order || 0));
            });
            return setDoc(doc(db, 'catalog_manufacturers', data.id), data);
        },
        deleteManufacturer: async (id) => {
            if (!db) return;
            setManufacturers(prev => prev.filter(m => m.id !== id));
            setSeriesData(prev => { const next = { ...prev }; delete next[id]; return next; });
            const batch = writeBatch(db);
            batch.delete(doc(db, 'catalog_manufacturers', id));
            batch.delete(doc(db, 'catalog_series', id));
            return batch.commit();
        },
        saveSeries: async (mfgId, data) => {
            if (!db) return;
            setSeriesData(prev => ({ ...prev, [mfgId]: data }));
            return setDoc(doc(db, 'catalog_series', mfgId), data);
        },
        saveComponent: async (data) => {
            if (!db) return;
            setComponentTypes(prev => {
                const idx = prev.findIndex(c => c.id === data.id);
                if (idx >= 0) { const copy = [...prev]; copy[idx] = data; return copy; }
                return [...prev, data];
            });
            return setDoc(doc(db, 'catalog_components', data.id), data);
        },
        saveCable: async (data) => {
            if (!db) return;
            setCables(prev => {
                const idx = prev.findIndex(c => c.part === data.part);
                if (idx >= 0) { const copy = [...prev]; copy[idx] = data; return copy; }
                return [...prev, data];
            });
            const safeId = data.part.replace(/[^a-zA-Z0-9]/g, '_');
            return setDoc(doc(db, 'catalog_cables', safeId), data);
        },
        saveAccessory: async (data) => {
            if (!db) return;
            setAccessories(prev => {
                const idx = prev.findIndex(a => a.id === data.id);
                if (idx >= 0) { const copy = [...prev]; copy[idx] = data; return copy; }
                return [...prev, data];
            });
            return setDoc(doc(db, 'catalog_accessories', data.id), data);
        },
        saveFooter: async (data) => {
            if (!db) return;
            setFooterConfig(data);
            return setDoc(doc(db, 'catalog_settings', 'footer'), data);
        }
    };

    return {
        manufacturers, seriesData, componentTypes, cables, cordGrips, accessories, 
        footerConfig, popularConfigs, isLoading, dbActions,
        // Setters are rarely needed outside, but can be exposed if necessary
        setManufacturers, setSeriesData, setCables, setAccessories, setComponentTypes, setFooterConfig
    };
}