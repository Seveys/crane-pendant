import React, { useState } from 'react';
import { 
  Database, Plus, Cable, Plug, Layout, Layers, LogOut, 
  ChevronDown, ChevronRight, Folder, Settings, Search 
} from 'lucide-react';
import AdminViews from './AdminViews';
import AdminForms from './AdminForms';

export default function AdminPanel(props) {
    const { 
        manufacturers, seriesData, cables, accessories, componentTypes, footerConfig,
        setManufacturers, setSeriesData, setCables, setAccessories, setComponentTypes, setFooterConfig,
        onLogout, onReturnToBuilder 
    } = props;

    // --- LOCAL ADMIN STATE ---
    const [globalTab, setGlobalTab] = useState(null); // 'cables', 'accessories', 'footer', 'add-mfg'
    const [selectedManufacturerAdmin, setSelectedManufacturerAdmin] = useState(null);
    const [selectedSeriesAdmin, setSelectedSeriesAdmin] = useState(null);
    const [adminSubTab, setAdminSubTab] = useState('enclosures'); // 'enclosures', 'components', 'preconfigs'
    
    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [tempImage, setTempImage] = useState(null);
    const [tempDocs, setTempDocs] = useState([]);

    // --- HELPER: RESET EDIT STATE ---
    const resetEditState = () => {
        setIsEditing(false);
        setEditItem(null);
        setTempImage(null);
        setTempDocs([]);
    };

    // --- HANDLER: SIDEBAR NAVIGATION ---
    const handleGlobalNav = (tab) => {
        setGlobalTab(tab);
        setSelectedManufacturerAdmin(null);
        setSelectedSeriesAdmin(null);
        resetEditState();
    };

    const handleMfgSelect = (mfgId) => {
        setSelectedManufacturerAdmin(mfgId);
        setGlobalTab(null);
        setSelectedSeriesAdmin(null);
        // Default to first series if available, or stay null
        resetEditState();
    };

    // --- RENDER SIDEBAR ---
    const renderSidebar = () => (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                <span className="flex items-center gap-2"><Database size={18} /> Library</span>
                <button 
                    onClick={() => { 
                        resetEditState(); 
                        setIsEditing(true); 
                        setGlobalTab('add-mfg'); 
                        setSelectedManufacturerAdmin(null); // Fix: Clear selection so "New Item" logic works
                    }} 
                    className="p-1 hover:bg-slate-700 rounded" title="Add Manufacturer"
                >
                    <Plus size={16}/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Global Assets */}
                <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Global Assets</div>
                    <button onClick={() => handleGlobalNav('cables')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'cables' ? 'bg-slate-800 text-white' : ''}`}>
                        <Cable size={14} /> Cables
                    </button>
                    <button onClick={() => handleGlobalNav('accessories')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'accessories' ? 'bg-slate-800 text-white' : ''}`}>
                        <Plug size={14} /> Accessories
                    </button>
                </div>

                {/* Site Settings */}
                <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Site Settings</div>
                    <button onClick={() => handleGlobalNav('footer')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'footer' ? 'bg-slate-800 text-white' : ''}`}>
                        <Layout size={14} /> Footer / Branding
                    </button>
                </div>

                {/* Manufacturers List */}
                <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturers</div>
                {manufacturers.map(m => (
                    <div key={m.id}>
                        <button 
                            onClick={() => handleMfgSelect(m.id)} 
                            className={`w-full text-left px-3 py-2 rounded flex items-center justify-between hover:bg-slate-800 transition-colors ${selectedManufacturerAdmin === m.id && !globalTab ? 'bg-slate-800 text-white' : ''}`}
                        >
                            <span className="font-semibold">{m.name}</span>
                            {selectedManufacturerAdmin === m.id && !globalTab ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </button>
                        
                        {/* Series Sub-menu */}
                        {selectedManufacturerAdmin === m.id && !globalTab && (
                            <div className="ml-4 mt-1 border-l-2 border-slate-700 pl-2 space-y-1">
                                {/* Safer map logic: Check for existence of enclosures array before mapping */}
                                {Array.from(new Set((seriesData[m.id]?.enclosures || []).map(e => e.series))).map(s => (
                                   <button key={s} onClick={() => setSelectedSeriesAdmin(s)} className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:text-white ${selectedSeriesAdmin === s ? 'text-blue-400 font-medium bg-slate-800/50' : 'text-slate-400'}`}>
                                    <Folder size={14} /> {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center">
                <button onClick={onReturnToBuilder} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">Back to Builder</button>
                <button onClick={onLogout} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><LogOut size={12}/> Logout</button>
            </div>
        </div>
    );

    // --- RENDER MAIN CONTENT AREA ---
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {renderSidebar()}
            
            <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
                {/* 1. Header Area for Content */}
                {(globalTab || selectedManufacturerAdmin) && (
                    <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {globalTab === 'cables' && <><Cable className="text-blue-600"/> Cable Library</>}
                                {globalTab === 'accessories' && <><Plug className="text-blue-600"/> Accessories</>}
                                {globalTab === 'footer' && <><Layout className="text-blue-600"/> Footer Config</>}
                                {globalTab === 'add-mfg' && <><Plus className="text-green-600"/> Add Manufacturer</>}
                                {selectedManufacturerAdmin && !selectedSeriesAdmin && <><Settings className="text-slate-600"/> {manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name}</>}
                                {selectedSeriesAdmin && <><Folder className="text-blue-600"/> {selectedSeriesAdmin} Series</>}
                            </h2>
                            {selectedSeriesAdmin && <p className="text-xs text-slate-500">{manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name}</p>}
                        </div>

                        {/* Action Buttons / Tabs */}
                        <div className="flex gap-2">
                            {selectedSeriesAdmin && (
                                <div className="bg-slate-100 p-1 rounded-lg flex mr-4">
                                    {['enclosures', 'components', 'preconfigs'].map(tab => (
                                        <button 
                                            key={tab}
                                            onClick={() => { setAdminSubTab(tab); resetEditState(); }} 
                                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize ${adminSubTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>
                            )}
                            
                            {!isEditing && globalTab !== 'footer' && globalTab !== 'add-mfg' && (
                                <button 
                                    onClick={() => { resetEditState(); setIsEditing(true); }} 
                                    className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1 shadow hover:bg-blue-700"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Main Content Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* EDITING FORMS */}
                    {isEditing || globalTab === 'footer' ? (
                        <AdminForms 
                            {...props} // Pass all data setters
                            // State
                            globalTab={globalTab}
                            selectedManufacturerAdmin={selectedManufacturerAdmin}
                            selectedSeriesAdmin={selectedSeriesAdmin}
                            adminSubTab={adminSubTab}
                            editItem={editItem}
                            tempImage={tempImage}
                            tempDocs={tempDocs}
                            setTempImage={setTempImage}
                            setTempDocs={setTempDocs}
                            onCancel={resetEditState}
                            onSaveSuccess={resetEditState}
                        />
                    ) : (
                        /* DATA TABLES / VIEWS */
                        <AdminViews 
                            {...props} // Pass all data arrays
                            globalTab={globalTab}
                            selectedManufacturerAdmin={selectedManufacturerAdmin}
                            selectedSeriesAdmin={selectedSeriesAdmin}
                            adminSubTab={adminSubTab}
                            onEdit={(item) => { 
                                setEditItem(item); 
                                setTempImage(item.image || null); 
                                setTempDocs(item.docs || []); 
                                setIsEditing(true); 
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}