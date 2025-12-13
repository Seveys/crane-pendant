import React, { useState } from 'react';
import { Download, Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { toDecimalInches } from '../../utils/units'; // <--- Import Utility

export default function DataTools({ seriesData, dbActions }) {
    const [importStats, setImportStats] = useState(null);
    const [error, setError] = useState(null);

    // --- EXPORT TO CSV ---
    const handleExport = () => {
        const headers = ['ManufacturerID', 'ID', 'Series', 'Model', 'KCID', 'Holes', 'Depth', 'MaxContactDepth', 'AcceptedODMin', 'AcceptedODMax', 'StrainRelief (Split by |)', 'ImageURL'];
        const rows = [];

        Object.entries(seriesData).forEach(([mfgId, data]) => {
            if (data.enclosures) {
                data.enclosures.forEach(enc => {
                    const srString = enc.supportedStrainRelief ? enc.supportedStrainRelief.join('|') : '';
                    rows.push([
                        mfgId,
                        enc.id,
                        enc.series,
                        enc.model,
                        enc.kcid,
                        enc.holes,
                        enc.depth,
                        enc.max_contact_depth,
                        enc.accepted_od_min || 0,
                        enc.accepted_od_max || 0,
                        srString,
                        enc.image || ''
                    ]);
                });
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `enclosures_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- IMPORT FROM CSV ---
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n').map(line => line.trim()).filter(line => line);
                
                if (lines.length < 2) throw new Error("File appears empty or missing headers.");

                const groupedData = {};
                let count = 0;

                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
                    
                    if (cols.length < 5) continue; 

                    const mfgId = cols[0];
                    if (!mfgId) continue;

                    const enclosure = {
                        id: cols[1],
                        series: cols[2],
                        model: cols[3],
                        kcid: cols[4],
                        holes: parseInt(cols[5]) || 1,
                        depth: cols[6],
                        max_contact_depth: parseInt(cols[7]) || 3,
                        
                        // --- UPDATED: Use smart converter ---
                        accepted_od_min: toDecimalInches(cols[8]), 
                        accepted_od_max: toDecimalInches(cols[9]), 
                        
                        supportedStrainRelief: cols[10] ? cols[10].split('|') : [],
                        image: cols[11] || null
                    };

                    if (!groupedData[mfgId]) groupedData[mfgId] = [];
                    groupedData[mfgId].push(enclosure);
                    count++;
                }

                await dbActions.bulkUpdateEnclosures(groupedData);
                setImportStats(`Successfully imported ${count} enclosures across ${Object.keys(groupedData).length} manufacturers.`);
                setError(null);
                
                e.target.value = '';

            } catch (err) {
                console.error(err);
                setError("Import Failed: " + err.message);
                setImportStats(null);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-sm border max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="text-blue-600"/> Data Import / Export Tools
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white rounded-full shadow-sm text-green-600"><Download size={24}/></div>
                        <div><h3 className="font-bold text-slate-700">Export to CSV</h3><p className="text-xs text-slate-500">Download current enclosures for editing.</p></div>
                    </div>
                    <button onClick={handleExport} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-transform active:scale-95">Download CSV</button>
                </div>

                <div className="border rounded-xl p-6 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white rounded-full shadow-sm text-blue-600"><Upload size={24}/></div>
                        <div><h3 className="font-bold text-slate-700">Import CSV</h3><p className="text-xs text-slate-500">Upload edited CSV to bulk update.</p></div>
                    </div>
                    <label className="block w-full">
                        <span className="sr-only">Choose file</span>
                        <input type="file" accept=".csv" onChange={handleImport} className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"/>
                    </label>
                </div>
            </div>

            <div className="mt-8">
                {importStats && <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"><CheckCircle size={20}/><span>{importStats}</span></div>}
                {error && <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"><AlertTriangle size={20}/><span>{error}</span></div>}
            </div>

            <div className="mt-8 pt-6 border-t text-sm text-slate-500">
                <h4 className="font-bold text-slate-700 mb-2">Instructions:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Click <strong>Export to CSV</strong> to get a template.</li>
                    <li>Edit in Excel/Sheets. <strong>Do not change ManufacturerID</strong>.</li>
                    <li><strong>OD Fields:</strong> Accepts decimals (0.5), fractions (1/2), or mm (12mm).</li>
                    <li>For "StrainRelief", separate with | (e.g. <code>internal|external</code>).</li>
                    <li>Save as CSV and upload.</li>
                </ol>
            </div>
        </div>
    );
}