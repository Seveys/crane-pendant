import { useState, useEffect } from 'react';
import { 
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, writeBatch, 
  query, limit, orderBy, where
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
    const [cordGrips, setCordGrips] = useState([]); // <--- Added State
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
                const [mfgSnap, seriesSnap, compSnap, cableSnap, gripSnap, accSnap, footerSnap] = await Promise.all([
                    fetchOrFallback('catalog_manufacturers'),
                    fetchOrFallback('catalog_series'),
                    fetchOrFallback('catalog_components'),
                    fetchOrFallback('catalog_cables'),
                    fetchOrFallback('catalog_cordgrips'), // <--- Fetch Grips
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

                if (gripSnap && !gripSnap.empty) setCordGrips(gripSnap.docs.map(d => d.data()));
                else setCordGrips(INITIAL_CORD_GRIPS);

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
        INITIAL_CORD_GRIPS.forEach(g => batch.set(doc(db, 'catalog_cordgrips', g.id), g)); // <--- Seed Grips
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
        renameSeries: async (mfgId, oldName, newName) => {
            if (!db) return;
            const batch = writeBatch(db);
            const mfgRef = doc(db, 'catalog_series', mfgId);
            const mfgDoc = await getDoc(mfgRef);
            if (mfgDoc.exists()) {
                const data = mfgDoc.data();
                const newEnclosures = data.enclosures.map(e => e.series === oldName ? { ...e, series: newName } : e);
                const newPreconfigs = (data.preconfigurations || []).map(p => p.series === oldName ? { ...p, series: newName } : p);
                batch.update(mfgRef, { enclosures: newEnclosures, preconfigurations: newPreconfigs });
                setSeriesData(prev => ({ ...prev, [mfgId]: { ...data, enclosures: newEnclosures, preconfigurations: newPreconfigs } }));
            }
            const q = query(collection(db, 'catalog_components'), where('series', '==', oldName));
            const snap = await getDocs(q);
            snap.forEach(doc => batch.update(doc.ref, { series: newName }));
            setComponentTypes(prev => prev.map(c => c.series === oldName ? { ...c, series: newName } : c));
            return batch.commit();
        },
        deleteSeries: async (mfgId, seriesName) => {
            if (!db) return;
            const batch = writeBatch(db);
            const mfgRef = doc(db, 'catalog_series', mfgId);
            const mfgDoc = await getDoc(mfgRef);
            if (mfgDoc.exists()) {
                const data = mfgDoc.data();
                const newEnclosures = data.enclosures.filter(e => e.series !== seriesName);
                const newPreconfigs = (data.preconfigurations || []).filter(p => p.series !== seriesName);
                batch.update(mfgRef, { enclosures: newEnclosures, preconfigurations: newPreconfigs });
                setSeriesData(prev => ({ ...prev, [mfgId]: { ...data, enclosures: newEnclosures, preconfigurations: newPreconfigs } }));
            }
            const q = query(collection(db, 'catalog_components'), where('series', '==', seriesName));
            const snap = await getDocs(q);
            snap.forEach(doc => batch.delete(doc.ref));
            setComponentTypes(prev => prev.filter(c => c.series !== seriesName));
            return batch.commit();
        },
        deleteEnclosure: async (mfgId, enclosureId) => {
            if (!db) return;
            setSeriesData(prev => {
                const currentSeries = prev[mfgId];
                if (!currentSeries) return prev;
                return { ...prev, [mfgId]: { ...currentSeries, enclosures: currentSeries.enclosures.filter(e => e.id !== enclosureId) } };
            });
            const mfgRef = doc(db, 'catalog_series', mfgId);
            const mfgDoc = await getDoc(mfgRef);
            if (mfgDoc.exists()) {
                const data = mfgDoc.data();
                const newEnclosures = data.enclosures.filter(e => e.id !== enclosureId);
                return setDoc(mfgRef, { ...data, enclosures: newEnclosures });
            }
        },
        deletePreconfig: async (mfgId, preconfigId) => {
            if (!db) return;
            setSeriesData(prev => {
                const currentSeries = prev[mfgId];
                if (!currentSeries) return prev;
                return { ...prev, [mfgId]: { ...currentSeries, preconfigurations: (currentSeries.preconfigurations || []).filter(p => p.id !== preconfigId) } };
            });
            const mfgRef = doc(db, 'catalog_series', mfgId);
            const mfgDoc = await getDoc(mfgRef);
            if (mfgDoc.exists()) {
                const data = mfgDoc.data();
                const newPreconfigs = (data.preconfigurations || []).filter(p => p.id !== preconfigId);
                return setDoc(mfgRef, { ...data, preconfigurations: newPreconfigs });
            }
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
        deleteComponent: async (id) => {
            if (!db) return;
            setComponentTypes(prev => prev.filter(c => c.id !== id));
            return deleteDoc(doc(db, 'catalog_components', id));
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
        deleteCable: async (part) => {
            if (!db) return;
            setCables(prev => prev.filter(c => c.part !== part));
            const safeId = part.replace(/[^a-zA-Z0-9]/g, '_');
            return deleteDoc(doc(db, 'catalog_cables', safeId));
        },
        // --- CORD GRIPS ---
        saveCordGrip: async (data) => {
            if (!db) return;
            setCordGrips(prev => {
                const idx = prev.findIndex(c => c.id === data.id);
                if (idx >= 0) { const copy = [...prev]; copy[idx] = data; return copy; }
                return [...prev, data];
            });
            return setDoc(doc(db, 'catalog_cordgrips', data.id), data);
        },
        deleteCordGrip: async (id) => {
            if (!db) return;
            setCordGrips(prev => prev.filter(c => c.id !== id));
            return deleteDoc(doc(db, 'catalog_cordgrips', id));
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
        deleteAccessory: async (id) => {
            if (!db) return;
            setAccessories(prev => prev.filter(a => a.id !== id));
            return deleteDoc(doc(db, 'catalog_accessories', id));
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
        setManufacturers, setSeriesData, setCables, setCordGrips, setAccessories, setComponentTypes, setFooterConfig
    };
}