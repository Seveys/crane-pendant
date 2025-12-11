import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useCatalogData } from './useCatalogData'; 

export function usePendantBuilder(user, db, appId = 'default-app-id') {
  // 1. GET CATALOG DATA
  const catalog = useCatalogData(db, appId);

  // 2. BUILDER UI STATE
  const [step, setStep] = useState(1);
  const [activeManufacturer, setActiveManufacturer] = useState(null);
  const [enclosure, setEnclosure] = useState(null);
  const [slots, setSlots] = useState([]); 
  // NEW: State for housing accessories (Series 80 specific)
  const [extraSlots, setExtraSlots] = useState({ large: null, small: null });
  
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [liftHeight, setLiftHeight] = useState('');
  const [customCableOD, setCustomCableOD] = useState('');
  const [userSelectedCable, setUserSelectedCable] = useState(null); 
  const [myBuilds, setMyBuilds] = useState([]);

  // --- SLOT INITIALIZATION ---
  useEffect(() => {
    if (enclosure) {
        setSlots(prev => {
            if (prev.length === enclosure.holes) return prev;
            return Array.from({ length: enclosure.holes }).map((_, i) => ({ 
                id: i, 
                componentId: 'empty' 
            }));
        });
        // Reset extra slots on enclosure change
        setExtraSlots({ large: null, small: null });
    } else {
        setSlots([]);
        setExtraSlots({ large: null, small: null });
    }
  }, [enclosure]);

  // 3. USER BUILDS LISTENER
  useEffect(() => {
    if (user && db) {
        const unsub = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds'), (snapshot) => {
            const builds = [];
            snapshot.forEach(doc => builds.push({ ...doc.data(), id: doc.id }));
            setMyBuilds(builds.sort((x,y) => (y.timestamp?.seconds || 0) - (x.timestamp?.seconds || 0)));
        }, (e) => console.log("User history offline"));
        return () => unsub();
    }
  }, [user, db, appId]);

  // 4. CALCULATIONS (Updated to include Extra Slots)
  const wiring = useMemo(() => {
    let signalWires = 0; let commonWire = 1; let groundWire = 1; 
    
    // Helper to process a component ID
    const processComp = (compId) => {
        const comp = catalog.componentTypes.find(c => c.id === compId);
        if (comp) {
            const cId = (comp.id || '').toLowerCase();
            const cPart = (comp.partNumber || '');
            const cCat = (comp.category || '').toLowerCase();

            const isMotion = cId.includes('motion');
            const isSet = cPart.includes('SET');
            const isEstop = cId === 'estop' || cCat === 'estop';

            if (isMotion || isSet) signalWires += (comp.wires - 1); 
            else if (isEstop) signalWires += 2; 
            else if (comp.wires > 0) signalWires += comp.wires;
        }
    };

    // Process Standard Slots
    slots.forEach(slot => processComp(slot.componentId));
    
    // Process Extra Slots
    if (extraSlots.large) processComp(extraSlots.large);
    if (extraSlots.small) processComp(extraSlots.small);

    return { signalWires, commonWire, groundWire, totalConductors: signalWires + commonWire + groundWire };
  }, [slots, extraSlots, catalog.componentTypes]);

  // --- CALCULATED IDEAL CABLE ---
  const calculatedRecommendedCable = useMemo(() => {
    if (wiring.totalConductors === 0 || !enclosure) return null;
    const requiredConductors = wiring.totalConductors + 1;
    const validCables = catalog.cables.filter(c => 
        enclosure?.supportedStrainRelief?.includes(c.strainRelief) &&
        c.conductors >= requiredConductors
    );
    return validCables.sort((a, b) => a.conductors - b.conductors)[0] || null;
  }, [wiring, catalog.cables, enclosure]);

  // --- ACTIVE CABLE SELECTION ---
  const activeCable = useMemo(() => {
      return userSelectedCable || calculatedRecommendedCable;
  }, [userSelectedCable, calculatedRecommendedCable]);

  // --- CORD GRIP LOGIC ---
  const recommendedGrip = useMemo(() => {
    const activeOD = customCableOD 
        ? parseFloat(customCableOD) 
        : (activeCable ? (activeCable.od || activeCable.od_max) : 0);
    
    if (!activeOD || !enclosure) return { grip: null, odValidation: null, activeOD: activeOD };

    let odValidation = 'ok';
    const encMin = enclosure.accepted_od_min;
    const encMax = enclosure.accepted_od_max;

    if (encMin && activeOD < encMin) odValidation = 'too_small';
    else if (encMax && activeOD > encMax) odValidation = 'too_large';

    const isQuickConnectSelected = catalog.accessories.filter(Boolean).some(acc => 
        selectedAccessories.includes(acc.id) && acc.id.toLowerCase().includes('qc')
    );

    let grip = null;
    if (isQuickConnectSelected) {
        const qcGrips = catalog.cordGrips
            .filter(g => g && g.part && g.part.toLowerCase().includes('qc') && g.compatibleSeries?.includes(enclosure.series))
            .sort((a, b) => a.od_min - b.od_min);
        grip = qcGrips.find(g => activeOD >= g.od_min && activeOD <= g.od_max);
    } else {
        const standardGrips = catalog.cordGrips
            .filter(g => g && g.part && !g.part.toLowerCase().includes('qc') && g.compatibleSeries?.includes(enclosure.series))
            .sort((a, b) => a.od_min - b.od_min);
        grip = standardGrips.find(g => activeOD >= g.od_min && activeOD <= g.od_max);
    }
    
    return { grip: grip, odValidation: odValidation, activeOD: activeOD };
  }, [activeCable, customCableOD, catalog.cordGrips, enclosure, selectedAccessories, catalog.accessories]);

  const activeSeriesData = useMemo(() => {
    if (!activeManufacturer) return null;
    return catalog.seriesData[activeManufacturer] || catalog.seriesData['default'];
  }, [activeManufacturer, catalog.seriesData]);

  const matchedPreconfig = useMemo(() => {
    if (!enclosure || !activeSeriesData?.preconfigurations) return null;
    const currentSlotIds = slots.map(s => s.componentId);
    return activeSeriesData.preconfigurations.find(pre => {
        if (pre.enclosureId !== enclosure.id) return false;
        if (pre.slots.length !== currentSlotIds.length) return false;
        // Preconfigs typically don't account for custom extra slots yet, checking only main slots
        return pre.slots.every((sId, index) => sId === currentSlotIds[index]);
    });
  }, [enclosure, slots, activeSeriesData]);

  const updateSlot = (index, componentId) => {
    if (!slots[index]) return; 
    const comp = catalog.componentTypes.find(c => c.id === componentId);
    if (!comp && componentId !== 'empty') return;
    const newSlots = [...slots];
    
    if (componentId !== 'empty' && comp.holes > 1) {
        if (index + comp.holes > newSlots.length) { alert(`Cannot place ${comp.name} here. Not enough space.`); return; }
        for (let i = 1; i < comp.holes; i++) {
            if (newSlots[index + i].componentId !== 'empty' && newSlots[index + i].componentId !== 'linked') {
                alert(`Slot ${index + i + 1} is already occupied.`); return;
            }
        }
    }

    if (newSlots[index].componentId !== 'empty' && newSlots[index].componentId !== 'linked') {
        const oldComp = catalog.componentTypes.find(c => c.id === newSlots[index].componentId);
        if (oldComp?.holes > 1) {
            for(let i=1; i < oldComp.holes; i++) {
                if (index + i < newSlots.length && newSlots[index + i].componentId === 'linked') {
                    newSlots[index + i] = { ...newSlots[index + i], componentId: 'empty', linkedTo: null };
                }
            }
        }
    }

    if (componentId === 'empty' && newSlots[index].componentId === 'linked') {
        let anchorIndex = newSlots[index].linkedTo;
        if (anchorIndex !== null && newSlots[anchorIndex]) {
            newSlots[anchorIndex] = { ...newSlots[anchorIndex], componentId: 'empty' };
            const anchorComp = catalog.componentTypes.find(c => c.id === newSlots[anchorIndex].componentId);
            if (anchorComp?.holes > 1) {
                for(let i=1; i < anchorComp.holes; i++) {
                    if (anchorIndex + i < newSlots.length) {
                        newSlots[anchorIndex + i] = { ...newSlots[anchorIndex + i], componentId: 'empty', linkedTo: null };
                    }
                }
            }
        }
    }
    
    newSlots[index] = { ...newSlots[index], componentId: componentId, linkedTo: null };
    if (componentId !== 'empty' && comp.holes > 1) {
        for(let i=1; i < comp.holes; i++) {
            newSlots[index + i] = { ...newSlots[index+i], componentId: 'linked', linkedTo: index };
        }
    }
    setSlots(newSlots);
  };

  // --- NEW: Helper to update Extra Slots ---
  const updateExtraSlot = (type, componentId) => {
      setExtraSlots(prev => ({ ...prev, [type]: componentId }));
  };

  const loadConfig = (configData) => {
      setActiveManufacturer(configData.manufacturerId);
      const mfgSeries = catalog.seriesData[configData.manufacturerId];
      if (!mfgSeries) return;
      const encObj = mfgSeries.enclosures.find(e => e.id === configData.enclosureId);
      if (encObj) {
          setEnclosure(encObj);
          const reconstructedSlots = configData.slotIds.map((sId, idx) => {
              if (sId === 'linked') return { id: idx, componentId: 'linked', linkedTo: idx - 1 };
              return { id: idx, componentId: sId };
          });
          setSlots(reconstructedSlots);
          // Load extra slots if they exist in saved data
          if (configData.extraSlots) {
              setExtraSlots(configData.extraSlots);
          }
          setStep(3); 
      }
  };

  const saveConfig = async (metaData) => {
      if (!user || !enclosure) return;
      const slotIds = slots.map(s => s.componentId).join('|');
      const signature = `${activeManufacturer}|${enclosure.model}|${slotIds}`;
      const buildData = {
          manufacturerId: activeManufacturer,
          manufacturerName: catalog.manufacturers.find(m => m.id === activeManufacturer)?.name || 'Unknown',
          enclosureId: enclosure.id,
          enclosureModel: enclosure.model,
          slotIds: slots.map(s => s.componentId),
          extraSlots: extraSlots, // Save the extra slots
          signature: signature,
          timestamp: serverTimestamp(),
          created_by: user.uid,
          meta_customer: metaData.customer,
          meta_location: metaData.location,
          meta_asset: metaData.assetId
      };
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds'), buildData);
      addDoc(collection(db, 'artifacts', appId, 'public_builds'), buildData).catch(e => console.log("Stats skip"));
      return true;
  };

  return {
    ...catalog, 
    step, setStep, activeManufacturer, setActiveManufacturer, enclosure, setEnclosure, slots, setSlots,
    selectedAccessories, setSelectedAccessories, liftHeight, setLiftHeight, customCableOD, setCustomCableOD,
    myBuilds, wiring, 
    recommendedCable: calculatedRecommendedCable, 
    activeCable: activeCable, 
    userSelectedCable, setUserSelectedCable, 
    recommendedGrip: recommendedGrip.grip, 
    odValidation: recommendedGrip.odValidation,
    activeCableOD: recommendedGrip.activeOD,
    matchedPreconfig,
    updateSlot, loadConfig, saveConfig,
    extraSlots, updateExtraSlot // Exported for UI
  };
}