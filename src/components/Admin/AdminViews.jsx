import React from 'react';
import { ImageIcon, Layers } from 'lucide-react';
import DataTable from '../Shared/DataTable'; // Assuming you created this file

export default function AdminViews({
    // Data
    manufacturers, seriesData, cables, accessories, componentTypes,
    
    // State
    globalTab,
    selectedManufacturerAdmin,
    selectedSeriesAdmin,
    adminSubTab,
    
    // Actions
    onEdit,
    onDelete // Optional: Pass delete handlers if implemented
}) {

    // --- VIEW: EMPTY STATE ---
    if (!globalTab && !selectedManufacturerAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 h-full">
                <Layers size={64} className="mb-4 text-slate-200" />
                <h3 className="text-xl font-bold text-slate-500">Select a Manufacturer or Global Asset</h3>
            </div>
        );
    }

    // --- VIEW: CABLES ---
    if (globalTab === 'cables') {
        const columns = [
            { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> },
            { header: 'KCID', key: 'kcid' },
            { header: 'Part #', key: 'part' },
            { header: 'Type', key: 'type' },
            { header: 'Cond.', key: 'conductors' }
        ];
        return <DataTable columns={columns} data={cables} onEdit={onEdit} onDelete={onDelete} />;
    }

    // --- VIEW: ACCESSORIES ---
    if (globalTab === 'accessories') {
        const columns = [
            { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> },
            { header: 'KCID', key: 'kcid' },
            { header: 'Name', key: 'name' }
        ];
        return <DataTable columns={columns} data={accessories} onEdit={onEdit} onDelete={onDelete} />;
    }

    // --- VIEW: MANUFACTURER SETTINGS ---
    if (selectedManufacturerAdmin && !selectedSeriesAdmin) {
        // This view is mostly handled by the "Edit Manufacturer" form in AdminForms.
        // But if you wanted a list of series here, you could add it.
        return null; // The form appears by default in Panel logic if isEditing is true, or we could show a dashboard here.
    }

    // --- VIEW: SERIES CONTENT ---
    if (selectedSeriesAdmin) {
        
        if (adminSubTab === 'enclosures') {
            const currentEnclosures = seriesData[selectedManufacturerAdmin].enclosures.filter(e => e.series === selectedSeriesAdmin);
            const columns = [
                { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'KCID', key: 'kcid' },
                { header: 'Model', key: 'model' },
                { header: 'Holes', key: 'holes' }
            ];
            return <DataTable columns={columns} data={currentEnclosures} onEdit={onEdit} onDelete={onDelete} />;
        }

        if (adminSubTab === 'components') {
            const currentComponents = componentTypes.filter(c => c.series === selectedSeriesAdmin || c.series === selectedManufacturerAdmin || c.series === 'global');
            const columns = [
                { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'KCID', key: 'kcid' },
                { header: 'Name', key: 'name' },
                { header: 'Holes', key: 'holes' }
            ];
            return <DataTable columns={columns} data={currentComponents} onEdit={onEdit} onDelete={onDelete} />;
        }

        if (adminSubTab === 'preconfigs') {
            const currentPreconfigs = seriesData[selectedManufacturerAdmin].preconfigurations?.filter(p => p.series === selectedSeriesAdmin) || [];
            const columns = [
                { header: 'Model #', key: 'modelNumber' },
                { header: 'Base Enclosure', key: 'enclosureId' },
                { header: 'Description', key: 'description' }
            ];
            return <DataTable columns={columns} data={currentPreconfigs} onEdit={onEdit} onDelete={onDelete} />;
        }
    }

    return null;
}