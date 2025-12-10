import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  signInAnonymously 
} from 'firebase/auth';
import { Lock, AlertTriangle, ChevronLeft } from 'lucide-react';

// --- IMPORTS ---
import { auth, db, initializeAuth } from './services/firebase';
import { usePendantBuilder } from './hooks/usePendantBuilder';

import AdminPanel from './components/Admin/AdminPanel';
import Header from './components/Shared/Header';
import { AuthModal, SaveModal } from './components/Shared/Modals';

import Step1_Dashboard from './components/Builder/Step1_Dashboard';
import Step2_Enclosures from './components/Builder/Step2_Enclosures';
import Step3_Configurator from './components/Builder/Step3_Configurator';
import Step4_Summary from './components/Builder/Step4_Summary';

import SearchResults from './components/Search/SearchResults';
import PartDetail from './components/Search/PartDetail';

export default function App() {
  // --- 1. APP STATE ---
  const [viewMode, setViewMode] = useState('builder'); // 'builder' | 'admin' | 'search-results' | 'part-detail'
  const [user, setUser] = useState(null);
  
  // Admin Auth State (Simple Password Protection)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState(false);

  // Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);

  // --- 2. INITIALIZE HOOKS & FIREBASE ---
  // Initialize the core logic hook
  const builder = usePendantBuilder(user, db);

  // Initialize Firebase Auth
  useEffect(() => {
    if (auth) {
        initializeAuth(); // Helper from services/firebase
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }
  }, []);

  // --- 3. SEARCH DATA AGGREGATION ---
  // Flatten all data for the search bar
  const allSearchableItems = useMemo(() => {
      const items = [];
      builder.componentTypes.forEach(c => items.push({ type: 'Component', data: c, match: `${c.name} ${c.partNumber} ${c.kcid} ${c.desc}` }));
      builder.cables.forEach(c => items.push({ type: 'Cable', data: c, match: `${c.type} ${c.part} ${c.kcid}` }));
      builder.accessories.forEach(a => items.push({ type: 'Accessory', data: a, match: `${a.name} ${a.kcid}` }));
      
      Object.values(builder.seriesData).forEach(series => {
          series.enclosures.forEach(enc => items.push({ type: 'Enclosure', data: enc, match: `${enc.model} ${enc.kcid} ${enc.series}` }));
      });
      return items;
  }, [builder.componentTypes, builder.cables, builder.accessories, builder.seriesData]);


  // --- 4. HANDLERS ---

  // Admin Login Handler
  const handleAdminLogin = (e) => {
      e.preventDefault();
      if (adminPasswordInput === 'config') { 
          setIsAdminAuthenticated(true); 
          setAdminLoginError(false); 
      } else { 
          setAdminLoginError(true); 
      }
  };

  // User Auth Handler (Firebase)
  const handleUserAuth = async (mode, formData) => {
      if (!auth) { setAuthError("Auth service unavailable"); return; }
      setAuthLoading(true);
      setAuthError('');
      try {
          if (mode === 'signup') {
              const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
              await updateProfile(cred.user, { displayName: formData.name });
          } else {
              await signInWithEmailAndPassword(auth, formData.email, formData.password);
          }
          setShowAuthModal(false);
      } catch (err) {
          console.error(err);
          setAuthError(err.message.replace('Firebase: ', ''));
      } finally {
          setAuthLoading(false);
      }
  };

  const handleUserLogout = async () => {
      if (!auth) return;
      try {
          await signOut(auth);
          await signInAnonymously(auth); // Fallback to anonymous so app still works
      } catch (e) { console.error(e); }
  };

  // Save Config Handler
  const handleSaveConfig = async (metaData) => {
      try {
          await builder.saveConfig(metaData);
          setShowSaveModal(false);
          alert("Configuration Saved Successfully!");
      } catch (e) {
          alert("Error saving configuration.");
      }
  };


  // --- 5. RENDER VIEWS ---

  // A. ADMIN VIEW (Protected)
  if (viewMode === 'admin') {
      if (!isAdminAuthenticated) {
          // Admin Login Screen
          return (
              <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
                  <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
                      <div className="flex flex-col items-center mb-6">
                          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
                              <Lock size={32} />
                          </div>
                          <h2 className="text-2xl font-bold text-slate-800">Admin Portal</h2>
                          <p className="text-slate-500 text-sm">Restricted Access</p>
                      </div>
                      <form onSubmit={handleAdminLogin} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Password</label>
                              <input 
                                  type="password" 
                                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  value={adminPasswordInput}
                                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                                  placeholder="••••••"
                              />
                          </div>
                          {adminLoginError && (
                              <div className="text-red-500 text-xs flex items-center gap-2 bg-red-50 p-2 rounded">
                                  <AlertTriangle size={14} /> Invalid Password
                              </div>
                          )}
                          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95">
                              Login
                          </button>
                      </form>
                      <div className="mt-6 text-center">
                          <button onClick={() => setViewMode('builder')} className="text-slate-400 hover:text-slate-600 text-sm flex items-center justify-center gap-2 w-full">
                              <ChevronLeft size={16} /> Return to Builder
                          </button>
                      </div>
                  </div>
              </div>
          );
      }

      // Admin Panel (Authenticated)
      return (
          <AdminPanel 
              // Pass builder state & setters
              {...builder}
              onLogout={() => { setIsAdminAuthenticated(false); setViewMode('builder'); }}
              onReturnToBuilder={() => setViewMode('builder')}
          />
      );
  }

  // B. MAIN BUILDER VIEW
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
          onAuth={handleUserAuth} 
          authError={authError} 
          isLoading={authLoading} 
      />
      
      <SaveModal 
          isOpen={showSaveModal} 
          onClose={() => setShowSaveModal(false)} 
          onSave={handleSaveConfig} 
      />
      
      {/* HEADER & NAV */}
      <Header 
          user={user} 
          step={builder.step} 
          setStep={builder.setStep} 
          onAdminClick={() => setViewMode('admin')} 
          onSaveClick={() => setShowSaveModal(true)}
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={handleUserLogout}
          // Search Props
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          allSearchableItems={allSearchableItems}
          onSearch={() => setViewMode('search-results')}
          onSelectResult={(item) => {
              setSelectedPartDetail(item);
              setViewMode('part-detail');
              setSearchQuery('');
          }}
      />

      {/* MAIN CONTENT AREA */}
      <div className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-8 flex flex-col">
          
          {/* VIEW: PART DETAIL */}
          {viewMode === 'part-detail' ? (
             <PartDetail 
                 selectedPartDetail={selectedPartDetail} 
                 onBack={() => setViewMode(searchQuery ? 'search-results' : 'builder')} 
             />
          ) : 
          
          /* VIEW: SEARCH RESULTS */
          viewMode === 'search-results' ? (
             <SearchResults 
                 searchQuery={searchQuery} 
                 allSearchableItems={allSearchableItems} 
                 onClose={() => { setViewMode('builder'); setSearchQuery(''); }}
                 onSelectResult={(item) => {
                    setSelectedPartDetail(item);
                    setViewMode('part-detail');
                    setSearchQuery('');
                 }}
             />
          ) : 
          
          /* VIEW: BUILDER STEPS */
          (
             <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[600px]">
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5">
                    <div className="bg-blue-600 h-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(builder.step / 4) * 100}%` }} />
                </div>
                
                <div className="flex-1 p-6 md:p-8 flex flex-col">
                    <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                        {builder.step === 1 && (
                            <Step1_Dashboard 
                                builder={builder} 
                                popularConfigs={builder.popularConfigs} 
                                myBuilds={builder.myBuilds}
                                onLoadConfig={builder.loadConfig}
                            />
                        )}
                        {builder.step === 2 && <Step2_Enclosures builder={builder} />}
                        {builder.step === 3 && <Step3_Configurator builder={builder} />}
                        {builder.step === 4 && <Step4_Summary builder={builder} />}
                    </div>
                </div>
             </div>
          )}
      </div>

      {/* FOOTER */}
      <div className="bg-white border-t py-6 text-center text-slate-500 text-sm">
          <p className="flex items-center justify-center gap-2">
              {builder.footerConfig.credits}
              {builder.footerConfig.links.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2">
                      {link.label}
                  </a>
              ))}
          </p>
      </div>
    </div>
  );
}