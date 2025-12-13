import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Edit, Trash2, ChevronDown, ChevronUp, Filter, ArrowUp, ArrowDown, X, Check } from 'lucide-react';

export default function DataTable({ columns, data, onDelete, onEdit, onCellEdit }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filters, setFilters] = useState({}); // { key: 'search term' }
  const [activeMenu, setActiveMenu] = useState(null); // 'key' of column with open menu
  
  // Editing State
  const [editingLocation, setEditingLocation] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  // --- CLICK OUTSIDE TO CLOSE MENU ---
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setActiveMenu(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FILTER & SORT LOGIC ---
  const processedData = useMemo(() => {
    let items = [...data];

    // 1. Apply Filters
    Object.keys(filters).forEach(key => {
        const term = filters[key].toLowerCase();
        if (term) {
            items = items.filter(item => {
                const val = String(item[key] || '').toLowerCase();
                return val.includes(term);
            });
        }
    });

    // 2. Apply Sort
    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key] ?? '';
        let bVal = b[sortConfig.key] ?? '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, sortConfig, filters]);

  // --- HANDLERS ---
  const handleSort = (key, direction) => {
      setSortConfig({ key, direction });
      setActiveMenu(null); // Close menu after sort
  };

  const handleFilterChange = (key, value) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key) => {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
  };

  // --- EDITING HANDLERS ---
  const handleDoubleClick = (item, col) => {
    if (!onCellEdit || col.editable === false) return;
    
    // Unique Row ID
    const rowId = item.id || item.part || item.kcid;
    
    setEditingLocation({ rowId, colKey: col.key });
    setTempValue(item[col.key] || "");
  };

  const commitEdit = (item, col) => {
    // If saving a number field, try to convert
    let finalValue = tempValue;
    if (col.type === 'number' && finalValue !== '') {
        finalValue = parseFloat(finalValue);
    }

    if (finalValue !== item[col.key]) {
        onCellEdit(item, col.key, finalValue);
    }
    setEditingLocation(null);
  };

  // Focus input on edit
  useEffect(() => {
    if (editingLocation && inputRef.current) {
        inputRef.current.focus();
    }
  }, [editingLocation]);


  return (
    <div className="border rounded-lg bg-white shadow-sm flex flex-col h-full">
      <div className="overflow-auto flex-1 relative">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b sticky top-0 z-20 shadow-sm">
            <tr>
              {columns.map((col, i) => (
                <th 
                  key={i} 
                  className={`p-3 whitespace-nowrap bg-slate-50 border-r border-slate-200 last:border-0 ${col.width || ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate" title={col.header}>{col.header}</span>
                    
                    {/* Header Menu Trigger */}
                    {col.sortable !== false && (
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === col.key ? null : col.key); }}
                                className={`p-1 rounded hover:bg-slate-200 transition-colors ${filters[col.key] || sortConfig.key === col.key ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                            >
                                <Filter size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenu === col.key && (
                                <div ref={menuRef} className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="p-1 space-y-1">
                                        <button 
                                            onClick={() => handleSort(col.key, 'ascending')}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded hover:bg-slate-50 ${sortConfig.key === col.key && sortConfig.direction === 'ascending' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                                        >
                                            <ArrowUp size={14}/> Sort Ascending
                                        </button>
                                        <button 
                                            onClick={() => handleSort(col.key, 'descending')}
                                            className={`flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded hover:bg-slate-50 ${sortConfig.key === col.key && sortConfig.direction === 'descending' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                                        >
                                            <ArrowDown size={14}/> Sort Descending
                                        </button>
                                    </div>
                                    
                                    <div className="border-t p-2">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Filter</div>
                                        <div className="flex items-center gap-1 border rounded px-2 py-1 bg-slate-50">
                                            <input 
                                                autoFocus
                                                placeholder={`Search ${col.header}...`}
                                                className="w-full bg-transparent outline-none text-xs"
                                                value={filters[col.key] || ''}
                                                onChange={(e) => handleFilterChange(col.key, e.target.value)}
                                            />
                                            {filters[col.key] && (
                                                <button onClick={() => clearFilter(col.key)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                  <th className="p-3 text-right sticky right-0 bg-slate-50 z-20 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)] w-24">
                      Actions
                  </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                        <Filter size={32} className="text-slate-200"/>
                        <p>No items match your filters.</p>
                        <button onClick={() => { setFilters({}); setSearchTerm(''); }} className="text-blue-600 text-xs hover:underline">Clear all filters</button>
                    </div>
                </td>
              </tr>
            ) : (
                processedData.map((item, idx) => {
                const rowId = item.id || item.part || item.kcid;
                
                return (
                    <tr key={rowId || idx} className="hover:bg-slate-50 group">
                    {columns.map((col, cIdx) => {
                        const isEditing = editingLocation?.rowId === rowId && editingLocation?.colKey === col.key;
                        
                        return (
                            <td 
                                key={cIdx} 
                                className={`p-3 whitespace-nowrap align-middle border-r border-transparent ${col.editable !== false ? 'cursor-cell hover:bg-blue-50/30' : ''}`}
                                onDoubleClick={() => handleDoubleClick(item, col)}
                            >
                                {isEditing ? (
                                    col.editorType === 'select' ? (
                                        <select
                                            ref={inputRef}
                                            value={tempValue}
                                            onChange={(e) => {
                                                setTempValue(e.target.value);
                                                // Optional: Auto-commit on select change?
                                                // commitEdit(item, col.key); // Uncomment for instant save
                                            }}
                                            onBlur={() => commitEdit(item, col)}
                                            onKeyDown={(e) => e.key === 'Enter' && commitEdit(item, col)}
                                            className="w-full p-1 border border-blue-500 rounded text-xs outline-none shadow-sm bg-white"
                                        >
                                            {col.options.map(opt => (
                                                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            ref={inputRef}
                                            type={col.type === 'number' ? 'number' : 'text'}
                                            step={col.step || "any"}
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            onBlur={() => commitEdit(item, col)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') commitEdit(item, col);
                                                if (e.key === 'Escape') setEditingLocation(null);
                                            }}
                                            className="w-full p-1 border border-blue-500 rounded text-xs outline-none shadow-sm"
                                        />
                                    )
                                ) : (
                                    col.render ? col.render(item) : item[col.key]
                                )}
                            </td>
                        );
                    })}
                    
                    {(onEdit || onDelete) && (
                        <td className="p-3 text-right flex justify-end gap-2 sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        {onEdit && (
                            <button onClick={() => onEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Edit">
                                <Edit size={16} />
                            </button>
                        )}
                        {onDelete && (
                            <button onClick={() => onDelete(item)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Delete">
                                <Trash2 size={16} />
                            </button>
                        )}
                        </td>
                    )}
                    </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50 p-2 border-t text-xs text-slate-400 flex justify-between">
          <span>{processedData.length} items</span>
          <span>Double-click a cell to edit</span>
      </div>
    </div>
  );
}