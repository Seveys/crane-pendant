import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Settings, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Zap, Box, Cable, Save, RotateCcw,
  CheckCircle, AlertTriangle, Info, Edit, Plus, Trash2, Database, X, Folder, FileText, Layers,
  Tag, Eye, EyeOff, Plug, Package, Link, Upload, ImageIcon, Search, Lock, Linkedin, LogOut,
  ArrowUpDown, TrendingUp, Loader2, MapPin, User, FileText as FileIcon, Download, ShoppingBag, Clock,
  Grid, ListFilter, FilePlus
} from 'lucide-react';

// --- FIREBASE SETUP ---
// Safe initialization for the environment
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * INITIAL DATA
 */
const INITIAL_MANUFACTURERS = [
  { id: 'duct-o-wire', name: 'Duct-O-Wire', color: 'bg-yellow-500', isActive: true, image: null },
  { id: 'conductix', name: 'Conductix-Wampfler', color: 'bg-orange-500', isActive: true, image: null },
  { id: 'magnetek', name: 'Magnetek', color: 'bg-blue-600', isActive: true, image: null },
  { id: 'squared', name: 'Square D', color: 'bg-blue-800', isActive: true, image: null },
  { id: 'demag', name: 'Demag', color: 'bg-yellow-400', isActive: true, image: null },
  { id: 'konecranes', name: 'Konecranes', color: 'bg-red-600', isActive: true, image: null },
];

