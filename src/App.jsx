import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signOut, 
  signInAnonymously 
} from 'firebase/auth';
import { Lock, AlertTriangle, ChevronLeft, Loader2, User, Linkedin, Github, Globe, Link as LinkIcon, Info } from 'lucide-react';

// --- IMPORTS ---
import { auth, db, initializeAuth } from './services/firebase'; 
import { usePendantBuilder } from './hooks/usePendantBuilder';

import AdminPanel from './components/Admin/AdminPanel';
import Header from './components/Shared/Header';
import { SaveModal, AuthModal } from './components/Shared/Modals'; // Added AuthModal to imports based on code usage

import Step1_Dashboard from './components/Builder/Step1_Dashboard';
import Step2_Enclosures from './components/Builder/Step2_Enclosures';
import Step3_Configurator from './components/Builder/Step3_Configurator';
import Step4_CableSelection from './components/Builder/Step4_CableSelection'; 
import Step5_Finalize from './components/Builder/Step5_Finalize';                 

import SearchResults from './components/Search/SearchResults';
import PartDetail from './components/Search/PartDetail';
import VersionHistory from './components/Shared/VersionHistory'; // NEW IMPORT

// --- CONFIGURATION ---
const ADMIN_EMAILS = [
    'admin@example.com', 
    'theseveys@gmail.com', 
    'nickseverance94@gmail.com'
]; 

export default function App() {
  // --- 1. APP STATE ---
  const [viewMode, setViewMode] = useState('builder'); // 'builder', 'admin', 'search-results', 'part-detail', 'version-history'
  const [user, setUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false); 
  
  // Login Form State
  const [loginMode, setLoginMode] = useState('login'); 
  const [loginForm, setLoginForm] = useState({ email: '', password: '', name: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false); // Added missing state for AuthModal

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
  const handleUserAuth = async (mode, formData) => { // Fixed signature to match AuthModal usage
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

  // Handle explicit Login Screen if no user (and not anonymous)
  if (!user && auth) { 
      // Note: Assuming anonymous login is handled in firebase.js init, 
      // but if we enforce login, this screen appears.
      // For this app, we usually allow anonymous, so this block might not trigger 
      // if initializeAuth() worked.
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
      
      <Header 
          user={user} 
          isAdmin={isAdmin}
          step={builder.step} 
          setStep={builder.setStep} 
          onAdminClick={() => setViewMode('admin')} 
          onSaveClick={() => setShowSaveModal(true)}
          onAuthClick={() => setShowAuthModal(true)}
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
          ) : viewMode === 'version-history' ? (
             /* NEW VIEW: VERSION HISTORY */
             <VersionHistory onBack={() => setViewMode('builder')} />
          ) : (
             <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[600px]">
                <div className="w-full bg-slate-100 h-1.5">
                    <div className="bg-blue-600 h-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(builder.step / 5) * 100}%` }} />
                </div>
                
                <div className="flex-1 p-6 md:p-8 flex flex-col">
                    <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                        {builder.step === 1 && <Step1_Dashboard builder={builder} popularConfigs={builder.popularConfigs} myBuilds={builder.myBuilds} onLoadConfig={builder.loadConfig} />}
                        {builder.step === 2 && <Step2_Enclosures builder={builder} />}
                        {builder.step === 3 && <Step3_Configurator builder={builder} />}
                        {builder.step === 4 && <Step4_CableSelection builder={builder} />} 
                        {builder.step === 5 && <Step5_Finalize builder={builder} />}
                    </div>
                </div>
             </div>
          )}
      </div>

      {/* FIXED FOOTER WITH ICONS AND VERSION */}
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
                  {/* NEW VERSION BUTTON */}
                  <button 
                      onClick={() => setViewMode('version-history')} 
                      className="ml-4 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-mono rounded flex items-center gap-1 transition-colors"
                      title="View Changelog"
                  >
                      <Info size={10} /> v0.002
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}