import { Category, WorkerProfile, CustomerProfile, JobPost, Booking, WalletTransaction, SupportTicket, AppOwnerPaymentConfig, CommissionRecord, OwnerPayoutRecord, WorkerNotification } from '../types';

export const CATEGORIES: Category[] = [
  // Construction & Labor
  {
    id: 'mistry',
    name: 'Mistry (Mason / राजमिस्त्री)',
    nameHi: 'राजमिस्त्री / चिनाई',
    iconName: 'Building2',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Brick Work', 'Plastering', 'Wall Foundation', 'Boundary Wall Construction', 'Repair & Renovation'],
    subcategoriesHi: ['ईंट चिनाई', 'प्लास्टर', 'नींव का काम', 'बाउंड्री वॉल', 'मरम्मत व नवीनीकरण'],
    basePriceEstimate: '₹850 - ₹1200 / day',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'labor',
    name: 'Labor / Beldar (श्रमिक / बेलदार)',
    nameHi: 'श्रमिक / बेलदार',
    iconName: 'HardHat',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Cement Mixing', 'Material Loading/Unloading', 'Digging & Excavation', 'Debris Clearing', 'Helper Work'],
    subcategoriesHi: ['सीमेंट मिश्रण', 'सामान लोडिंग/अनलोडिंग', 'खुदाई कार्य', 'मलबा सफाई', 'हेल्पर कार्य'],
    basePriceEstimate: '₹550 - ₹750 / day',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'sariya_binding',
    name: 'Sariya Jaal & Bar Bending (सरिया जाल कारीगर)',
    nameHi: 'सरिया जाल / छत ढलाई, बीम, कॉलम व नींव जाल',
    iconName: 'Layers',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: [
      'Roof Slab Sariya Jaal (छत ढलाई सरिया जाल - 8mm/10mm/12mm)',
      'Beam & Column Cage Ring Tying (बीम व पिलर कॉलम रिंग बंधाई)',
      'Foundation Footing & Raft Mesh (नींव, फुटिंग व राफ्ट भारी जाल)',
      'Stirrups & Hook Bending (रिंग कटिंग व 135° भूकंपरोधी हुक बनवाई)',
      'Staircase & Cantilever Lintel Jaal (सीढ़ी व लिंटेल छज्जा जाल)',
      'Retaining Wall & Water Tank Jaal (रिटेनिंग वाल व वाटर टैंक)'
    ],
    subcategoriesHi: [
      'छत ढलाई सरिया जाल (सिंगल व डबल जाल बंधाई)',
      'बीम व पिलर/कॉलम रिंग बंधाई व 135° हुक',
      'नींव, फुटिंग व राफ्ट भारी सरिया जाल',
      'रिंग/स्टिरप्स कटिंग व 135 डिग्री बेंडिंग',
      'सीढ़ी (Staircase) व छज्जा सरिया जाल',
      'पानी टंकी, बेसमेंट व रिटेनिंग वाल'
    ],
    basePriceEstimate: '₹850 - ₹1,200 / day or ₹4 - ₹7 / sq.ft',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'shuttering',
    name: 'Shuttering (शटरिंग कारपेंटर)',
    nameHi: 'शटरिंग / फर्मे का काम',
    iconName: 'SquareStack',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Plywood Shuttering', 'Iron Plate Shuttering', 'Column Formwork', 'Slab Props & Scaffolding'],
    subcategoriesHi: ['प्लाईवुड शटरिंग', 'लोहा प्लेट शटरिंग', 'कॉलम फर्मा', 'छत बल्ली सपोर्ट'],
    basePriceEstimate: '₹800 - ₹1100 / day',
    imageUrl: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'slab_dhalai_machine',
    name: 'Slab Dhalai Machine & Mixer (छत ढलाई मशीन)',
    nameHi: 'छत ढलाई मशीन / कंक्रीट मिक्सर, लिफ्ट व वाइब्रेटर',
    iconName: 'Cog',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: [
      'Concrete Mixer with Lift Machine (लिफ्ट वाली छत ढलाई मशीन)',
      'Complete Slab Casting Labor Gang (ढलाई मशीन मय 12-15 लेबर टीम)',
      'Needle Vibrator for Beams & Roof (कंक्रीट नीडल वाइब्रेटर मशीन)',
      'Mini Concrete Mixer on Daily Rent (छोटी मिक्सर मशीन व ऑपरेटर)',
      'Aggregate, Sand & Cement Trolley Setup (हॉपर व ट्रॉली ढुलाई)'
    ],
    subcategoriesHi: [
      'लिफ्ट वाली कंक्रीट मिक्सर छत ढलाई मशीन',
      'छत ढलाई मशीन मय अनुभवी लेबर गैंग',
      'बीम व छत के लिए कंक्रीट नीडल वाइब्रेटर',
      'कंक्रीट मिक्सर मशीन व ऑपरेटर किराया',
      'रेत, रोड़ी व सीमेंट मिक्सिंग व ट्रॉली सेटअप'
    ],
    basePriceEstimate: '₹18 - ₹25 / bag or ₹5,000 - ₹12,000 / slab',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'welding',
    name: 'Welding & Fabrication (वेल्डिंग)',
    nameHi: 'वेल्डिंग और फैब्रिकेशन',
    iconName: 'Flame',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Main Gate & Grill Welding', 'Iron Shed Construction', 'Railing Installation', 'Arc & Gas Repair'],
    subcategoriesHi: ['मेन गेट व ग्रिल', 'टीन शेड निर्माण', 'सीढ़ी रेलिंग', 'आर्क व गैस वेल्डिंग'],
    basePriceEstimate: '₹450 / visit or ₹900 / day',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'plumber',
    name: 'Plumber (प्लंबर)',
    nameHi: 'प्लंबर / नलसाज',
    iconName: 'Wrench',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Pipe Leakage Fix', 'Tap & Shower Fitting', 'Water Tank Cleaning/Install', 'Toilet Seat & Concealed Fitting', 'Motor Pump Installation'],
    subcategoriesHi: ['पाइप लीकेज मरम्मत', 'नल व शॉवर फिटिंग', 'पानी टंकी सफाई/फिटिंग', 'टॉयलेट व कंसील्ड फिटिंग', 'मोटर पंप स्थापना'],
    basePriceEstimate: '₹250 - ₹500 / job',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'electrician',
    name: 'Electrician / Wiring (इलेक्ट्रीशियन)',
    nameHi: 'इलेक्ट्रीशियन / वायरिंग',
    iconName: 'Zap',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['House Concealed Wiring', 'MCB Tripping Fix', 'Switch Board Repair', 'Inverter Battery Setup', 'Earthing Installation'],
    subcategoriesHi: ['घर की कंसील्ड वायरिंग', 'MCB ट्रिपिंग समाधान', 'स्विच बोर्ड मरम्मत', 'इन्वर्टर सेटअप', 'अर्थिंग कार्य'],
    basePriceEstimate: '₹200 - ₹600 / job',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'false_ceiling',
    name: 'False Ceiling & Gypsum (फ़ाल्स सीलिंग व जिप्सम)',
    nameHi: 'फॉल्स सीलिंग (जिप्सम बोर्ड, पीवीसी व ग्रिड सीलिंग)',
    iconName: 'Sparkles',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: [
      'Gypsum Board False Ceiling (जिप्सम बोर्ड फॉल्स सीलिंग)',
      'PVC Panel False Ceiling (पीवीसी पैनल सीलिंग)',
      'POP 3D Designer Ceiling & Cornice (पीओपी 3D डिजाइन व कॉर्निस)',
      'Grid Metal & Office Acoustic Ceiling (ग्रिड मेटल व ऑफिस सीलिंग)',
      'Cove Lighting & Profile Light Grooves (कोव लाइटिंग व प्रोफाइल लाइट खांचा)',
      'Moisture Resistant False Ceiling for Kitchen/Bathroom (सीलनरोधी सीलिंग)',
      'Ceiling Repair, Patchwork & Cracks Fixing (सीलिंग मरम्मत व सुधार)'
    ],
    subcategoriesHi: [
      'जिप्सम बोर्ड फॉल्स सीलिंग (हॉल व बेडरूम)',
      'पीवीसी पैनल सीलिंग (वाटरप्रूफ व दीमकरोधी)',
      'पीओपी 3D डिजाइनर सीलिंग व मोल्डिंग',
      'ग्रिड मेटल व ऑफिस सीलिंग टाइल्स',
      'कोव लाइटिंग व प्रोफाइल लाइट खांचा कटिंग',
      'किचन व बाथरूम सीलनरोधी फॉल्स सीलिंग',
      'फॉल्स सीलिंग मरम्मत व क्रैक रिपेयर'
    ],
    basePriceEstimate: '₹45 - ₹115 / sq ft',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'tiles_granite_pathar',
    name: 'Tiles, Granite & Pathar (टाइल्स, ग्रेनाइट व पत्थर/मार्बल)',
    nameHi: 'टाइल्स, ग्रेनाइट, पत्थर व मार्बल कारीगर',
    iconName: 'Grid',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: [
      'Vitrified Floor Tiles Laying (2x2, 2x4, 4x2 विट्रिफाइड फ्लोर टाइल्स)',
      'Bathroom & Kitchen Wall Tiles with Epoxy Grouting (बाथरूम व किचन वाल टाइल्स)',
      'Granite Kitchen Countertop Slab with Full Bullnose Molding (किचन ग्रेनाइट स्लैब व मोल्डिंग)',
      'Marble Flooring, Kota Stone & Dholpur Pathar (मार्बल, कोटा स्टोन व फर्श पत्थर)',
      'Staircase Granite Steps with Anti-Skid Grooves (सीढ़ी ग्रेनाइट टप्पे व राइजर कटिंग)',
      'Italian Marble Polishing & Diamond Silicate (इटैलियन मार्बल घिसाई व डायमंड पॉलिश)',
      'Elevation Stone Cladding & Boundary Wall Pathar (एलिवेशन स्टोन क्लैडिंग व दीवार पत्थर)'
    ],
    subcategoriesHi: [
      'विट्रिफाइड फ्लोर टाइल्स फिटिंग (2x2, 2x4, 4x2)',
      'बाथरूम व किचन वाल टाइल्स व एपॉक्सी ग्राउटिंग',
      'किचन ग्रेनाइट स्लैब कटिंग व डबल मोल्डिंग धार',
      'मार्बल, कोटा स्टोन व धौलपुर पत्थर फर्श',
      'सीढ़ी ग्रेनाइट टप्पे व एंटी-स्किड ग्रूव्स',
      'मार्बल घिसाई व डायमंड सिलिकेट मिरर पॉलिश',
      'एलिवेशन स्टोन क्लैडिंग व बाउंड्री वाल पत्थर'
    ],
    basePriceEstimate: '₹22 - ₹55 / sq ft',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'pop',
    name: 'POP & False Ceiling (पीओपी / फॉल्स सीलिंग)',
    nameHi: 'पीओपी / फॉल्स सीलिंग',
    iconName: 'Sparkles',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['POP Cornice Design', 'Gypsum False Ceiling', 'Grid Ceiling Installation', 'POP Wall Punning'],
    subcategoriesHi: ['पीओपी डिजाइनिंग', 'जिप्सम फॉल्स सीलिंग', 'ग्रिड सीलिंग', 'पीओपी वॉल पनिंग'],
    basePriceEstimate: '₹35 - ₹75 / sq ft',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'tiles_marble',
    name: 'Tiles / Marble Fitting (टाइल्स / मार्बल)',
    nameHi: 'टाइल्स / मार्बल कारीगर',
    iconName: 'Grid',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Floor Tile Laying', 'Bathroom Wall Tiles', 'Granite Kitchen Countertop', 'Marble Cutting & Polishing'],
    subcategoriesHi: ['फ्लोर टाइल्स फिटिंग', 'बाथरूम वॉल टाइल्स', 'ग्रेनाइट किचन स्लैब', 'मार्बल कटिंग व पॉलिशिंग'],
    basePriceEstimate: '₹18 - ₹45 / sq ft',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'painter',
    name: 'Painter / Putty (पेंटर / पुट्टी)',
    nameHi: 'पेंटर / पुट्टी कारीगर',
    iconName: 'Paintbrush',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Interior Plastic Paint', 'Exterior Weatherproof Paint', 'Birla White Putty', 'Texture & Stencil Design', 'Wood Polish & PU'],
    subcategoriesHi: ['आंतरिक प्लास्टिक पेंट', 'बाहरी वेदरप्रूफ पेंट', 'दीवार पुट्टी', 'टेक्सचर डिजाइन', 'लकड़ी पॉलिश'],
    basePriceEstimate: '₹12 - ₹30 / sq ft',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'borewell',
    name: 'Borewell Drilling (बोरवेल ड्रिलिंग)',
    nameHi: 'बोरवेल ड्रिलिंग व मोटर',
    iconName: 'Drill',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Deep Tubewell Drilling', 'Submersible Pump Lowering', 'Borewell Flushing', 'Handpump Boring'],
    subcategoriesHi: ['गहरा ट्यूबवेल बोरिंग', 'सबमर्सिबल पंप फिटिंग', 'बोरवेल फ्लशिंग', 'हैंडपंप बोरिंग'],
    basePriceEstimate: '₹120 - ₹250 / ft',
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'carpenter',
    name: 'Carpenter (बढ़ई / कारपेंटर)',
    nameHi: 'बढ़ई / लकड़ी कारीगर',
    iconName: 'Hammer',
    group: 'construction',
    groupName: 'Construction & Labor',
    groupNameHi: 'निर्माण और श्रमिक',
    subcategories: ['Door & Window Lock Repair', 'Custom Wardrobe & Almirah', 'Modular Kitchen Fitting', 'Bed & Sofa Repair'],
    subcategoriesHi: ['दरवाजा व लॉक मरम्मत', 'अलमारी निर्माण', 'मॉड्यूलर किचन फिटिंग', 'बेड व सोफा रिपेयर'],
    basePriceEstimate: '₹350 - ₹800 / job',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // Home Appliance Repair
  {
    id: 'tv_repair',
    name: 'TV & LCD Repair (टीवी रिपेयर)',
    nameHi: 'एलईडी / टीवी रिपेयर',
    iconName: 'Tv',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['LED Backlight Repair', 'Display Screen Replacement', 'Motherboard / Power Board Fix', 'Smart TV Wall Mounting'],
    subcategoriesHi: ['बैकलाइट मरम्मत', 'स्क्रीन रिप्लेसमेंट', 'मदरबोर्ड रिपेयर', 'वॉल माउंटिंग फिटिंग'],
    basePriceEstimate: '₹299 inspection + parts',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'ac_repair',
    name: 'AC Service & Gas Charging (एसी सर्विस)',
    nameHi: 'एसी रिपेयर व गैस चार्जिंग',
    iconName: 'AirVent',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Jet Pump Deep Service', 'Gas Leakage & Refilling', 'Split AC Installation/Dismantling', 'PCB Board Repair', 'Compressor Replacement'],
    subcategoriesHi: ['जेट पंप डीप सर्विस', 'गैस लीकेज व रिफिलिंग', 'स्प्लिट एसी इंस्टॉलेशन', 'पीसीबी बोर्ड रिपेयर', 'कंप्रेसर बदलाव'],
    basePriceEstimate: '₹499 service / ₹2200 gas',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'ro_purifier',
    name: 'RO Water Purifier (आरओ रिपेयर)',
    nameHi: 'आरओ वाटर प्यूरीफायर',
    iconName: 'Droplets',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['RO Membrane & Filter Replacement', 'Booster Pump Fix', 'Low Water Flow Check', 'New RO Installation'],
    subcategoriesHi: ['मेम्ब्रेन व फिल्टर बदलाव', 'बूस्टर पंप रिपेयर', 'कम पानी बहाव ठीक करें', 'नया आरओ इंस्टॉलेशन'],
    basePriceEstimate: '₹249 inspection',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'fan_repair',
    name: 'Fan & Cooler Repair (पंखा / कूलर)',
    nameHi: 'पंखा व कूलर मरम्मत',
    iconName: 'Fan',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Ceiling Fan Capacitor & Winding', 'Exhaust Fan Installation', 'Desert Cooler Motor Repair', 'Cooler Water Pump Replacement'],
    subcategoriesHi: ['पंखे की वाइंडिंग व कैपेसिटर', 'एग्जॉस्ट पंखा फिटिंग', 'कूलर मोटर रिपेयर', 'कूलर वाटर पंप'],
    basePriceEstimate: '₹150 - ₹350',
    imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'fridge_repair',
    name: 'Fridge / Refrigerator (फ्रिज रिपेयर)',
    nameHi: 'फ्रिज रिपेयर व गैस',
    iconName: 'Refrigerator',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Single & Double Door Gas Charging', 'Thermostat & Defrost Timer', 'Compressor Not Starting', 'Door Gasket Rubber Change'],
    subcategoriesHi: ['फ्रिज गैस चार्जिंग', 'थर्मोस्टेट रिपेयर', 'कंप्रेसर चालू न होना', 'डोर रबर गैस्केट'],
    basePriceEstimate: '₹349 inspection',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'washing_machine',
    name: 'Washing Machine (वाशिंग मशीन)',
    nameHi: 'वाशिंग मशीन रिपेयर',
    iconName: 'WashingMachine',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Top Load / Front Load Service', 'Spin & Drain Motor Issue', 'Vibration & Noise Fix', 'Water Inlet Valve & PCB'],
    subcategoriesHi: ['टॉप लोड / फ्रंट लोड सर्विस', 'ड्रेन व स्पिन मोटर रिपेयर', 'कंपन व आवाज ठीक करें', 'पीसीबी बोर्ड मरम्मत'],
    basePriceEstimate: '₹299 inspection',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'geyser_repair',
    name: 'Geyser & Water Heater (गीजर रिपेयर)',
    nameHi: 'गीजर व वाटर हीटर',
    iconName: 'Thermometer',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Heating Element Replacement', 'Thermostat Safety Cutoff', 'Water Tank Descaling', 'New Geyser Wall Mounting'],
    subcategoriesHi: ['हीटिंग एलिमेंट बदलाव', 'थर्मोस्टेट कटऑफ चेक', 'गीजर स्केलिंग सफाई', 'नया गीजर इंस्टॉलेशन'],
    basePriceEstimate: '₹249 inspection',
    imageUrl: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'chimney_repair',
    name: 'Kitchen Chimney & Hob (चिमनी रिपेयर)',
    nameHi: 'किचन चिमनी व हॉब',
    iconName: 'Wind',
    group: 'appliance',
    groupName: 'Home Appliance Repair',
    groupNameHi: 'घरेलू उपकरण मरम्मत',
    subcategories: ['Deep Oil Degreasing & Cleaning', 'Blower Motor Repair', 'Touch Panel & LED Fix', 'Duct Pipe Installation'],
    subcategoriesHi: ['डीप ऑयल सफाई', 'ब्लोअर मोटर रिपेयर', 'टच पैनल मरम्मत', 'डक्ट पाइप फिटिंग'],
    basePriceEstimate: '₹399 - ₹799',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // Events & DTH
  {
    id: 'dth_installation',
    name: 'Satellite / DTH Installation (डीटीएच)',
    nameHi: 'डीटीएच व छतरी फिटिंग',
    iconName: 'Radio',
    group: 'events',
    groupName: 'Events & DTH',
    groupNameHi: 'इवेंट्स और डीटीएच',
    subcategories: ['Tata Play / Airtel / Dish TV Dish Alignment', 'Signal Frequency Tuning', 'LNB & Cable Wire Change', 'Relocation & Re-installation'],
    subcategoriesHi: ['डिश सिग्नल अलाइनमेंट', 'फ्रीक्वेंसी ट्यूनिंग', 'एलएनबी व केबल तार', 'स्थान परिवर्तन फिटिंग'],
    basePriceEstimate: '₹200 - ₹400',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'catering',
    name: 'Catering & Halwai (कैटरिंग, हलवाई व खान-पान)',
    nameHi: 'कैटरिंग, हलवाई व रसोइया (शादी, पार्टी व बुफे)',
    iconName: 'Utensils',
    group: 'events',
    groupName: 'Events & Catering',
    groupNameHi: 'इवेंट्स, कैटरिंग व डीटीएच',
    subcategories: [
      'Wedding & Function Halwai Team (शादी-ब्याह हलवाई व मुख्य कारीगर टीम)',
      'Full Buffet Catering - Veg & Jain (बुफे कैटरिंग व संपूर्ण भोजन व्यवस्था)',
      'Live Chaat, Golgappe, Dosa & Tandoori Counters (लाइव चाट, गोलगप्पे व तंदूर स्टॉल)',
      'Uniformed Waiters & Service Boys Staff (प्रोफेशनल वेटर व सर्विस बॉयज टीम)',
      'Mithai & Dessert Karigar (गुलाब जामुन, रसमलाई, जलेबी व देशी घी मिठाई)',
      'Birthday Party, Kitty & Anniversary Catering (घरेलू पार्टी, किटी व जन्मदिन कैटरिंग)',
      'Crockery, Chafing Dishes, Tandoor Bhatti & Gas Rental (बर्तन, क्रॉकरी व तंदूर भट्टी रेंट)'
    ],
    subcategoriesHi: [
      'शादी व कार्यक्रम हलवाई टीम',
      'बुफे कैटरिंग व शुद्ध शाकाहारी खाना',
      'लाइव चाट, डोसा व तंदूर स्टॉल',
      'वेटर व सर्विस बॉयज टीम',
      'हलवाई मिठाई कारीगर (गुलाब जामुन, जलेबी)',
      'बर्थडे व किटी पार्टी कैटरिंग',
      'बर्तन, क्रॉकरी व भट्टी रेंट'
    ],
    basePriceEstimate: '₹250 - ₹650 / plate or contract',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'event_decoration',
    name: 'Event Decoration & Tent (टेंट व सजावट)',
    nameHi: 'टेंट, मंडप व सजावट',
    iconName: 'PartyPopper',
    group: 'events',
    groupName: 'Events & DTH',
    groupNameHi: 'इवेंट्स और डीटीएच',
    subcategories: ['Birthday Balloon Decoration', 'Wedding Mandap & Stage Flower Setup', 'Waterproof Tent & Flooring', 'Haldi / Mehendi Theme Props'],
    subcategoriesHi: ['जन्मदिन बैलून डेकोरेशन', 'मंडप व स्टेज फ्लावर डेकोरेशन', 'वाटरप्रूफ टेंट', 'हल्दी/मेहंदी थीम डेकोर'],
    basePriceEstimate: '₹2,500 - ₹25,000 / event',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'dj_sound',
    name: 'DJ & Sound System (डीजे और साउंड)',
    nameHi: 'डीजे व साउंड सिस्टम',
    iconName: 'Music',
    group: 'events',
    groupName: 'Events & DTH',
    groupNameHi: 'इवेंट्स और डीटीएच',
    subcategories: ['Wedding DJ with Truss & Sharpy Lights', 'Birthday Party Compact Sound', 'Live Stage Microphone & Amplifiers', 'Dhol & Brass Band'],
    subcategoriesHi: ['शादी डीजे व शार्पी लाइट', 'पार्टी कॉम्पैक्ट साउंड', 'माइक व एम्पलीफायर', 'ढोल व ब्रास बैंड'],
    basePriceEstimate: '₹4,500 - ₹18,000 / event',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'photographer',
    name: 'Photographer / Videographer (फोटोग्राफर)',
    nameHi: 'फोटोग्राफर व ड्रोन',
    iconName: 'Camera',
    group: 'events',
    groupName: 'Events & DTH',
    groupNameHi: 'इवेंट्स और डीटीएच',
    subcategories: ['Candid Wedding Shoot', 'Pre-Wedding Cinematic Video', 'Drone Aerial Video Shoot', 'Traditional Photography & Album'],
    subcategoriesHi: ['वेडिंग कैंडिड फोटो', 'प्री-वेडिंग सिनेमाई वीडियो', 'ड्रोन वीडियोग्राफी', 'फोटो एल्बम प्रिंट'],
    basePriceEstimate: '₹5,000 - ₹25,000 / day',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'event_vehicles',
    name: 'Event Vehicles & Goods Carrier (गाड़ी / ट्रांसपोर्ट)',
    nameHi: 'सामान ढुलाई व इवेंट गाड़ियां',
    iconName: 'Truck',
    group: 'events',
    groupName: 'Events & DTH',
    groupNameHi: 'इवेंट्स और डीटीएच',
    subcategories: ['Tata Ace (Chota Hathi) Goods Carrier', 'Mahindra Bolero Pickup', 'Vintage Car / Groom Ghodi', 'Passenger Tempo Traveler (17 Seater)'],
    subcategoriesHi: ['छोटा हाथी माल ढुलाई', 'महिंद्रा बोलेरो पिकअप', 'दूल्हा विंटेज कार / घोड़ी', 'टेंपो ट्रेवलर बस'],
    basePriceEstimate: '₹500 base + ₹25 / km',
    imageUrl: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80'
    ]
  },

  // Home & Household Daily Services (घरेलू कार्य व दैनिक सेवाएं)
  {
    id: 'home_cleaning',
    name: 'Home Deep Cleaning & Housemaid (घर की सफाई व मेड)',
    nameHi: 'घर की गहरी सफाई व कामवाली बाई',
    iconName: 'Sparkles',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Full House Deep Cleaning (1/2/3 BHK)', 'Kitchen Grease & Chimney Scrubbing', 'Bathroom Acid Wash & Sanitization', 'Daily Maid Service (Jhadu-Pocha-Bartan)', 'Balcony & Window Glass Wash'],
    subcategoriesHi: ['पूरे घर की डीप क्लीनिंग', 'किचन तेल-मैल व टाइल स्क्रब', 'बाथरूम एसिड वॉश व सैनिटाइज', 'दैनिक मेड (झाड़ू-पोछा-बर्तन)', 'बालकनी व खिड़की कांच सफाई'],
    basePriceEstimate: '₹499 - ₹2,499',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'sofa_carpet_cleaning',
    name: 'Sofa, Carpet & Mattress Cleaning (सोफा व कालीन)',
    nameHi: 'सोफा, कालीन व गद्दा ड्राई क्लीनिंग',
    iconName: 'Armchair',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Fabric Sofa Shampoo Foam Wash', 'Leather Sofa Conditioning & Polish', 'Carpet Deep Extraction Wash', 'Bed Mattress Anti-Dustmite Steam Clean'],
    subcategoriesHi: ['सोफा शैम्पू फोम वॉश', 'लेदर सोफा पॉलिश व कंडीशनिंग', 'कालीन डीप मशीन वॉश', 'गद्दा स्टीम सैनिटाइजेशन'],
    basePriceEstimate: '₹399 - ₹1,299',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'pest_control',
    name: 'Pest Control & Termite (पेस्ट कंट्रोल व दीमक)',
    nameHi: 'पेस्ट कंट्रोल व दीमक रोधी उपचार',
    iconName: 'ShieldAlert',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Odorless Cockroach Herbal Gel', 'Anti-Termite Wood Drilling Treatment', 'Bed Bug Heat & Spray Treatment', 'Mosquito Fogging & Rodent Control'],
    subcategoriesHi: ['हर्बल कॉकरोच जेल ट्रीटमेंट', 'दीमक रोधी ड्रिल व इंजेक्शन', 'खटमल निवारण स्प्रे', 'मच्छर फॉगिंग व चूहा नियंत्रण'],
    basePriceEstimate: '₹599 - ₹2,800',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'water_tank_cleaning',
    name: 'Water Tank Cleaning (पानी टंकी मशीनी सफाई)',
    nameHi: 'पानी टंकी 6-स्टेज मशीनी सफाई',
    iconName: 'Droplet',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Overhead Sintex Tank High Pressure Wash', 'Underground RCC Sump Sludge Vacuum', 'Anti-Bacterial UV & Chlorine Sanitization'],
    subcategoriesHi: ['छत सिंटेक्स टंकी प्रेशर वॉश', 'अंडरग्राउंड हौद कीचड़ वैक्यूम', 'एंटी-बैक्टीरियल यूवी सैनिटाइज'],
    basePriceEstimate: '₹399 - ₹899 / tank',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'mali_gardening',
    name: 'Gardening & Plant Care / Mali (माली / बागवानी)',
    nameHi: 'माली / बागवानी, गमले व पौधे',
    iconName: 'Flower2',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Balcony Garden Setup & Trimming', 'Pot Soil Change & Organic Vermicompost', 'Lawn Mowing & Weed Removal', 'Plant Pest Spray & Pruning'],
    subcategoriesHi: ['बालकनी गमले सजावट व छंटाई', 'गमले की मिट्टी व जैविक खाद', 'घास कटाई व खरपतवार सफाई', 'पौधों में कीटनाशक स्प्रे'],
    basePriceEstimate: '₹350 - ₹650 / visit',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'packers_movers',
    name: 'House Shifting & Packers-Movers (घर शिफ्टिंग)',
    nameHi: 'घर शिफ्टिंग व सामान लोडिंग',
    iconName: 'Package',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Local 1/2/3 BHK House Relocation', 'Furniture Bubble & Stretch Film Packing', 'Bed & Wardrobe Dismantling & Reassembly', 'Fragile Crockery Box Packing'],
    subcategoriesHi: ['लोकल 1/2/3 बीएचके मकान शिफ्टिंग', 'फर्नीचर बबल रैप पैकिंग', 'बेड व अलमारी खोलना व जोड़ना', 'नाजुक बर्तन सुरक्षित पैकिंग'],
    basePriceEstimate: '₹2,500 - ₹9,500',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'gas_stove_repair',
    name: 'Gas Stove & Kitchen Mixer Repair (गैस चूल्हा रिपेयर)',
    nameHi: 'गैस चूल्हा, ओवन व मिक्सी मरम्मत',
    iconName: 'Flame',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Gas Burner Cleaning & Flame Low Fix', 'Glass Top Stove Leakage Inspection', 'Microwave Oven Heating Repair', 'Mixer Grinder Coupler & Blade Fix'],
    subcategoriesHi: ['गैस बर्नर सफाई व कम आंच ठीक करें', 'गैस पाइप लीकेज जांच', 'माइक्रोवेव हीटिंग रिपेयर', 'मिक्सी कपलर व मोटर रिपेयर'],
    basePriceEstimate: '₹199 - ₹450',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'locksmith',
    name: 'Locksmith & Digital Smart Lock (ताला-चाबी कारीगर)',
    nameHi: 'ताला-चाबी व डिजिटल लॉक फिटिंग',
    iconName: 'Key',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Jammed Door Emergency Opening', 'Duplicate Computerized Key Making', 'Godrej Main Door Rim Lock Fitting', 'Fingerprint Digital Door Lock Install'],
    subcategoriesHi: ['जाम दरवाजा खोलना', 'कंप्यूटराइज्ड डुप्लीकेट चाबी', 'गोदरेज रिम लॉक फिटिंग', 'फिंगरप्रिंट स्मार्ट डिजिटल लॉक'],
    basePriceEstimate: '₹250 - ₹650',
    imageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'cctv_security',
    name: 'CCTV Camera & Home Security (सीसीटीवी कैमरा)',
    nameHi: 'सीसीटीवी कैमरा व होम सिक्योरिटी',
    iconName: 'Video',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['WiFi 360° Smart Wireless Camera Setup', '4/8 Channel HD DVR Cable Wiring', 'Video Door Phone (VDP) Fitting', 'Mobile Live Streaming Configuration'],
    subcategoriesHi: ['स्मार्ट वाई-फाई कैमरा इंस्टॉलेशन', '4/8 चैनल डीवीआर व वायरिंग', 'वीडियो डोर फोन (VDP)', 'मोबाइल पर लाइव फुटेज सेटअप'],
    basePriceEstimate: '₹499 inspection / ₹1,500 setup',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'wall_drilling_handyman',
    name: 'Wall Drilling & Curtain Rod Handyman (ड्रिलिंग व हैंगिंग)',
    nameHi: 'दीवार ड्रिलिंग, पर्दा रॉड व हैंगिंग',
    iconName: 'Drill',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Curtain Rod & Blind Installation', 'Heavy Mirror & Wall Art Hanging', 'Bathroom Steel Shelf & Towel Rod Drill', 'Wall Mount Shelves & TV Mount'],
    subcategoriesHi: ['पर्दा रॉड व ब्लाइंड्स फिटिंग', 'दीवार शीशा व फोटो फ्रेम लगाना', 'बाथरूम शेल्फ व टॉवल रॉड ड्रिल', 'वॉल रैक व टीवी स्टैंड फिटिंग'],
    basePriceEstimate: '₹149 - ₹399',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'solar_panel_cleaning',
    name: 'Solar Panel Cleaning & Service (सोलर पैनल सफाई)',
    nameHi: 'सोलर पैनल सफाई व रखरखाव',
    iconName: 'Sun',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Rooftop Solar Glass Dust Soft Wash', 'Inverter Generation Check & MC4 Wiring', 'Solar Battery Distilled Water Refill'],
    subcategoriesHi: ['रूफटॉप सोलर पैनल सॉफ्ट वॉश', 'इन्वर्टर व जनरेशन जांच', 'सोलर बैटरी डिस्टिल्ड वाटर टॉपअप'],
    basePriceEstimate: '₹299 - ₹699',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'elderly_care_patient',
    name: 'Elderly Care & Patient Attendant (मरीज व बुजुर्ग देखभाल)',
    nameHi: 'मरीज व बुजुर्ग देखभाल सेवा',
    iconName: 'HeartHandshake',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: ['Daily Patient Nursing Attendant', 'Senior Citizen Mobility & Walk Assistance', 'BP, Sugar & Medicine Timetable Tracking', 'Post-Hospitalization Home Care'],
    subcategoriesHi: ['मरीज देखभाल अटेंडेंट', 'बुजुर्ग सहायता व चलना-फिरना', 'बीपी, शुगर व दवा समय पर देना', 'अस्पताल के बाद घरेलू देखभाल'],
    basePriceEstimate: '₹600 - ₹1,200 / day',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'septic_tank_cleaning',
    name: 'Septic & Latrine Tank Cleaning (लैट्रिन / सेप्टिक टैंक सफाई)',
    nameHi: 'सेप्टिक टैंक व लैट्रिन टैंक सफाई (वैक्यूम मशीन टैंकर)',
    iconName: 'Truck',
    group: 'home_services',
    groupName: 'Home & Household',
    groupNameHi: 'घरेलू कार्य व सफाई',
    subcategories: [
      'Vacuum Suction Tanker Pump (वैक्यूम टैंकर द्वारा टैंक खाली करना)',
      'Deep Sludge & Mud Extraction (अंदर जमी गाद, ठोस मैला व कीचड़ सफाई)',
      'Latrine Pipeline De-choking & Jetting (टॉयलेट व लैट्रिन पाइपलाइन जाम खोलना)',
      'Septic Tank Chemical & Odor Treatment (बदबू रोकथाम व केमिकल छिड़काव)',
      'Soak Pit & Chamber Cleaning (सोक पिट, मैनहोल व चेंबर सफाई)'
    ],
    subcategoriesHi: [
      'वैक्यूम टैंकर मशीन द्वारा टैंक खाली करना',
      'अंदर जमी गाद, ठोस मैला व कीचड़ सफाई',
      'लैट्रिन चेंबर व ड्रेन पाइपलाइन जाम खोलना',
      'बदबू निवारण केमिकल व फिनाइल ट्रीटमेंट',
      'सोक पिट, मैनहोल व चेंबर मरम्मत कार्य'
    ],
    basePriceEstimate: '₹1,200 - ₹3,500 / tank',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
    ]
  },
];

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: 'w_dhalai_1',
    name: 'Brijesh Yadav (Slab Dhalai Machine & Mixer)',
    nameHi: 'बृजेश यादव (छत ढलाई मशीन व लिफ्ट ऑपरेटर)',
    age: 41,
    phone: '+91 98114 77881',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    rating: 4.96,
    reviewsCount: 215,
    experienceYears: 15,
    category: 'slab_dhalai_machine',
    subSkills: [
      'लिफ्ट वाली कंक्रीट मिक्सर मशीन (Lift Mixer)',
      '15-मेंबर ढलाई लेबर गैंग (Casting Gang)',
      'नीडल वाइब्रेटर ऑपरेटर (Needle Vibrators)',
      'छत व बीम कंक्रीट कंपैक्शन'
    ],
    city: 'Delhi NCR',
    locality: 'Sector 62, Noida',
    distanceKm: 1.8,
    hourlyRate: 220,
    dailyRate: 1400,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 310,
    completedJobsCount: 340,
    workerIdCode: 'SI-WRK-2026-77881',
    aadhaarNumber: 'XXXX-XXXX-7193',
    registeredDate: '18 Jan 2024',
    bloodGroup: 'A+',
    emergencyContact: '+91 98114 00992',
    portfolio: [
      {
        id: 'pd1',
        title: '2200 sq.ft 2nd Floor Roof Slab Casting with Lift Machine',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        description: 'Non-stop 1:2:4 ratio concrete mixing with double tower lift and 2 needle vibrators. Completed in 7 hours without joint lines.',
        tag: 'छत ढलाई',
      },
      {
        id: 'pd2',
        title: 'Heavy Column & Raft Footing Casting',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
        description: 'M25 design mix foundation casting using mobile diesel mixer and hopper trolley.',
        tag: 'कंक्रीट मिक्सर',
      }
    ],
    currentLocation: { lat: 28.6270, lng: 77.3680 }
  },
  {
    id: 'w_septic_1',
    name: 'Subhash Rawat (Septic & Latrine Vacuum Cleaners)',
    nameHi: 'सुभाष रावत (सेप्टिक व लैट्रिन टैंक वैक्यूम सफाई)',
    age: 43,
    phone: '+91 98710 33441',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.91,
    reviewsCount: 194,
    experienceYears: 16,
    category: 'septic_tank_cleaning',
    subSkills: [
      'वैक्यूम टैंकर सक्शन मशीन (Vacuum Tanker)',
      'लैट्रिन पाइपलाइन हाई-प्रेशर जेटिंग',
      'गाद व कीचड़ डीप सफाई (Sludge Extraction)',
      'केमिकल बदबू निवारण स्प्रे (Odor Treatment)'
    ],
    city: 'Delhi NCR',
    locality: 'Indirapuram, Ghaziabad',
    distanceKm: 2.1,
    hourlyRate: 200,
    dailyRate: 1200,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 280,
    completedJobsCount: 480,
    workerIdCode: 'SI-WRK-2026-33441',
    aadhaarNumber: 'XXXX-XXXX-8245',
    registeredDate: '10 Jan 2024',
    bloodGroup: 'B+',
    emergencyContact: '+91 98710 00881',
    portfolio: [
      {
        id: 'pse1',
        title: '5000L Underground Septic Tank Vacuum Extraction',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        description: 'Heavy duty German suction pump emptied full 5000-liter septic tank with 120ft pipe in 40 minutes.',
        tag: 'सेप्टिक टैंक सफाई',
      },
      {
        id: 'pse2',
        title: 'Apartment Main Latrine Drainage Line De-choking',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'High pressure water jetting cleared jammed 6-inch underground sewer chamber line without breaking tiles.',
        tag: 'पाइपलाइन जेटिंग',
      }
    ],
    currentLocation: { lat: 28.6410, lng: 77.3720 }
  },
  {
    id: 'w_sariya_1',
    name: 'Mukesh Kumar (Sariya Jaal Contractor)',
    nameHi: 'मुकेश कुमार (सरिया जाल व बार बेंडिंग मिस्त्री)',
    age: 38,
    phone: '+91 98711 55432',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    rating: 4.94,
    reviewsCount: 172,
    experienceYears: 14,
    category: 'sariya_binding',
    subSkills: [
      'छत ढलाई सरिया जाल (Roof Slab)',
      'बीम व कॉलम रिंग बंधाई (Column Cages)',
      'नींव व राफ्ट भारी जाल (Raft Mesh)',
      'सीढ़ी/Staircase सरिया जाल',
      '135° हुक रिंग बनवाई (Stirrups)'
    ],
    city: 'Delhi NCR',
    locality: 'Sector 44, Noida',
    distanceKm: 1.5,
    hourlyRate: 160,
    dailyRate: 950,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 240,
    completedJobsCount: 260,
    workerIdCode: 'SI-WRK-2026-55432',
    aadhaarNumber: 'XXXX-XXXX-9921',
    registeredDate: '12 Jan 2024',
    bloodGroup: 'O+',
    emergencyContact: '+91 98711 00234',
    portfolio: [
      {
        id: 'ps1',
        title: '2400 sq.ft Double Mesh Roof Slab Sariya Jaal',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
        description: 'Complete 10mm & 8mm Fe550D TMT bar double jaal binding with beam cages and cover blocks ready for RMC pouring.',
        tag: 'छत सरिया जाल',
      },
      {
        id: 'ps2',
        title: '16 RCC Column & Plinth Beam Ring Cages',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
        description: '16mm main bars tied with 8mm stirrups at 6-inch centers with 135-degree seismic hooks.',
        tag: 'कॉलम व बीम जाल',
      },
      {
        id: 'ps3',
        title: 'Heavy Raft Foundation & Footing Mesh',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        description: 'Foundation footing mat jaal tied with binding wire for a 4-storey commercial building.',
        tag: 'नींव सरिया जाल',
      }
    ],
    currentLocation: { lat: 28.5620, lng: 77.3380 }
  },
  {
    id: 'w_sariya_2',
    name: 'Ramashray Bind (Sariya & Shuttering)',
    nameHi: 'रामाश्रय बिंद (सरिया व शटरिंग कारीगर)',
    age: 35,
    phone: '+91 98118 66778',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.88,
    reviewsCount: 98,
    experienceYears: 10,
    category: 'sariya_binding',
    subSkills: [
      'छत सरिया जाल बंधाई',
      'बीम व कॉलम फर्मा सेटिंग',
      'सीढ़ी व छज्जा सरिया'
    ],
    city: 'Delhi NCR',
    locality: 'Indirapuram, Ghaziabad',
    distanceKm: 2.4,
    hourlyRate: 140,
    dailyRate: 850,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 110,
    completedJobsCount: 145,
    workerIdCode: 'SI-WRK-2026-66778',
    aadhaarNumber: 'XXXX-XXXX-4419',
    registeredDate: '05 Feb 2024',
    bloodGroup: 'B+',
    emergencyContact: '+91 98118 00334',
    portfolio: [
      {
        id: 'ps4',
        title: 'Duplex Villa Staircase & Roof Jaal',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
        description: 'Folded plate waist slab RCC reinforcement tying with landing beam.',
        tag: 'सीढ़ी सरिया',
      }
    ],
    currentLocation: { lat: 28.6350, lng: 77.3710 }
  },
  {
    id: 'w_false_ceiling_1',
    name: 'Shamsher Ali (False Ceiling & Gypsum Master)',
    nameHi: 'शमशेर अली (फॉल्स सीलिंग व जिप्सम मास्टर)',
    age: 36,
    phone: '+91 98732 11099',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.96,
    reviewsCount: 224,
    experienceYears: 13,
    category: 'false_ceiling',
    subSkills: [
      'Gypsum Board False Ceiling (जिप्सम सीलिंग)',
      'PVC Waterproof Panel Ceiling',
      'Cove Light Grooves & Profile Channel',
      'POP 3D Designer Hall Ceiling'
    ],
    city: 'Delhi NCR',
    locality: 'Sector 44, Noida',
    distanceKm: 1.2,
    hourlyRate: 180,
    dailyRate: 1100,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 260,
    completedJobsCount: 310,
    workerIdCode: 'SI-WRK-2026-11099',
    aadhaarNumber: 'XXXX-XXXX-9182',
    registeredDate: '08 Feb 2024',
    bloodGroup: 'O+',
    emergencyContact: '+91 98732 00119',
    portfolio: [
      {
        id: 'pfc1',
        title: '1400 sq.ft Living Hall Gypsum Ceiling with Warm White Cove Lighting',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
        description: 'Saint-Gobain Gyproc board framing with perimeter cove lighting and magnetic track light slots.',
        tag: 'जिप्सम सीलिंग',
      },
      {
        id: 'pfc2',
        title: 'Master Bedroom Designer PVC Wooden Louver Ceiling',
        imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
        description: 'Termite-proof PVC fluted panel ceiling with concealed spotlights for luxury master bedroom.',
        tag: 'पीवीसी सीलिंग',
      }
    ],
    currentLocation: { lat: 28.5640, lng: 77.3400 }
  },
  {
    id: 'w_tiles_granite_1',
    name: 'Kailash Mistry (Tiles, Granite & Marble Expert)',
    nameHi: 'कैलाश मिस्त्री (टाइल्स, ग्रेनाइट व पत्थर/मार्बल एक्सपर्ट)',
    age: 39,
    phone: '+91 98104 77881',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    rating: 4.97,
    reviewsCount: 295,
    experienceYears: 17,
    category: 'tiles_granite_pathar',
    subSkills: [
      '2x4 विट्रिफाइड फ्लोर टाइल्स लेज़र लेवल',
      'किचन ब्लैक ग्रेनाइट स्लैब डबल मोल्डिंग',
      'सीढ़ी ग्रेनाइट टप्पे व एंटी-स्किड ग्रूव्स',
      'इटैलियन मार्बल घिसाई व डायमंड पॉलिश'
    ],
    city: 'Delhi NCR',
    locality: 'Indirapuram, Ghaziabad',
    distanceKm: 1.8,
    hourlyRate: 190,
    dailyRate: 1200,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 320,
    completedJobsCount: 420,
    workerIdCode: 'SI-WRK-2026-77881',
    aadhaarNumber: 'XXXX-XXXX-5524',
    registeredDate: '01 Jan 2024',
    bloodGroup: 'A+',
    emergencyContact: '+91 98104 00223',
    portfolio: [
      {
        id: 'ptg1',
        title: '3 BHK Vitrified Tile Laying with Laser Alignment & Epoxy Grout',
        imageUrl: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
        description: '2x4 feet Kajaria vitrified glazed tiles laid with paper joint, level clips and waterproof epoxy grout.',
        tag: 'फ्लोर टाइल्स',
      },
      {
        id: 'ptg2',
        title: 'L-Shaped Black Galaxy Granite Kitchen Countertop with Full Bullnose',
        imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
        description: 'Single-piece 18mm granite slab fitted with undermount quartz sink cutout and smooth high-gloss edge polish.',
        tag: 'किचन ग्रेनाइट स्लैब',
      },
      {
        id: 'ptg3',
        title: 'Duplex Villa Granite Staircase with Riser & 3-Line Anti-Skid Grooves',
        imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
        description: '24 marble steps fitted with chamfered granite treads and matching white composite stone risers.',
        tag: 'सीढ़ी पत्थर',
      }
    ],
    currentLocation: { lat: 28.6380, lng: 77.3710 }
  },
  {
    id: 'w1',
    name: 'Rameshwar "Ramesh" Kumar',
    nameHi: 'रामेश्वर "रमेश" कुमार',
    age: 34,
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    rating: 4.88,
    reviewsCount: 142,
    experienceYears: 9,
    category: 'mistry',
    subSkills: ['Brick Work', 'Plastering', 'Boundary Wall Construction', 'Repair & Renovation'],
    city: 'Delhi NCR',
    locality: 'Sector 62, Noida',
    distanceKm: 1.4,
    hourlyRate: 150,
    dailyRate: 950,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 120,
    completedJobsCount: 186,
    workerIdCode: 'SI-WRK-2026-84920',
    aadhaarNumber: 'XXXX-XXXX-4819',
    registeredDate: '15 Jan 2024',
    bloodGroup: 'B+',
    emergencyContact: '+91 98765 00112',
    portfolio: [
      {
        id: 'p1',
        title: '3-Floor Villa Brickwork & Plaster',
        imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
        description: 'Complete red brick laying and smooth fine putty-ready plastering done in 14 days.',
        tag: 'Plastering',
      },
      {
        id: 'p2',
        title: 'Boundary Wall & Pillar Foundation',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
        description: '9-inch reinforced boundary wall with RCC column tie-in.',
        tag: 'Brickwork',
      }
    ],
    currentLocation: { lat: 28.6280, lng: 77.3649 }
  },
  {
    id: 'w2',
    name: 'Sunil Verma',
    nameHi: 'सुनील वर्मा',
    age: 31,
    phone: '+91 98112 34567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    rating: 4.95,
    reviewsCount: 208,
    experienceYears: 7,
    category: 'electrician',
    subSkills: ['House Concealed Wiring', 'MCB Tripping Fix', 'Switch Board Repair', 'Inverter Battery Setup'],
    city: 'Delhi NCR',
    locality: 'Indirapuram, Ghaziabad',
    distanceKm: 2.1,
    hourlyRate: 180,
    dailyRate: 1100,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 85,
    completedJobsCount: 312,
    workerIdCode: 'SI-WRK-2026-77312',
    aadhaarNumber: 'XXXX-XXXX-3891',
    portfolio: [
      {
        id: 'p3',
        title: 'Complete 3BHK Concealed Modular Wiring',
        imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        description: 'Havells fire-retardant wiring, Schneider MCB distribution box and Legrand modular switches.',
        tag: 'Wiring',
      }
    ],
    currentLocation: { lat: 28.6360, lng: 77.3750 }
  },
  {
    id: 'w3',
    name: 'Mohammed Arif Plumber',
    nameHi: 'मोहम्मद आरिफ',
    age: 28,
    phone: '+91 97188 99001',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    rating: 4.79,
    reviewsCount: 95,
    experienceYears: 6,
    category: 'plumber',
    subSkills: ['Pipe Leakage Fix', 'Tap & Shower Fitting', 'Toilet Seat & Concealed Fitting', 'Motor Pump Installation'],
    city: 'Delhi NCR',
    locality: 'Sector 50, Noida',
    distanceKm: 3.5,
    hourlyRate: 140,
    dailyRate: 900,
    isAadhaarVerified: true,
    isPanVerified: false,
    isOnline: true,
    walletBalance: 45,
    completedJobsCount: 140,
    workerIdCode: 'SI-WRK-2026-90140',
    aadhaarNumber: 'XXXX-XXXX-6124',
    portfolio: [
      {
        id: 'p4',
        title: 'Modern Wall-Hung Commode & Diverter',
        imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        description: 'Kohler thermostatic shower mixer and concealed cistern tank installation.',
        tag: 'Plumbing',
      }
    ],
    currentLocation: { lat: 28.5750, lng: 77.3680 }
  },
  {
    id: 'w4',
    name: 'Vikram Singh Painter',
    nameHi: 'विक्रम सिंह पेंटर',
    age: 35,
    phone: '+91 99554 11223',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    rating: 4.82,
    reviewsCount: 114,
    experienceYears: 8,
    category: 'painter',
    subSkills: ['Interior Plastic Paint', 'Birla White Putty', 'Texture & Stencil Design', 'Wood Polish & PU'],
    city: 'Delhi NCR',
    locality: 'Vasundhara, Ghaziabad',
    distanceKm: 2.8,
    hourlyRate: 120,
    dailyRate: 850,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 90,
    completedJobsCount: 165,
    workerIdCode: 'SI-WRK-2026-11652',
    aadhaarNumber: 'XXXX-XXXX-7729',
    portfolio: [
      {
        id: 'p5',
        title: 'Living Room Royale Play Texture Finish',
        imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80',
        description: 'Asian Paints Royale Luxury Emulsion with Metallic Safari Dune finish on feature wall.',
        tag: 'Texture',
      }
    ],
    currentLocation: { lat: 28.6600, lng: 77.3700 }
  },
  {
    id: 'w5',
    name: 'Deepak AC Care & Gas Service',
    nameHi: 'दीपक एसी एक्सपर्ट',
    phone: '+91 93120 44556',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    rating: 4.92,
    reviewsCount: 178,
    experienceYears: 10,
    category: 'ac_repair',
    subSkills: ['Jet Pump Deep Service', 'Gas Leakage & Refilling', 'Split AC Installation/Dismantling', 'PCB Board Repair'],
    city: 'Delhi NCR',
    locality: 'Vaishali Sector 4',
    distanceKm: 1.8,
    hourlyRate: 200,
    dailyRate: 1400,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 210,
    completedJobsCount: 420,
    portfolio: [
      {
        id: 'p6',
        title: 'Split AC Outdoor Coil Copper Welding & Gas Refill',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
        description: 'Nitrogen pressure testing, flare nut brazing, and 100% pure R32 refrigerant top-up.',
        tag: 'AC Service',
      }
    ],
    currentLocation: { lat: 28.6450, lng: 77.3400 }
  },
  {
    id: 'w6',
    name: 'Shree Radhe Event & Balloon Decor',
    nameHi: 'श्री राधे इवेंट व डेकोर',
    phone: '+91 98990 77889',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    rating: 4.90,
    reviewsCount: 88,
    experienceYears: 5,
    category: 'event_decoration',
    subSkills: ['Birthday Balloon Decoration', 'Wedding Mandap & Stage Flower Setup', 'Haldi / Mehendi Theme Props'],
    city: 'Delhi NCR',
    locality: 'Sector 18, Noida',
    distanceKm: 4.2,
    hourlyRate: 300,
    dailyRate: 3500,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 150,
    completedJobsCount: 105,
    portfolio: [
      {
        id: 'p7',
        title: 'Pastel Floral Arch for 1st Birthday',
        imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
        description: 'Custom neon light name signage, organic balloon garland and marquee numbers.',
        tag: 'Decoration',
      }
    ],
    currentLocation: { lat: 28.5700, lng: 77.3200 }
  },
  {
    id: 'w7',
    name: 'Sunita Devi (Deep Cleaning & Maid)',
    nameHi: 'सुनीता देवी (सफाई व मेड)',
    age: 32,
    phone: '+91 98109 88776',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    rating: 4.96,
    reviewsCount: 165,
    experienceYears: 6,
    category: 'home_cleaning',
    subSkills: ['Full House Deep Cleaning', 'Kitchen Grease & Chimney Scrubbing', 'Bathroom Acid Wash & Sanitization', 'Daily Maid Service'],
    city: 'Delhi NCR',
    locality: 'Sector 76, Noida',
    distanceKm: 2.2,
    hourlyRate: 150,
    dailyRate: 750,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 160,
    completedJobsCount: 290,
    workerIdCode: 'SI-WRK-2026-66290',
    aadhaarNumber: 'XXXX-XXXX-9142',
    registeredDate: '10 Feb 2024',
    bloodGroup: 'O+',
    emergencyContact: '+91 98109 00111',
    portfolio: [
      {
        id: 'p8',
        title: '3BHK Post-Tenant Deep Sanitization & Degreasing',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
        description: 'Machine floor scrub, kitchen oil stain cleaning, and mirror polish done in 5 hours.',
        tag: 'Deep Cleaning',
      }
    ],
    currentLocation: { lat: 28.5800, lng: 77.3800 }
  },
  {
    id: 'w8',
    name: 'Rajendra Kumar Mali (Gardener)',
    nameHi: 'राजेन्द्र कुमार माली',
    age: 42,
    phone: '+91 98733 44551',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    rating: 4.89,
    reviewsCount: 112,
    experienceYears: 14,
    category: 'mali_gardening',
    subSkills: ['Balcony Garden Setup & Trimming', 'Pot Soil Change & Organic Vermicompost', 'Lawn Mowing & Weed Removal'],
    city: 'Delhi NCR',
    locality: 'Sector 50, Noida',
    distanceKm: 1.9,
    hourlyRate: 120,
    dailyRate: 650,
    isAadhaarVerified: true,
    isPanVerified: false,
    isOnline: true,
    walletBalance: 110,
    completedJobsCount: 175,
    workerIdCode: 'SI-WRK-2026-55175',
    aadhaarNumber: 'XXXX-XXXX-4428',
    registeredDate: '18 Mar 2024',
    bloodGroup: 'B+',
    emergencyContact: '+91 98733 00222',
    portfolio: [
      {
        id: 'p9',
        title: 'Villa Terrace Garden & Bonsai Care',
        imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
        description: 'Complete balcony setup with 40 flowering pots, vermicompost, and drip pipe.',
        tag: 'Gardening',
      }
    ],
    currentLocation: { lat: 28.5700, lng: 77.3600 }
  },
  {
    id: 'w9',
    name: 'Anil Pest Shield & Anti-Termite',
    nameHi: 'अनिल पेस्ट कंट्रोल',
    age: 36,
    phone: '+91 99112 88334',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    rating: 4.93,
    reviewsCount: 144,
    experienceYears: 8,
    category: 'pest_control',
    subSkills: ['Odorless Cockroach Herbal Gel', 'Anti-Termite Wood Drilling Treatment', 'Bed Bug Heat & Spray Treatment'],
    city: 'Delhi NCR',
    locality: 'Indirapuram, Ghaziabad',
    distanceKm: 2.7,
    hourlyRate: 200,
    dailyRate: 1500,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 190,
    completedJobsCount: 310,
    workerIdCode: 'SI-WRK-2026-99310',
    aadhaarNumber: 'XXXX-XXXX-8812',
    portfolio: [
      {
        id: 'p10',
        title: 'Modular Kitchen Cockroach Herbal Gel Treatment',
        imageUrl: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=600&q=80',
        description: 'Bayer herbal odorless gel dots applied inside all cabinets, 100% kid & pet safe.',
        tag: 'Pest Control',
      }
    ],
    currentLocation: { lat: 28.6400, lng: 77.3700 }
  },
  {
    id: 'w10',
    name: 'Radhe Shyam Halwai & Caterers',
    nameHi: 'राधे श्याम हलवाई व कैटरर्स',
    age: 44,
    phone: '+91 98188 55432',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    rating: 4.96,
    reviewsCount: 268,
    experienceYears: 16,
    category: 'catering',
    subSkills: ['Shadi Halwai & Rasoi Team', 'Full Buffet Setup (Veg & Jain)', 'Live Chaat & Golgappa Counter', 'Uniformed Waiter Staff', 'Pure Desi Ghee Sweets & Mithai'],
    city: 'Delhi NCR',
    locality: 'Sector 50, Noida',
    distanceKm: 2.3,
    hourlyRate: 350,
    dailyRate: 2500,
    isAadhaarVerified: true,
    isPanVerified: true,
    isOnline: true,
    walletBalance: 240,
    completedJobsCount: 420,
    workerIdCode: 'SI-WRK-2026-78420',
    aadhaarNumber: 'XXXX-XXXX-9143',
    registeredDate: '08 Feb 2024',
    bloodGroup: 'O+',
    emergencyContact: '+91 98188 00111',
    portfolio: [
      {
        id: 'p_cat1',
        title: '500-Pax Grand Wedding Buffet & Live Tandoor Stalls',
        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
        description: 'Complete marriage reception catering with 28-item royal menu, live rumali roti, paneer tikka, and jalebi counter.',
        tag: 'Wedding Catering',
      },
      {
        id: 'p_cat2',
        title: 'Chaat & Snacks Counter Setup with Uniformed Staff',
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
        description: 'Hygienic stainless steel chafing dishes, mineral water cooking, and 12 groomed service boys.',
        tag: 'Buffet Setup',
      }
    ],
    currentLocation: { lat: 28.5800, lng: 77.3620 }
  }
];

