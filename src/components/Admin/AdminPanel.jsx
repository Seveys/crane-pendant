import React, { useState } from 'react';
import { 
  Database, Plus, Cable, Plug, Layout, Layers, LogOut, 
  ChevronDown, ChevronRight, Folder, Settings, Search, Disc, // Added Disc Icon
  Edit, Trash2, AlertTriangle, X 
} from 'lucide-react';
import AdminViews from './AdminViews';
import AdminForms from './AdminForms';

export default function AdminPanel(props) {
    const { 
        manufacturers, seriesData, cables, cordGrips, accessories, componentTypes, footerConfig,
        dbActions, 
        onLogout, onReturnToBuilder 
    } = props;

    // --- STATE ---
    const [globalTab, setGlobalTab] = useState(null);
    const [selectedManufacturerAdmin, setSelectedManufacturerAdmin] = useState(null);
    const [selectedSeriesAdmin, setSelectedSeriesAdmin] = useState(null);
    const [adminSubTab, setAdminSubTab] = useState('enclosures'); 
    
    // Edit & Modal State
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingSeries, setIsEditingSeries] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [tempImage, setTempImage] = useState(null);
    const [tempDocs, setTempDocs] = useState([]);
    
    // Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // 'manufacturer', 'series', 'item'
    const [itemToDelete, setItemToDelete] = useState(null);

    // --- HELPERS ---
    const resetEditState = () => {
        setIsEditing(false);
        setIsEditingSeries(false);
        setEditItem(null);
        setTempImage(null);
        setTempDocs([]);
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        setItemToDelete(null);
    };

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
        resetEditState();
    };

    // --- ACTIONS ---
    const handleEditManufacturer = () => {
        const mfg = manufacturers.find(m => m.id === selectedManufacturerAdmin);
        if (!mfg) return;
        setEditItem(mfg);
        setTempImage(mfg.image);
        setIsEditing(true);
    };

    const handleDeleteManufacturer = () => {
        setDeleteTarget('manufacturer');
        setShowDeleteConfirm(true);
    };

    const handleEditSeries = () => {
        setIsEditing(true);
        setIsEditingSeries(true);
    };

    const handleDeleteSeries = () => {
        setDeleteTarget('series');
        setShowDeleteConfirm(true);
    };

    const handleDeleteItem = (item) => {
        setDeleteTarget('item');
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (deleteTarget === 'manufacturer' && selectedManufacturerAdmin) {
            dbActions.deleteManufacturer(selectedManufacturerAdmin);
            setSelectedManufacturerAdmin(null);
        } else if (deleteTarget === 'series' && selectedSeriesAdmin) {
            dbActions.deleteSeries(selectedManufacturerAdmin, selectedSeriesAdmin);
            setSelectedSeriesAdmin(null);
        } else if (deleteTarget === 'item' && itemToDelete) {
            // Determine WHAT we are deleting
            if (globalTab === 'cables') {
                dbActions.deleteCable(itemToDelete.part);
            } else if (globalTab === 'cordgrips') {
                dbActions.deleteCordGrip(itemToDelete.id);
            } else if (globalTab === 'accessories') {
                dbActions.deleteAccessory(itemToDelete.id);
            } else if (selectedSeriesAdmin) {
                if (adminSubTab === 'enclosures') {
                    dbActions.deleteEnclosure(selectedManufacturerAdmin, itemToDelete.id);
                } else if (adminSubTab === 'components') {
                    dbActions.deleteComponent(itemToDelete.id);
                } else if (adminSubTab === 'preconfigs') {
                    dbActions.deletePreconfig(selectedManufacturerAdmin, itemToDelete.id);
                }
            }
        }
        resetEditState();
    };

    // --- RENDER SIDEBAR ---
    const renderSidebar = () => (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center">
                <span className="flex items-center gap-2"><Database size={18} /> Library</span>
                <button 
                    onClick={() => { resetEditState(); setIsEditing(true); setGlobalTab('add-mfg'); setSelectedManufacturerAdmin(null); }} 
                    className="p-1 hover:bg-slate-700 rounded" title="Add Manufacturer"
                >
                    <Plus size={16}/>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Global Assets</div>
                    <button onClick={() => handleGlobalNav('cables')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'cables' ? 'bg-slate-800 text-white' : ''}`}><Cable size={14} /> Cables</button>
                    <button onClick={() => handleGlobalNav('cordgrips')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'cordgrips' ? 'bg-slate-800 text-white' : ''}`}><Disc size={14} /> Cord Grips</button>
                    <button onClick={() => handleGlobalNav('accessories')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'accessories' ? 'bg-slate-800 text-white' : ''}`}><Plug size={14} /> Accessories</button>
                </div>

                <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Site Settings</div>
                    <button onClick={() => handleGlobalNav('footer')} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'footer' ? 'bg-slate-800 text-white' : ''}`}><Layout size={14} /> Footer / Branding</button>
                </div>

                <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturers</div>
                {manufacturers.map(m => (
                    <div key={m.id}>
                        <button onClick={() => handleMfgSelect(m.id)} className={`w-full text-left px-3 py-2 rounded flex items-center justify-between hover:bg-slate-800 transition-colors ${selectedManufacturerAdmin === m.id && !globalTab ? 'bg-slate-800 text-white' : ''}`}>
                            <span className="font-semibold">{m.name}</span>
                            {selectedManufacturerAdmin === m.id && !globalTab ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                        </button>
                        {selectedManufacturerAdmin === m.id && !globalTab && (
                            <div className="ml-4 mt-1 border-l-2 border-slate-700 pl-2 space-y-1">
                                {Array.from(new Set((seriesData[m.id]?.enclosures || []).map(e => e.series))).map(s => (
                                   <button key={s} onClick={() => { setSelectedSeriesAdmin(s); resetEditState(); }} className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:text-white ${selectedSeriesAdmin === s ? 'text-blue-400 font-medium bg-slate-800/50' : 'text-slate-400'}`}><Folder size={14} /> {s}</button>
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

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
            {renderSidebar()}
            
            <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
                {(globalTab || selectedManufacturerAdmin) && (
                    <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                {globalTab === 'cables' && <><Cable className="text-blue-600"/> Cable Library</>}
                                {globalTab === 'cordgrips' && <><Disc className="text-blue-600"/> Cord Grips</>}
                                {globalTab === 'accessories' && <><Plug className="text-blue-600"/> Accessories</>}
                                {globalTab === 'footer' && <><Layout className="text-blue-600"/> Footer Config</>}
                                {globalTab === 'add-mfg' && <><Plus className="text-green-600"/> Add Manufacturer</>}
                                {selectedManufacturerAdmin && !selectedSeriesAdmin && <><Settings className="text-slate-600"/> {manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name}</>}
                                {selectedSeriesAdmin && <><Folder className="text-blue-600"/> {selectedSeriesAdmin} Series</>}
                            </h2>
                            {selectedSeriesAdmin && <p className="text-xs text-slate-500">{manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name}</p>}
                        </div>

                        <div className="flex gap-2">
                            {/* MANUFACTURER ACTIONS */}
                            {selectedManufacturerAdmin && !selectedSeriesAdmin && !isEditing && (
                                <>
                                    <button onClick={handleEditManufacturer} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded text-sm font-bold flex items-center gap-1 transition-colors"><Edit size={16}/> Edit</button>
                                    <button onClick={handleDeleteManufacturer} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm font-bold flex items-center gap-1 transition-colors"><Trash2 size={16}/> Delete</button>
                                </>
                            )}

                            {/* SERIES ACTIONS */}
                            {selectedSeriesAdmin && !isEditing && (
                                <div className="flex items-center gap-2 mr-4">
                                    <button onClick={handleEditSeries} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded text-sm font-bold flex items-center gap-1 transition-colors"><Edit size={16}/> Edit Series</button>
                                    <button onClick={handleDeleteSeries} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded text-sm font-bold flex items-center gap-1 transition-colors"><Trash2 size={16}/> Delete Series</button>
                                    <div className="w-px h-6 bg-slate-300 mx-2"></div>
                                </div>
                            )}

                            {selectedSeriesAdmin && (
                                <div className="bg-slate-100 p-1 rounded-lg flex mr-4">
                                    {['enclosures', 'components', 'preconfigs'].map(tab => (
                                        <button key={tab} onClick={() => { setAdminSubTab(tab); resetEditState(); }} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize ${adminSubTab === tab ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>{tab}</button>
                                    ))}
                                </div>
                            )}
                            
                            {!isEditing && globalTab !== 'footer' && globalTab !== 'add-mfg' && (
                                <button onClick={() => { resetEditState(); setIsEditing(true); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1 shadow hover:bg-blue-700"><Plus size={16} /> Add Item</button>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6">
                    {isEditing || globalTab === 'footer' ? (
                        <AdminForms 
                            {...props} 
                            isEditingSeries={isEditingSeries}
                            globalTab={globalTab} selectedManufacturerAdmin={selectedManufacturerAdmin} selectedSeriesAdmin={selectedSeriesAdmin} adminSubTab={adminSubTab}
                            editItem={editItem} tempImage={tempImage} tempDocs={tempDocs} setTempImage={setTempImage} setTempDocs={setTempDocs}
                            onCancel={resetEditState} onSaveSuccess={resetEditState}
                        />
                    ) : (
                        <AdminViews 
                            {...props} 
                            globalTab={globalTab} selectedManufacturerAdmin={selectedManufacturerAdmin} selectedSeriesAdmin={selectedSeriesAdmin} adminSubTab={adminSubTab}
                            onEdit={(item) => { setEditItem(item); setTempImage(item.image || null); setTempDocs(item.docs || []); setIsEditing(true); }}
                            onDelete={handleDeleteItem} // <--- Pass Delete Handler
                        />
                    )}
                </div>
            </div>

            {/* DELETE MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><AlertTriangle size={32}/></div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Delete {deleteTarget === 'series' ? 'Series' : (deleteTarget === 'item' ? 'Item' : 'Manufacturer')}?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to delete <strong>{deleteTarget === 'series' ? selectedSeriesAdmin : (deleteTarget === 'item' ? (itemToDelete?.name || itemToDelete?.model || 'this item') : manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name)}</strong>?
                            {deleteTarget !== 'item' && <br/>}
                            {deleteTarget !== 'item' && <span className="text-red-500 font-bold mt-2 block text-xs">This will permanently delete all associated data.</span>}
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}