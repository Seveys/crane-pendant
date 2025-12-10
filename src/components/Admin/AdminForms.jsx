import React from 'react';
import ManufacturerForm from './forms/ManufacturerForm';
import CableForm from './forms/CableForm';
import ComponentForm from './forms/ComponentForm';
import EnclosureForm from './forms/EnclosureForm';
import FooterForm from './forms/FooterForm';

export default function AdminForms(props) {
    const { 
        globalTab, selectedManufacturerAdmin, selectedSeriesAdmin, adminSubTab, 
        editItem, onCancel, onSaveSuccess 
    } = props;

    // 1. FOOTER SETTINGS
    if (globalTab === 'footer') {
        return <FooterForm {...props} />;
    }

    // 2. MANUFACTURER (Add New OR Edit Selected)
    const isEditingMfg = editItem && editItem.id === selectedManufacturerAdmin;
    const isAddingMfg = globalTab === 'add-mfg';

    if (isAddingMfg || isEditingMfg) {
        return <ManufacturerForm {...props} />;
    }

    // 3. CABLES
    if (globalTab === 'cables') {
        return <CableForm {...props} />;
    }

    // 4. COMPONENTS
    if (adminSubTab === 'components') {
        return <ComponentForm {...props} />;
    }

    // 5. ENCLOSURES
    if (adminSubTab === 'enclosures') {
        return <EnclosureForm {...props} />;
    }

    return null;
}