import { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useCatalogData } from './useCatalogData'; // Import the new hook

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

  // 3. USER BUILDS LISTENER (Specific to current user)
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
        if (comp.id.includes('motion') || comp.partNumber.includes('SET')) signalWires += (comp.wires - 1); 
        else if (comp.id === 'estop') signalWires += 2; 
        else if (comp.wires > 0) signalWires += comp.wires;
      }
    });
    return { signalWires, commonWire, groundWire, totalConductors: signalWires + commonWire + groundWire };
  }, [slots, catalog.componentTypes]);

  const recommendedCable = useMemo(() => {
    if (wiring.totalConductors === 0 || !enclosure) return null;
    const validCables = catalog.cables.filter(c => enclosure?.supportedStrainRelief?.includes(c.strainRelief));
    return validCables.find(c => c.conductors >= wiring.totalConductors) || null;
  }, [wiring, catalog.cables, enclosure]);

  const recommendedGrip = useMemo(() => {
    const activeOD = customCableOD ? parseFloat(customCableOD) : (recommendedCable ? recommendedCable.od_max : 0);
    if (!activeOD) return null;
    return catalog.cordGrips.find(g => activeOD >= g.range_min && activeOD <= g.range_max) || null;
  }, [recommendedCable, customCableOD, catalog.cordGrips]);

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

  // 5. ACTIONS
  const updateSlot = (index, componentId) => {
      const comp = catalog.componentTypes.find(c => c.id === componentId);
      if (!comp) return;
      const newSlots = [...slots];
      if (componentId !== 'empty' && comp.holes > 1) {
          if (index + comp.holes > newSlots.length) { alert(`Cannot place ${comp.name} here.`); return; }
      }
      newSlots[index] = { ...newSlots[index], componentId: componentId };
      if (comp.holes > 1) {
          for(let i=1; i < comp.holes; i++) newSlots[index + i] = { ...newSlots[index+i], componentId: 'linked', linkedTo: index };
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
    ...catalog, // Spread all catalog data and actions
    step, setStep, activeManufacturer, setActiveManufacturer, enclosure, setEnclosure, slots, setSlots,
    selectedAccessories, setSelectedAccessories, liftHeight, setLiftHeight, customCableOD, setCustomCableOD,
    myBuilds, wiring, recommendedCable, recommendedGrip, matchedPreconfig,
    updateSlot, loadConfig, saveConfig 
  };
}