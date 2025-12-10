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
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [liftHeight, setLiftHeight] = useState('');
  const [customCableOD, setCustomCableOD] = useState('');
  const [myBuilds, setMyBuilds] = useState([]);

  // --- SLOT INITIALIZATION (CRITICAL) ---
  useEffect(() => {
    if (enclosure) {
        setSlots(prev => {
            if (prev.length === enclosure.holes) return prev;
            return Array.from({ length: enclosure.holes }).map((_, i) => ({ 
                id: i, 
                componentId: 'empty' 
            }));
        });
    } else {
        setSlots([]);
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

  // 4. CALCULATIONS
  const wiring = useMemo(() => {
    let signalWires = 0; let commonWire = 1; let groundWire = 1; 
    slots.forEach(slot => {
      const comp = catalog.componentTypes.find(c => c.id === slot.componentId);
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
    });
    return { signalWires, commonWire, groundWire, totalConductors: signalWires + commonWire + groundWire };
  }, [slots, catalog.componentTypes]);

  // --- CABLE LOGIC (Must include 1 spare wire) ---
  const recommendedCable = useMemo(() => {
    if (wiring.totalConductors === 0 || !enclosure) return null;
    
    // Required conductors = Total Conductors + 1 Spare
    const requiredConductors = wiring.totalConductors + 1;

    const validCables = catalog.cables.filter(c => 
        enclosure?.supportedStrainRelief?.includes(c.strainRelief) &&
        c.conductors >= requiredConductors
    );
    // Find the smallest cable that meets the requirement
    return validCables.sort((a, b) => a.conductors - b.conductors)[0] || null;
  }, [wiring, catalog.cables, enclosure]);

  // --- CORD GRIP LOGIC (With Validation and Quick Connect rule) ---
  const recommendedGrip = useMemo(() => {
    const activeOD = customCableOD 
        ? parseFloat(customCableOD) 
        : (recommendedCable ? (recommendedCable.od || recommendedCable.od_max) : 0);
    
    if (!activeOD || !enclosure) return { grip: null, odValidation: null, activeOD: activeOD };

    // 1. Check enclosure OD validation
    let odValidation = 'ok';
    const encMin = enclosure.accepted_od_min;
    const encMax = enclosure.accepted_od_max;

    if (encMin && activeOD < encMin) {
        odValidation = 'too_small';
    } else if (encMax && activeOD > encMax) {
        odValidation = 'too_large';
    }

    // 2. CORD GRIP SELECTION
    // Fix for Error #2: Filter out any null/undefined accessories before checking ID
    const isQuickConnectSelected = catalog.accessories.filter(Boolean).some(acc => 
        selectedAccessories.includes(acc.id) && acc.id.toLowerCase().includes('qc')
    );

    let grip = null;

    if (isQuickConnectSelected) {
        // Find the SMALLEST QUICK CONNECT that fits the cable OD
        const qcGrips = catalog.cordGrips
            // FIX: Ensure g and g.part exist before calling toLowerCase
            .filter(g => g && g.part && g.part.toLowerCase().includes('qc'))
            .sort((a, b) => a.od_min - b.od_min);

        grip = qcGrips.find(g => activeOD >= g.od_min && activeOD <= g.od_max);

    } else {
        // Find the smallest standard Cord Grip (non-QC) that fits
        const standardGrips = catalog.cordGrips
            // FIX: Ensure g and g.part exist before calling toLowerCase
            .filter(g => g && g.part && !g.part.toLowerCase().includes('qc'))
            .sort((a, b) => a.od_min - b.od_min);

        grip = standardGrips.find(g => activeOD >= g.od_min && activeOD <= g.od_max);
    }
    
    return { grip: grip, odValidation: odValidation, activeOD: activeOD };
  }, [recommendedCable, customCableOD, catalog.cordGrips, enclosure, selectedAccessories, catalog.accessories]);

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
        return pre.slots.every((sId, index) => sId === currentSlotIds[index]);
    });
  }, [enclosure, slots, activeSeriesData]);

  const updateSlot = (index, componentId) => {
      if (!slots[index]) return; 

      const comp = catalog.componentTypes.find(c => c.id === componentId);
      if (!comp && componentId !== 'empty') return;

      const newSlots = [...slots];
      
      if (componentId !== 'empty' && comp.holes > 1) {
          if (index + comp.holes > newSlots.length) { 
              alert(`Cannot place ${comp.name} here. Not enough space.`); 
              return; 
          }
      }

      newSlots[index] = { ...newSlots[index], componentId: componentId };
      
      if (componentId !== 'empty' && comp.holes > 1) {
          for(let i=1; i < comp.holes; i++) {
              newSlots[index + i] = { ...newSlots[index+i], componentId: 'linked', linkedTo: index };
          }
      } else {
          if (index + 1 < newSlots.length && newSlots[index+1].componentId === 'linked' && newSlots[index+1].linkedTo === index) {
              newSlots[index+1] = { ...newSlots[index+1], componentId: 'empty', linkedTo: null };
          }
      }
      setSlots(newSlots);
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
    myBuilds, wiring, recommendedCable, 
    recommendedGrip: recommendedGrip.grip, 
    odValidation: recommendedGrip.odValidation,
    activeCableOD: recommendedGrip.activeOD,
    matchedPreconfig,
    updateSlot, loadConfig, saveConfig 
  };
}