export const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'c1',
    name: 'Priya Sharma',
    phone: '+91 98711 00223',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    city: 'Delhi NCR',
    locality: 'Express Green Apartments, Sector 44, Noida',
    address: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida - 201301',
    totalBookingsCount: 5,
    totalSpent: 4200,
    joinedDate: '10 Aug 2026',
    lastActive: '5 mins ago',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida' },
      { label: 'Office', address: 'Plot B-14, Sector 62, Noida Electronic City' },
    ]
  },
  {
    id: 'c2',
    name: 'Anil Gupta',
    phone: '+91 98102 33445',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    city: 'Delhi NCR',
    locality: 'Sector 62, Noida',
    address: 'House 42, Block C, Sector 62, Noida - 201309',
    totalBookingsCount: 3,
    totalSpent: 2450,
    joinedDate: '15 Aug 2026',
    lastActive: '2 hours ago',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'House 42, Block C, Sector 62, Noida' },
      { label: 'Shop', address: 'Shop 12, Main Market, Sector 62, Noida' },
    ]
  },
  {
    id: 'c3',
    name: 'Rajesh Kumar Mehta',
    phone: '+91 99201 55667',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    city: 'Ghaziabad',
    locality: 'Indirapuram, Ghaziabad',
    address: 'Flat 302, ATS Advantage, Ahinsa Khand 1, Indirapuram - 201014',
    totalBookingsCount: 4,
    totalSpent: 3100,
    joinedDate: '22 Aug 2026',
    lastActive: 'Yesterday',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'Flat 302, ATS Advantage, Ahinsa Khand 1, Indirapuram' },
    ]
  },
  {
    id: 'c4',
    name: 'Sunita Devi',
    phone: '+91 98234 11229',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    city: 'Delhi NCR',
    locality: 'Mayur Vihar Phase 1, East Delhi',
    address: 'Pocket 4, Flat 112, Mayur Vihar Phase 1, Delhi - 110091',
    totalBookingsCount: 2,
    totalSpent: 1600,
    joinedDate: '01 Sep 2026',
    lastActive: '3 days ago',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'Pocket 4, Flat 112, Mayur Vihar Phase 1, Delhi' }
    ]
  },
  {
    id: 'c5',
    name: 'Vikram Malhotra',
    phone: '+91 97112 88440',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    city: 'Gurugram',
    locality: 'DLF Phase 4, Gurugram',
    address: 'Villa 18, Block B, DLF Phase 4, Gurugram - 122002',
    totalBookingsCount: 6,
    totalSpent: 8900,
    joinedDate: '28 Aug 2026',
    lastActive: 'Today, 10:15 AM',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'Villa 18, Block B, DLF Phase 4, Gurugram' }
    ]
  },
  {
    id: 'c6',
    name: 'Kavita Verma',
    phone: '+91 99182 66778',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    city: 'Lucknow',
    locality: 'Gomti Nagar, Lucknow',
    address: '2/45 Viram Khand, Gomti Nagar, Lucknow - 226010',
    totalBookingsCount: 2,
    totalSpent: 1200,
    joinedDate: '05 Sep 2026',
    lastActive: '4 hours ago',
    status: 'new',
    savedAddresses: [
      { label: 'Home', address: '2/45 Viram Khand, Gomti Nagar, Lucknow' }
    ]
  },
  {
    id: 'c7',
    name: 'Manoj Tiwari',
    phone: '+91 98390 44551',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    city: 'Varanasi',
    locality: 'Sigra, Varanasi',
    address: 'D-58/12, Kuber Complex Road, Sigra, Varanasi - 221010',
    totalBookingsCount: 1,
    totalSpent: 850,
    joinedDate: '12 Sep 2026',
    lastActive: '2 days ago',
    status: 'new',
    savedAddresses: [
      { label: 'Home', address: 'D-58/12, Kuber Complex Road, Sigra, Varanasi' }
    ]
  },
  {
    id: 'c8',
    name: 'Deepika Joshi',
    phone: '+91 98200 99881',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    city: 'Jaipur',
    locality: 'Vaishali Nagar, Jaipur',
    address: 'Plot 88, Queens Road, Vaishali Nagar, Jaipur - 302021',
    totalBookingsCount: 3,
    totalSpent: 3400,
    joinedDate: '02 Sep 2026',
    lastActive: 'Today, 02:40 PM',
    status: 'active',
    savedAddresses: [
      { label: 'Home', address: 'Plot 88, Queens Road, Vaishali Nagar, Jaipur' }
    ]
  }
];

