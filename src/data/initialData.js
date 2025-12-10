export const INITIAL_MANUFACTURERS = [
  { id: 'duct-o-wire', name: 'Duct-O-Wire', color: 'bg-yellow-500', isActive: true, image: null },
  { id: 'conductix', name: 'Conductix-Wampfler', color: 'bg-orange-500', isActive: true, image: null },
  { id: 'magnetek', name: 'Magnetek', color: 'bg-blue-600', isActive: true, image: null },
  { id: 'squared', name: 'Square D', color: 'bg-blue-800', isActive: true, image: null },
  { id: 'demag', name: 'Demag', color: 'bg-yellow-400', isActive: true, image: null },
  { id: 'konecranes', name: 'Konecranes', color: 'bg-red-600', isActive: true, image: null },
];

export const INITIAL_SERIES_DATA = {
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
  'magnetek': { name: 'Magnetek Series', description: 'Standard Series', isActive: true, enclosures: [], preconfigurations: [] },
  'squared': { name: 'Square D Series', description: 'Standard Series', isActive: true, enclosures: [], preconfigurations: [] },
  'demag': { name: 'Demag Series', description: 'Standard Series', isActive: true, enclosures: [], preconfigurations: [] },
  'konecranes': { name: 'Konecranes Series', description: 'Standard Series', isActive: true, enclosures: [], preconfigurations: [] },
  
  'default': {
    name: 'Standard Series', description: 'Generic Configuration', isActive: true,
    enclosures: [ { id: 'gen-2', series: 'Generic', holes: 2, model: 'GEN-2', depth: 'Standard', max_contact_depth: 3, kcid: 'KC-GEN-02', supportedStrainRelief: ['external'], image: null } ],
    preconfigurations: []
  }
};

export const INITIAL_COMPONENTS = [
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

export const INITIAL_CABLES = [
  { conductors: 3, awg: 16, od_min: 0.39, od_max: 0.43, type: '16/3 SOOW (Int SR)', part: 'XA-34155', strainRelief: 'internal', kcid: 'KC-CBL-16-03-I', image: null },
  { conductors: 8, awg: 16, od_min: 0.56, od_max: 0.64, type: '16/8 Round (Ext SR)', part: 'XA-35398', strainRelief: 'external', kcid: 'KC-CBL-16-08-E', image: null },
  { conductors: 12, awg: 16, od_min: 0.58, od_max: 0.68, type: '16/12 Round (Ext SR)', part: 'XA-35399', strainRelief: 'external', kcid: 'KC-CBL-16-12-E', image: null },
  { conductors: 16, awg: 16, od_min: 0.64, od_max: 0.76, type: '16/16 Round (Ext SR)', part: 'XA-35400', strainRelief: 'external', kcid: 'KC-CBL-16-16-E', image: null },
  { conductors: 24, awg: 16, od_min: 0.78, od_max: 0.92, type: '16/24 Round (Ext SR)', part: 'XA-35401', strainRelief: 'external', kcid: 'KC-CBL-16-24-E', image: null },
  { conductors: 36, awg: 16, od_min: 0.95, od_max: 1.15, type: '16/36 Round (Bulk)', part: 'XA-83097', strainRelief: 'external', kcid: 'KC-CBL-16-36-E', image: null },
];

export const INITIAL_CORD_GRIPS = [
  { id: 'CG-050', range_min: 0.35, range_max: 0.50, thread: '1/2" NPT', kcid: 'KC-CG-050' },
  { id: 'CG-075', range_min: 0.55, range_max: 0.75, thread: '3/4" NPT', kcid: 'KC-CG-075' },
  { id: 'CG-100', range_min: 0.85, range_max: 1.00, thread: '1" NPT', kcid: 'KC-CG-100' },
];

export const INITIAL_ACCESSORIES = [
  { id: 'lbl-warn', name: 'Warning Label', category: 'label', kcid: 'KC-LBL-WARN', image: null },
  { id: 'qc-16', name: '16-Pin Quick Connect', category: 'connector', kcid: 'KC-QC-16', image: null },
  { id: 'qc-24', name: '24-Pin Quick Connect', category: 'connector', kcid: 'KC-QC-24', image: null },
  { id: 'alarm-ext', name: 'External Alarm Sounder', category: 'addon', kcid: 'KC-ALM-EXT', image: null },
];

export const INITIAL_FOOTER_CONFIG = {
    credits: "Created by Nicholas Severance",
    links: [
        { id: 1, label: "LinkedIn", url: "https://www.linkedin.com/in/nick-severance?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", icon: "linkedin" },
        { id: 2, label: "GitHub", url: "https://github.com/Seveys/crane-pendant", icon: "github" }
    ]
};