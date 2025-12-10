import React from 'react';
import { ImageIcon, Layers } from 'lucide-react';
import DataTable from '../Shared/DataTable'; 

export default function AdminViews({
    // Data
    manufacturers, seriesData, cables, cordGrips, accessories, componentTypes,
    
    // State
    globalTab,
    selectedManufacturerAdmin,
    selectedSeriesAdmin,
    adminSubTab,
    
    // Actions
    onEdit,
    onDelete 
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
            { header: 'Description', key: 'description', render: (i) => i.description || i.type },
            { header: 'Cond.', key: 'conductors' }
        ];
        return <DataTable columns={columns} data={cables} onEdit={onEdit} onDelete={onDelete} />;
    }

    // --- VIEW: CORD GRIPS ---
    if (globalTab === 'cordgrips') {
        const columns = [
            { header: 'Part #', key: 'part' },
            { header: 'Desc', key: 'description' },
            { header: 'Thread', key: 'thread' },
            { header: 'Range', key: 'range', render: (i) => `${i.od_min_display || i.od_min} - ${i.od_max_display || i.od_max}` }
        ];
        return <DataTable columns={columns} data={cordGrips} onEdit={onEdit} onDelete={onDelete} />;
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
        return null; 
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
            const currentComponents = componentTypes.filter(c => c.series === selectedSeriesAdmin);
            const columns = [
                { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'KCID', key: 'kcid' },
                { header: 'Part #', key: 'partNumber' },
                { header: 'Name', key: 'name' },
                { header: 'Type', key: 'type', render: (i) => <span className="capitalize">{i.type}</span> }
            ];
            return <DataTable columns={columns} data={currentComponents} onEdit={onEdit} onDelete={onDelete} />;
        }

        if (adminSubTab === 'preconfigs') {
            const currentPreconfigs = seriesData[selectedManufacturerAdmin].preconfigurations?.filter(p => p.series === selectedSeriesAdmin) || [];
            const columns = [
                { header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> }, // <--- ADDED IMAGE COLUMN
                { header: 'Model #', key: 'modelNumber' },
                { header: 'KCID', key: 'kcid' },
                { header: 'Base Enclosure', key: 'enclosureId' },
                { header: 'Description', key: 'description' }
            ];
            return <DataTable columns={columns} data={currentPreconfigs} onEdit={onEdit} onDelete={onDelete} />;
        }
    }

    return null;
}