export const INITIAL_CUSTOMER: CustomerProfile = INITIAL_CUSTOMERS[0];

export const INITIAL_JOBS: JobPost[] = [
  {
    id: 'job_dhalai_101',
    customerId: 'c1',
    customerName: 'Priya Sharma (Site Owner)',
    customerPhone: '+91 98711 00223',
    customerLocality: 'Sector 44, Noida',
    customerAddress: 'Plot 18, Block D, Near Amity University, Sector 44, Noida',
    category: 'slab_dhalai_machine',
    subCategory: 'Concrete Mixer with Lift Machine (लिफ्ट वाली छत ढलाई मशीन)',
    title: '1800 sq.ft 2nd Floor Roof Slab Dhalai Machine & 15-Person Gang (1800 sq.ft छत ढलाई मशीन व लेबर)',
    description: 'Sariya jaal and shuttering ready for Sunday casting. Need vertical tower lift mixer machine with 14-person trained gang, sand/gravel trolleys, and 2 working needle vibrators starting 7:30 AM.',
    budget: 13500,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '5 mins ago',
    status: 'open',
  },
  {
    id: 'job_septic_101',
    customerId: 'c2',
    customerName: 'Anil Gupta',
    customerPhone: '+91 98102 33445',
    customerLocality: 'Sector 62, Noida',
    customerAddress: 'House 42, Block C, Sector 62, Noida',
    category: 'septic_tank_cleaning',
    subCategory: 'Vacuum Suction Tanker Pump (वैक्यूम टैंकर द्वारा टैंक खाली करना)',
    title: '4000L Latrine Septic Tank Overflow - Urgent Vacuum Suction Cleaning (लैट्रिन सेप्टिक टैंक खाली करवाना है)',
    description: 'Underground residential latrine septic tank is full and overflowing into drain. Require high-power vacuum suction tanker with at least 80-foot hose pipe for complete sludge removal and deodorizing treatment today.',
    budget: 2400,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '12 mins ago',
    status: 'open',
  },
  {
    id: 'job_sariya_101',
    customerId: 'c1',
    customerName: 'Priya Sharma (Site Owner)',
    customerPhone: '+91 98711 00223',
    customerLocality: 'Sector 44, Noida',
    customerAddress: 'Plot 18, Block D, Near Amity University, Sector 44, Noida',
    category: 'sariya_binding',
    subCategory: 'Roof Slab Sariya Jaal (छत ढलाई सरिया जाल - 8mm/10mm/12mm)',
    title: '1600 sq.ft Roof Slab Sariya Jaal Binding & Beam Cages (छत ढलाई सरिया जाल बंधाई)',
    description: 'Need experienced Sariya Mistri & Bar Benders for 1600 sq.ft residential 1st floor roof slab. Work entails tying 10mm & 8mm Fe550D TMT bar double mesh, 14 hidden/hanging beam cages with 8mm rings at 6-inch centers, fan box binding, and cover blocks placement before concrete pouring on Sunday.',
    budget: 9500,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '10 mins ago',
    status: 'open',
  },
  {
    id: 'job_fc_101',
    customerId: 'c1',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98711 00223',
    customerLocality: 'Sector 44, Noida',
    customerAddress: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida',
    category: 'false_ceiling',
    subCategory: 'Gypsum Board False Ceiling (जिप्सम बोर्ड फॉल्स सीलिंग)',
    title: 'Drawing Room & Dining Hall Gypsum False Ceiling with Cove Light',
    description: 'Require experienced False Ceiling contractor for 580 sq ft hall. Need Saint-Gobain channel grid framing, Gyproc boards, LED cove lighting groove, and smooth putty finish.',
    budget: 38000,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '5 mins ago',
    status: 'open',
  },
  {
    id: 'job_tg_102',
    customerId: 'c2',
    customerName: 'Anil Gupta',
    customerPhone: '+91 98102 33445',
    customerLocality: 'Sector 62, Noida',
    customerAddress: 'House 42, Block C, Sector 62, Noida',
    category: 'tiles_granite_pathar',
    subCategory: 'Vitrified Floor Tiles Laying (2x2, 2x4, 4x2 विट्रिफाइड फ्लोर टाइल्स)',
    title: '1100 sq.ft Floor Vitrified Tiles & Kitchen Black Granite Countertop',
    description: 'Need skilled tile mistry for 2x4 feet double charge vitrified tiles fitting with laser level spacer clips, plus 16-foot kitchen L-shaped Black Galaxy granite slab with double rounded molding.',
    budget: 28500,
    urgency: 'today',
    photos: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '12 mins ago',
    status: 'open',
  },
  {
    id: 'job_cat_103',
    customerId: 'c3',
    customerName: 'Rajesh Kumar Mehta',
    customerPhone: '+91 99201 55667',
    customerLocality: 'Indirapuram, Ghaziabad',
    customerAddress: 'Flat 302, ATS Advantage, Ahinsa Khand 1, Indirapuram - 201014',
    category: 'catering',
    subCategory: 'Wedding & Function Halwai Team (शादी-ब्याह हलवाई व मुख्य कारीगर टीम)',
    title: '400-Person Family Wedding Function Halwai Team & Full Buffet Setup (400 लोगों का हलवाई व बुफे कैटरिंग)',
    description: 'Upcoming family wedding celebration at community hall. Need experienced head Halwai with 5 karigars, 8 uniformed service waiters, live chaat & golgappa counter, tandoori naan bhatti, and pure desi ghee sweets (gulab jamun, jalebi, moong dal halwa). Buffet chafing dishes and serving cutlery to be included.',
    budget: 48000,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '8 mins ago',
    status: 'open',
  },
  {
    id: 'job_101',
    customerId: 'c1',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98711 00223',
    customerLocality: 'Sector 44, Noida',
    customerAddress: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida',
    category: 'mistry',
    subCategory: 'Plastering',
    title: 'Balcony wall water seepage & plaster repair',
    description: 'Need skilled mason (mistry) to scrape damaged outer wall plaster, apply Dr. Fixit waterproof coat, and replaster 45 sq ft balcony wall.',
    budget: 1200,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '15 mins ago',
    status: 'open',
  },
  {
    id: 'job_102',
    customerId: 'c1',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98711 00223',
    customerLocality: 'Sector 44, Noida',
    customerAddress: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida',
    category: 'ac_repair',
    subCategory: 'Jet Pump Deep Service',
    title: '1.5 Ton Split AC foaming jet clean before summer',
    description: 'Indoor unit blowing less air. Need thorough indoor coil washing with jet pump and outdoor unit clean.',
    budget: 599,
    urgency: 'today',
    photos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '2 hours ago',
    status: 'open',
  },
  {
    id: 'job_103',
    customerId: 'c2',
    customerName: 'Anil Gupta',
    customerPhone: '+91 98102 33445',
    customerLocality: 'Sector 62, Noida',
    customerAddress: 'House 42, Block C, Sector 62, Noida',
    category: 'electrician',
    subCategory: 'MCB Tripping Fix',
    title: 'Main MCB Box Sparking & Short Circuit Repair',
    description: 'Main 32A distribution box tripping continuously on heavy load. Require certified electrician to check load balance and replace faulty miniature circuit breaker.',
    budget: 450,
    urgency: 'urgent',
    photos: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '45 mins ago',
    status: 'open',
  },
  {
    id: 'job_104',
    customerId: 'c3',
    customerName: 'Rajesh Kumar Mehta',
    customerPhone: '+91 99201 55667',
    customerLocality: 'Indirapuram, Ghaziabad',
    customerAddress: 'Flat 302, ATS Advantage, Ahinsa Khand 1, Indirapuram',
    category: 'plumber',
    subCategory: 'Pipe Leakage Fix',
    title: 'Kitchen Sink Concealed CPVC Pipe Leakage & Valve Change',
    description: 'Continuous water dripping inside modular kitchen cabinet below sink. Need plumber with heat-fusion machine to replace damaged elbow joint and angle stop-cock.',
    budget: 350,
    urgency: 'today',
    photos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=800&q=80'
    ],
    createdAt: '1 hour ago',
    status: 'open',
  }
];

