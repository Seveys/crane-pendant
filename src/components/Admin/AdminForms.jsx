import React from 'react';
import ManufacturerForm from './forms/ManufacturerForm';
import CableForm from './forms/CableForm';
import ComponentForm from './forms/ComponentForm';
import EnclosureForm from './forms/EnclosureForm';
import FooterForm from './forms/FooterForm';
import SeriesForm from './forms/SeriesForm';
import CordGripForm from './forms/CordGripForm';
import PreconfigForm from './forms/PreconfigForm'; // <--- New Import

export default function AdminForms(props) {
    const { 
        globalTab, selectedManufacturerAdmin, adminSubTab, 
        editItem, isEditingSeries 
    } = props;

    // 1. FOOTER
    if (globalTab === 'footer') {
        return <FooterForm {...props} />;
    }

    // 2. MANUFACTURER
    const isEditingMfg = editItem && editItem.id === selectedManufacturerAdmin;
    const isAddingMfg = globalTab === 'add-mfg';

    if (isAddingMfg || isEditingMfg) {
        return <ManufacturerForm {...props} />;
    }

    // 3. SERIES RENAME
    if (isEditingSeries) {
        return <SeriesForm {...props} />;
    }

    // --- GLOBAL ASSETS ---
    if (globalTab === 'cables') {
        return <CableForm {...props} />;
    }
    if (globalTab === 'cordgrips') {
        return <CordGripForm {...props} />;
    }

    // --- SERIES ASSETS ---
    if (adminSubTab === 'components') {
        return <ComponentForm {...props} />;
    }
    if (adminSubTab === 'enclosures') {
        return <EnclosureForm {...props} />;
    }
    
    // 4. PRE-CONFIGURATIONS (NEW)
    if (adminSubTab === 'preconfigs') {
        // When adding or editing a preconfig
        return <PreconfigForm {...props} />;
    }

    return null;
}