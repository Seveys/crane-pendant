import React from 'react';
import { ChevronLeft, GitCommit, Tag, Calendar } from 'lucide-react';

export default function VersionHistory({ onBack }) {
    const versions = [
        {
            version: '0.002',
            date: new Date().toLocaleDateString(),
            changes: [
                'Added Version History page.',
                'Updated README with correct CLI start commands.',
                'Added version number to application footer.',
                'Refined navigation routing in App.jsx.'
            ]
        },
        {
            version: '0.001',
            date: 'Initial Release',
            changes: [
                'Initial project setup.',
                'Core Builder logic implementation.',
                'Admin Panel creation.',
                'Visual Configurator (Step 3) implementation.'
            ]
        }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <GitCommit className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Version History</h2>
                        <p className="text-slate-400 text-xs">Changelog & Updates</p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                >
                    <ChevronLeft size={16} /> Back to Builder
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                <div className="max-w-3xl mx-auto space-y-8">
                    {versions.map((v, idx) => (
                        <div key={idx} className="relative pl-8 border-l-2 border-slate-200 last:border-0 pb-8">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-blue-600 border-blue-200' : 'bg-slate-300 border-slate-100'}`}></div>
                            
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${idx === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            <Tag size={12}/> v{v.version}
                                        </span>
                                        {idx === 0 && <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Latest</span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                                        <Calendar size={12}/> {v.date}
                                    </div>
                                </div>
                                
                                <ul className="space-y-2">
                                    {v.changes.map((change, cIdx) => (
                                        <li key={cIdx} className="text-sm text-slate-600 flex items-start gap-2">
                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}