export const INITIAL_BOOKING: Booking = {
  id: 'BK_9081',
  jobId: 'job_101',
  customerId: 'c1',
  customerName: 'Priya Sharma',
  customerPhone: '+91 98711 00223',
  customerAddress: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida',
  customerLocality: 'Sector 44, Noida (2.2 km away)',
  workerId: 'w1',
  workerName: 'Rameshwar "Ramesh" Kumar',
  workerPhone: '+91 98765 43210',
  workerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  workerRating: 4.88,
  serviceCategory: 'Mistry (Mason / राजमिस्त्री)',
  serviceSubCategory: 'Plastering & Water Leakage Fix',
  arrivalOtp: '8492', // 4-digit arrival OTP
  isOtpVerified: false,
  microFeeDeducted: 10,
  estimatedAmount: 1200,
  platformCommissionRate: 0,
  platformCommissionAmount: 10, // Flat ₹10 lead fee (0% commission)
  commissionPaymentStatus: 'pending',
  status: 'worker_en_route',
  createdAt: 'Just now',
  scheduledTime: 'Today, Immediate Arrival (ETA 8 mins)',
  workerLocationProgress: 45, // 45% towards destination
  jobPhotos: [
    'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80'
  ],
  completedWorkPhotos: [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80'
  ]
};

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_001',
    workerId: 'w1',
    amount: 100,
    type: 'credit',
    reason: 'recharge',
    description: 'Wallet Recharge via UPI / PhonePe',
    date: 'Today, 08:30 AM',
    referenceId: 'UPI/60291823901/SMARTIND',
    balanceAfter: 130,
  },
  {
    id: 'tx_002',
    workerId: 'w1',
    amount: 10,
    type: 'debit',
    reason: 'lead_fee',
    description: 'Verified Lead Connection (OTP #6129 - Sector 50)',
    date: 'Yesterday, 04:15 PM',
    referenceId: 'LEAD_FEE/BK_8812',
    balanceAfter: 120,
  },
  {
    id: 'tx_003',
    workerId: 'w1',
    amount: 50,
    type: 'credit',
    reason: 'incentive',
    description: 'Weekly Top 5-Star Worker Bonus',
    date: '28 Aug 2026',
    referenceId: 'BONUS/AUG_WK4',
    balanceAfter: 130,
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK_301',
    userId: 'w1',
    userName: 'Rameshwar Kumar',
    userRole: 'worker',
    subject: 'Wallet deduction discrepancy on cancelled job',
    category: 'wallet_payment',
    status: 'resolved',
    priority: 'medium',
    createdAt: 'Yesterday',
    messages: [
      { sender: 'user', text: 'Namaste, customer cancelled booking after 2 mins, please refund ₹10 lead fee.', time: 'Yesterday 10:15 AM' },
      { sender: 'support', text: 'Namaste Rameshwar ji, we verified the cancellation log. ₹10 has been refunded back to your Smart India Wallet.', time: 'Yesterday 10:45 AM' }
    ]
  }
];

