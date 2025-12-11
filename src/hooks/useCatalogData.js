import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { storage } from '../services/firebase'; 
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

    // --- HELPER: SAVE ITEM ---
    const saveItem = async (collectionName, item) => {
        if (!db) return;
        const id = item.id || item.part || item.kcid; 
        if (!id) throw new Error("Item must have an ID");
        await setDoc(doc(db, 'artifacts', appId, collectionName, id), item);
    };

    // --- HELPER: DELETE ITEM (Standard Collections) ---
    const deleteItem = async (collectionName, itemId) => {
        if (!db) return;
        await deleteDoc(doc(db, 'artifacts', appId, collectionName, itemId));
    };

    // --- HELPER: UPLOAD IMAGE ---
    const uploadImage = async (file, folder, baseName = null) => {
        if (!storage) throw new Error("Storage not configured");
        let fileName = `${Date.now()}_${file.name}`; 

        if (baseName) {
            const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
            const fileExt = file.name.split('.').pop();
            try {
                const folderRef = ref(storage, folder);
                const res = await listAll(folderRef);
                const prefix = `${cleanName}-`;
                const matchingFiles = res.items.filter(item => item.name.startsWith(prefix));
                
                let maxIndex = 0;
                matchingFiles.forEach(item => {
                    const parts = item.name.replace(prefix, '').split('.');
                    const index = parseInt(parts[0]);
                    if (!isNaN(index) && index > maxIndex) maxIndex = index;
                });
                fileName = `${cleanName}-${maxIndex + 1}.${fileExt}`;
            } catch (e) {
                console.warn("Sequential naming failed, using timestamp.", e);
            }
        }

        const storageRef = ref(storage, `${folder}/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    };

    // --- ACTIONS: EXPOSED SAVERS & DELETERS ---
    const dbActions = {
        saveManufacturer: (m) => saveItem('manufacturers', m),
        deleteManufacturer: async (mfgId) => {
            if(!db) return;
            // Delete the manufacturer record
            await deleteDoc(doc(db, 'artifacts', appId, 'manufacturers', mfgId));
            // Also delete their associated series data to keep DB clean
            await deleteDoc(doc(db, 'artifacts', appId, 'series_data', mfgId));
        },

        saveComponent: (c) => saveItem('components', c),
        deleteComponent: (id) => deleteItem('components', id),

        saveCable: (c) => saveItem('cables', c),
        deleteCable: (id) => deleteItem('cables', id),

        saveAccessory: (a) => saveItem('accessories', a),
        deleteAccessory: (id) => deleteItem('accessories', id),

        saveCordGrip: (g) => saveItem('cord_grips', g),
        
        // ENCLOSURE LOGIC (Nested in Series Data)
        saveEnclosure: async (mfgId, enc) => {
            if(!db) return;
            const seriesDocRef = doc(db, 'artifacts', appId, 'series_data', mfgId);
            const currentMfgData = seriesData[mfgId] || { name: 'New Series', enclosures: [] };
            const currentEnclosures = currentMfgData.enclosures || [];
            
            const existingIdx = currentEnclosures.findIndex(e => e.id === enc.id);
            let newEnclosures = [...currentEnclosures];
            if (existingIdx >= 0) newEnclosures[existingIdx] = enc;
            else newEnclosures.push(enc);
            
            const newData = { ...currentMfgData, enclosures: newEnclosures };
            await setDoc(seriesDocRef, newData, { merge: true });
        },

        deleteEnclosure: async (mfgId, enclosureId) => {
            if(!db) return;
            const seriesDocRef = doc(db, 'artifacts', appId, 'series_data', mfgId);
            const currentMfgData = seriesData[mfgId];
            if (!currentMfgData || !currentMfgData.enclosures) return;

            const newEnclosures = currentMfgData.enclosures.filter(e => e.id !== enclosureId);
            // Update the document with the filtered array
            await setDoc(seriesDocRef, { enclosures: newEnclosures }, { merge: true });
        },

        bulkUpdateEnclosures: async (groupedEnclosures) => {
            if (!db) return;
            const batch = writeBatch(db);
            Object.entries(groupedEnclosures).forEach(([mfgId, enclosures]) => {
                const docRef = doc(db, 'artifacts', appId, 'series_data', mfgId);
                batch.set(docRef, { enclosures: enclosures }, { merge: true });
            });
            await batch.commit();
        },

        saveFooter: (conf) => saveItem('site_config', { ...conf, id: 'footer' }),
        uploadImage
    };

    const loadDefaults = () => {
        setManufacturers(INITIAL_MANUFACTURERS);
        setSeriesData(INITIAL_SERIES_DATA);
        setComponentTypes(INITIAL_COMPONENTS);
        setCables(INITIAL_CABLES);
        setCordGrips(INITIAL_CORD_GRIPS);
        setAccessories(INITIAL_ACCESSORIES);
        setFooterConfig(INITIAL_FOOTER_CONFIG);
    };

    useEffect(() => {
        if (!db) { loadDefaults(); return; }

        const unsubMfg = onSnapshot(collection(db, 'artifacts', appId, 'manufacturers'), (s) => !s.empty && setManufacturers(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubSeries = onSnapshot(collection(db, 'artifacts', appId, 'series_data'), (s) => {
            if(!s.empty) {
                const map = {};
                s.forEach(d => map[d.id] = d.data());
                setSeriesData(map);
            }
        });
        const unsubComps = onSnapshot(collection(db, 'artifacts', appId, 'components'), (s) => !s.empty && setComponentTypes(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubCables = onSnapshot(collection(db, 'artifacts', appId, 'cables'), (s) => !s.empty && setCables(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubAcc = onSnapshot(collection(db, 'artifacts', appId, 'accessories'), (s) => !s.empty && setAccessories(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubGrips = onSnapshot(collection(db, 'artifacts', appId, 'cord_grips'), (s) => !s.empty && setCordGrips(s.docs.map(d => ({...d.data(), id: d.id}))));
        const unsubFooter = onSnapshot(doc(db, 'artifacts', appId, 'site_config', 'footer'), (s) => {
            if (s.exists()) setFooterConfig(s.data());
        });

        return () => { unsubMfg(); unsubSeries(); unsubComps(); unsubCables(); unsubAcc(); unsubGrips(); unsubFooter(); };
    }, [db, appId]);

    return {
        manufacturers, seriesData, componentTypes, cables, cordGrips, accessories, footerConfig,
        dbActions,
        loadDefaults
    };
}