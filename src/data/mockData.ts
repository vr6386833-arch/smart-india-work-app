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
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=800&q=80'
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
      'https://images.unsplash.com/photo-1541976590-713941681591?auto=format&fit=crop&w=800&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80'
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
    imageUrl: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=600&q=80',
    workPhotos: [
      'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=800&q=80'
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

// Standby default worker fallback used when no local workers have registered yet
export const DEFAULT_STANDBY_WORKER: WorkerProfile = {
  id: 'wrk_standby_live',
  name: 'New Worker ID',
  nameHi: 'नया कारीगर ID बनाएं',
  age: 28,
  phone: '',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  rating: 5.0,
  reviewsCount: 0,
  experienceYears: 1,
  category: 'mistry',
  subSkills: ['नया कारीगर रजिस्टर करें', 'काम पाएं'],
  city: 'India',
  locality: 'लोकेशन चुनें',
  distanceKm: 0.5,
  hourlyRate: 150,
  dailyRate: 850,
  isAadhaarVerified: false,
  isPanVerified: false,
  isOnline: true,
  walletBalance: 100,
  completedJobsCount: 0,
  workerIdCode: 'SI-NEW-ID',
  aadhaarNumber: 'XXXX-XXXX-0000',
  registeredDate: 'नया (New)',
  bloodGroup: 'O+',
  emergencyContact: '',
  portfolio: []
};

// 100% Clean Production Workers Array (Starts pristine, populates from real registrations & Firestore)
export const INITIAL_WORKERS: WorkerProfile[] = [];

// Guest placeholder when no customer has registered yet on device
export const DEFAULT_GUEST_CUSTOMER: CustomerProfile = {
  id: 'c_new_guest',
  name: 'New Customer ID',
  phone: '',
  email: '',
  loginMethod: 'otp',
  isPhoneVerified: false,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  city: 'India',
  locality: 'लोकेशन चुनें',
  address: '',
  totalBookingsCount: 0,
  totalSpent: 0,
  joinedDate: 'नया (New)',
  lastActive: 'आईडी बनाएं',
  status: 'active',
  savedAddresses: []
};

// 100% Clean Production Customers Array (Starts empty until real user creates Customer ID)
export const INITIAL_CUSTOMERS: CustomerProfile[] = [];

export const INITIAL_CUSTOMER: CustomerProfile = DEFAULT_GUEST_CUSTOMER;

// 100% Clean Production Jobs Array (Starts pristine, populates when real customers post jobs)
export const INITIAL_JOBS: JobPost[] = [];

// Pristine Active Booking: Defaults to null (no fake or stuck ongoing bookings)
export const INITIAL_BOOKING: Booking | null = null;

// Clean Production Financial & Support Arrays
export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [];
export const INITIAL_TICKETS: SupportTicket[] = [];

// Official App Owner / Admin Receiving Account Configuration
export const DEFAULT_APP_OWNER_CONFIG: AppOwnerPaymentConfig = {
  ownerName: 'Smart India Work Owner',
  businessName: 'Smart India Work Official',
  upiId: 'smartindia.official@icici',
  phone: '+91 98765 00000',
  bankAccountName: 'Smart India Work Technologies Pvt Ltd',
  bankAccountNumber: '50200084938291',
  ifscCode: 'ICIC0001092',
  bankName: 'ICICI Bank Ltd',
  feeModel: 'fixed_per_job',
  perJobFeeRupees: 10, // Har ek kaam ke ₹10 flat to app owner
  commissionRatePercent: 0, // 0% commission (Strictly flat ₹10 per lead)
  autoDeductFromWallet: true,
  ownerSecurityPin: '1234',
  totalWithdrawnToBank: 0,
  payoutHistory: [],
};

export const INITIAL_COMMISSION_RECORDS: CommissionRecord[] = [];
export const INITIAL_APP_OWNER_PAYOUTS: OwnerPayoutRecord[] = [];
export const INITIAL_WORKER_NOTIFICATIONS: WorkerNotification[] = [];
