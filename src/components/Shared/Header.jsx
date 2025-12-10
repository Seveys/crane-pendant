import React from 'react';
import { Box, ChevronLeft, Save, Settings, User, LogOut } from 'lucide-react';
import SearchBar from '../Search/SearchBar'; 

export default function Header({ 
    user, 
    isAdmin, // <--- New Prop
    step, 
    setStep, 
    onAdminClick, 
    onSaveClick, 
    onAuthClick, 
    onLogout,
    // Search Props
    searchQuery, setSearchQuery, onSearch, onSelectResult, allSearchableItems 
}) {
    return (
        <div className="bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-lg">
            <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
                
                {/* LOGO & TITLE */}
                <div className="flex items-center gap-3">
                    <Box className="text-yellow-400" />
                    <div>
                        <h1 className="text-lg font-bold leading-none">Pendant Builder</h1>
                        <div className="text-[10px] text-slate-400">Professional Configuration Tool</div>
                    </div>
                </div>
                
                {/* SEARCH COMPONENT */}
                <SearchBar 
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSearch={onSearch}
                    onSelectResult={onSelectResult}
                    allSearchableItems={allSearchableItems}
                />

                {/* NAVIGATION ACTIONS */}
                <div className="flex gap-3 items-center">
                    {/* Back Button */}
                    {step > 1 && (
                        <button 
                            onClick={() => setStep(step - 1)} 
                            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs flex items-center gap-1 font-semibold"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                    )}

                    {/* Save Button (Only on Step 4) */}
                    {step === 4 && (
                        <button 
                            onClick={onSaveClick} 
                            className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition text-xs flex items-center gap-1 font-bold shadow-lg shadow-green-900/20"
                        >
                            <Save size={14} /> Save Config
                        </button>
                    )}

                    {/* Admin Toggle - ONLY FOR ADMINS */}
                    {isAdmin && (
                        <button 
                            onClick={onAdminClick} 
                            className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs flex items-center gap-1"
                        >
                            <Settings size={14} /> Admin
                        </button>
                    )}
                    
                    {/* User Profile / Auth */}
                    <div className="ml-4 pl-4 border-l border-slate-700">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden md:block">
                                    <div className="text-xs font-bold text-white">{user.displayName || user.email}</div>
                                    <div className="text-[10px] text-slate-400">{isAdmin ? 'Administrator' : 'User'}</div>
                                </div>
                                <button 
                                    onClick={onLogout} 
                                    className="bg-slate-800 p-2 rounded hover:bg-red-900/50 hover:text-red-400 transition-colors text-slate-300" 
                                    title="Logout"
                                >
                                    <LogOut size={14}/>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={onAuthClick} 
                                className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white transition-colors"
                            >
                                <User size={14}/> Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}