// Official App Owner / Admin Receiving Account Configuration
export const DEFAULT_APP_OWNER_CONFIG: AppOwnerPaymentConfig = {
  ownerName: 'Smart India Admin (You)',
  businessName: 'Smart India Work Official',
  upiId: 'smartindia.official@icici',
  phone: '+91 98765 00112',
  bankAccountName: 'Smart India Work Technologies Pvt Ltd',
  bankAccountNumber: '50200084938291',
  ifscCode: 'ICIC0001092',
  bankName: 'ICICI Bank Ltd',
  feeModel: 'fixed_per_job',
  perJobFeeRupees: 10, // Har ek kaam ke ₹10 flat to app owner
  commissionRatePercent: 0, // 0% commission (Strictly flat ₹10 per lead)
  autoDeductFromWallet: true,
  totalWithdrawnToBank: 400,
  payoutHistory: [
    {
      id: 'payout_01',
      amount: 400,
      date: '12 Sep 2026',
      time: '04:30 PM',
      destinationBank: 'ICICI Bank Ltd',
      accountNumber: '50200084938291',
      accountHolderName: 'Smart India Work Technologies Pvt Ltd',
      ifscCode: 'ICIC0001092',
      upiId: 'smartindia.official@icici',
      utrNumber: 'IMPS/62551928401/SETTLE',
      status: 'completed',
      note: 'Weekly Company QR Earnings Transfer to Owner Personal Bank Account',
      balanceRemaining: 320,
    }
  ],
};

