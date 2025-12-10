import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, ArrowUp, ArrowDown, Settings, AlertTriangle, ChevronRight, Layers, Upload, Loader2, ImageIcon } from 'lucide-react'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase'; // Import storage service

export default function PreconfigForm({ 
    manufacturers, seriesData, componentTypes, 
    dbActions, 
    selectedManufacturerAdmin, selectedSeriesAdmin, 
    editItem, onCancel, onSaveSuccess 
}) {
    // --- LOCAL BUILDER STATE (Mimics Step 2/3) ---
    const [configId] = useState(editItem?.id || `pre-${Date.now()}`);
    const [modelNumber, setModelNumber] = useState(editItem?.modelNumber || '');
    const [kcid, setKcid] = useState(editItem?.kcid || '');
    const [description, setDescription] = useState(editItem?.description || '');
    
    // Image State
    const [tempImage, setTempImage] = useState(editItem?.image || null);
    const [uploading, setUploading] = useState(false);
    
    // Enclosure & Slot State
    const [selectedEnclosureId, setSelectedEnclosureId] = useState(editItem?.enclosureId || '');
    const [slots, setSlots] = useState(editItem?.slots || []); // Stores component IDs
    
    // --- DATA ---
    const currentSeries = seriesData[selectedManufacturerAdmin] || {};
    const enclosures = currentSeries.enclosures || [];
    const selectedEnclosure = enclosures.find(e => e.id === selectedEnclosureId);

    // --- EFFECT: Initialize Slots when Enclosure changes ---
    useEffect(() => {
        if (selectedEnclosure && !editItem) {
            setSlots(Array.from({ length: selectedEnclosure.holes }).map(() => 'empty'));
        } else if (selectedEnclosure && editItem) {
             // For editing, ensure the slots array length matches the enclosure's hole count
             const newSlots = [...editItem.slots];
             while (newSlots.length < selectedEnclosure.holes) newSlots.push('empty');
             setSlots(newSlots.slice(0, selectedEnclosure.holes));
        } else if (!selectedEnclosureId) {
             setSlots([]);
        }
    }, [selectedEnclosureId, selectedEnclosure, editItem]);

    // --- FILTERED COMPONENTS ---
    const availableComponents = useMemo(() => {
        if (!selectedEnclosure) return [];
        return componentTypes.filter(c => 
            c.series === selectedManufacturerAdmin || 
            c.series === selectedSeriesAdmin
        );
    }, [componentTypes, selectedManufacturerAdmin, selectedSeriesAdmin, selectedEnclosure]);

    // --- IMAGE UPLOAD ACTION ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!storage) {
            alert("Storage not configured. Check firebase.js");
            return;
        }

        try {
            setUploading(true);
            // Create a unique path: images/preconfigs/timestamp_filename
            const storageRef = ref(storage, `images/preconfigs/${Date.now()}_${file.name}`);
            
            // Upload
            const snapshot = await uploadBytes(storageRef, file);
            
            // Get URL
            const url = await getDownloadURL(snapshot.ref);
            
            setTempImage(url); // Set the URL as the image
        } catch (error) {
            console.error("Upload failed", error);
            alert("Image upload failed!");
        } finally {
            setUploading(false);
        }
    };

    // --- SLOT ACTIONS ---
    const updateSlot = (index, componentId) => {
        const comp = componentTypes.find(c => c.id === componentId);
        const newSlots = [...slots];

        // 1. Hole Constraint Check (simplified)
        if (componentId !== 'empty' && comp?.holes > 1) {
            if (index + comp.holes > newSlots.length) { 
                alert(`Cannot place ${comp.name} here. Not enough holes.`); 
                return; 
            }
            // Check if any slot is already occupied by another anchor
            for (let i = 1; i < comp.holes; i++) {
                if (newSlots[index + i] !== 'empty' && newSlots[index + i] !== 'linked') {
                    alert(`Slot ${index + i + 1} is already occupied.`);
                    return;
                }
            }
        }

        // 2. Clear existing links before setting new anchor (for safety)
        if (newSlots[index] !== 'empty' && newSlots[index] !== 'linked') {
            const oldComp = componentTypes.find(c => c.id === newSlots[index]);
            if (oldComp?.holes > 1) {
                for(let i = 1; i < oldComp.holes; i++) {
                    if (newSlots[index + i] === 'linked') newSlots[index + i] = 'empty';
                }
            }
        }
        
        // 3. Set Anchor Slot
        newSlots[index] = componentId;

        // 4. Set Linked Slots
        if (componentId !== 'empty' && comp?.holes > 1) {
            for(let i = 1; i < comp.holes; i++) {
                newSlots[index + i] = 'linked';
            }
        } else if (newSlots[index] === 'empty') {
             // If clearing a single slot, check for and clear forward link
            if (newSlots[index + 1] === 'linked') newSlots[index + 1] = 'empty';

            // Also check for backward link and clear the chain if necessary
            if (index > 0 && newSlots[index - 1] === 'linked') {
                let j = index - 1;
                while(j >= 0 && newSlots[j] === 'linked') j--;
                
                // j is now the anchor or empty slot. Check if anchor needs clearing
                if (newSlots[j] !== 'empty' && componentTypes.find(c => c.id === newSlots[j])?.holes > 1) {
                    newSlots[j] = 'empty';
                    for(let k = j + 1; k < newSlots.length; k++) {
                        if (newSlots[k] === 'linked') newSlots[k] = 'empty'; else break;
                    }
                }
            }
        }

        setSlots(newSlots);
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!selectedEnclosureId || !modelNumber.trim() || !kcid.trim()) {
            return alert("Enclosure, Model #, and KCID are required.");
        }
        if (slots.some(s => s === 'empty')) {
            return alert("Please fill all slots or confirm the configuration.");
        }

        const newItem = {
            id: configId,
            series: selectedSeriesAdmin,
            enclosureId: selectedEnclosureId,
            modelNumber: modelNumber.trim(),
            kcid: kcid.trim(),
            description: description.trim(),
            image: tempImage || null, // <--- SAVING IMAGE URL HERE
            slots: slots, // Array of component IDs
            timestamp: Date.now()
        };

        const finalSeriesData = seriesData[selectedManufacturerAdmin];
        let newPreconfigs = [...(finalSeriesData.preconfigurations || [])];
        
        const index = newPreconfigs.findIndex(p => p.id === configId);
        if (index >= 0) {
            newPreconfigs[index] = newItem; // Update existing
        } else {
            newPreconfigs.push(newItem); // Add new
        }
        
        // Save the updated series document
        dbActions.saveSeries(selectedManufacturerAdmin, { 
            ...finalSeriesData, 
            preconfigurations: newPreconfigs 
        });

        onSaveSuccess();
    };

    // --- RENDER VISUAL SLOT ---
    const renderSlotItem = (slotId) => {
        if (slotId === 'empty') return <div className="text-xs text-slate-400">Empty Hole</div>;
        if (slotId === 'linked') return <div className="text-xs text-blue-400">Linked/Occupied</div>;
        
        const comp = componentTypes.find(c => c.id === slotId);
        return <div className="text-sm font-semibold">{comp?.name || 'Unknown Component'}</div>;
    };

    // --- RENDER FORM ---
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="font-bold text-lg mb-4">
                {editItem ? 'Edit Pre-Configuration' : 'Create New Pre-Configuration'}
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LEFT: METADATA & ENCLOSURE SELECTION */}
                <div className="space-y-4 col-span-1 border-r pr-6">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2"><Settings size={16} /> Assembly Details</h4>
                    
                    {/* Model Number & KCID */}
                    <div><label className="text-xs font-bold block mb-1">Model / Part Number</label><input value={modelNumber} onChange={e => setModelNumber(e.target.value)} required className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold block mb-1">KCID</label><input value={kcid} onChange={e => setKcid(e.target.value)} required className="w-full border p-2 rounded"/></div>
                    <div><label className="text-xs font-bold block mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded text-sm"/></div>
                    
                    {/* IMAGE UPLOAD FIELD */}
                    <div className="pt-4 border-t">
                        <label className="text-xs font-bold block mb-1">Assembly Image</label>
                        <div className="flex items-center gap-3">
                            {tempImage ? <img src={tempImage} className="w-16 h-16 object-contain border rounded" /> : <ImageIcon size={32} className="text-slate-300"/>}
                            <label className={`cursor-pointer bg-slate-200 px-3 py-2 rounded text-xs hover:bg-slate-300 flex items-center gap-1 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploading ? <Loader2 size={12} className="animate-spin"/> : <Upload size={12}/>} 
                                {uploading ? 'Uploading...' : 'Upload Image'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                            {tempImage && (
                                <button type="button" onClick={() => setTempImage(null)} className="text-red-500 hover:text-red-700 p-1">
                                    <X size={16}/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Enclosure Selection */}
                    <div className="pt-4 border-t">
                        <label className="text-xs font-bold block mb-1">Base Enclosure</label>
                        <select 
                            value={selectedEnclosureId}
                            onChange={e => { setSelectedEnclosureId(e.target.value); setSlots([]); }}
                            required
                            className="w-full border p-2 rounded"
                        >
                            <option value="">-- Select Enclosure ({currentSeries.name}) --</option>
                            {enclosures.filter(e => e.series === selectedSeriesAdmin).map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.model} ({e.holes} Holes)
                                </option>
                            ))}
                        </select>
                        {selectedEnclosure && (
                            <p className="text-xs text-slate-500 mt-2">
                                Holes: {selectedEnclosure.holes}, Depth: {selectedEnclosure.depth}
                            </p>
                        )}
                    </div>

                    <div className="pt-6">
                         <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded text-sm mr-2">Cancel</button>
                         <button type="submit" disabled={uploading} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50">Save Pre-Configuration</button>
                    </div>
                </div>

                {/* MIDDLE: SLOT CONFIGURATION */}
                <div className="space-y-4 col-span-2">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <Layers size={16} /> Slot Configuration
                    </h4>
                    
                    {!selectedEnclosure ? (
                        <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 rounded">Select an enclosure to begin configuration.</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Slot List */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {slots.map((slotId, index) => (
                                    <div key={index} className={`flex items-center p-3 rounded border ${slotId === 'empty' ? 'bg-slate-50' : slotId === 'linked' ? 'bg-blue-50/50' : 'bg-green-50/50'}`}>
                                        <span className="font-mono text-slate-400 mr-4">#{index + 1}</span>
                                        <div className="flex-1">{renderSlotItem(slotId)}</div>
                                        
                                        {/* Remove Button */}
                                        {(slotId !== 'empty' && slotId !== 'linked') && (
                                            <button type="button" onClick={() => updateSlot(index, 'empty')} className="text-red-500 hover:text-red-700 p-1">
                                                <X size={14}/>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Component Selector */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                <p className="text-xs font-bold text-slate-500 uppercase">Available Components</p>
                                {availableComponents.map(comp => (
                                    <button 
                                        key={comp.id}
                                        type="button"
                                        onClick={() => {
                                            const firstEmptyIndex = slots.findIndex(s => s === 'empty');
                                            if (firstEmptyIndex !== -1) {
                                                updateSlot(firstEmptyIndex, comp.id);
                                            } else {
                                                alert("Enclosure is full.");
                                            }
                                        }}
                                        className="w-full text-left p-3 border rounded-lg hover:border-blue-400 transition-colors bg-white shadow-sm flex items-center gap-2"
                                    >
                                        <Settings size={16} className="text-blue-500 shrink-0" />
                                        <div>
                                            <div className="font-bold text-sm leading-tight">{comp.name} ({comp.holes}H)</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{comp.partNumber}</div>
                                        </div>
                                        <div className="ml-auto text-green-600"><Plus size={14} /></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}