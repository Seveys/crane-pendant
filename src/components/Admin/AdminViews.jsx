import React from 'react';
import { ImageIcon, Layers, Zap } from 'lucide-react';
import DataTable from '../Shared/DataTable'; 
import { toDecimalInches, formatInches } from '../../utils/units'; // <--- Import Utilities

// --- DROPDOWN OPTIONS ---
const TYPE_OPTIONS = [
    { value: 'button', label: 'Push Button' },
    { value: 'light', label: 'Pilot Light' },
    { value: 'selector', label: 'Selector Switch' },
    { value: 'potentiometer', label: 'Potentiometer' },
    { value: 'blank', label: 'Blank Plug' },
    { value: 'pilot_horn', label: 'Pilot Light / Horn' }
];

const CATEGORY_OPTIONS = [
    { value: 'momentary', label: 'Momentary' },
    { value: 'on_off', label: 'On / Off' },
    { value: 'estop', label: 'E-Stop' },
    { value: 'maintained', label: 'Maintained' },
    { value: 'indicator', label: 'Indicator' },
    { value: 'accessory', label: 'Accessory' }
];

const VOLTAGE_TYPE_OPTIONS = ['universal', 'AC', 'DC', 'AC/DC'];
const STRAIN_RELIEF_OPTIONS = ['external', 'internal'];

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
    onDelete,
    dbActions 
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
        const handleCableUpdate = async (item, key, value) => {
            await dbActions.saveCable({ ...item, [key]: value, id: item.part });
        };

        const columns = [
            { header: 'Img', key: 'image', sortable: false, editable: false, render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded border bg-white"/> : <ImageIcon size={16} className="text-slate-300"/> },
            { header: 'KCID', key: 'kcid' },
            { header: 'Part #', key: 'part' },
            { header: 'Description', key: 'description', render: (i) => <span className="font-medium">{i.description || i.type}</span> },
            { header: 'Cond.', key: 'conductors', type: 'number', render: (i) => <span className="font-bold">{i.conductors}</span> },
            { header: 'AWG', key: 'awg', type: 'number' },
            { header: 'OD Range', key: 'od_min', editable: false, render: (i) => `${(i.od_min || 0).toFixed(3)}" - ${(i.od_max || 0).toFixed(3)}"` },
            { header: 'Strain Relief', key: 'strainRelief', editorType: 'select', options: STRAIN_RELIEF_OPTIONS, render: (i) => <span className="capitalize bg-slate-100 px-2 py-0.5 rounded text-xs">{i.strainRelief}</span> }
        ];
        return <DataTable columns={columns} data={cables} onEdit={onEdit} onDelete={onDelete} onCellEdit={handleCableUpdate} />;
    }

    // --- VIEW: ACCESSORIES ---
    if (globalTab === 'accessories') {
        const handleAccessoryUpdate = async (item, key, value) => {
            await dbActions.saveAccessory({ ...item, [key]: value });
        };
        const columns = [
            { header: 'Img', key: 'image', sortable: false, editable: false, render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded border bg-white"/> : <ImageIcon size={16} className="text-slate-300"/> },
            { header: 'KCID', key: 'kcid' },
            { header: 'Part #', key: 'partNumber' },
            { header: 'Name', key: 'name', render: (i) => <span className="font-bold">{i.name}</span> },
            { header: 'Description', key: 'description', render: (i) => <span className="text-slate-500 truncate max-w-xs block">{i.description}</span> }
        ];
        return <DataTable columns={columns} data={accessories} onEdit={onEdit} onDelete={onDelete} onCellEdit={handleAccessoryUpdate} />;
    }

    // --- VIEW: SERIES CONTENT ---
    if (selectedSeriesAdmin) {
        
        if (adminSubTab === 'enclosures') {
            const currentEnclosures = seriesData[selectedManufacturerAdmin].enclosures.filter(e => e.series === selectedSeriesAdmin);
            
            const handleEnclosureUpdate = async (item, key, value) => {
                let finalVal = value;
                // If editing OD fields, use the smart converter
                if (key === 'accepted_od_min' || key === 'accepted_od_max') {
                    finalVal = toDecimalInches(value);
                }
                
                await dbActions.saveEnclosure(selectedManufacturerAdmin, { ...item, [key]: finalVal });
            };

            const columns = [
                { header: 'Img', key: 'image', sortable: false, editable: false, render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded border bg-white"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'KCID', key: 'kcid' },
                { header: 'Model', key: 'model', render: (i) => <span className="font-bold text-slate-800">{i.model}</span> },
                { header: 'Holes', key: 'holes', type: 'number', render: (i) => <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{i.holes} Hole</span> },
                { header: 'Depth', key: 'depth' },
                // UPDATED: No 'type: number' to allow text input (fractions/mm), use formatInches for display
                { header: 'OD Min', key: 'accepted_od_min', render: (i) => formatInches(i.accepted_od_min) },
                { header: 'OD Max', key: 'accepted_od_max', render: (i) => formatInches(i.accepted_od_max) }
            ];
            return <DataTable columns={columns} data={currentEnclosures} onEdit={onEdit} onDelete={onDelete} onCellEdit={handleEnclosureUpdate} />;
        }

        if (adminSubTab === 'components') {
            const currentComponents = componentTypes.filter(c => c.series === selectedSeriesAdmin);
            
            const handleComponentUpdate = async (item, key, value) => {
                if (['holes', 'wires', 'voltage'].includes(key) && value !== '') {
                    if (!isNaN(Number(value))) value = Number(value);
                }
                const newItem = { ...item, [key]: value };
                await dbActions.saveComponent(newItem);
            };

            const columns = [
                { header: 'Img', key: 'image', sortable: false, editable: false, render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded border bg-white"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'KCID', key: 'kcid', render: (i) => <span className="font-mono text-xs">{i.kcid}</span> },
                { header: 'Part #', key: 'partNumber', render: (i) => <span className="font-bold">{i.partNumber}</span> },
                { header: 'Name', key: 'name' },
                
                { header: 'Type', key: 'type', editorType: 'select', options: TYPE_OPTIONS, render: (i) => <span className="capitalize text-xs bg-slate-100 px-2 py-0.5 rounded">{i.type}</span> },
                { header: 'Category', key: 'category', editorType: 'select', options: CATEGORY_OPTIONS, render: (i) => <span className="capitalize text-xs text-slate-500">{i.category?.replace('_', ' ')}</span> },
                
                { header: 'Voltage', key: 'voltage', width: 'w-20', render: (i) => i.voltage ? <span className="flex items-center gap-1 text-orange-600 text-xs font-bold"><Zap size={10}/> {i.voltage}V</span> : '-' },
                { header: 'Vol. Type', key: 'voltageType', editorType: 'select', options: VOLTAGE_TYPE_OPTIONS, width: 'w-20', render: (i) => <span className="text-xs">{i.voltageType}</span> },
                
                { header: 'Color', key: 'color', render: (i) => i.color ? <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full border shadow-sm ${i.color.includes('bg-') ? i.color : 'bg-gray-200'}`} style={!i.color.includes('bg-') ? {backgroundColor: i.color} : {}}></div><span className="text-xs capitalize">{i.color.replace('bg-', '').replace('-500', '')}</span></div> : '-' },
                { header: 'Holes', key: 'holes', type: 'number', width: 'w-16', render: (i) => i.holes > 1 ? <span className="text-xs font-bold text-purple-600">{i.holes}</span> : '1' },
                { header: 'Wires', key: 'wires', type: 'number', width: 'w-16' },
            ];
            
            return (
                <DataTable 
                    columns={columns} 
                    data={currentComponents} 
                    onEdit={onEdit} 
                    onDelete={onDelete}
                    onCellEdit={handleComponentUpdate} 
                />
            );
        }

        if (adminSubTab === 'preconfigs') {
            const currentPreconfigs = seriesData[selectedManufacturerAdmin].preconfigurations?.filter(p => p.series === selectedSeriesAdmin) || [];
            const columns = [
                { header: 'Img', key: 'image', sortable: false, editable: false, render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded border bg-white"/> : <ImageIcon size={16} className="text-slate-300"/> },
                { header: 'Model #', key: 'modelNumber', render: (i) => <span className="font-bold">{i.modelNumber}</span> },
                { header: 'KCID', key: 'kcid' },
                { header: 'Enclosure ID', key: 'enclosureId', render: (i) => <span className="font-mono text-xs">{i.enclosureId}</span> },
                { header: 'Description', key: 'description' },
                { header: 'Slots', key: 'slots', editable: false, render: (i) => <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{i.slots?.length || 0} Slots</span> }
            ];
            return <DataTable columns={columns} data={currentPreconfigs} onEdit={onEdit} onDelete={onDelete} />;
        }
    }

    return null;
}