// Past Commission & Meeting Fee Records Collected by App Owner via Company QR / Platform
export const INITIAL_COMMISSION_RECORDS: CommissionRecord[] = [
  {
    id: 'comm_01',
    workerId: 'w1',
    workerName: 'Rameshwar "Ramesh" Kumar',
    workerPhone: '+91 98765 43210',
    customerName: 'Rajesh Sharma (Civil Lines)',
    bookingId: 'BK_8812',
    jobTitle: 'Wall Plaster & Boundary Masonry',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 1100,
    commissionAmount: 10,
    commissionPercent: 10,
    paymentMethod: 'upi_direct',
    upiTxnId: 'UPI/FEE/2026/849102',
    paidAt: 'Yesterday, 06:30 PM',
    status: 'paid',
  },
  {
    id: 'comm_02',
    workerId: 'w2',
    workerName: 'Sunil Sharma Electrician',
    workerPhone: '+91 98102 33445',
    customerName: 'Pooja Verma (Sector 14)',
    bookingId: 'BK_7901',
    jobTitle: 'Switchboard & Inverter Installation',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 850,
    commissionAmount: 10,
    commissionPercent: 10,
    paymentMethod: 'wallet_deduct',
    upiTxnId: 'WAL/DEDUCT/99412',
    paidAt: '2 days ago',
    status: 'paid',
  },
  {
    id: 'comm_03',
    workerId: 'w3',
    workerName: 'Mohammed Arif Plumber',
    workerPhone: '+91 97188 99001',
    customerName: 'Amit Patel (Gomti Nagar)',
    bookingId: 'BK_6711',
    jobTitle: 'Bathroom Diverter & Pipe Repair',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 600,
    commissionAmount: 10,
    commissionPercent: 10,
    paymentMethod: 'upi_direct',
    upiTxnId: 'UPI/FEE/2026/551209',
    paidAt: '3 days ago',
    status: 'paid',
  },
  {
    id: 'comm_04',
    workerId: 'w_sariya_1',
    workerName: 'Dharmendra "Dharamu" Nishad',
    workerPhone: '+91 98722 11889',
    customerName: 'Vikas Agarwal (Site B)',
    bookingId: 'BK_5410',
    jobTitle: 'Sariya Jaal Roof Mesh Binding',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 1400,
    commissionAmount: 10,
    commissionPercent: 10,
    paymentMethod: 'upi_direct',
    upiTxnId: 'UPI/QR/2026/910283',
    paidAt: '4 days ago',
    status: 'paid',
  },
  {
    id: 'comm_05',
    workerId: 'w_septic_1',
    workerName: 'Subhash Rawat',
    workerPhone: '+91 98390 12345',
    customerName: 'Alok Singh (Sector 71)',
    bookingId: 'BK_4320',
    jobTitle: 'Septic & Latrine Tank Vacuum Cleaning',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 2200,
    commissionAmount: 10,
    commissionPercent: 10,
    paymentMethod: 'upi_direct',
    upiTxnId: 'UPI/QR/2026/748192',
    paidAt: '5 days ago',
    status: 'paid',
  },
  {
    id: 'comm_06',
    workerId: 'w_dhalai_1',
    workerName: 'Brijesh Yadav',
    workerPhone: '+91 98111 22334',
    customerName: 'Sunita Mehra (Indirapuram)',
    bookingId: 'BK_3210',
    jobTitle: 'Slab Dhalai Machine & Labor Gang',
    feeType: 'per_job_meeting_fee',
    jobTotalAmount: 6800,
    commissionAmount: 10,
    commissionPercent: 0,
    paymentMethod: 'upi_direct',
    upiTxnId: 'UPI/COMM/2026/184920',
    paidAt: '6 days ago',
    status: 'paid',
  },
];

