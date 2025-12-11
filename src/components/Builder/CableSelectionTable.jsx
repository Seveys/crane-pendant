import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'; // Added XCircle

export default function CableSelectionTable({
    allCables,
    wiring,
    enclosure,
    recommendedCable,
    activeCable,
    currentCableOD,
    setCustomCableOD,
    setActiveCable
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'conductors', direction: 'ascending' });

    const requiredConductors = wiring.totalConductors + 1;
    const requiredStrainRelief = enclosure?.supportedStrainRelief || [];
    const encMaxOD = enclosure?.accepted_od_max;

    const sortedCables = useMemo(() => {
        let workableCables = allCables;

        workableCables = workableCables.filter(c => {
            const matchesSearch = searchTerm === '' || 
                c.part?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesSR = requiredStrainRelief.includes(c.strainRelief);

            return matchesSearch && matchesSR;
        });

        workableCables = [...workableCables];
        workableCables.sort((a, b) => {
            const aValue = a[sortConfig.key] || 0;
            const bValue = b[sortConfig.key] || 0;

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return workableCables;
    }, [allCables, searchTerm, sortConfig, requiredStrainRelief]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getClassNamesFor = (key) => {
        if (sortConfig.key !== key) return 'text-slate-400';
        return sortConfig.direction === 'ascending' ? 'text-blue-600 rotate-0' : 'text-blue-600 rotate-180';
    };

    const renderTableHeader = (key, label) => (
        <th 
            className="p-3 cursor-pointer hover:bg-slate-200 transition-colors" 
            onClick={() => requestSort(key)}
        >
            <div className="flex items-center gap-1 font-semibold text-sm text-slate-700">
                {label}
                <ChevronDown size={14} className={getClassNamesFor(key)} />
            </div>
        </th>
    );
    
    const trulyRecommendedPart = recommendedCable ? recommendedCable.part : null;
    const isWiringMet = wiring.totalConductors > 0;

    return (
        <div className="p-4 border rounded-xl bg-white shadow-lg space-y-4">
            <h4 className="font-bold text-lg text-slate-800">Cable Selection</h4>
            
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded border">
                <div className="flex items-center w-64 border rounded-lg bg-white p-1">
                    <Search size={18} className="text-slate-400 mx-2" />
                    <input
                        type="text"
                        placeholder="Search P/N or Description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm outline-none"
                    />
                </div>
                <div className="text-sm font-semibold">
                    Required Conductors (incl. spare): <span className="text-blue-600 text-lg">{requiredConductors}C</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 text-left">Select</th>
                            {renderTableHeader('part', 'Part #')}
                            {renderTableHeader('conductors', 'Conductors')}
                            {renderTableHeader('od', 'OD (in)')}
                            <th className="p-3 text-left">Description</th>
                            <th className="p-3 text-left">Strain Relief</th>
                            <th className="p-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {sortedCables.length > 0 ? (
                            sortedCables.map((cable) => {
                                const isSelected = activeCable && cable.part === activeCable.part;
                                const meetsWiring = cable.conductors >= requiredConductors;
                                
                                const cableOD = cable.od || cable.od_max || 0;
                                const isTooLarge = encMaxOD && cableOD > encMaxOD;
                                
                                // Determine if this is the calculated recommended cable
                                // BUT if it's too large, it cannot be recommended.
                                const isRecommended = cable.part === trulyRecommendedPart && !isTooLarge;

                                const rowClass = isRecommended 
                                    ? 'bg-green-50/70 border-l-4 border-green-500'
                                    : isTooLarge 
                                        ? 'bg-red-50/30 hover:bg-red-50' // Light red background for incompatible
                                        : meetsWiring && isWiringMet 
                                            ? 'hover:bg-blue-50/50'
                                            : 'bg-white hover:bg-slate-50';

                                return (
                                    <tr 
                                        key={cable.part} 
                                        className={`transition-colors cursor-pointer ${rowClass}`}
                                        onClick={() => {
                                            setActiveCable(cable);
                                            setCustomCableOD('');
                                        }}
                                    >
                                        <td className="p-3">
                                            <input 
                                                type="radio" 
                                                checked={!!isSelected} 
                                                readOnly
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className={`p-3 font-mono ${isRecommended ? 'font-bold text-green-700' : 'text-slate-700'}`}>{cable.part}</td>
                                        <td className={`p-3 text-center font-bold ${meetsWiring ? 'text-blue-600' : 'text-red-500'}`}>{cable.conductors}</td>
                                        
                                        {/* Highlighted OD Cell */}
                                        <td className={`p-3 ${isTooLarge ? 'text-red-600 font-bold' : ''}`}>
                                            {cableOD.toFixed(4) || '-'}
                                            {isTooLarge && <span className="ml-1 text-xs">⚠</span>}
                                        </td>
                                        
                                        <td className="p-3 text-sm text-slate-600">{cable.description}</td>
                                        <td className="p-3 text-sm text-slate-600 capitalize">{cable.strainRelief}</td>
                                        
                                        {/* Status Column */}
                                        <td className="p-3 text-center">
                                            {isTooLarge ? (
                                                <span className="text-red-600 flex items-center justify-center gap-1 font-bold">
                                                    <XCircle size={16}/> Incompatible
                                                </span>
                                            ) : isRecommended ? (
                                                <span className="text-green-600 flex items-center justify-center gap-1">
                                                    <CheckCircle size={16}/> Recommended
                                                </span>
                                            ) : meetsWiring && isWiringMet ? (
                                                <span className="text-blue-500 text-sm">Suitable</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center justify-center gap-1">
                                                    <AlertTriangle size={16}/> Insufficient Wires
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-6 text-center text-slate-500">
                                    No cables found matching search or strain relief requirements.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pt-4 border-t border-slate-200">
                <h5 className="font-semibold text-slate-700 mb-2">Custom Cable Input</h5>
                <p className="text-sm text-slate-500 mb-2">Manually enter a cable Outside Diameter (OD) if using a custom part not listed above.</p>
                <input
                    type="number"
                    step="0.001"
                    placeholder="Enter Cable OD in Decimal Inches (e.g., 0.530)"
                    value={currentCableOD}
                    onChange={(e) => {
                        setCustomCableOD(e.target.value);
                        setActiveCable(null);
                    }}
                    className="w-96 p-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
}