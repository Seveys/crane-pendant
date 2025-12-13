import React, { useState } from 'react';
import { Plus, X, Link as LinkIcon, Github, Linkedin, Globe } from 'lucide-react';

export default function FooterForm({ footerConfig, dbActions, onSaveSuccess }) {
    // Initialize local state with existing links or empty array
    const [localLinks, setLocalLinks] = useState(footerConfig?.links || []);

    // --- LINK HANDLERS ---
    const addLink = () => {
        setLocalLinks([...localLinks, { id: Date.now(), label: '', url: '', icon: 'website' }]);
    };

    const updateLink = (index, field, value) => {
        const updated = [...localLinks];
        updated[index] = { ...updated[index], [field]: value };
        setLocalLinks(updated);
    };

    const removeLink = (index) => {
        setLocalLinks(localLinks.filter((_, i) => i !== index));
    };

    // --- SAVE HANDLER ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        // Save both the credits text AND the links array
        await dbActions.saveFooter({ 
            credits: formData.get('credits'), 
            links: localLinks 
        });
        
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-3xl">
             <h3 className="font-bold text-lg mb-4 text-slate-700">Footer Configuration</h3>
             <form onSubmit={handleSubmit}>
                
                {/* CREDITS SECTION */}
                <div className="mb-6">
                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">Credits / Copyright Text</label>
                    <input 
                        name="credits" 
                        defaultValue={footerConfig?.credits || ''} 
                        className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* LINKS SECTION */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Footer Links</label>
                        <button 
                            type="button" 
                            onClick={addLink} 
                            className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        >
                            <Plus size={14}/> Add Link
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {localLinks.map((link, idx) => (
                            <div key={link.id || idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded border border-slate-200">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <div className="w-1/3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Label</label>
                                            <input 
                                                placeholder="e.g. Website" 
                                                value={link.label} 
                                                onChange={(e) => updateLink(idx, 'label', e.target.value)}
                                                className="w-full border p-1.5 rounded text-xs"
                                            />
                                        </div>
                                        <div className="w-2/3">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">URL</label>
                                            <input 
                                                placeholder="https://..." 
                                                value={link.url} 
                                                onChange={(e) => updateLink(idx, 'url', e.target.value)}
                                                className="w-full border p-1.5 rounded text-xs font-mono text-slate-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Icon</label>
                                        <select 
                                            value={link.icon} 
                                            onChange={(e) => updateLink(idx, 'icon', e.target.value)}
                                            className="border p-1.5 rounded text-xs w-full bg-white"
                                        >
                                            <option value="website">🌐 Website (Globe)</option>
                                            <option value="linkedin">👔 LinkedIn</option>
                                            <option value="github">💻 GitHub</option>
                                            <option value="link">🔗 Generic Link</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => removeLink(idx)} 
                                    className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors mt-6"
                                    title="Remove Link"
                                >
                                    <X size={16}/>
                                </button>
                            </div>
                        ))}
                        {localLinks.length === 0 && (
                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                                No links added yet. Click "Add Link" to get started.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold shadow-lg hover:bg-blue-700 transition-colors">
                        Save Configuration
                    </button>
                </div>
             </form>
        </div>
    );
}