import React, { useState } from 'react';
import { User, Lock, AlertTriangle, X, Loader2, Save, MapPin, Tag } from 'lucide-react';

// --- AUTH MODAL (Login / Signup) ---
export function AuthModal({ 
    isOpen, onClose, onAuth, 
    authError, isLoading 
}) {
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [form, setForm] = useState({ email: '', password: '', name: '' });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAuth(mode, form); // Pass mode and data back to parent
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                <div className="bg-slate-900 p-6 text-white text-center relative">
                    <h3 className="font-bold text-xl mb-1">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                    <p className="text-slate-400 text-xs">{mode === 'login' ? 'Sign in to access your saved builds' : 'Register to save and manage configurations'}</p>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={18}/></button>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute top-2.5 left-2.5 text-slate-400"/>
                                    <input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                            <input type="email" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="name@company.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <input type="password" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                        </div>

                        {authError && (
                            <div className="bg-red-50 text-red-600 p-2 rounded text-xs flex items-center gap-2">
                                <AlertTriangle size={14}/> {authError}
                            </div>
                        )}

                        <button disabled={isLoading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
                            {isLoading && <Loader2 size={14} className="animate-spin"/>}
                            {mode === 'login' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-4 pt-4 border-t text-center">
                        <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); }} className="text-xs text-blue-600 hover:underline font-medium">
                            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SAVE CONFIG MODAL ---
export function SaveModal({ 
    isOpen, onClose, onSave 
}) {
    const [metaData, setMetaData] = useState({ customer: '', location: '', assetId: '' });

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSave(metaData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><Save size={18}/> Save Build Configuration</h3>
                    <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded"><X size={18}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800">
                        <p>Saving this configuration allows you to retrieve it later from your dashboard.</p>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label>
                        <input className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Acme Corp" value={metaData.customer} onChange={e => setMetaData({...metaData, customer: e.target.value})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / Site</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute top-2.5 left-2.5 text-slate-400"/>
                            <input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Plant B, Crane 4" value={metaData.location} onChange={e => setMetaData({...metaData, location: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset ID / Reference</label>
                        <div className="relative">
                            <Tag size={16} className="absolute top-2.5 left-2.5 text-slate-400"/>
                            <input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. ASSET-1024" value={metaData.assetId} onChange={e => setMetaData({...metaData, assetId: e.target.value})} />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-lg">Save Config</button>
                    </div>
                </div>
            </div>
        </div>
    );
}