import { useState, useEffect, useMemo } from 'react';
import { 
  collection, addDoc, onSnapshot, serverTimestamp 
} from 'firebase/firestore';

import { 
  INITIAL_MANUFACTURERS, INITIAL_SERIES_DATA, INITIAL_COMPONENTS, 
  INITIAL_CABLES, INITIAL_ACCESSORIES, INITIAL_CORD_GRIPS, INITIAL_FOOTER_CONFIG 
} from '../data/initialData';

export function usePendantBuilder(user, db, appId = 'default-app-id') {
  // --- 1. CORE DATA STATE ---
  // These are passed down to AdminPanel for editing
  const [manufacturers, setManufacturers] = useState(INITIAL_MANUFACTURERS);
  const [seriesData, setSeriesData] = useState(INITIAL_SERIES_DATA);
  const [componentTypes, setComponentTypes] = useState(INITIAL_COMPONENTS);
  const [cables, setCables] = useState(INITIAL_CABLES);
  const [cordGrips, setCordGrips] = useState(INITIAL_CORD_GRIPS);
  const [accessories, setAccessories] = useState(INITIAL_ACCESSORIES);
  const [footerConfig, setFooterConfig] = useState(INITIAL_FOOTER_CONFIG);

  // --- 2. BUILDER UI STATE ---
  const [step, setStep] = useState(1);
  const [activeManufacturer, setActiveManufacturer] = useState(null);
  const [enclosure, setEnclosure] = useState(null);
  const [slots, setSlots] = useState([]); 
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [liftHeight, setLiftHeight] = useState('');
  const [customCableOD, setCustomCableOD] = useState('');
  const [loadedPreconfig, setLoadedPreconfig] = useState(null); // Tracks if we loaded a specific pre-made config

  // --- 3. ANALYTICS DATA STATE ---
  const [popularConfigs, setPopularConfigs] = useState([]);
  const [myBuilds, setMyBuilds] = useState([]);

  // --- 4. FIREBASE SYNCHRONIZATION ---
  useEffect(() => {
    if (!user || !db) return; 

    // A. Fetch Public Trending Builds
    const qPublic = collection(db, 'artifacts', appId, 'public', 'data', 'pendant_builds');
    const unsubPublic = onSnapshot(qPublic, (snapshot) => {
        const builds = []; 
        snapshot.forEach(doc => builds.push(doc.data()));
        
        // Simple client-side aggregation for "Trending"
        const counts = {};
        builds.forEach(build => {
            const sig = build.signature; 
            if (!counts[sig]) counts[sig] = { count: 0, data: build };
            counts[sig].count++;
        });
        
        setPopularConfigs(
            Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5) // Top 5
                .map(c => c.data)
        );
    }, (error) => {
        console.warn("Analytics disabled (No Public Read Permissions)", error);
    });

    // B. Fetch User's Saved Builds
    const qUser = collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds');
    const unsubUser = onSnapshot(qUser, (snapshot) => {
        const builds = [];
        snapshot.forEach(doc => builds.push({ ...doc.data(), id: doc.id }));
        // Sort by newest first
        setMyBuilds(builds.sort((x,y) => (y.timestamp?.seconds || 0) - (x.timestamp?.seconds || 0)));
    }, (error) => {
        console.warn("Could not fetch user builds", error);
    });

    return () => { unsubPublic(); unsubUser(); };
  }, [user, db, appId]);


  // --- 5. CALCULATIONS (Memoized) ---

  // A. Wiring Logic (Signal, Common, Ground)
  const wiring = useMemo(() => {
    let signalWires = 0; 
    let commonWire = 1; 
    let groundWire = 1; 
    
    slots.forEach(slot => {
      const comp = componentTypes.find(c => c.id === slot.componentId);
      if (comp) {
        if (comp.id.includes('motion') || comp.partNumber.includes('SET')) {
            // "Sets" usually share a common, so wires count is often Total - Common
            signalWires += (comp.wires - 1); 
        }
        else if (comp.id === 'estop') {
            signalWires += 2; // Usually 2 NC contacts separate from common
        }
        else if (comp.wires > 0) {
            signalWires += comp.wires;
        }
      }
    });
    
    return { 
        signalWires, 
        commonWire, 
        groundWire, 
        totalConductors: signalWires + commonWire + groundWire 
    };
  }, [slots, componentTypes]);

  // B. Cable Selection
  const recommendedCable = useMemo(() => {
    if (wiring.totalConductors === 0) return null;
    if (!enclosure) return null;
    
    // Filter cables supported by the enclosure's strain relief type (Internal/External)
    const validCables = cables.filter(c => enclosure.supportedStrainRelief.includes(c.strainRelief));
    
    // Find smallest cable that has enough conductors
    return validCables.find(c => c.conductors >= wiring.totalConductors) || null;
  }, [wiring, cables, enclosure]);

  // C. Cord Grip Selection
  const recommendedGrip = useMemo(() => {
    const activeOD = customCableOD ? parseFloat(customCableOD) : (recommendedCable ? recommendedCable.od_max : 0);
    if (!activeOD) return null;
    return cordGrips.find(g => activeOD >= g.range_min && activeOD <= g.range_max) || null;
  }, [recommendedCable, customCableOD, cordGrips]);

  // D. Pre-Configuration Matcher (Did the user build something standard?)
  const activeSeriesData = useMemo(() => {
    if (!activeManufacturer) return null;
    return seriesData[activeManufacturer] || seriesData['default'];
  }, [activeManufacturer, seriesData]);

  const matchedPreconfig = useMemo(() => {
    if (!enclosure || !activeSeriesData?.preconfigurations) return null;
    const currentSlotIds = slots.map(s => s.componentId);
    
    return activeSeriesData.preconfigurations.find(pre => {
        if (pre.enclosureId !== enclosure.id) return false;
        if (pre.slots.length !== currentSlotIds.length) return false;
        return pre.slots.every((sId, index) => sId === currentSlotIds[index]);
    });
  }, [enclosure, slots, activeSeriesData]);


  // --- 6. ACTIONS ---

  // A. Update a specific slot (Handling multi-hole components)
  const updateSlot = (index, componentId) => {
      const comp = componentTypes.find(c => c.id === componentId);
      if (!comp) return;
      
      const newSlots = [...slots];
      
      // Check if multi-hole component fits
      if (componentId !== 'empty' && comp.holes > 1) {
          if (index + comp.holes > newSlots.length) { 
              alert(`Cannot place ${comp.name} here. It requires ${comp.holes} slots.`); 
              return; 
          }
      }

      // Assign the main component
      newSlots[index] = { ...newSlots[index], componentId: componentId };

      // Handle Linked Slots for Multi-hole items
      if (comp.holes > 1) {
          for(let i=1; i < comp.holes; i++) {
              newSlots[index + i] = { ...newSlots[index+i], componentId: 'linked', linkedTo: index };
          }
      } else {
          // If we replaced a multi-hole component with a single one, clear the "linked" slot that might be next to it
          if (index + 1 < newSlots.length && newSlots[index+1].componentId === 'linked' && newSlots[index+1].linkedTo === index) {
              newSlots[index+1] = { ...newSlots[index+1], componentId: 'empty', linkedTo: null };
          }
      }
      setSlots(newSlots);
  };

  // B. Load a configuration from history
  const loadConfig = (configData) => {
      setActiveManufacturer(configData.manufacturerId);
      
      const mfgSeries = seriesData[configData.manufacturerId];
      if (!mfgSeries) return;
      
      const encObj = mfgSeries.enclosures.find(e => e.id === configData.enclosureId);
      if (encObj) {
          setEnclosure(encObj);
          // Reconstruct slots array from saved IDs
          const reconstructedSlots = configData.slotIds.map((sId, idx) => {
              if (sId === 'linked') return { id: idx, componentId: 'linked', linkedTo: idx - 1 };
              return { id: idx, componentId: sId };
          });
          setSlots(reconstructedSlots);
          setStep(3); // Jump to editor
      }
  };

  // C. Save Configuration to Database
  const saveConfig = async (metaData) => {
      if (!user || !enclosure) return;
      
      const slotIds = slots.map(s => s.componentId).join('|');
      const signature = `${activeManufacturer}|${enclosure.model}|${slotIds}`;
      
      const buildData = {
          manufacturerId: activeManufacturer,
          manufacturerName: manufacturers.find(m => m.id === activeManufacturer)?.name || 'Unknown',
          enclosureId: enclosure.id,
          enclosureModel: enclosure.model,
          slotIds: slots.map(s => s.componentId),
          signature: signature,
          timestamp: serverTimestamp(),
          created_by: user.uid,
          meta_customer: metaData.customer,
          meta_location: metaData.location,
          meta_asset: metaData.assetId
      };

      try {
          // 1. Save to User's private collection
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds'), buildData);
          
          // 2. Save to Public aggregation (fire-and-forget, optional)
          if (db) {
             addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'pendant_builds'), buildData)
                .catch(e => console.log("Public stats write skipped"));
          }
          
          return true; // Success
      } catch (e) {
          console.error("Save error:", e);
          throw e;
      }
  };

  return {
    // --- State ---
    manufacturers, setManufacturers,
    seriesData, setSeriesData,
    componentTypes, setComponentTypes,
    cables, setCables,
    cordGrips, setCordGrips,
    accessories, setAccessories,
    footerConfig, setFooterConfig,
    
    step, setStep,
    activeManufacturer, setActiveManufacturer,
    enclosure, setEnclosure,
    slots, setSlots,
    selectedAccessories, setSelectedAccessories,
    liftHeight, setLiftHeight,
    customCableOD, setCustomCableOD,
    
    // --- Analytics ---
    popularConfigs,
    myBuilds,

    // --- Computed ---
    wiring,
    recommendedCable,
    recommendedGrip,
    matchedPreconfig,

    // --- Actions ---
    updateSlot,
    loadConfig,
    saveConfig
  };
}