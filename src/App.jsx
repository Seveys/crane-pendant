import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut 
} from 'firebase/auth';
import { 
  Lock, AlertTriangle, ChevronLeft, Loader2, User, 
  Linkedin, Github, Globe, Link as LinkIcon // <--- Restored Icon Imports
} from 'lucide-react';

// --- IMPORTS ---
import { auth, db, initializeAuth, analytics } from './services/firebase'; 
import { usePendantBuilder } from './hooks/usePendantBuilder';

import AdminPanel from './components/Admin/AdminPanel';
import Header from './components/Shared/Header';
import { SaveModal } from './components/Shared/Modals';

import Step1_Dashboard from './components/Builder/Step1_Dashboard';
import Step2_Enclosures from './components/Builder/Step2_Enclosures';
import Step3_Configurator from './components/Builder/Step3_Configurator';
import Step4_Summary from './components/Builder/Step4_Summary';

import SearchResults from './components/Search/SearchResults';
import PartDetail from './components/Search/PartDetail';

// --- CONFIGURATION ---
const ADMIN_EMAILS = [
    'admin@example.com', 
    'theseveys@gmail.com', 
    'nickseverance94@gmail.com'
]; 

export default function App() {
  // --- 1. APP STATE ---
  const [viewMode, setViewMode] = useState('builder'); 
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Login Form State
  const [loginMode, setLoginMode] = useState('login'); 
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);

  // --- 2. INITIALIZE HOOKS & FIREBASE ---
  const builder = usePendantBuilder(user, db);

  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthInitialized(true);
        });
        return () => unsubscribe();
    } else {
        setAuthInitialized(true);
    }
  }, []);

  const isAdmin = useMemo(() => {
      return user && ADMIN_EMAILS.includes(user.email);
  }, [user]);

  // --- 3. SEARCH DATA ---
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
  const handleAuth = async (e) => {
      e.preventDefault();
      if (!auth) { setAuthError("Auth service unavailable"); return; }
      setAuthLoading(true);
      setAuthError('');
      
      try {
          if (loginMode === 'signup') {
              const cred = await createUserWithEmailAndPassword(auth, loginForm.email, loginForm.password);
              await updateProfile(cred.user, { displayName: loginForm.name });
          } else {
              await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
          }
      } catch (err) {
          console.error(err);
          setAuthError(err.message.replace('Firebase: ', '').replace('auth/', ''));
      } finally {
          setAuthLoading(false);
      }
  };

  const handleUserLogout = async () => {
      if (!auth) return;
      try {
          await signOut(auth);
          setViewMode('builder'); 
      } catch (e) { console.error(e); }
  };

  const handleSaveConfig = async (metaData) => {
      try {
          await builder.saveConfig(metaData);
          setShowSaveModal(false);
          alert("Configuration Saved Successfully!");
      } catch (e) {
          alert("Error saving configuration.");
      }
  };

  // --- HELPER: GET FOOTER ICON ---
  const getFooterIcon = (iconName) => {
      if (!iconName) return <LinkIcon size={14}/>;
      switch(iconName.toLowerCase()) {
          case 'linkedin': return <Linkedin size={14}/>;
          case 'github': return <Github size={14}/>;
          case 'website': return <Globe size={14}/>;
          default: return <LinkIcon size={14}/>;
      }
  };


  // --- 5. RENDER VIEWS ---

  if (!authInitialized) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
      );
  }

  if (!user) {
      return (
          <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
                  <div className="bg-slate-900 p-8 text-white text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                          <Lock size={32} className="text-yellow-400" />
                      </div>
                      <h2 className="text-2xl font-bold mb-1">Pendant Builder</h2>
                      <p className="text-slate-400 text-sm">Please sign in to access the tool</p>
                  </div>
                  
                  <div className="p-8">
                      <form onSubmit={handleAuth} className="space-y-4">
                          {loginMode === 'signup' && (
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                  <div className="relative">
                                      <User size={16} className="absolute top-2.5 left-3 text-slate-400"/>
                                      <input className="w-full border rounded-lg p-2.5 pl-10 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="John Doe" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} required />
                                  </div>
                              </div>
                          )}
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                              <input type="email" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="name@company.com" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} required />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                              <input type="password" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="••••••••" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
                          </div>

                          {authError && (
                              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs flex items-center gap-2 border border-red-100">
                                  <AlertTriangle size={14} className="shrink-0"/> {authError}
                              </div>
                          )}

                          <button disabled={authLoading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                              {authLoading ? <Loader2 size={18} className="animate-spin"/> : (loginMode === 'login' ? 'Sign In' : 'Create Account')}
                          </button>
                      </form>

                      <div className="mt-6 pt-6 border-t text-center">
                          <p className="text-xs text-slate-400 mb-2">{loginMode === 'login' ? "New here?" : "Already have an account?"}</p>
                          <button onClick={() => { setLoginMode(loginMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                              {loginMode === 'login' ? "Create an Account" : "Sign In to Existing Account"}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (viewMode === 'admin') {
      if (isAdmin) {
          return <AdminPanel {...builder} onLogout={handleUserLogout} onReturnToBuilder={() => setViewMode('builder')} />;
      } else {
          setViewMode('builder');
      }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <SaveModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleSaveConfig} />
      
      <Header 
          user={user} 
          isAdmin={isAdmin}
          step={builder.step} 
          setStep={builder.setStep} 
          onAdminClick={() => setViewMode('admin')} 
          onSaveClick={() => setShowSaveModal(true)}
          onLogout={handleUserLogout}
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

      <div className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-8 flex flex-col">
          {viewMode === 'part-detail' ? (
             <PartDetail selectedPartDetail={selectedPartDetail} onBack={() => setViewMode(searchQuery ? 'search-results' : 'builder')} />
          ) : viewMode === 'search-results' ? (
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
          ) : (
             <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[600px]">
                <div className="w-full bg-slate-100 h-1.5">
                    <div className="bg-blue-600 h-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(builder.step / 4) * 100}%` }} />
                </div>
                
                <div className="flex-1 p-6 md:p-8 flex flex-col">
                    <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                        {builder.step === 1 && <Step1_Dashboard builder={builder} popularConfigs={builder.popularConfigs} myBuilds={builder.myBuilds} onLoadConfig={builder.loadConfig} />}
                        {builder.step === 2 && <Step2_Enclosures builder={builder} />}
                        {builder.step === 3 && <Step3_Configurator builder={builder} />}
                        {builder.step === 4 && <Step4_Summary builder={builder} />}
                    </div>
                </div>
             </div>
          )}
      </div>

      {/* FIXED FOOTER WITH ICONS */}
      <div className="bg-white border-t py-6 text-center text-slate-500 text-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2">
              <span>{builder.footerConfig.credits}</span>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-4">
                  {builder.footerConfig.links.map(link => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                          {getFooterIcon(link.icon)}
                          <span className="font-semibold">{link.label}</span>
                      </a>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}