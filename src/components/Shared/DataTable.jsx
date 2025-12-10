import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function DataTable({ columns, data, onDelete, onEdit }) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="p-3">{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th className="p-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="p-4 text-center text-slate-400">
                No items found
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="p-3">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                
                {(onEdit || onDelete) && (
                  <td className="p-3 text-right flex justify-end gap-2">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(item)} 
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(item)} 
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}