export const INITIAL_APP_OWNER_PAYOUTS: OwnerPayoutRecord[] = [
  {
    id: 'payout_01',
    amount: 1500,
    date: '12 Sep 2026',
    time: '04:30 PM',
    destinationBank: 'ICICI Bank Ltd',
    accountNumber: '•••• •••• 8291',
    accountHolderName: 'Smart India Work Technologies Pvt Ltd',
    ifscCode: 'ICIC0001092',
    utrNumber: 'UTR-ICIC-20260912-984210',
    status: 'completed',
    note: 'Weekly earnings transferred to primary corporate current account',
    balanceRemaining: 740,
  },
  {
    id: 'payout_02',
    amount: 2200,
    date: '05 Sep 2026',
    time: '01:15 PM',
    destinationBank: 'ICICI Bank Ltd',
    accountNumber: '•••• •••• 8291',
    accountHolderName: 'Smart India Work Technologies Pvt Ltd',
    ifscCode: 'ICIC0001092',
    utrNumber: 'UTR-ICIC-20260905-117492',
    status: 'completed',
    note: 'Auto-batch settlement for worker company QR payments',
    balanceRemaining: 2240,
  }
];

export const INITIAL_WORKER_NOTIFICATIONS: WorkerNotification[] = [
  {
    id: 'notif_001',
    workerId: 'w1',
    type: 'new_booking',
    title: '🔔 नया काम बुक हुआ! (Priya Sharma)',
    titleHi: '🔔 नया काम बुक हुआ! (Priya Sharma)',
    message: 'Customer Priya Sharma booked you for Plastering & Water Leakage Fix in Sector 44, Noida.',
    messageHi: 'ग्राहक Priya Sharma ने Sector 44, Noida में प्लास्टर व वाटर लीकेज कार्य हेतु आपको बुक किया है।',
    time: '2 mins ago',
    isRead: false,
    bookingId: 'BK_9081',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98711 00223',
    customerAddress: 'Flat 704, Tower B, Express Green Apartments, Sector 44, Noida',
    customerLocality: 'Sector 44, Noida (2.2 km away)',
    category: 'Mistry (Mason / राजमिस्त्री)',
    amount: 1200
  },
  {
    id: 'notif_002',
    workerId: 'w1',
    type: 'new_lead',
    title: '⚡ नजदीकी काम की आवश्यकता पोस्ट हुई (2.4 km)',
    titleHi: '⚡ नजदीकी काम की आवश्यकता पोस्ट हुई (2.4 km)',
    message: 'New mason requirement posted in Sector 50, Noida. Tap to view and send quote.',
    messageHi: 'Sector 50, Noida में राजमिस्त्री का नया काम आया है। तुरंत विवरण देखें।',
    time: '25 mins ago',
    isRead: true,
    jobId: 'job_101',
    customerName: 'Rahul Verma',
    customerLocality: 'Sector 50, Noida',
    category: 'Mistry',
    amount: 800
  }
];


