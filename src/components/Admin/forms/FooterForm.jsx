import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function FooterForm({ footerConfig, dbActions, onCancel, onSaveSuccess }) {
    const [footerForm, setFooterForm] = useState({ credits: '', links: [] });

    useEffect(() => {
        if (footerConfig) {
            setFooterForm({
                credits: footerConfig.credits || '',
                links: footerConfig.links || []
            });
        }
    }, [footerConfig]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dbActions.saveFooter(footerForm);
        onSaveSuccess();
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
            <h3 className="font-bold text-lg mb-4 text-slate-700">Footer Configuration</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">Credits Text</label>
                    <input
                        value={footerForm.credits}
                        onChange={e => setFooterForm({ ...footerForm, credits: e.target.value })}
                        className="w-full border p-2 rounded text-sm"
                        placeholder="e.g. Created by My Company"
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">Footer Links</label>
                    <div className="space-y-2">
                        {footerForm.links.map((link, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    className="w-1/3 border p-2 rounded text-sm"
                                    placeholder="Label (e.g. Website)"
                                    value={link.label}
                                    onChange={e => {
                                        const newLinks = [...footerForm.links];
                                        newLinks[idx].label = e.target.value;
                                        setFooterForm({ ...footerForm, links: newLinks });
                                    }}
                                />
                                <input
                                    className="flex-1 border p-2 rounded text-sm"
                                    placeholder="URL (https://...)"
                                    value={link.url}
                                    onChange={e => {
                                        const newLinks = [...footerForm.links];
                                        newLinks[idx].url = e.target.value;
                                        setFooterForm({ ...footerForm, links: newLinks });
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newLinks = footerForm.links.filter((_, i) => i !== idx);
                                        setFooterForm({ ...footerForm, links: newLinks });
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setFooterForm({ ...footerForm, links: [...footerForm.links, { id: Date.now(), label: '', url: '' }] })}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <Plus size={14} /> Add Link
                    </button>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded text-sm">Cancel</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save Footer</button>
                </div>
            </form>
        </div>
    );
}