const INITIAL_SERIES_DATA = {
  'duct-o-wire': {
    name: 'Duct-O-Wire Series', description: 'Select from L-Series, J-Series, RPB, RPS, or PSW.', isActive: true,
    enclosures: [
      { id: 'dw-l2s', series: 'L-Series', holes: 2, model: 'L2-S', depth: 'Shallow', max_contact_depth: 2, kcid: 'KC-DW-L2S', supportedStrainRelief: ['internal', 'external'], image: null },
      { id: 'dw-l4s', series: 'L-Series', holes: 4, model: 'L4-S', depth: 'Shallow', max_contact_depth: 2, kcid: 'KC-DW-L4S', supportedStrainRelief: ['internal', 'external'], image: null },
      { id: 'dw-l6s', series: 'L-Series', holes: 6, model: 'L6-S', depth: 'Shallow', max_contact_depth: 2, kcid: 'KC-DW-L6S', supportedStrainRelief: ['internal', 'external'], image: null },
      { id: 'dw-l8s', series: 'L-Series', holes: 8, model: 'L8-S', depth: 'Shallow', max_contact_depth: 2, kcid: 'KC-DW-L8S', supportedStrainRelief: ['internal', 'external'], image: null },
      { id: 'dw-j4', series: 'J-Series', holes: 4, model: 'J-4', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-DW-J4', supportedStrainRelief: ['external'], image: null },
      { id: 'dw-j6', series: 'J-Series', holes: 6, model: 'J-6', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-DW-J6', supportedStrainRelief: ['external'], image: null },
    ],
    preconfigurations: [
      { id: 'config-l2s-1', series: 'L-Series', modelNumber: 'L2-S-1', enclosureId: 'dw-l2s', slots: ['start-mom', 'stop-mom'], description: '2-Button Start/Stop Station' },
      { id: 'config-l4s-1', series: 'L-Series', modelNumber: 'L4-S-1', enclosureId: 'dw-l4s', slots: ['motion-1', 'linked', 'start-mom', 'stop-mom'], description: '4-Button Up/Down + Start/Stop' }
    ]
  },
  'conductix': {
    name: '80 Series', description: 'Ergonomic design, heavy duty.', isActive: true,
    enclosures: [
      { id: 'cx-802', series: '80 Series', holes: 2, model: '80-2', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-CX-802', supportedStrainRelief: ['internal', 'external'], image: null },
      { id: 'cx-804', series: '80 Series', holes: 4, model: '80-4', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-CX-804', supportedStrainRelief: ['internal', 'external'], image: null },
    ],
    preconfigurations: []
  },
  'default': {
    name: 'Standard Series', description: 'Generic Configuration', isActive: true,
    enclosures: [ { id: 'gen-2', series: 'Generic', holes: 2, model: 'GEN-2', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-GEN-02', supportedStrainRelief: ['external'], image: null } ],
    preconfigurations: []
  }
};

const INITIAL_COMPONENTS = [
  { id: 'empty', series: 'global', name: 'Blank Plug', holes: 1, wires: 0, color: 'bg-gray-300', desc: 'Seal', partNumber: 'PLUG-UNI', kcid: 'KC-PLUG-001', image: null, docs: [] },
  { id: 'motion-1', series: 'global', name: 'Motion (1-Speed Set)', holes: 2, wires: 3, color: 'bg-black', label: 'UP/DOWN', desc: 'Interlocked Pair', partNumber: 'SW-1SPD-SET', kcid: 'KC-SW-1S-SET', image: null, docs: [] }, 
  { id: 'motion-2', series: 'global', name: 'Motion (2-Speed Set)', holes: 2, wires: 5, color: 'bg-black', label: 'UP/DOWN 2-SPD', desc: 'Interlocked Pair', partNumber: 'SW-2SPD-SET', kcid: 'KC-SW-2S-SET', image: null, docs: [] },
  { id: 'rb-1', series: 'global', name: 'Single Button (RB-1)', holes: 1, wires: 1, color: 'bg-black', label: 'AUX', desc: 'Single Button', partNumber: 'RB-1', kcid: 'KC-RB-1', image: null, docs: [] },
  { id: 'estop', series: 'global', name: 'E-Stop (Twist)', holes: 1, wires: 2, color: 'bg-red-600', label: 'E-STOP', desc: '1x N.C. Maintained', partNumber: 'SW-ESTOP', kcid: 'KC-SW-ES', image: null, docs: [] },
  { id: 'start-mom', series: 'global', name: 'Start (Momentary)', holes: 1, wires: 1, color: 'bg-green-600', label: 'START', desc: '1x N.O. Contact', partNumber: 'SW-START', kcid: 'KC-SW-ST', image: null, docs: [] },
  { id: 'stop-mom', series: 'global', name: 'Stop (Momentary)', holes: 1, wires: 1, color: 'bg-red-600', label: 'STOP', desc: '1x N.C. Contact', partNumber: 'SW-STOP', kcid: 'KC-SW-SP', image: null, docs: [] },
  { id: 'sp-1-set', series: 'L-Series', name: 'SP-1 (1-Speed Set)', holes: 2, wires: 3, color: 'bg-black', label: 'UP/DOWN', desc: 'L-Series Interlocked', partNumber: 'SP-1-SET', kcid: 'KC-SP-1', image: null, docs: [] },
  { id: 'sp-2-set', series: 'L-Series', name: 'SP-2 (2-Speed Set)', holes: 2, wires: 5, color: 'bg-black', label: 'UP/DOWN', desc: 'L-Series Interlocked', partNumber: 'SP-2-SET', kcid: 'KC-SP-2', image: null, docs: [] },
];

const INITIAL_CABLES = [
  { conductors: 3, awg: 16, od_min: 0.39, od_max: 0.43, type: '16/3 SOOW (Int SR)', part: 'XA-34155', strainRelief: 'internal', kcid: 'KC-CBL-16-03-I', image: null },
  { conductors: 8, awg: 16, od_min: 0.56, od_max: 0.64, type: '16/8 Round (Ext SR)', part: 'XA-35398', strainRelief: 'external', kcid: 'KC-CBL-16-08-E', image: null },
  { conductors: 12, awg: 16, od_min: 0.58, od_max: 0.68, type: '16/12 Round (Ext SR)', part: 'XA-35399', strainRelief: 'external', kcid: 'KC-CBL-16-12-E', image: null },
  { conductors: 16, awg: 16, od_min: 0.64, od_max: 0.76, type: '16/16 Round (Ext SR)', part: 'XA-35400', strainRelief: 'external', kcid: 'KC-CBL-16-16-E', image: null },
  { conductors: 24, awg: 16, od_min: 0.78, od_max: 0.92, type: '16/24 Round (Ext SR)', part: 'XA-35401', strainRelief: 'external', kcid: 'KC-CBL-16-24-E', image: null },
  { conductors: 36, awg: 16, od_min: 0.95, od_max: 1.15, type: '16/36 Round (Bulk)', part: 'XA-83097', strainRelief: 'external', kcid: 'KC-CBL-16-36-E', image: null },
];

const INITIAL_CORD_GRIPS = [
  { id: 'CG-050', range_min: 0.35, range_max: 0.50, thread: '1/2" NPT', kcid: 'KC-CG-050' },
  { id: 'CG-075', range_min: 0.55, range_max: 0.75, thread: '3/4" NPT', kcid: 'KC-CG-075' },
  { id: 'CG-100', range_min: 0.85, range_max: 1.00, thread: '1" NPT', kcid: 'KC-CG-100' },
];

const INITIAL_ACCESSORIES = [
  { id: 'lbl-warn', name: 'Warning Label', category: 'label', kcid: 'KC-LBL-WARN', image: null },
  { id: 'qc-16', name: '16-Pin Quick Connect', category: 'connector', kcid: 'KC-QC-16', image: null },
  { id: 'qc-24', name: '24-Pin Quick Connect', category: 'connector', kcid: 'KC-QC-24', image: null },
  { id: 'alarm-ext', name: 'External Alarm Sounder', category: 'addon', kcid: 'KC-ALM-EXT', image: null },
];

// --- HELPER COMPONENT: DATA TABLE ---
const DataTable = ({ columns, data, onDelete, onEdit }) => (
  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
        <tr>
          {columns.map((col, i) => <th key={i} className="p-3">{col.header}</th>)}
          <th className="p-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="p-4 text-center text-slate-400">No items found</td></tr>
        ) : (
            data.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
                {columns.map((col, cIdx) => (
                <td key={cIdx} className="p-3">
                    {col.render ? col.render(item) : item[col.key]}
                </td>
                ))}
                <td className="p-3 text-right flex justify-end gap-2">
                {onEdit && <button onClick={() => onEdit(item)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><Edit size={16} /></button>}
                {onDelete && <button onClick={() => onDelete(item)} className="p-1 text-red-600 hover:bg-red-100 rounded"><Trash2 size={16} /></button>}
                </td>
            </tr>
            ))
        )}
      </tbody>
    </table>
  </div>
);

/**
 * MAIN COMPONENT
 */
export default function PendantBuilder() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState('builder'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Admin Auth
  const [user, setUser] = useState(null); // Firebase User
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // --- USER AUTH STATE ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);
  
  // Data
  const [manufacturers, setManufacturers] = useState(INITIAL_MANUFACTURERS);
  const [seriesData, setSeriesData] = useState(INITIAL_SERIES_DATA);
  const [componentTypes, setComponentTypes] = useState(INITIAL_COMPONENTS);
  const [cables, setCables] = useState(INITIAL_CABLES);
  const [cordGrips, setCordGrips] = useState(INITIAL_CORD_GRIPS);
  const [accessories, setAccessories] = useState(INITIAL_ACCESSORIES);

  // Builder Flow
  const [step, setStep] = useState(1);
  const [browseMode, setBrowseMode] = useState('brand'); // 'brand' or 'capacity'
  const [selectedButtonCount, setSelectedButtonCount] = useState(null);
  const [activeManufacturer, setActiveManufacturer] = useState(null);
  const [enclosure, setEnclosure] = useState(null);
  const [slots, setSlots] = useState([]); 
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [customCableOD, setCustomCableOD] = useState('');
  const [loadedPreconfig, setLoadedPreconfig] = useState(null);
  const [liftHeight, setLiftHeight] = useState('');

  // UI State
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [activeSearchTab, setActiveSearchTab] = useState('all');
  const [selectedPartDetail, setSelectedPartDetail] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('trending'); 

  // Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMetaData, setSaveMetaData] = useState({ customer: '', location: '', assetId: '' });

  // Admin State
  const [editItem, setEditItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [preconfigSlots, setPreconfigSlots] = useState([]);
  const [tempImage, setTempImage] = useState(null); 
  const [tempDocs, setTempDocs] = useState([]); // NEW: State for doc uploads
  const [selectedManufacturerAdmin, setSelectedManufacturerAdmin] = useState(null);
  const [selectedSeriesAdmin, setSelectedSeriesAdmin] = useState(null);
  const [globalTab, setGlobalTab] = useState(null); 
  const [adminSubTab, setAdminSubTab] = useState('enclosures'); 
  
  // Analytics State
  const [popularConfigs, setPopularConfigs] = useState([]);
  const [myBuilds, setMyBuilds] = useState([]);

  // Refs
  const searchContainerRef = useRef(null);

  // --- FIREBASE INIT ---
  useEffect(() => {
    const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e) { console.error(e) }
        } else {
            if (!auth.currentUser) await signInAnonymously(auth);
        }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- CLICK OUTSIDE SEARCH ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  // --- FETCH DATA ---
  useEffect(() => {
      if (!user) return;
      
      // 1. Trending (Public)
      const qPublic = collection(db, 'artifacts', appId, 'public', 'data', 'pendant_builds');
      const unsubPublic = onSnapshot(qPublic, (snapshot) => {
          const builds = []; 
          snapshot.forEach(doc => builds.push(doc.data()));
          const counts = {};
          builds.forEach(build => {
              const sig = build.signature; 
              if (!counts[sig]) counts[sig] = { count: 0, data: build };
              counts[sig].count++;
          });
          setPopularConfigs(Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3).map(c => c.data));
      }, (error) => {
          console.log("Trending load error (expected if public read restricted):", error.code);
      });

      // 2. My Builds (Private User Collection)
      const qUser = collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds');
      const unsubUser = onSnapshot(qUser, (snapshot) => {
          const builds = [];
          snapshot.forEach(doc => builds.push({ ...doc.data(), id: doc.id }));
          setMyBuilds(builds.sort((x,y) => (y.timestamp?.seconds || 0) - (x.timestamp?.seconds || 0)));
      }, (error) => {
          console.error("My Builds load error:", error);
      });

      return () => { unsubPublic(); unsubUser(); };
  }, [user]);

  // --- HELPERS ---
  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setTempImage(reader.result);
          reader.readAsDataURL(file);
      }
  };

  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setTempDocs(prev => [...prev, {
                name: file.name,
                type: file.type,
                size: (file.size / 1024).toFixed(1) + ' KB',
                data: reader.result
            }]);
        };
        reader.readAsDataURL(file);
    });
  };

  const handleLogin = (e) => {
      e.preventDefault();
      if (passwordInput === 'config') { setIsAuthenticated(true); setLoginError(false); } 
      else { setLoginError(true); }
  };

  const handleUserAuth = async (e) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError('');
      try {
          if (authMode === 'signup') {
              const cred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
              await updateProfile(cred.user, { displayName: authForm.name });
          } else {
              await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
          }
          setShowAuthModal(false);
          setAuthForm({ email: '', password: '', name: '' });
      } catch (err) {
          console.error(err);
          setAuthError(err.message.replace('Firebase: ', ''));
      } finally {
          setAuthLoading(false);
      }
  };

  const handleUserLogout = async () => {
      try {
          await signOut(auth);
          await signInAnonymously(auth);
      } catch (e) { console.error(e); }
  };

  // --- SAVE LOGIC ---
  const handleSaveToDatabase = async () => {
      if (!user || !enclosure) return;
      const slotIds = slots.map(s => s.componentId).join('|');
      const signature = `${activeManufacturer}|${enclosure.model}|${slotIds}`;
      
      const buildData = {
          manufacturerId: activeManufacturer,
          manufacturerName: manufacturers.find(m => m.id === activeManufacturer)?.name || 'Unknown',
          enclosureId: enclosure.id,
          enclosureModel: enclosure.model,
          slotIds: slots.map(s => s.componentId),
          signature: signature,
          timestamp: serverTimestamp(),
          created_by: user.uid,
          meta_customer: saveMetaData.customer,
          meta_location: saveMetaData.location,
          meta_asset: saveMetaData.assetId
      };

      try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'pendant_builds'), buildData);
          addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'pendant_builds'), buildData).catch(e => console.log("Public stats write skipped"));
          setShowSaveModal(false);
          setSaveMetaData({ customer: '', location: '', assetId: '' });
          alert("Configuration Saved!");
      } catch (e) {
          console.error("Save error:", e);
          alert("Error saving configuration to your account.");
      }
  };

  // --- LOAD CONFIG ---
  const loadConfig = (configData) => {
      setActiveManufacturer(configData.manufacturerId);
      const mfgSeries = seriesData[configData.manufacturerId];
      if (!mfgSeries) return;
      const encObj = mfgSeries.enclosures.find(e => e.id === configData.enclosureId);
      if (encObj) {
          setEnclosure(encObj);
          const reconstructedSlots = configData.slotIds.map((sId, idx) => {
              if (sId === 'linked') return { id: idx, componentId: 'linked', linkedTo: idx - 1 };
              return { id: idx, componentId: sId };
          });
          setSlots(reconstructedSlots);
          setStep(3);
          setViewMode('builder');
      }
  };

  // --- SEARCH LOGIC ---
  const handleSearch = (e) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setViewMode('search-results');
      setShowSuggestions(false);
  };

  const allSearchableItems = useMemo(() => {
      const items = [];
      componentTypes.forEach(c => items.push({ type: 'Component', data: c, match: `${c.name} ${c.partNumber} ${c.kcid} ${c.desc}` }));
      cables.forEach(c => items.push({ type: 'Cable', data: c, match: `${c.type} ${c.part} ${c.kcid}` }));
      accessories.forEach(a => items.push({ type: 'Accessory', data: a, match: `${a.name} ${a.kcid}` }));
      Object.values(seriesData).forEach(series => {
          series.enclosures.forEach(enc => items.push({ type: 'Enclosure', data: enc, match: `${enc.model} ${enc.kcid} ${enc.series}` }));
      });
      return items;
  }, [componentTypes, cables, accessories, seriesData]);

  const searchResults = useMemo(() => {
      if (!searchQuery) return [];
      const lowerQ = searchQuery.toLowerCase();
      return allSearchableItems.filter(item => item.match.toLowerCase().includes(lowerQ));
  }, [searchQuery, allSearchableItems]);

  // --- CALCULATIONS (Builder) ---
  const activeSeriesData = useMemo(() => {
    if (!activeManufacturer) return null;
    return seriesData[activeManufacturer] || seriesData['default'];
  }, [activeManufacturer, seriesData]);

  const availableComponents = useMemo(() => {
      const currentSeries = viewMode === 'admin' ? selectedSeriesAdmin : (enclosure?.series);
      const currentMfg = viewMode === 'admin' ? selectedManufacturerAdmin : activeManufacturer;
      return componentTypes.filter(c => c.series === 'global' || c.series === currentMfg || c.series === currentSeries);
  }, [componentTypes, enclosure, activeManufacturer, selectedManufacturerAdmin, selectedSeriesAdmin, viewMode]);

  const allEnclosuresFlat = useMemo(() => {
      const all = [];
      Object.keys(seriesData).forEach(mfgId => {
          const mfgData = seriesData[mfgId];
          const mfgName = manufacturers.find(m => m.id === mfgId)?.name || mfgId;
          const mfgImage = manufacturers.find(m => m.id === mfgId)?.image;
          if(mfgData.isActive) {
              mfgData.enclosures.forEach(enc => {
                  all.push({ ...enc, manufacturerId: mfgId, manufacturerName: mfgName, manufacturerImage: mfgImage });
              });
          }
      });
      return all;
  }, [seriesData, manufacturers]);

  const availableButtonCounts = useMemo(() => {
      const counts = new Set(allEnclosuresFlat.map(e => e.holes));
      return Array.from(counts).sort((a,b) => a - b);
  }, [allEnclosuresFlat]);

  const wiring = useMemo(() => {
    let signalWires = 0; let commonWire = 1; let groundWire = 1; 
    slots.forEach(slot => {
      const comp = componentTypes.find(c => c.id === slot.componentId);
      if (comp) {
        if (comp.id.includes('motion') || comp.partNumber.includes('SET')) signalWires += (comp.wires - 1); 
        else if (comp.id === 'estop') signalWires += 2;
        else if (comp.wires > 0) signalWires += comp.wires;
      }
    });
    return { signalWires, commonWire, groundWire, totalConductors: signalWires + commonWire + groundWire };
  }, [slots, componentTypes]);

  const recommendedCable = useMemo(() => {
    if (wiring.totalConductors === 0) return null;
    if (!enclosure) return null;
    const validCables = cables.filter(c => enclosure.supportedStrainRelief.includes(c.strainRelief));
    return validCables.find(c => c.conductors >= wiring.totalConductors) || null;
  }, [wiring, cables, enclosure]);

  const recommendedGrip = useMemo(() => {
    const activeOD = customCableOD ? parseFloat(customCableOD) : (recommendedCable ? recommendedCable.od_max : 0);
    if (!activeOD) return null;
    return cordGrips.find(g => activeOD >= g.range_min && activeOD <= g.range_max) || null;
  }, [recommendedCable, customCableOD, cordGrips]);

  const matchedPreconfig = useMemo(() => {
    if (!enclosure || !activeSeriesData?.preconfigurations) return null;
    const currentSlotIds = slots.map(s => s.componentId);
    return activeSeriesData.preconfigurations.find(pre => {
        if (pre.enclosureId !== enclosure.id) return false;
        if (pre.slots.length !== currentSlotIds.length) return false;
        return pre.slots.every((sId, index) => sId === currentSlotIds[index]);
    });
  }, [enclosure, slots, activeSeriesData]);

  const handleUpdateSlot = (index, componentId, slotArray, setSlotFn) => {
      const comp = availableComponents.find(c => c.id === componentId);
      if (!comp) return;
      const newSlots = [...slotArray];
      if (componentId !== 'empty' && comp.holes > 1) {
          if (index + comp.holes > newSlots.length) { alert(`Cannot place ${comp.name} here. It requires ${comp.holes} slots.`); return; }
      }
      newSlots[index] = { ...newSlots[index], componentId: componentId };
      if (comp.holes > 1) {
          for(let i=1; i < comp.holes; i++) {
              newSlots[index + i] = { ...newSlots[index+i], componentId: 'linked', linkedTo: index };
          }
      } else {
          if (index + 1 < newSlots.length && newSlots[index+1].componentId === 'linked' && newSlots[index+1].linkedTo === index) {
              newSlots[index+1] = { ...newSlots[index+1], componentId: 'empty', linkedTo: null };
          }
      }
      setSlotFn(newSlots);
  };

  // --- CRUD ACTIONS (Abbreviated for brevity, logic identical to prev) ---
  const handleSaveManufacturer = (e) => { e.preventDefault(); const formData = new FormData(e.target); const newItem = { id: formData.get('id').toLowerCase().replace(/\s+/g, '-'), name: formData.get('name'), color: 'bg-slate-500', isActive: true, image: tempImage || editItem?.image }; setManufacturers(prev => editItem ? prev.map(m => m.id === newItem.id ? newItem : m) : [...prev, newItem]); if(!editItem) setSeriesData(prev => ({...prev, [newItem.id]: { name: newItem.name + " Series", description: "Default", isActive: true, enclosures: [], preconfigurations: [] }})); setIsEditing(false); setTempImage(null); setEditItem(null); };
  const handleToggleSeries = (mfgId) => { setSeriesData(prev => ({ ...prev, [mfgId]: { ...prev[mfgId], isActive: !prev[mfgId].isActive } })); };
  const handleSaveEnclosure = (e) => { e.preventDefault(); const formData = new FormData(e.target); const supportedSR = []; if (formData.get('sr_internal') === 'on') supportedSR.push('internal'); if (formData.get('sr_external') === 'on') supportedSR.push('external'); const newItem = { id: formData.get('id') || `enc-${Date.now()}`, series: selectedSeriesAdmin, model: formData.get('model'), kcid: formData.get('kcid'), holes: parseInt(formData.get('holes')), depth: formData.get('depth'), max_contact_depth: parseInt(formData.get('max_contact_depth')), supportedStrainRelief: supportedSR, image: tempImage || editItem?.image }; const newData = { ...seriesData }; const mData = newData[selectedManufacturerAdmin]; const index = mData.enclosures.findIndex(e => e.id === newItem.id); if (index >= 0) mData.enclosures[index] = newItem; else mData.enclosures.push(newItem); setSeriesData(newData); setIsEditing(false); setEditItem(null); setTempImage(null); };
  const handleSavePreconfig = (e) => { e.preventDefault(); const formData = new FormData(e.target); const enclosureId = formData.get('enclosureId'); const newItem = { id: formData.get('id') || `conf-${Date.now()}`, series: selectedSeriesAdmin, modelNumber: formData.get('modelNumber'), description: formData.get('description'), enclosureId: enclosureId, slots: preconfigSlots }; const newData = { ...seriesData }; const mData = newData[selectedManufacturerAdmin]; if (!mData.preconfigurations) mData.preconfigurations = []; const index = mData.preconfigurations.findIndex(c => c.id === newItem.id); if (index >= 0) mData.preconfigurations[index] = newItem; else mData.preconfigurations.push(newItem); setSeriesData(newData); setIsEditing(false); setEditItem(null); setPreconfigSlots([]); };
  const handleSelectPreconfigEnclosure = (encId) => { const enc = seriesData[selectedManufacturerAdmin].enclosures.find(e => e.id === encId); if (enc) setPreconfigSlots(Array(enc.holes).fill('empty')); };
  
  // NEW: Save component with Docs
  const handleSaveComponent = (e) => { 
    e.preventDefault(); const formData = new FormData(e.target); 
    const scope = formData.get('scope'); 
    let seriesValue = 'global'; 
    if (scope === 'manufacturer') seriesValue = selectedManufacturerAdmin; 
    if (scope === 'series') seriesValue = selectedSeriesAdmin; 
    
    // Combine existing docs with new uploads if editing, or just new uploads
    const existingDocs = editItem?.docs || [];
    const finalDocs = [...existingDocs, ...tempDocs];

    const newItem = { 
        id: formData.get('id'), 
        series: seriesValue, 
        name: formData.get('name'), 
        partNumber: formData.get('partNumber'), 
        kcid: formData.get('kcid'), 
        wires: parseInt(formData.get('wires')), 
        holes: parseInt(formData.get('holes')), 
        color: formData.get('color'), 
        label: formData.get('label'), 
        desc: formData.get('desc'), 
        image: tempImage || editItem?.image,
        docs: finalDocs
    }; 
    const existsIndex = componentTypes.findIndex(c => c.id === newItem.id); 
    if (existsIndex >= 0 && editItem) { 
        const updated = [...componentTypes]; updated[existsIndex] = newItem; setComponentTypes(updated); 
    } else { 
        setComponentTypes(prev => [...prev, newItem]); 
    } 
    setIsEditing(false); setEditItem(null); setTempImage(null); setTempDocs([]); 
  };
  
  const handleDeleteDoc = (docIndex) => {
      // Only works if we are in editing mode and modifying 'editItem' directly or local state
      // We need to update editItem state to reflect deletion before saving
      if (editItem) {
          const updatedDocs = editItem.docs.filter((_, i) => i !== docIndex);
          setEditItem({ ...editItem, docs: updatedDocs });
      }
  };

  const handleSaveCable = (e) => { e.preventDefault(); const formData = new FormData(e.target); const newItem = { part: formData.get('part'), kcid: formData.get('kcid'), type: formData.get('type'), conductors: parseInt(formData.get('conductors')), awg: parseInt(formData.get('awg')), od_min: parseFloat(formData.get('od_min')), od_max: parseFloat(formData.get('od_max')), strainRelief: formData.get('strainRelief'), image: tempImage || editItem?.image }; const existsIndex = cables.findIndex(c => c.part === newItem.part); if (existsIndex >= 0 && editItem) { const updated = [...cables]; updated[existsIndex] = newItem; setCables(updated); } else { setCables(prev => [...prev, newItem]); } setIsEditing(false); setEditItem(null); setTempImage(null); };
  const handleSaveAccessory = (e) => { e.preventDefault(); const formData = new FormData(e.target); const newItem = { id: formData.get('id'), name: formData.get('name'), category: formData.get('category'), kcid: formData.get('kcid'), image: tempImage || editItem?.image }; if (accessories.find(a => a.id === newItem.id) && !editItem) return; setAccessories(prev => { if(editItem) return prev.map(a => a.id === newItem.id ? newItem : a); return [...prev, newItem]; }); setIsEditing(false); setEditItem(null); setTempImage(null); };

  const handleUpdateManufacturer = (e) => {
    e.preventDefault(); const formData = new FormData(e.target); const newName = formData.get('name'); const mfgId = selectedManufacturerAdmin; 
    setManufacturers(prev => prev.map(m => m.id === mfgId ? { ...m, name: newName, image: tempImage || m.image } : m));
    setTempImage(null); alert("Manufacturer Updated");
  };

  // --- SUB-VIEWS (Defined INSIDE to access state) ---

  const renderPartDetail = () => {
      const part = selectedPartDetail.data;
      const type = selectedPartDetail.type;
      
      return (
          <div className="flex flex-col h-full p-6 bg-slate-50">
              <button onClick={() => { setViewMode('search-results'); setSelectedPartDetail(null); }} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-semibold"><ChevronLeft size={20}/> Back to Search</button>
              <div className="flex flex-col lg:flex-row gap-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                  <div className="lg:w-1/3 flex items-center justify-center bg-slate-100 rounded-xl p-8">{part.image ? <img src={part.image} className="max-h-64 object-contain"/> : <Package size={128} className="text-slate-300"/>}</div>
                  <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{type}</span><span className="text-slate-400 text-sm font-mono">{part.kcid || 'No KCID'}</span></div>
                      <h1 className="text-3xl font-bold text-slate-800 mb-2">{part.name || part.model || part.type}</h1>
                      <p className="text-slate-500 mb-6 text-lg">{part.desc || part.description || "No description available."}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                          {part.partNumber && <div className="bg-slate-50 p-3 rounded border"><div className="text-xs text-slate-400 uppercase font-bold">Part Number</div><div className="font-mono font-semibold">{part.partNumber}</div></div>}
                          {part.wires !== undefined && <div className="bg-slate-50 p-3 rounded border"><div className="text-xs text-slate-400 uppercase font-bold">Wires</div><div className="font-mono font-semibold">{part.wires}</div></div>}
                          {part.holes !== undefined && <div className="bg-slate-50 p-3 rounded border"><div className="text-xs text-slate-400 uppercase font-bold">Holes</div><div className="font-mono font-semibold">{part.holes}</div></div>}
                          {part.conductors !== undefined && <div className="bg-slate-50 p-3 rounded border"><div className="text-xs text-slate-400 uppercase font-bold">Conductors</div><div className="font-mono font-semibold">{part.conductors}</div></div>}
                      </div>
                      <div className="border-t pt-6"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileIcon size={18}/> Documentation</h3>
                        <div className="space-y-2">
                            {/* DYNAMIC DOCS */}
                            {part.docs && part.docs.length > 0 ? (
                                part.docs.map((doc, i) => (
                                    <a key={i} href={doc.data} download={doc.name} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50 group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-red-100 p-2 rounded text-red-600"><FileIcon size={20}/></div>
                                            <div><div className="font-semibold text-sm">{doc.name}</div><div className="text-xs text-slate-400">{doc.type} • {doc.size || 'Unknown'}</div></div>
                                        </div>
                                        <Download size={16} className="text-slate-300 group-hover:text-blue-600"/>
                                    </a>
                                ))
                            ) : (
                                <div className="text-sm text-slate-400 italic">No documentation uploaded.</div>
                            )}
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderSearchResults = () => (
      <div className="flex flex-col h-full p-6 bg-slate-50">
          <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-slate-800">Search Results</h2><button onClick={() => setViewMode('builder')} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1"><X size={16}/> Close Search</button></div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {searchResults.length === 0 ? (<div className="p-12 text-center text-slate-400">No results found for "{searchQuery}"</div>) : (
                  <div className="divide-y">
                      {searchResults.map((item, idx) => (
                          <div key={idx} onClick={() => { setSelectedPartDetail(item); setViewMode('part-detail'); }} className="p-4 flex items-center gap-4 hover:bg-blue-50 cursor-pointer transition-colors">
                              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border">{item.data.image ? <img src={item.data.image} className="w-10 h-10 object-contain"/> : <Search size={20} className="text-slate-300"/>}</div>
                              <div className="flex-1"><div className="flex items-center gap-2"><span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 rounded">{item.type}</span><span className="text-xs font-mono text-slate-400">{item.data.kcid}</span></div><div className="font-bold text-slate-800">{item.data.name || item.data.model || item.data.type}</div><div className="text-xs text-slate-500">{item.data.desc || item.data.description || item.data.partNumber || item.data.part || ''}</div></div><ChevronRight size={20} className="text-slate-300"/>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
  );

  const renderUserAuthModal = () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95"><div className="bg-slate-900 p-6 text-white text-center"><h3 className="font-bold text-xl mb-1">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3><p className="text-slate-400 text-xs">{authMode === 'login' ? 'Sign in to access your saved builds' : 'Register to save and manage configurations'}</p></div><div className="p-6"><form onSubmit={handleUserAuth} className="space-y-4">{authMode === 'signup' && (<div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label><div className="relative"><User size={16} className="absolute top-2.5 left-2.5 text-slate-400"/><input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="John Doe" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required /></div></div>)}<div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label><input type="email" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="name@company.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label><input type="password" className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required /></div>{authError && (<div className="bg-red-50 text-red-600 p-2 rounded text-xs flex items-center gap-2"><AlertTriangle size={14}/> {authError}</div>)}<button disabled={authLoading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow transition-transform active:scale-95 flex items-center justify-center gap-2">{authLoading && <Loader2 size={14} className="animate-spin"/>}{authMode === 'login' ? 'Sign In' : 'Create Account'}</button></form><div className="mt-4 pt-4 border-t text-center"><button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} className="text-xs text-blue-600 hover:underline font-medium">{authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}</button></div><button onClick={() => setShowAuthModal(false)} className="absolute top-2 right-2 text-white/50 hover:text-white p-2"><X size={18}/></button></div></div></div>
  );

  const renderSaveModal = () => (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95"><div className="bg-blue-600 p-4 text-white flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><Save size={18}/> Save Build Configuration</h3><button onClick={() => setShowSaveModal(false)} className="hover:bg-blue-700 p-1 rounded"><X size={18}/></button></div><div className="p-6 space-y-4"><div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800"><p>Saving this configuration allows you to retrieve it later from your dashboard.</p></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Name</label><input className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Acme Corp" value={saveMetaData.customer} onChange={e => setSaveMetaData({...saveMetaData, customer: e.target.value})} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location / Site</label><div className="relative"><MapPin size={16} className="absolute top-2.5 left-2.5 text-slate-400"/><input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Plant B, Crane 4" value={saveMetaData.location} onChange={e => setSaveMetaData({...saveMetaData, location: e.target.value})} /></div></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset ID / Reference</label><div className="relative"><Tag size={16} className="absolute top-2.5 left-2.5 text-slate-400"/><input className="w-full border rounded p-2 pl-9 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. ASSET-1024" value={saveMetaData.assetId} onChange={e => setSaveMetaData({...saveMetaData, assetId: e.target.value})} /></div></div><div className="pt-4 flex justify-end gap-2"><button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700">Cancel</button><button onClick={handleSaveToDatabase} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-lg">Save Config</button></div></div></div></div>
  );

  const renderAdminSidebar = () => (
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800"><div className="p-4 border-b border-slate-800 font-bold text-white flex justify-between items-center"><span className="flex items-center gap-2"><Database size={18} /> Library</span><button onClick={() => { setEditItem(null); setTempImage(null); setIsEditing(true); setGlobalTab('add-mfg'); }} className="p-1 hover:bg-slate-700 rounded"><Plus size={16}/></button></div><div className="flex-1 overflow-y-auto p-2 space-y-1"><div className="mb-4"><div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Global Assets</div><button onClick={() => { setGlobalTab('cables'); setSelectedManufacturerAdmin(null); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'cables' ? 'bg-slate-800 text-white' : ''}`}><Cable size={14} /> Cables</button><button onClick={() => { setGlobalTab('accessories'); setSelectedManufacturerAdmin(null); }} className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 hover:bg-slate-800 ${globalTab === 'accessories' ? 'bg-slate-800 text-white' : ''}`}><Plug size={14} /> Accessories</button></div><div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Manufacturers</div>{manufacturers.map(m => (<div key={m.id}><button onClick={() => { setSelectedManufacturerAdmin(m.id); setSelectedSeriesAdmin(null); setGlobalTab(null); setTempImage(m.image); setEditItem(null); }} className={`w-full text-left px-3 py-2 rounded flex items-center justify-between hover:bg-slate-800 transition-colors ${selectedManufacturerAdmin === m.id && !globalTab ? 'bg-slate-800 text-white' : ''}`}><span className="font-semibold">{m.name}</span>{selectedManufacturerAdmin === m.id && !globalTab ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</button>{selectedManufacturerAdmin === m.id && !globalTab && (<div className="ml-4 mt-1 border-l-2 border-slate-700 pl-2 space-y-1">{Array.from(new Set(seriesData[m.id]?.enclosures.map(e => e.series)||[])).map(s => (<button key={s} onClick={() => setSelectedSeriesAdmin(s)} className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:text-white ${selectedSeriesAdmin === s ? 'text-blue-400 font-medium bg-slate-800/50' : 'text-slate-400'}`}><Folder size={14} /> {s}</button>))}</div>)}</div>))}</div><div className="p-4 border-t border-slate-800 flex justify-between items-center"><button onClick={() => setViewMode('builder')} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">Back to Builder</button><button onClick={() => { setIsAuthenticated(false); setViewMode('builder'); }} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><LogOut size={12}/> Logout</button></div></div>
  );

  const renderAdminMain = () => {
    if (globalTab === 'add-mfg' && isEditing) return (<div className="flex-1 flex items-center justify-center bg-slate-100"><div className="bg-white p-6 rounded shadow-lg w-96"><h3 className="font-bold mb-4">Add Manufacturer</h3><form onSubmit={handleSaveManufacturer} className="space-y-4"><div><label className="text-xs font-bold">Name</label><input name="name" required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">ID</label><input name="id" required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold block mb-1">Logo Image</label><div className="flex items-center gap-2">{tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}<label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div><div className="flex justify-end gap-2"><button type="button" onClick={() => {setIsEditing(false); setGlobalTab(null);}} className="text-sm text-slate-500">Cancel</button><button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Save</button></div></form></div></div>);
    if (globalTab === 'cables') return (<div className="flex-1 flex flex-col bg-slate-50 h-full p-6 overflow-hidden"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Cable/> Cable Library</h2><button onClick={() => { setEditItem(null); setIsEditing(true); setTempImage(null); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Cable</button></div>{isEditing && (<div className="bg-white p-4 mb-4 rounded shadow border"><form onSubmit={handleSaveCable} className="grid grid-cols-4 gap-4"><div className="col-span-2"><label className="text-xs font-bold">Part #</label><input name="part" defaultValue={editItem?.part} className="w-full border p-1 rounded"/></div><div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">Type</label><input name="type" defaultValue={editItem?.type} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">Conductors</label><input name="conductors" type="number" defaultValue={editItem?.conductors} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">AWG</label><input name="awg" type="number" defaultValue={editItem?.awg || 16} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">Min OD</label><input name="od_min" type="number" step="0.01" defaultValue={editItem?.od_min} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">Max OD</label><input name="od_max" type="number" step="0.01" defaultValue={editItem?.od_max} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">Strain Relief</label><select name="strainRelief" defaultValue={editItem?.strainRelief || 'external'} className="w-full border p-1 rounded"><option value="external">External</option><option value="internal">Internal</option></select></div>
    <div className="col-span-4"><label className="text-xs font-bold block mb-1">Cable Image</label><div className="flex items-center gap-2">{tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}<label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div>
    <div className="col-span-4 flex justify-end gap-2 mt-2"><button type="button" onClick={() => setIsEditing(false)} className="text-sm">Cancel</button><button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button></div></form></div>)}<div className="overflow-y-auto flex-1"><DataTable columns={[{ header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> }, { header: 'KCID', key: 'kcid' }, { header: 'Part #', key: 'part' }, { header: 'Cond.', key: 'conductors' }]} data={cables} onEdit={(i) => { setEditItem(i); setIsEditing(true); setTempImage(i.image); }} onDelete={(i) => setCables(prev => prev.filter(c => c.part !== i.part))} /></div></div>);
    if (globalTab === 'accessories') return (<div className="flex-1 flex flex-col bg-slate-50 h-full p-6 overflow-hidden"><div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Plug/> Accessories</h2><button onClick={() => { setEditItem(null); setIsEditing(true); setTempImage(null); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Item</button></div>{isEditing && (<div className="bg-white p-4 mb-4 rounded shadow border"><form onSubmit={handleSaveAccessory} className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold">ID</label><input name="id" defaultValue={editItem?.id} className="w-full border p-1 rounded"/></div><div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-1 rounded"/></div><div className="col-span-2"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} className="w-full border p-1 rounded"/></div>
    <div className="col-span-2"><label className="text-xs font-bold block mb-1">Accessory Image</label><div className="flex items-center gap-2">{tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}<label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div>
    <div className="col-span-2 flex justify-end gap-2 mt-2"><button type="button" onClick={() => setIsEditing(false)} className="text-sm">Cancel</button><button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button></div></form></div>)}<div className="overflow-y-auto flex-1"><DataTable columns={[{ header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> }, { header: 'KCID', key: 'kcid' }, { header: 'Name', key: 'name' }]} data={accessories} onEdit={(i) => { setEditItem(i); setIsEditing(true); setTempImage(i.image); }} onDelete={(i) => setAccessories(prev => prev.filter(a => a.id !== i.id))} /></div></div>);

    if (!selectedManufacturerAdmin) return (<div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"><Layers size={64} className="mb-4 text-slate-200" /><h3 className="text-xl font-bold text-slate-500">Select a Manufacturer</h3></div>);
    
    // NEW: Edit Manufacturer Form (if no series selected)
    if (selectedManufacturerAdmin && !selectedSeriesAdmin) {
        const mfg = manufacturers.find(m => m.id === selectedManufacturerAdmin);
        return (
            <div className="flex-1 flex flex-col bg-slate-50 h-full p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Edit size={20}/> Edit Manufacturer</h2></div>
                <div className="bg-white p-6 rounded-lg shadow-sm border max-w-2xl">
                    <form onSubmit={handleUpdateManufacturer} className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Name</label><input name="name" defaultValue={mfg.name} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Logo / Image</label><div className="flex items-center gap-4">{tempImage ? <img src={tempImage} className="w-24 h-24 object-contain border rounded p-2" /> : (mfg.image ? <img src={mfg.image} className="w-24 h-24 object-contain border rounded p-2" /> : <div className="w-24 h-24 bg-slate-100 rounded flex items-center justify-center text-slate-300"><ImageIcon size={32}/></div>)}<label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 font-bold text-sm flex items-center gap-2"><Upload size={16}/> Change Image<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div>
                        <div className="flex justify-end pt-4"><button className="bg-green-600 text-white px-6 py-2 rounded font-bold shadow-lg hover:bg-green-700 transition-transform active:scale-95">Save Changes</button></div>
                    </form>
                </div>
            </div>
        );
    }

    const currentEnclosures = seriesData[selectedManufacturerAdmin].enclosures.filter(e => e.series === selectedSeriesAdmin);
    const currentComponents = componentTypes.filter(c => c.series === selectedSeriesAdmin || c.series === selectedManufacturerAdmin || c.series === 'global');
    const currentPreconfigs = seriesData[selectedManufacturerAdmin].preconfigurations?.filter(p => p.series === selectedSeriesAdmin) || [];

    return (
        <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
            <div className="bg-white border-b px-6 py-4 flex justify-between items-center"><div><h2 className="text-xl font-bold text-slate-800">{selectedSeriesAdmin} Configuration</h2><p className="text-xs text-slate-500">{manufacturers.find(m => m.id === selectedManufacturerAdmin)?.name}</p></div><div className="bg-slate-100 p-1 rounded-lg flex"><button onClick={() => { setAdminSubTab('enclosures'); setIsEditing(false); }} className={`px-4 py-1.5 rounded-md text-sm font-medium ${adminSubTab === 'enclosures' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Enclosures</button><button onClick={() => { setAdminSubTab('components'); setIsEditing(false); }} className={`px-4 py-1.5 rounded-md text-sm font-medium ${adminSubTab === 'components' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Components</button><button onClick={() => { setAdminSubTab('preconfigs'); setIsEditing(false); }} className={`px-4 py-1.5 rounded-md text-sm font-medium ${adminSubTab === 'preconfigs' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Preconfigs</button></div></div>
            <div className="flex-1 overflow-y-auto p-6">
                {adminSubTab === 'enclosures' && (<div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Enclosure Models</h3><button onClick={() => { setEditItem(null); setIsEditing(true); setTempImage(null); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Model</button></div>{isEditing && (<div className="mb-6 bg-white p-4 border rounded-lg shadow-lg"><form onSubmit={handleSaveEnclosure} className="grid grid-cols-2 md:grid-cols-4 gap-4"><input type="hidden" name="id" value={editItem?.id || ''} /><div className="col-span-2"><label className="text-xs font-bold">Model</label><input name="model" defaultValue={editItem?.model} required className="w-full border p-2 rounded"/></div><div className="col-span-2"><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Holes</label><input name="holes" type="number" defaultValue={editItem?.holes || 2} className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Depth</label><input name="depth" defaultValue={editItem?.depth || 'Standard'} className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Strain Relief</label><div className="flex flex-col gap-1 mt-1"><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_internal" defaultChecked={editItem?.supportedStrainRelief?.includes('internal')} /> Internal</label><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="sr_external" defaultChecked={editItem?.supportedStrainRelief?.includes('external')} /> External</label></div></div>
                <div className="col-span-4"><label className="text-xs font-bold block mb-1">Enclosure Image</label><div className="flex items-center gap-2">{tempImage ? <img src={tempImage} className="w-10 h-10 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-10 h-10 object-contain border rounded" />)}<label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-xs hover:bg-slate-300 flex items-center gap-1"><Upload size={12}/> Upload<input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div>
                <div className="col-span-4 flex justify-end mt-2 gap-2"><button type="button" onClick={() => setIsEditing(false)} className="text-sm">Cancel</button><button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button></div></form></div>)}<DataTable columns={[{ header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> }, { header: 'KCID', key: 'kcid' }, { header: 'Model', key: 'model' }, { header: 'Holes', key: 'holes' }]} data={currentEnclosures} onEdit={(item) => { setEditItem(item); setIsEditing(true); setTempImage(item.image); }} onDelete={(item) => { const newData = { ...seriesData }; newData[selectedManufacturerAdmin].enclosures = newData[selectedManufacturerAdmin].enclosures.filter(e => e.id !== item.id); setSeriesData(newData); }} /></div>)}
                {/* COMPONENT EDITOR WITH IMAGE UPLOAD */}
                {adminSubTab === 'components' && (<div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Scoped Components</h3><button onClick={() => { setEditItem(null); setTempImage(null); setTempDocs([]); setIsEditing(true); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Component</button></div>{isEditing && (<div className="mb-6 bg-white p-4 border rounded-lg shadow-lg"><form onSubmit={handleSaveComponent} className="grid grid-cols-2 md:grid-cols-3 gap-4"><div className="col-span-3 bg-blue-50 p-2 rounded"><label className="text-xs font-bold text-blue-800">Scope</label><div className="flex gap-4 mt-1"><label className="flex items-center gap-1 text-xs"><input type="radio" name="scope" value="manufacturer" defaultChecked={editItem?.series === selectedManufacturerAdmin} /> Manufacturer</label><label className="flex items-center gap-1 text-xs"><input type="radio" name="scope" value="series" defaultChecked={editItem?.series === selectedSeriesAdmin} /> Series</label></div></div><div><label className="text-xs font-bold">ID</label><input name="id" defaultValue={editItem?.id} required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">KCID</label><input name="kcid" defaultValue={editItem?.kcid} className="w-full border p-2 rounded"/></div><div className="col-span-1"><label className="text-xs font-bold">Name</label><input name="name" defaultValue={editItem?.name} required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Holes Required</label><input name="holes" type="number" defaultValue={editItem?.holes || 1} className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Wires</label><input name="wires" type="number" defaultValue={editItem?.wires || 0} className="w-full border p-2 rounded"/></div>
                <div className="col-span-3"><label className="text-xs font-bold block mb-1">Component Image</label><div className="flex items-center gap-3">{tempImage ? <img src={tempImage} className="w-12 h-12 object-contain border rounded" /> : (editItem?.image && <img src={editItem.image} className="w-12 h-12 object-contain border rounded" />)}<label className="cursor-pointer bg-slate-100 px-3 py-2 rounded text-xs hover:bg-slate-200 flex items-center gap-1"><Upload size={12}/> Upload <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label></div></div>
                {/* DOC UPLOAD SECTION */}
                <div className="col-span-3 border-t pt-3 mt-1">
                    <label className="text-xs font-bold block mb-2 text-slate-500 uppercase">Documentation</label>
                    <div className="space-y-2 mb-2">
                        {editItem?.docs?.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded border">
                                <span className="flex items-center gap-2"><FileIcon size={12}/> {d.name}</span>
                                <button type="button" onClick={() => handleDeleteDoc(i)} className="text-red-500 hover:text-red-700"><Trash2 size={12}/></button>
                            </div>
                        ))}
                        {tempDocs.map((d, i) => (
                            <div key={`new-${i}`} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded border border-green-200 text-green-700">
                                <span className="flex items-center gap-2"><FilePlus size={12}/> {d.name} (New)</span>
                            </div>
                        ))}
                    </div>
                    <label className="cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100 inline-flex items-center gap-1"><Upload size={12}/> Add Documents <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} /></label>
                </div>
                <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-2"><button type="button" onClick={() => setIsEditing(false)} className="text-sm">Cancel</button><button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button></div></form></div>)}<DataTable columns={[{ header: 'Img', key: 'image', render: (i) => i.image ? <img src={i.image} className="w-8 h-8 object-contain rounded"/> : <ImageIcon size={16} className="text-slate-300"/> }, { header: 'KCID', key: 'kcid' }, { header: 'Name', key: 'name' }, { header: 'Holes', key: 'holes' }]} data={currentComponents} onEdit={(item) => { setEditItem(item); setTempImage(item.image); setIsEditing(true); }} onDelete={(item) => { /* Delete */ }} /></div>)}
                {adminSubTab === 'preconfigs' && (<div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-slate-700">Preconfigured Pendants</h3><button onClick={() => { setEditItem(null); setPreconfigSlots([]); setIsEditing(true); }} className="bg-blue-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1"><Plus size={16} /> Add Preconfig</button></div>{isEditing && (<div className="mb-6 bg-white p-4 border rounded-lg shadow-lg"><form onSubmit={handleSavePreconfig} className="grid grid-cols-2 gap-4"><input type="hidden" name="id" value={editItem?.id || ''} /><div><label className="text-xs font-bold">Model Number</label><input name="model" defaultValue={editItem?.modelNumber} required className="w-full border p-2 rounded"/></div><div><label className="text-xs font-bold">Description</label><input name="description" defaultValue={editItem?.description} className="w-full border p-2 rounded"/></div><div className="col-span-2"><label className="text-xs font-bold">Base Enclosure</label><select name="enclosureId" defaultValue={editItem?.enclosureId || ''} className="w-full border p-2 rounded" onChange={(e) => handleSelectPreconfigEnclosure(e.target.value)} required><option value="">Select Enclosure...</option>{currentEnclosures.map(enc => <option key={enc.id} value={enc.id}>{enc.model} ({enc.holes} Holes)</option>)}</select></div><div className="col-span-2 bg-slate-50 p-3 rounded"><label className="text-xs font-bold mb-2 block">Button Configuration</label>{preconfigSlots.length > 0 ? (<div className="space-y-2">{preconfigSlots.map((slotId, idx) => (<div key={idx} className="flex items-center gap-2"><span className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-xs font-bold">{idx + 1}</span><select className="flex-1 border p-1 rounded text-sm" value={slotId} onChange={(e) => { const newSlots = [...preconfigSlots]; newSlots[idx] = e.target.value; setPreconfigSlots(newSlots); }} disabled={slotId === 'linked'}>{slotId === 'linked' ? <option value="linked">Linked (Occupied)</option> : componentTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>))}</div>) : (<p className="text-xs text-slate-400 italic">Select an enclosure to configure slots.</p>)}</div><div className="col-span-2 flex justify-end gap-2 mt-2"><button type="button" onClick={() => setIsEditing(false)} className="text-sm">Cancel</button><button className="bg-green-600 text-white px-3 py-1 rounded text-sm">Save</button></div></form></div>)}<DataTable columns={[{ header: 'Model #', key: 'modelNumber' }, { header: 'Base', key: 'enclosureId' }, { header: 'Desc', key: 'description' }]} data={currentPreconfigs} onEdit={(item) => { setEditItem(item); setPreconfigSlots(item.slots); setIsEditing(true); }} onDelete={(item) => { /* Delete */ }} /></div>)}
            </div>
        </div>
    );
  };

  // --- LOGIN SCREEN ---
  if (viewMode === 'admin' && !isAuthenticated) {
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
                  <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">Password</label>
                          <input 
                              type="password" 
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="••••••"
                          />
                      </div>
                      {loginError && (
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

  if (viewMode === 'admin') return (<div className="flex h-screen bg-slate-50 overflow-hidden font-sans">{renderAdminSidebar()}{renderAdminMain()}</div>);

  // --- BUILDER VIEW ---

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {showSaveModal && renderSaveModal()}
      {showAuthModal && renderUserAuthModal()}
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-40 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                  <Box className="text-yellow-400" />
                  <div>
                      <h1 className="text-lg font-bold leading-none">Pendant Builder</h1>
                      <div className="text-[10px] text-slate-400">Professional Configuration Tool</div>
                  </div>
              </div>
              
              {/* SEARCH BAR */}
              <div className="flex-1 max-w-md relative hidden md:block" ref={searchContainerRef}>
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search KCID, Part #, or Name..." 
                      className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-500 text-white"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                  />
                  {/* AUTOFILL SUGGESTIONS */}
                  {showSuggestions && searchQuery && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
                          {searchResults.length > 0 ? (
                              <>
                                  {searchResults.slice(0, 6).map((item, idx) => (
                                      <button
                                          key={idx}
                                          className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-3 border-b last:border-0 transition-colors"
                                          onClick={() => {
                                              setSelectedPartDetail(item);
                                              setViewMode('part-detail');
                                              setShowSuggestions(false);
                                              setSearchQuery('');
                                          }}
                                      >
                                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0 border">
                                              {item.data.image ? <img src={item.data.image} className="w-8 h-8 object-contain"/> : <Search size={16} className="text-slate-400"/>}
                                          </div>
                                          <div className="flex-1 overflow-hidden">
                                              <div className="flex items-center gap-2">
                                                  <div className="text-sm font-bold text-slate-800 truncate">{item.data.name || item.data.model}</div>
                                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold">{item.type}</span>
                                              </div>
                                              <div className="text-xs text-slate-500 font-mono">{item.data.kcid || item.data.partNumber || item.data.part}</div>
                                          </div>
                                          <ChevronRight size={14} className="text-slate-300"/>
                                      </button>
                                  ))}
                                  {searchResults.length > 6 && (
                                      <button 
                                          onClick={handleSearch}
                                          className="w-full p-2 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 bg-slate-50"
                                      >
                                          View all {searchResults.length} results
                                      </button>
                                  )}
                              </>
                          ) : (
                              <div className="p-4 text-center text-slate-400 text-sm">No matching parts found</div>
                          )}
                      </div>
                  )}
              </div>

              <div className="flex gap-3 items-center">
                  {step > 1 && <button onClick={() => setStep(step - 1)} className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs flex items-center gap-1 font-semibold"><ChevronLeft size={14} /> Back</button>}
                  {step === 4 && <button onClick={() => setShowSaveModal(true)} className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white transition text-xs flex items-center gap-1 font-bold shadow-lg shadow-green-900/20"><Save size={14} /> Save Config</button>}
                  <button onClick={() => setViewMode('admin')} className="px-3 py-2 rounded border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs flex items-center gap-1"><Settings size={14} /> Admin</button>
                  
                  {/* User Auth Info */}
                  <div className="ml-4 pl-4 border-l border-slate-700">
                      {user && !user.isAnonymous ? (
                          <div className="flex items-center gap-3">
                              <div className="text-right hidden md:block">
                                  <div className="text-xs font-bold text-white">{user.displayName || 'User'}</div>
                                  <div className="text-[10px] text-slate-400">Online</div>
                              </div>
                              <button onClick={handleUserLogout} className="bg-slate-800 p-2 rounded hover:bg-red-900/50 hover:text-red-400 transition-colors text-slate-300" title="Logout">
                                  <LogOut size={14}/>
                              </button>
                          </div>
                      ) : (
                          <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white transition-colors">
                              <User size={14}/> Login
                          </button>
                      )}
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-6xl mx-auto w-full flex-1 p-4 md:p-8 flex flex-col">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[600px]">
            {/* PROGRESS */}
            <div className="w-full bg-slate-100 h-1.5"><div className="bg-blue-600 h-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(37,99,235,0.5)]" style={{ width: `${(step / 4) * 100}%` }} /></div>
            
            <div className="flex-1 p-6 md:p-8 flex flex-col">
                <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
                    
                    {/* STEP 1: DASHBOARD */}
                    {step === 1 && (
                        <div className="flex flex-col md:flex-row gap-8 h-full">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-slate-800">Start Your Configuration</h2>
                                    <div className="bg-slate-100 p-1 rounded-lg flex text-xs font-bold">
                                        <button onClick={() => setBrowseMode('brand')} className={`px-4 py-2 rounded transition-all ${browseMode === 'brand' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Shop by Brand</button>
                                        <button onClick={() => setBrowseMode('capacity')} className={`px-4 py-2 rounded transition-all ${browseMode === 'capacity' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Shop by Capacity</button>
                                    </div>
                                </div>
                                
                                {browseMode === 'brand' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {manufacturers.filter(m => seriesData[m.id]?.isActive).map((m) => (
                                            <button key={m.id} onClick={() => { setActiveManufacturer(m.id); setStep(2); }} className="flex flex-col items-center justify-center p-6 border rounded-xl hover:border-blue-500 hover:shadow-lg transition-all bg-white group overflow-hidden relative h-32">
                                                {m.image ? <img src={m.image} className="w-full h-16 object-contain mb-2" /> : <div className={`w-12 h-12 ${m.color} rounded-full mb-2 flex items-center justify-center text-white font-bold text-xl shadow-sm`}>{m.name.charAt(0)}</div>}
                                                <span className="font-semibold text-sm text-slate-700 text-center leading-tight">{m.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                            {availableButtonCounts.map(count => (
                                                <button 
                                                    key={count} 
                                                    onClick={() => setSelectedButtonCount(count)}
                                                    className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${selectedButtonCount === count ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 hover:border-blue-400'}`}
                                                >
                                                    {count} Buttons
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {selectedButtonCount ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {allEnclosuresFlat.filter(enc => enc.holes === selectedButtonCount).map((enc, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => { 
                                                            setActiveManufacturer(enc.manufacturerId); 
                                                            setEnclosure(enc); 
                                                            setLoadedPreconfig(null); 
                                                            setSlots(Array(enc.holes).fill(null).map((_, i) => ({ id: i, componentId: 'empty' }))); 
                                                            setStep(3); 
                                                        }} 
                                                        className="flex flex-col p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left bg-white items-center text-center group relative overflow-hidden"
                                                    >
                                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 uppercase">{enc.manufacturerName}</div>
                                                        <div className="w-20 h-24 mb-2 mt-4 flex items-center justify-center">
                                                            {enc.image ? <img src={enc.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"/> : <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300"><Box size={24}/></div>}
                                                        </div>
                                                        <div className="font-bold text-slate-800 text-sm">{enc.model}</div>
                                                        <div className="text-xs text-slate-400 font-mono mt-1">{enc.kcid}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed">
                                                <Grid size={48} className="mx-auto mb-2 text-slate-300"/>
                                                <p>Select a button count to view compatible enclosures from all manufacturers.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* DASHBOARD SIDEBAR */}
                            <div className="w-full md:w-80 border-l pl-0 md:pl-8 flex flex-col">
                                <div className="flex items-center gap-4 mb-4 border-b pb-2">
                                    <button onClick={() => setDashboardTab('trending')} className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${dashboardTab === 'trending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Trending</button>
                                    <button onClick={() => setDashboardTab('my-builds')} className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${dashboardTab === 'my-builds' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>My Saved Builds</button>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[500px] space-y-3 pr-2">
                                    {dashboardTab === 'trending' ? (
                                        popularConfigs.map((build, idx) => (
                                            <button key={idx} onClick={() => loadConfig(build)} className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all bg-slate-50 group">
                                                <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{build.manufacturerName}</span><ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500"/></div>
                                                <div className="font-bold text-slate-800 text-sm">{build.enclosureModel}</div>
                                                <div className="text-xs text-slate-500 mt-1">{build.slotIds.length} Component Slots</div>
                                            </button>
                                        ))
                                    ) : (
                                        myBuilds.length === 0 ? <div className="text-center text-slate-400 text-sm py-8">No saved builds yet.</div> :
                                        myBuilds.map((build, idx) => (
                                            <button key={idx} onClick={() => loadConfig(build)} className="w-full text-left p-3 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-all bg-white group shadow-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={10}/> {build.timestamp ? new Date(build.timestamp.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500"/>
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm mb-1">{build.meta_customer || 'Unnamed Project'}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10}/> {build.meta_location || 'No Location'}</div>
                                                <div className="text-xs text-slate-400 mt-2 pt-2 border-t flex justify-between"><span>{build.enclosureModel}</span><span>{build.manufacturerName}</span></div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: ENCLOSURE (With Images) */}
                    {step === 2 && activeSeriesData && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-slate-800">Select {activeSeriesData.name} Model</h2>
                            {Object.entries(activeSeriesData.enclosures.reduce((acc, enc) => { if (!acc[enc.series]) acc[enc.series] = []; acc[enc.series].push(enc); return acc; }, {})).map(([seriesName, enclosures]) => (
                                <div key={seriesName} className="mb-6"><h5 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 border-b pb-1">{seriesName} Enclosures</h5><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{enclosures.map((enc, idx) => (<button key={idx} onClick={() => { setEnclosure(enc); setLoadedPreconfig(null); setSlots(Array(enc.holes).fill(null).map((_, i) => ({ id: i, componentId: 'empty' }))); setStep(3); }} className="flex flex-col p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left bg-white items-center text-center group">
                                    <div className="w-20 h-24 mb-2 flex items-center justify-center">
                                        {enc.image ? <img src={enc.image} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"/> : <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-300"><Box size={24}/></div>}
                                    </div>
                                    <div className="font-bold text-slate-800 text-sm">{enc.model}</div><div className="text-xs text-slate-500">{enc.holes} Holes</div>
                                </button>))}</div></div>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: CONFIGURATION (Same as before) */}
                    {step === 3 && (
                        <div className="flex flex-col lg:flex-row gap-8 h-full">
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                                <h3 className="font-bold text-slate-700 mb-2">Configure {enclosure?.model}</h3>
                                {slots.map((slot, index) => {
                                    const selectedComp = componentTypes.find(c => c.id === slot.componentId);
                                    const isExpanded = expandedSlot === index;
                                    const isLinked = slot.componentId === 'linked';
                                    return (
                                        <div key={index} className={`border rounded-lg mb-4 bg-white shadow-sm overflow-visible relative transition-all ${isLinked ? 'opacity-60 bg-slate-50 border-dashed' : ''}`}>
                                            <div className={`flex items-center p-4 ${isLinked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`} onClick={() => !isLinked && setExpandedSlot(isExpanded ? null : index)}>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 mr-4 shrink-0 shadow-inner text-sm">{index + 1}</div>
                                                <div className="flex-1">
                                                    {isLinked ? (<div className="flex items-center gap-2 text-slate-400 italic text-sm"><Link size={16} /> Linked to Slot {slot.linkedTo + 1}</div>) : (selectedComp && slot.componentId !== 'empty') ? (<div className="flex items-center gap-4"><div className="w-10 h-10 bg-white border rounded flex items-center justify-center shrink-0 overflow-hidden p-1">{selectedComp.image ? <img src={selectedComp.image} className="w-full h-full object-contain"/> : <Box size={20} className="text-slate-300"/>}</div><div><div className="font-bold text-slate-800 text-sm">{selectedComp.name}</div><div className="text-[10px] text-slate-500 font-mono">{selectedComp.partNumber}</div></div></div>) : (<div className="text-slate-400 font-medium flex items-center gap-2 text-sm"><Plus size={16} /> Select Component...</div>)}
                                                </div>
                                                {!isLinked && <div className="text-slate-300 ml-4">{isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>}
                                            </div>
                                            {isExpanded && !isLinked && (
                                                <div className="border-t bg-slate-50 p-0 flex h-64">
                                                    <div className="w-3/5 border-r overflow-y-auto p-2">
                                                        {availableComponents.filter(c => { if (c.holes > 1 && index + c.holes > slots.length) return false; return true; }).map(comp => (
                                                            <div key={comp.id} className={`p-2 rounded mb-1 cursor-pointer flex items-center gap-3 transition-colors ${slot.componentId === comp.id ? 'bg-blue-100 ring-1 ring-blue-300' : 'hover:bg-white hover:shadow-sm'}`} onClick={() => { handleUpdateSlot(index, comp.id, slots, setSlots); setExpandedSlot(null); }} onMouseEnter={() => setHoveredComponent(comp)} onMouseLeave={() => setHoveredComponent(null)}>
                                                                <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">{comp.image ? <img src={comp.image} className="w-6 h-6 object-contain"/> : <Box size={14} className="text-slate-300"/>}</div>
                                                                <div className="overflow-hidden"><div className="text-xs font-semibold truncate">{comp.name}</div><div className="text-[9px] text-slate-500 font-mono">{comp.partNumber}</div></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex-1 bg-white p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                                        {(hoveredComponent || selectedComp) ? (<div className="animate-in fade-in zoom-in-95 duration-200 w-full h-full flex flex-col"><div className="flex-1 flex items-center justify-center p-2 mb-2">{(hoveredComponent || selectedComp).image ? <img src={(hoveredComponent || selectedComp).image} className="max-w-full max-h-full object-contain" /> : <Package size={48} className="text-slate-200" />}</div><div><div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">{(hoveredComponent || selectedComp).kcid}</div><h4 className="font-bold text-slate-800 text-sm leading-tight mb-2">{(hoveredComponent || selectedComp).name}</h4></div></div>) : (<div className="text-slate-300 flex flex-col items-center"><Eye size={32} className="mb-2" /><p className="text-xs">Preview</p></div>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <button onClick={() => setStep(4)} className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">Calculate Cabling <ChevronRight size={20} /></button>
                            </div>
                            <div className="lg:w-1/3 bg-slate-100 rounded-xl p-6 flex flex-col items-center border border-slate-200 min-h-[500px]">
                                <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-6 text-sm">Visual Preview</h4>
                                <div className={`relative ${activeManufacturer === 'duct-o-wire' || activeManufacturer === 'demag' ? 'bg-yellow-400' : 'bg-orange-500'} w-32 rounded-3xl shadow-2xl border-4 border-slate-800 flex flex-col items-center py-6 gap-4`}>
                                    <div className="absolute -top-6 w-8 h-6 bg-slate-700 rounded-sm"></div><div className="absolute -top-12 w-2 h-8 bg-black"></div>
                                    {slots.map((slot, idx) => {
                                        if (slot.componentId === 'linked') return null; const comp = componentTypes.find(c => c.id === slot.componentId); if (!comp) return null;
                                        return (<div key={idx} className="relative group flex flex-col items-center">{comp.holes > 1 && <div className="absolute inset-0 border-2 border-slate-400/30 rounded-lg -m-2 pointer-events-none"></div>}{comp.image ? (<div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner overflow-hidden bg-white"><img src={comp.image} className="w-full h-full object-cover" /></div>) : (<div className={`w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner ${comp.color === 'bg-black' ? 'bg-slate-900' : comp.color}`}>{comp.id === 'estop' && <div className="w-12 h-12 rounded-full bg-red-600 border-2 border-red-800 shadow-lg"></div>}{comp.holes > 1 && <div className="flex flex-col gap-1"><div className="w-8 h-3 bg-white/20 rounded-sm"></div><div className="w-8 h-3 bg-white/20 rounded-sm"></div></div>}</div>)}{comp.holes > 1 && <div className="h-4 w-8 bg-slate-800 my-1"></div>}{comp.holes > 1 && (<div className={`w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center shadow-inner ${comp.image ? 'bg-white' : (comp.color === 'bg-black' ? 'bg-slate-900' : comp.color)}`}>{comp.image ? (<img src={comp.image} className="w-full h-full object-cover opacity-50 grayscale" />) : (<div className="w-8 h-3 bg-white/20 rounded-sm"></div>)}</div>)}</div>);
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUMMARY & CABLING */}
                    {step === 4 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Zap className="text-yellow-500" /> System Calculations</h3>
                                {matchedPreconfig ? (<div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm"><h4 className="flex items-center gap-2 text-green-700 font-bold"><CheckCircle size={18} /> Standard Configuration Detected</h4><p className="text-sm text-green-600 mt-1">Matched assembly <strong>{matchedPreconfig.modelNumber}</strong>.</p></div>) : (<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow-sm"><h4 className="flex items-center gap-2 text-blue-700 font-bold"><Settings size={18} /> Custom Configuration</h4></div>)}
                                
                                <div className="bg-white border rounded-xl p-5 shadow-sm">
                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><ArrowUpDown size={18} className="text-blue-500"/> Cable Length Requirements</h4>
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1"><label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Height of Lift (ft)</label><input type="number" className="w-full p-2 border rounded-lg text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="20" value={liftHeight} onChange={(e) => setLiftHeight(e.target.value)} /></div>
                                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-200"><div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Cable</div><div className="text-xl font-bold text-blue-600">{liftHeight ? parseInt(liftHeight) + 5 : '--'} <span className="text-sm text-slate-400">ft</span></div><div className="text-[10px] text-slate-400 leading-tight">+5ft Makeup Included</div></div>
                                    </div>
                                </div>

                                <div className="bg-white border rounded-xl p-5 shadow-sm">
                                    <h4 className="font-semibold text-slate-700 mb-3">Recommended Cable</h4>
                                    {recommendedCable ? (
                                        <div className="flex items-center gap-4">
                                            {recommendedCable.image && <img src={recommendedCable.image} className="w-16 h-16 object-cover rounded border"/>}
                                            <div>
                                                <div className="text-2xl font-bold text-blue-600 mb-1">{recommendedCable.type}</div>
                                                <div className="text-sm font-mono text-slate-500 bg-slate-100 p-1 rounded inline-block mb-2">KCID: {recommendedCable.kcid}</div>
                                            </div>
                                        </div>
                                    ) : (<div className="text-red-500 flex items-center gap-2"><AlertTriangle size={18} /> No valid cable found.</div>)}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Plug className="text-slate-500" /> Accessories</h3>
                                <div className="bg-white border rounded-xl p-5 shadow-sm">
                                    <h4 className="font-semibold text-slate-700 mb-3">Optional Add-ons</h4>
                                    <div className="space-y-2">{accessories.map(acc => (<label key={acc.id} className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"><input type="checkbox" checked={selectedAccessories.includes(acc.id)} onChange={(e) => { if(e.target.checked) setSelectedAccessories([...selectedAccessories, acc.id]); else setSelectedAccessories(selectedAccessories.filter(id => id !== acc.id)); }} />{acc.image ? <img src={acc.image} className="w-10 h-10 object-contain border bg-white p-1 rounded"/> : <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center"><Plug size={16} className="text-slate-400"/></div>}<div><div className="font-semibold text-sm">{acc.name}</div><div className="text-xs text-slate-500 font-mono">{acc.kcid}</div></div></label>))}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
          {step === 4 && (<div className="bg-slate-100 p-6 border-t border-slate-200"><h4 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">Bill of Materials</h4><div className="bg-white border rounded-lg overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-semibold border-b"><tr><th className="p-3">KCID</th><th className="p-3">Part #</th><th className="p-3">Description</th><th className="p-3 text-right">Qty</th></tr></thead><tbody className="divide-y">{matchedPreconfig ? (<tr className="bg-blue-50/50"><td className="p-3 font-mono text-blue-700 font-bold">PRE-CONFIG</td><td className="p-3 font-bold text-blue-800">{matchedPreconfig.modelNumber}</td><td className="p-3 text-slate-700"><div className="font-semibold">{matchedPreconfig.description}</div><div className="text-xs text-slate-500 mt-1">Includes: {enclosure.model} Enclosure + Configured Inserts</div></td><td className="p-3 text-right font-bold">1</td></tr>) : (<><tr><td className="p-3 font-mono text-blue-600">{enclosure?.kcid}</td><td className="p-3 font-medium">{enclosure?.model}</td><td className="p-3 text-slate-600">{activeManufacturer} - {enclosure?.model}</td><td className="p-3 text-right">1</td></tr>{Object.values(slots.reduce((acc, slot) => { if (slot.componentId === 'empty' || slot.componentId === 'linked') return acc; const comp = componentTypes.find(c => c.id === slot.componentId); if (!comp) return acc; if (!acc[comp.id]) acc[comp.id] = { ...comp, count: 0 }; acc[comp.id].count++; return acc; }, {})).map(comp => (<tr key={comp.id}><td className="p-3 font-mono text-blue-600">{comp.kcid}</td><td className="p-3 font-medium">{comp.partNumber || '-'}</td><td className="p-3 text-slate-600">{comp.name}</td><td className="p-3 text-right">{comp.count}</td></tr>))}</>)}{recommendedCable && (<tr><td className="p-3 font-mono text-blue-600">{recommendedCable.kcid}</td><td className="p-3 font-medium">{recommendedCable.part}</td><td className="p-3 text-slate-600">{recommendedCable.type}</td><td className="p-3 text-right font-bold">{liftHeight ? parseInt(liftHeight) + 5 : 'AR'} ft</td></tr>)}{selectedAccessories.map(accId => { const acc = accessories.find(a => a.id === accId); return (<tr key={accId}><td className="p-3 font-mono text-blue-600">{acc.kcid}</td><td className="p-3 font-medium">{acc.id}</td><td className="p-3 text-slate-600">{acc.name}</td><td className="p-3 text-right">1</td></tr>); })}</tbody></table></div></div>)}
      </div>
      <div className="bg-white border-t py-6 text-center text-slate-500 text-sm"><p className="flex items-center justify-center gap-2">Created by <span className="font-semibold text-slate-700">Nicholas Severance</span><a href="https://www.linkedin.com/in/nick-severance?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2"><Linkedin size={14}/> LinkedIn</a></p></div>
    </div>
  );
}
