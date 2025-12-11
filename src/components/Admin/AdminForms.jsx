import React from 'react';
import { Trash2 } from 'lucide-react';
import ManufacturerForm from './forms/ManufacturerForm';
import EnclosureForm from './forms/EnclosureForm';
import ComponentForm from './forms/ComponentForm';
import CableForm from './forms/CableForm';
import FooterForm from './forms/FooterForm';

export default function AdminForms(props) {
    const { 
        globalTab, selectedManufacturerAdmin, selectedSeriesAdmin, adminSubTab, editItem, onDelete
    } = props;

    // --- WRAPPER FOR HEADER ---
    const renderHeader = (title) => (
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">{title}</h3>
            {editItem && onDelete && (
                <button 
                    type="button" 
                    onClick={onDelete} 
                    className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50" 
                    title="Delete"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
    );

    // --- ROUTER ---

    if (globalTab === 'footer') {
        return <FooterForm {...props} />;
    }

    if (globalTab === 'add-mfg' || (selectedManufacturerAdmin && !selectedSeriesAdmin && !adminSubTab)) {
        return (
            <div className="bg-white p-6 rounded shadow-lg max-w-lg">
                {renderHeader(editItem ? 'Edit Manufacturer' : 'Add Manufacturer')}
                <ManufacturerForm {...props} />
            </div>
        );
    }

    if (globalTab === 'cables') {
        return (
            <div className="bg-white p-4 mb-4 rounded shadow border max-w-4xl">
                {renderHeader(editItem ? 'Edit Cable' : 'Add Cable')}
                <CableForm {...props} />
            </div>
        );
    }

    if (adminSubTab === 'enclosures') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                {renderHeader(editItem ? 'Edit Enclosure' : 'Add Enclosure')}
                <EnclosureForm {...props} />
            </div>
        );
    }

    if (adminSubTab === 'components') {
        return (
            <div className="mb-6 bg-white p-4 border rounded-lg shadow-lg">
                {renderHeader(editItem ? 'Edit Component' : 'Add Component')}
                <ComponentForm {...props} />
            </div>
        );
    }

    return null;
}