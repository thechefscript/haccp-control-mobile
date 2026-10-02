(() => {
  'use strict';

  const cfg = window.HACCP_CONFIG || {};
  const initialHashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const initialQueryParams = new URLSearchParams(window.location.search);
  const initialAuthType = initialHashParams.get('type') || initialQueryParams.get('type') || '';
  const publicKey = cfg.SUPABASE_PUBLISHABLE_KEY || cfg.SUPABASE_ANON_KEY;
  const hasSupabaseConfig = !!(cfg.SUPABASE_URL && publicKey);
  const supabaseRuntimeReady = !!window.supabase?.createClient;
  const configured = hasSupabaseConfig && supabaseRuntimeReady;
  const db = configured ? window.supabase.createClient(cfg.SUPABASE_URL, publicKey) : null;

  function authRuntimeMessage() {
    if (!hasSupabaseConfig) return 'Connect Supabase first: open config.js and add your Project URL and publishable key.';
    if (!supabaseRuntimeReady) return 'Supabase runtime did not load. Rebuild the local mobile runtime and sync Android.';
    return '';
  }

  const state = {
    user: null,
    profile: null,
    membership: null,
    kitchen: null,
    locations: [],
    equipment: [],
    limits: [],
    members: [],
    property: null,
    processLimits: [],
    processLimitUsageIds: new Set(),
    processBatches: [],
    calibrationDevices: [],
    calibrationRecords: [],
    receivingSuppliers: [],
    receivingStandards: [],
    receivingRecords: [],
    receivingPhotoDraft: [],
    thawingStandards: [],
    thawingBatches: [],
    thawingReadings: [],
    thawingPhotoDraft: [],
    sanitationStandards: [],
    sanitationRecords: [],
    sanitationPhotoDraft: [],
    sanitationVerifyPhotoDraft: [],
    allergens: [],
    allergenProfiles: [],
    allergenChecks: [],
    managementSummary: null,
    managementLiveSummary: null,
    managementReviews: [],
    managementCurrentReview: null,
    notifications: { generated_at:null,total:0,critical:0,warning:0,info:0,items:[] },
    notificationFilter: 'all',
    notificationTimer: null,
    trainingAssessments: [],
    trainingAssignments: [],
    trainingAttempts: [],
    trainingCompetencies: [],
    trainingSelectedAssessmentId: null,
    trainingExam: null,
    currentPage: 'dashboard',
    pendingQuickEquipment: new URLSearchParams(location.search).get('equipment') || null,
    pendingQuickSanitation: new URLSearchParams(location.search).get('sanitation') || null,
    pendingQuickThawing: new URLSearchParams(location.search).get('thawing') || null,
    authActionMode: ['invite', 'recovery'].includes(initialAuthType) ? initialAuthType : null,
    todaySlotLogs: [],
    reminderTimer: null,
    processReminderTimer: null,
    monitoringLocationId: localStorage.getItem('haccpMonitoringLocation') || 'all',
    recordsTab: localStorage.getItem('haccpRecordsTab') || 'storage'
  };

  const roleRank = { staff: 1, chef: 2, supervisor: 3, manager: 4, admin: 5, owner: 6 };
  const translations = {
    en: {
      'nav.dashboard':'Dashboard','nav.check':'Storage Temperature','nav.receiving':'Receiving Control','nav.corrective':'Corrective Actions','nav.calibration':'Calibration','nav.records':'HACCP Records','nav.process':'Food Process Control','nav.equipment':'Equipment','nav.limits':'HACCP Limits','nav.processSettings':'Process Standards','nav.receivingSettings':'Receiving Settings','nav.team':'Team','nav.qr':'QR Labels','nav.property':'Property Information','nav.section.monitoring':'MONITORING','nav.section.control':'CONTROL','nav.section.records':'RECORDS','nav.section.configuration':'CONFIGURATION',
      'common.language':'Language','common.signOut':'Sign out','common.profile':'My Profile','common.close':'Close','common.refresh':'Refresh','common.cancel':'Cancel','common.all':'All','common.save':'Save','common.saving':'Saving…','common.optional':'Optional',
      'monitor.eyebrow':'MONITORING','monitor.title':'Storage Temperature','monitor.description':'All active equipment in one checklist. Storage type and HACCP limit are taken automatically from Equipment Settings.','monitor.instructionTitle':'Enter temperatures as you move through the kitchen.','monitor.instructionBody':'Each Save records the current time automatically. Out-of-limit readings open corrective action immediately.','monitor.noEquipment':'No active equipment configured. Ask a Manager or Owner to add equipment first.','monitor.location':'LOCATION','monitor.units':'unit','monitor.unitsPlural':'units','monitor.schedule':'Schedule','monitor.criticalLimit':'Critical limit','monitor.noLimit':'HACCP limit not assigned','monitor.noLimitHelp':'Assign a default HACCP limit in Equipment Settings before recording.','monitor.temperature':'Temperature (°C)','monitor.batch':'Product / batch','monitor.notes':'Notes','monitor.enterTemp':'Enter temperature','monitor.pass':'PASS — within limit','monitor.out':'OUT OF LIMIT — action required','monitor.saved':'Saved','monitor.outSaved':'OUT saved','monitor.refreshed':'Monitoring list refreshed.','monitor.savedToast':'temperature saved.','monitor.deviationToast':'deviation saved — complete corrective action.','monitor.slot':'Current round','monitor.alreadyRecorded':'Already recorded','monitor.recordedBy':'Recorded by','monitor.locked':'This equipment is locked for this round because a temperature has already been recorded.','monitor.overdueTitle':'TEMPERATURE CHECK OVERDUE','monitor.overdueBody':'The scheduled temperature round is more than 30 minutes overdue. Please complete the remaining equipment now.','monitor.remaining':'equipment remaining','monitor.goCheck':'Open Storage Temperature','monitor.dismiss':'Remind me later','monitor.allLocations':'All Locations','monitor.locationTabs':'Filter equipment by location',
      'corrective.eyebrow':'DEVIATIONS','corrective.title':'Corrective Actions','corrective.description':'Complete action for every out-of-limit record and verify it when appropriate.','corrective.openOnly':'Open only','corrective.save':'Save Corrective Action','corrective.verify':'Verify Action','corrective.noActions':'No corrective actions.','corrective.noOpenActions':'No open corrective actions.','corrective.recorded':'Recorded by','corrective.limit':'Limit','corrective.immediate':'Immediate action','corrective.disposition':'Disposition','corrective.followup':'Follow-up','corrective.completedBy':'Completed by','corrective.verifiedBy':'Verified by','corrective.awaiting':'AWAITING VERIFY','corrective.required':'ACTION REQUIRED','corrective.verified':'VERIFIED','corrective.complete':'Complete Action','corrective.saved':'Corrective action saved.','corrective.savedNeedsVerify':'Corrective action saved. Supervisor verification is still required.','corrective.verifiedToast':'Corrective action verified.',
      'records.eyebrow':'RECORDKEEPING','records.title':'HACCP Records','records.description':'Central archive for monitoring, food process, calibration, corrective actions and verification status.','records.recordDate':'Record date','records.tab.storage':'Storage Temperature','records.tab.receiving':'Receiving','records.tab.process':'Food Process','records.tab.corrective':'Corrective Actions','records.tab.calibration':'Calibration','records.tab.verification':'Verification','records.storageTitle':'Storage Temperature Records','records.receivingTitle':'Receiving Records','records.processTitle':'Food Process Records','records.correctiveTitle':'Corrective Action Records','records.storagePdf':'Storage Temperature PDF','records.view':'View Record','records.download':'Download PDF','records.print':'Print','records.previewTitle':'Record Preview','records.location':'Location','records.round':'Round','records.status':'Status','records.process':'Process','records.search':'Search','records.source':'Source','records.verificationStatus':'Verification status','records.verifyDay':'Verify Day','records.dayVerified':'Day Verified','records.noRecords':'No records for this date.','records.notVerified':'Not verified yet.','records.verified':'Verified','records.dailyVerified':'Daily HACCP record verified.',
      'property.eyebrow':'PROPERTY','property.title':'Hotel / Property Information','property.description':'Official property identity used on HACCP PDF records. Equipment, kitchen names and operational data are not translated or changed.','property.name':'Hotel / Property name','property.address':'Address','property.phone':'Telephone','property.website':'Website','property.logo':'Hotel / Property logo','property.logoHelp':'PNG or JPG. A square or horizontal transparent logo works best.','property.save':'Save Property Information','property.removeLogo':'Remove Logo','property.saved':'Property information saved.','property.logoTooLarge':'Please choose an image under 5 MB.','property.ownerAdmin':'Only Owner or Admin can edit this information.',
      'profile.eyebrow':'ACCOUNT','profile.title':'My Profile','profile.description':'Your account identity used for HACCP records. These details are read-only to protect audit consistency.','profile.name':'Name','profile.email':'Email','profile.role':'Role','profile.kitchen':'Kitchen / Outlet','profile.readonly':'Account details cannot be edited here. This helps preserve user attribution on HACCP monitoring, corrective actions and verification records.',
      'calibration.eyebrow':'VERIFICATION CONTROL','calibration.title':'Thermometer Calibration','calibration.description':'Register measuring devices, record calibration checks, control due dates and verify results.','calibration.addDevice':'+ Add Thermometer','calibration.newCheck':'+ Calibration Check','calibration.registered':'Registered','calibration.activeDevices':'active devices','calibration.dueSoon':'Due soon','calibration.next7Days':'next 7 days','calibration.overdue':'Overdue','calibration.requiresCheck':'requires check','calibration.failed':'Failed','calibration.outOfService':'out of service','calibration.guidanceTitle':'Calibration is a verification control.','calibration.guidanceBody':'Use the reference temperature required by your approved procedure. Boiling-point reference temperature must reflect local conditions; it is not hard-coded.','calibration.deviceRegister':'DEVICE REGISTER','calibration.deviceStatus':'Thermometer status','calibration.recentEyebrow':'RECENT CHECKS','calibration.recentTitle':'Calibration activity','calibration.recordEyebrow':'VERIFICATION RECORD','calibration.recordsTitle':'Calibration Records',
      'receiving.eyebrow':'INCOMING FOOD CONTROL','receiving.title':'Receiving Control','receiving.description':'Check approved supplier, product condition and receiving requirements before food enters storage or production.','receiving.newCheck':'+ Receiving Check','receiving.deliveries':'Deliveries','receiving.today':'today','receiving.accepted':'Accepted','receiving.rejected':'Rejected','receiving.pendingVerify':'Awaiting verify','receiving.rejections':'rejections','receiving.guidanceTitle':'Receive only against an approved supplier and an approved receiving standard.','receiving.guidanceBody':'Temperature limits are property-configured. Packaging and transport condition are included in the acceptance decision when required by the selected standard.','receiving.manageSettings':'Manage Suppliers & Standards','receiving.settingsTitle':'Receiving Settings','receiving.settingsDescription':'Manage approved suppliers and property-approved receiving standards. Historical receiving records keep snapshots of the configuration used at the time.','receiving.saved':'Receiving record saved.','receiving.verified':'Receiving rejection verified.',
      'pdf.recordTitle':'HACCP DAILY TEMPERATURE RECORD','pdf.round':'Round','pdf.kitchen':'Kitchen / Outlet','pdf.recordDate':'Record date','pdf.generated':'Generated','pdf.timezone':'Timezone','pdf.total':'Total checks','pdf.passed':'Passed','pdf.deviations':'Deviations','pdf.dailyVerification':'Daily verification','pdf.complete':'Complete','pdf.pending':'Pending','pdf.time':'Time','pdf.equipment':'Equipment','pdf.point':'HACCP point','pdf.actual':'Actual','pdf.limit':'Critical limit','pdf.status':'Status','pdf.staffBatch':'Staff / Batch','pdf.corrective':'Corrective action','pdf.supervisorVerification':'Supervisor / Manager verification','pdf.notVerified':'Not verified','pdf.actionMissing':'Action not recorded','pdf.verificationPending':'Verification pending','pdf.verified':'Verified','pdf.followup':'Follow-up','pdf.footer':'Generated from Kitchen HACCP Control. Critical limits shown are historical snapshots from the configuration used at time of recording. Use only with your approved HACCP plan and applicable food-safety requirements.',
      'processPdf.eyebrow':'RECORDKEEPING','processPdf.title':'Food Process Daily Record','processPdf.description':'Generate a printable daily record for Cooking, Cooling, Reheating, Hot Holding and Cold Holding.','processPdf.date':'Record date','processPdf.button':'Food Process PDF','processPdf.recordTitle':'HACCP FOOD PROCESS CONTROL RECORD','processPdf.totalReadings':'Total readings','processPdf.batches':'Batches','processPdf.passed':'Passed','processPdf.deviations':'Deviations','processPdf.processSummary':'Process summary','processPdf.batch':'Batch','processPdf.quantity':'Quantity','processPdf.location':'Location','processPdf.equipment':'Equipment','processPdf.batchStatus':'Batch status','processPdf.journey':'Batch journey','processPdf.processStage':'Process / stage','processPdf.staff':'Staff','processPdf.notes':'Notes','processPdf.corrective':'Corrective action / verification','processPdf.noReadings':'No food process readings were recorded for this date.','processPdf.actionMissing':'Action not recorded','processPdf.createdBy':'Action by','processPdf.verifiedBy':'Verified by','processPdf.generatedBy':'Generated by','processPdf.preparing':'Preparing food process HACCP report…','processPdf.popupBlocked':'Allow pop-ups so the food process print/PDF window can open.','processPdf.footer':'Generated from Kitchen HACCP Control. Critical limits shown are historical snapshots saved with each process reading. Use only with your approved HACCP plan and applicable food-safety requirements.'
    },
    id: {
      'nav.dashboard':'Dasbor','nav.check':'Suhu Penyimpanan','nav.receiving':'Penerimaan Barang','nav.corrective':'Tindakan Korektif','nav.calibration':'Kalibrasi','nav.records':'Catatan HACCP','nav.process':'Kontrol Proses Makanan','nav.equipment':'Peralatan','nav.limits':'Batas HACCP','nav.processSettings':'Standar Proses','nav.receivingSettings':'Pengaturan Penerimaan','nav.team':'Tim','nav.qr':'Label QR','nav.property':'Informasi Hotel','nav.section.monitoring':'PEMANTAUAN','nav.section.control':'KONTROL','nav.section.records':'CATATAN','nav.section.configuration':'KONFIGURASI',
      'common.language':'Bahasa','common.signOut':'Keluar','common.profile':'Profil Saya','common.close':'Tutup','common.refresh':'Segarkan','common.cancel':'Batal','common.all':'Semua','common.save':'Simpan','common.saving':'Menyimpan…','common.optional':'Opsional',
      'monitor.eyebrow':'PEMANTAUAN','monitor.title':'Suhu Penyimpanan','monitor.description':'Semua peralatan aktif ditampilkan dalam satu daftar. Jenis penyimpanan dan batas HACCP diambil otomatis dari Pengaturan Peralatan.','monitor.instructionTitle':'Masukkan suhu sambil melakukan pengecekan di area dapur.','monitor.instructionBody':'Setiap kali menekan Simpan, waktu pencatatan direkam otomatis. Hasil di luar batas akan langsung membuka tindakan korektif.','monitor.noEquipment':'Belum ada peralatan aktif. Minta Manager atau Owner menambahkan peralatan terlebih dahulu.','monitor.location':'LOKASI','monitor.units':'unit','monitor.unitsPlural':'unit','monitor.schedule':'Jadwal','monitor.criticalLimit':'Batas kritis','monitor.noLimit':'Batas HACCP belum ditetapkan','monitor.noLimitHelp':'Tetapkan batas HACCP default di Pengaturan Peralatan sebelum melakukan pencatatan.','monitor.temperature':'Suhu (°C)','monitor.batch':'Produk / batch','monitor.notes':'Catatan','monitor.enterTemp':'Masukkan suhu','monitor.pass':'PASS — dalam batas','monitor.out':'DI LUAR BATAS — perlu tindakan','monitor.saved':'Tersimpan','monitor.outSaved':'OUT tersimpan','monitor.refreshed':'Daftar pemantauan diperbarui.','monitor.savedToast':'suhu tersimpan.','monitor.deviationToast':'deviasi tersimpan — lengkapi tindakan korektif.','monitor.slot':'Pengecekan saat ini','monitor.alreadyRecorded':'Sudah diinput','monitor.recordedBy':'Diinput oleh','monitor.locked':'Equipment ini dikunci untuk sesi ini karena suhu sudah diinput.','monitor.overdueTitle':'PENGECEKAN SUHU TERLAMBAT','monitor.overdueBody':'Jadwal pengecekan suhu sudah lewat lebih dari 30 menit. Segera lengkapi equipment yang belum diinput.','monitor.remaining':'equipment belum diinput','monitor.goCheck':'Buka Suhu Penyimpanan','monitor.dismiss':'Ingatkan lagi','monitor.allLocations':'Semua Lokasi','monitor.locationTabs':'Filter equipment berdasarkan lokasi',
      'corrective.eyebrow':'DEVIASI','corrective.title':'Tindakan Korektif','corrective.description':'Lengkapi tindakan untuk setiap hasil di luar batas dan lakukan verifikasi bila diperlukan.','corrective.openOnly':'Belum selesai','corrective.save':'Simpan Tindakan Korektif','corrective.verify':'Verifikasi Tindakan','corrective.noActions':'Tidak ada tindakan korektif.','corrective.noOpenActions':'Tidak ada tindakan korektif yang terbuka.','corrective.recorded':'Dicatat oleh','corrective.limit':'Batas','corrective.immediate':'Tindakan langsung','corrective.disposition':'Penanganan produk','corrective.followup':'Tindak lanjut','corrective.completedBy':'Diselesaikan oleh','corrective.verifiedBy':'Diverifikasi oleh','corrective.awaiting':'MENUNGGU VERIFIKASI','corrective.required':'PERLU TINDAKAN','corrective.verified':'TERVERIFIKASI','corrective.complete':'Lengkapi Tindakan','corrective.saved':'Tindakan korektif tersimpan.','corrective.savedNeedsVerify':'Tindakan korektif tersimpan. Verifikasi supervisor masih diperlukan.','corrective.verifiedToast':'Tindakan korektif telah diverifikasi.',
      'records.eyebrow':'PENCATATAN','records.title':'Catatan HACCP','records.description':'Arsip terpusat untuk pemantauan, proses makanan, kalibrasi, tindakan korektif, dan status verifikasi.','records.recordDate':'Tanggal catatan','records.tab.storage':'Suhu Penyimpanan','records.tab.receiving':'Penerimaan','records.tab.process':'Proses Makanan','records.tab.corrective':'Tindakan Korektif','records.tab.calibration':'Kalibrasi','records.tab.verification':'Verifikasi','records.storageTitle':'Catatan Suhu Penyimpanan','records.receivingTitle':'Catatan Penerimaan','records.processTitle':'Catatan Proses Makanan','records.correctiveTitle':'Catatan Tindakan Korektif','records.storagePdf':'PDF Suhu Penyimpanan','records.view':'Lihat Catatan','records.download':'Unduh PDF','records.print':'Cetak','records.previewTitle':'Pratinjau Catatan','records.location':'Lokasi','records.round':'Putaran','records.status':'Status','records.process':'Proses','records.search':'Cari','records.source':'Sumber','records.verificationStatus':'Status verifikasi','records.verifyDay':'Verifikasi Hari','records.dayVerified':'Hari Terverifikasi','records.noRecords':'Tidak ada catatan untuk tanggal ini.','records.notVerified':'Belum diverifikasi.','records.verified':'Diverifikasi','records.dailyVerified':'Catatan HACCP harian telah diverifikasi.',
      'property.eyebrow':'PROPERTI','property.title':'Informasi Hotel / Properti','property.description':'Identitas resmi properti yang digunakan pada dokumen PDF HACCP. Nama equipment, kitchen, dan data operasional tidak diterjemahkan atau diubah.','property.name':'Nama Hotel / Properti','property.address':'Alamat','property.phone':'Telepon','property.website':'Website','property.logo':'Logo Hotel / Properti','property.logoHelp':'PNG atau JPG. Logo transparan berbentuk persegi atau horizontal paling ideal.','property.save':'Simpan Informasi Properti','property.removeLogo':'Hapus Logo','property.saved':'Informasi properti tersimpan.','property.logoTooLarge':'Pilih gambar dengan ukuran di bawah 5 MB.','property.ownerAdmin':'Hanya Owner atau Admin yang dapat mengubah informasi ini.',
      'profile.eyebrow':'AKUN','profile.title':'Profil Saya','profile.description':'Identitas akun yang digunakan pada catatan HACCP. Data ini hanya dapat dilihat untuk menjaga konsistensi audit.','profile.name':'Nama','profile.email':'Email','profile.role':'Peran','profile.kitchen':'Kitchen / Outlet','profile.readonly':'Data akun tidak dapat diedit dari halaman ini. Hal ini membantu menjaga atribusi pengguna pada catatan pemantauan HACCP, tindakan korektif, dan verifikasi.',
      'calibration.eyebrow':'KONTROL VERIFIKASI','calibration.title':'Kalibrasi Termometer','calibration.description':'Daftarkan alat ukur, catat pemeriksaan kalibrasi, kontrol tanggal jatuh tempo, dan lakukan verifikasi hasil.','calibration.addDevice':'+ Tambah Termometer','calibration.newCheck':'+ Pemeriksaan Kalibrasi','calibration.registered':'Terdaftar','calibration.activeDevices':'alat aktif','calibration.dueSoon':'Segera jatuh tempo','calibration.next7Days':'7 hari ke depan','calibration.overdue':'Terlambat','calibration.requiresCheck':'perlu diperiksa','calibration.failed':'Gagal','calibration.outOfService':'tidak digunakan','calibration.guidanceTitle':'Kalibrasi adalah kontrol verifikasi.','calibration.guidanceBody':'Gunakan suhu referensi sesuai prosedur yang disetujui. Suhu referensi titik didih harus mengikuti kondisi setempat; sistem tidak menetapkannya secara otomatis.','calibration.deviceRegister':'REGISTER ALAT','calibration.deviceStatus':'Status termometer','calibration.recentEyebrow':'PEMERIKSAAN TERBARU','calibration.recentTitle':'Aktivitas kalibrasi','calibration.recordEyebrow':'CATATAN VERIFIKASI','calibration.recordsTitle':'Catatan Kalibrasi',
      'receiving.eyebrow':'KONTROL PENERIMAAN BAHAN','receiving.title':'Kontrol Penerimaan','receiving.description':'Periksa supplier yang disetujui, kondisi produk, dan persyaratan penerimaan sebelum bahan masuk ke penyimpanan atau produksi.','receiving.newCheck':'+ Pemeriksaan Penerimaan','receiving.deliveries':'Penerimaan','receiving.today':'hari ini','receiving.accepted':'Diterima','receiving.rejected':'Ditolak','receiving.pendingVerify':'Menunggu verifikasi','receiving.rejections':'penolakan','receiving.guidanceTitle':'Terima barang hanya dari supplier yang disetujui dan berdasarkan standar penerimaan yang disetujui.','receiving.guidanceBody':'Batas suhu dikonfigurasi oleh properti. Kondisi kemasan dan transportasi ikut menentukan keputusan penerimaan jika diwajibkan oleh standar.','receiving.manageSettings':'Kelola Supplier & Standar','receiving.settingsTitle':'Pengaturan Penerimaan','receiving.settingsDescription':'Kelola supplier yang disetujui dan standar penerimaan properti. Catatan historis menyimpan snapshot konfigurasi saat pencatatan.','receiving.saved':'Catatan penerimaan tersimpan.','receiving.verified':'Penolakan penerimaan telah diverifikasi.',
      'pdf.recordTitle':'CATATAN SUHU HARIAN HACCP','pdf.round':'Putaran','pdf.kitchen':'Kitchen / Outlet','pdf.recordDate':'Tanggal pencatatan','pdf.generated':'Dibuat','pdf.timezone':'Zona waktu','pdf.total':'Total pengecekan','pdf.passed':'Lulus','pdf.deviations':'Deviasi','pdf.dailyVerification':'Verifikasi harian','pdf.complete':'Selesai','pdf.pending':'Menunggu','pdf.time':'Waktu','pdf.equipment':'Equipment','pdf.point':'Titik HACCP','pdf.actual':'Aktual','pdf.limit':'Batas kritis','pdf.status':'Status','pdf.staffBatch':'Staff / Batch','pdf.corrective':'Tindakan korektif','pdf.supervisorVerification':'Verifikasi Supervisor / Manager','pdf.notVerified':'Belum diverifikasi','pdf.actionMissing':'Tindakan belum dicatat','pdf.verificationPending':'Menunggu verifikasi','pdf.verified':'Diverifikasi','pdf.followup':'Tindak lanjut','pdf.footer':'Dibuat dari Kitchen HACCP Control. Batas kritis yang ditampilkan merupakan snapshot historis dari konfigurasi saat pencatatan dilakukan. Gunakan hanya bersama rencana HACCP yang telah disetujui dan persyaratan keamanan pangan yang berlaku.',
      'processPdf.eyebrow':'PENCATATAN','processPdf.title':'Catatan Harian Proses Makanan','processPdf.description':'Buat catatan harian yang dapat dicetak untuk Cooking, Cooling, Reheating, Hot Holding, dan Cold Holding.','processPdf.date':'Tanggal pencatatan','processPdf.button':'PDF Proses Makanan','processPdf.recordTitle':'CATATAN KONTROL PROSES MAKANAN HACCP','processPdf.totalReadings':'Total pencatatan','processPdf.batches':'Batch','processPdf.passed':'Lulus','processPdf.deviations':'Deviasi','processPdf.processSummary':'Ringkasan proses','processPdf.batch':'Batch','processPdf.quantity':'Jumlah','processPdf.location':'Lokasi','processPdf.equipment':'Equipment','processPdf.batchStatus':'Status batch','processPdf.journey':'Alur batch','processPdf.processStage':'Proses / tahap','processPdf.staff':'Staff','processPdf.notes':'Catatan','processPdf.corrective':'Tindakan korektif / verifikasi','processPdf.noReadings':'Tidak ada pencatatan proses makanan untuk tanggal ini.','processPdf.actionMissing':'Tindakan belum dicatat','processPdf.createdBy':'Tindakan oleh','processPdf.verifiedBy':'Diverifikasi oleh','processPdf.generatedBy':'Dibuat oleh','processPdf.preparing':'Menyiapkan laporan HACCP proses makanan…','processPdf.popupBlocked':'Izinkan pop-up agar jendela cetak/PDF proses makanan dapat dibuka.','processPdf.footer':'Dibuat dari Kitchen HACCP Control. Batas kritis yang ditampilkan merupakan snapshot historis yang disimpan pada setiap pencatatan proses. Gunakan hanya bersama rencana HACCP yang telah disetujui dan persyaratan keamanan pangan yang berlaku.'
    }
  };
  Object.assign(translations.en, {
    'nav.sanitation':'Cleaning & Sanitation','nav.sanitationSettings':'Sanitation Settings','records.tab.sanitation':'Sanitation'
  });
  Object.assign(translations.id, {
    'nav.sanitation':'Cleaning & Sanitation','nav.sanitationSettings':'Pengaturan Sanitasi','records.tab.sanitation':'Sanitasi'
  });
  Object.assign(translations.en, {
    'nav.allergen':'Allergen Control','nav.allergenSettings':'Allergen Settings','records.tab.allergen':'Allergen',
    'allergen.eyebrow':'ALLERGEN CONTROL','allergen.title':'Allergen Control','allergen.description':'Review declared allergens and cross-contact risks using the property-approved menu allergen profiles.','allergen.manage':'Manage Allergen Profiles',
    'allergen.publishedMenus':'Published menus','allergen.currentProfiles':'current profiles','allergen.activeAllergens':'Active allergens','allergen.propertyLibrary':'property library','allergen.checksToday':'Guest checks','allergen.today':'today','allergen.reviewDue':'Review due','allergen.profileReview':'menu profiles',
    'allergen.guidanceTitle':'Use this as an allergen-information control, not a guarantee that a dish is allergen-free.','allergen.guidanceBody':'Ingredient specifications, substitutions, shared equipment and preparation practices can change. Follow the property’s allergen procedure before serving an allergy-related order.',
    'allergen.guestCheck':'GUEST ALLERGEN CHECK','allergen.checkDish':'Check a Menu Item','allergen.requestedAllergens':'Requested allergen(s)','allergen.menuItem':'Menu item','allergen.orderRef':'Order / Table / Room reference','allergen.serviceLocation':'Service location','allergen.notes':'Notes','allergen.selectPrompt':'Select at least one allergen and a menu item.','allergen.recordCheck':'Record Allergen Check',
    'allergen.recentEyebrow':'RECENT CHECKS','allergen.recentTitle':'Today’s Allergen Checks','allergen.matrixEyebrow':'MENU CONTROL','allergen.matrixTitle':'Menu Allergen Matrix','allergen.category':'Category','allergen.outlet':'Outlet','allergen.matrixLegend':'C = Contains · X = Cross-contact risk · — = No declared match in the approved profile. Always follow the property’s allergen procedure.',
    'allergen.recordEyebrow':'ALLERGEN RECORD','allergen.recordTitle':'Guest Allergen Checks','allergen.code':'Code','allergen.sortOrder':'Sort order','allergen.nameEn':'English name','allergen.nameId':'Bahasa Indonesia name','allergen.menuCode':'Menu code','allergen.menuName':'Menu item name','allergen.outletService':'Outlet / service','allergen.ingredients':'Ingredients / composition','allergen.handlingNotes':'Handling / cross-contact notes','allergen.reviewDate':'Review due date','allergen.classification':'Allergen classification','allergen.classificationHelp':'Select Contains, Cross-contact risk, or None for each property allergen.','allergen.settingsTitle':'Allergen Settings','allergen.settingsDescription':'Maintain the property’s allergen library and version-controlled menu allergen profiles.','allergen.libraryEyebrow':'ALLERGEN LIBRARY','allergen.libraryTitle':'Property Allergen Library','allergen.profileEyebrow':'MENU PROFILE','allergen.newProfile':'New Menu Allergen Profile','allergen.profileRegister':'Menu Allergen Profiles'
  });
  Object.assign(translations.id, {
    'nav.allergen':'Kontrol Alergen','nav.allergenSettings':'Pengaturan Alergen','records.tab.allergen':'Alergen',
    'allergen.eyebrow':'KONTROL ALERGEN','allergen.title':'Kontrol Alergen','allergen.description':'Tinjau alergen yang dinyatakan dan risiko kontak silang berdasarkan profil alergen menu yang disetujui properti.','allergen.manage':'Kelola Profil Alergen',
    'allergen.publishedMenus':'Menu dipublikasikan','allergen.currentProfiles':'profil aktif','allergen.activeAllergens':'Alergen aktif','allergen.propertyLibrary':'daftar properti','allergen.checksToday':'Pemeriksaan tamu','allergen.today':'hari ini','allergen.reviewDue':'Perlu ditinjau','allergen.profileReview':'profil menu',
    'allergen.guidanceTitle':'Gunakan sebagai kontrol informasi alergen, bukan jaminan bahwa hidangan bebas alergen.','allergen.guidanceBody':'Spesifikasi bahan, penggantian bahan, equipment bersama, dan praktik persiapan dapat berubah. Ikuti prosedur alergen properti sebelum menyajikan pesanan terkait alergi.',
    'allergen.guestCheck':'PEMERIKSAAN ALERGEN TAMU','allergen.checkDish':'Periksa Item Menu','allergen.requestedAllergens':'Alergen yang diinformasikan','allergen.menuItem':'Item menu','allergen.orderRef':'Referensi Order / Meja / Kamar','allergen.serviceLocation':'Lokasi pelayanan','allergen.notes':'Catatan','allergen.selectPrompt':'Pilih minimal satu alergen dan item menu.','allergen.recordCheck':'Catat Pemeriksaan Alergen',
    'allergen.recentEyebrow':'PEMERIKSAAN TERBARU','allergen.recentTitle':'Pemeriksaan Alergen Hari Ini','allergen.matrixEyebrow':'KONTROL MENU','allergen.matrixTitle':'Matriks Alergen Menu','allergen.category':'Kategori','allergen.outlet':'Outlet','allergen.matrixLegend':'C = Mengandung · X = Risiko kontak silang · — = Tidak ada kecocokan yang dinyatakan pada profil yang disetujui. Tetap ikuti prosedur alergen properti.',
    'allergen.recordEyebrow':'CATATAN ALERGEN','allergen.recordTitle':'Pemeriksaan Alergen Tamu','allergen.code':'Kode','allergen.sortOrder':'Urutan','allergen.nameEn':'Nama Bahasa Inggris','allergen.nameId':'Nama Bahasa Indonesia','allergen.menuCode':'Kode menu','allergen.menuName':'Nama item menu','allergen.outletService':'Outlet / pelayanan','allergen.ingredients':'Bahan / komposisi','allergen.handlingNotes':'Catatan penanganan / kontak silang','allergen.reviewDate':'Tanggal tinjau ulang','allergen.classification':'Klasifikasi alergen','allergen.classificationHelp':'Pilih Mengandung, Risiko kontak silang, atau Tidak dinyatakan untuk setiap alergen properti.','allergen.settingsTitle':'Pengaturan Alergen','allergen.settingsDescription':'Kelola daftar alergen properti dan profil alergen menu dengan kontrol versi.','allergen.libraryEyebrow':'DAFTAR ALERGEN','allergen.libraryTitle':'Daftar Alergen Properti','allergen.profileEyebrow':'PROFIL MENU','allergen.newProfile':'Profil Alergen Menu Baru','allergen.profileRegister':'Profil Alergen Menu'
  });
  let currentLanguage = localStorage.getItem('haccpLanguage') === 'id' ? 'id' : 'en';
  const t = key => translations[currentLanguage]?.[key] || translations.en[key] || key;
  function applyLanguage() {
    document.documentElement.lang = currentLanguage === 'id' ? 'id' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if (translations[currentLanguage]?.[key]) el.textContent = t(key); });
    const select = document.getElementById('languageSelect'); if (select) select.value = currentLanguage;
    const managementNav = document.getElementById('navManagementLabel'); if (managementNav) managementNav.textContent = currentLanguage === 'id' ? 'Tinjauan Manajemen' : 'Management Review';
    applyNotificationLanguage();
    applyThawingLanguage();
    if (state.equipment.length) renderMonitoringChecklist();
    if (state.currentPage === 'corrective' && state.kitchen) loadCorrectiveActions();
    if (state.currentPage === 'records' && state.kitchen) loadRecordsHub();
    if (state.currentPage === 'calibration' && state.kitchen) loadCalibration();
    if (state.currentPage === 'receiving' && state.kitchen) loadReceiving();
    if (state.currentPage === 'receiving-settings' && state.kitchen) loadReceivingSettings();
    if (state.currentPage === 'thawing' && state.kitchen) loadThawing();
    if (state.currentPage === 'thawing-settings' && state.kitchen) loadThawingSettings();
    if (state.currentPage === 'sanitation' && state.kitchen) loadSanitation();
    if (state.currentPage === 'sanitation-settings' && state.kitchen) loadSanitationSettings();
    if (state.currentPage === 'allergen' && state.kitchen) loadAllergenControl();
    if (state.currentPage === 'allergen-settings' && state.kitchen) loadAllergenSettings();
    if (state.currentPage === 'training' && state.kitchen) loadTraining();
    if (state.currentPage === 'training-settings' && state.kitchen) loadTrainingSettings();
    updateAuthGreeting();
    if (state.user && state.kitchen) updateDashboardGreeting();
    if (state.currentPage === 'dashboard' && state.kitchen) loadDashboard();
    if (state.currentPage === 'management' && state.kitchen) loadManagementReview();
    if (state.currentPage === 'notifications' && state.kitchen) loadNotifications(true);
  }
  const $ = selectorOrId => {
    if (selectorOrId.startsWith?.('.') || selectorOrId.startsWith?.('#') || selectorOrId.includes?.(' ')) return document.querySelector(selectorOrId);
    return document.getElementById(selectorOrId);
  };
  const $$ = selector => Array.from(document.querySelectorAll(selector));

  // ---------------------------------------------------------------------------
  // Mobile UX — time-aware greeting
  // ---------------------------------------------------------------------------
  function greetingForHour(hour, lowercase = false) {
    const h = Number(hour);
    let greeting;

    if (currentLanguage === 'id') {
      greeting = h < 12 ? 'Selamat pagi' : h < 17 ? 'Selamat siang' : 'Selamat malam';
    } else {
      greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    }

    if (!lowercase) return greeting;
    return greeting.charAt(0).toLowerCase() + greeting.slice(1);
  }

  function updateAuthGreeting() {
    const title = $('authGreeting');
    const eyebrow = $('authWelcomeEyebrow');
    const copy = $('authGreetingCopy');

    if (!title) return;

    const hour = new Date().getHours();

    if (currentLanguage === 'id') {
      if (eyebrow) eyebrow.textContent = 'SELAMAT DATANG';
      title.textContent = `Selamat datang, ${greetingForHour(hour, true)}`;
      if (copy) copy.textContent = 'Masuk untuk melanjutkan ke kitchen Anda.';
    } else {
      if (eyebrow) eyebrow.textContent = 'WELCOME';
      title.textContent = `Welcome, ${greetingForHour(hour, true)}`;
      if (copy) copy.textContent = 'Sign in to continue to your kitchen.';
    }
  }

  function currentUserFirstName() {
    const source = String(
      state.profile?.full_name ||
      state.user?.user_metadata?.full_name ||
      ''
    ).trim();

    if (source) return source.split(/\s+/)[0];

    const email = String(state.user?.email || state.profile?.email || '').trim();
    return email ? email.split('@')[0] : '';
  }

  function updateDashboardGreeting() {
    const title = $('dashboardTitle');
    if (!title) return;

    if (!state.user) {
      title.textContent = currentLanguage === 'id' ? 'Dashboard Dapur' : 'Kitchen Dashboard';
      return;
    }

    let hour = new Date().getHours();

    try {
      if (state.kitchen) hour = kitchenNowParts().hour;
    } catch (_) {}

    const greeting = greetingForHour(hour);
    const firstName = currentUserFirstName();

    title.textContent = firstName ? `${greeting}, ${firstName}` : greeting;
  }
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const nullableNumber = value => value === '' || value == null ? null : Number(value);
  const fmtDate = date => new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric' }).format(date);
  const fmtTime = value => new Intl.DateTimeFormat('en-GB', { hour:'2-digit', minute:'2-digit' }).format(new Date(value));
  const fmtDateTime = value => new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));

  // Keep legacy/browser-style offsets (for example GMT+0800) from being
  // passed to Intl/PostgreSQL as though they were IANA timezone names.
  function normalizeTimeZone(value) {
    const browserZone = (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
    })();
    const raw = String(value || '').trim();
    if (!raw) return browserZone;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: raw }).format(new Date());
      return raw;
    } catch (_) {}

    const compact = raw.toUpperCase().replace(/\s+/g, '');
    const indonesiaAliases = {
      'GMT+0700':'Asia/Jakarta','GMT+07:00':'Asia/Jakarta','UTC+0700':'Asia/Jakarta','UTC+07:00':'Asia/Jakarta','+0700':'Asia/Jakarta','+07:00':'Asia/Jakarta',
      'GMT+0800':'Asia/Makassar','GMT+08:00':'Asia/Makassar','UTC+0800':'Asia/Makassar','UTC+08:00':'Asia/Makassar','+0800':'Asia/Makassar','+08:00':'Asia/Makassar',
      'GMT+0900':'Asia/Jayapura','GMT+09:00':'Asia/Jayapura','UTC+0900':'Asia/Jayapura','UTC+09:00':'Asia/Jayapura','+0900':'Asia/Jayapura','+09:00':'Asia/Jayapura'
    };
    if (indonesiaAliases[compact]) return indonesiaAliases[compact];

    const fixed = compact.match(/^(?:GMT|UTC)?([+-])(\d{2})(?::?(\d{2}))$/);
    if (fixed && fixed[3] === '00') {
      const hours = Number(fixed[2]);
      if (hours === 0) return 'UTC';
      if (hours <= 14) {
        // IANA Etc/GMT signs are intentionally reversed.
        const candidate = `Etc/GMT${fixed[1] === '+' ? '-' : '+'}${hours}`;
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
          return candidate;
        } catch (_) {}
      }
    }
    return browserZone || 'UTC';
  }

  function kitchenTimeZone() {
    return normalizeTimeZone(state.kitchen?.timezone);
  }

  function kitchenDate(date = new Date()) {
    const tz = kitchenTimeZone();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(date);
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function addCalendarDays(dateString, days) {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
  }

  function kitchenDayBoundaryUtc(dateString) {
    const tz = kitchenTimeZone();
    const [year, month, day] = String(dateString).split('-').map(Number);
    const target = Date.UTC(year, month - 1, day, 0, 0, 0);
    let guess = target;
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' });
    for (let i = 0; i < 3; i++) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map(p => [p.type, p.value]));
      const observed = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
      guess -= observed - target;
    }
    return new Date(guess).toISOString();
  }

  function localDateTimeInput(date = new Date()) {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0,16);
  }

  function hasRole(minimum) {
    const currentRole = String(state.membership?.role || 'staff').trim().toLowerCase();
    return (roleRank[currentRole] || 0) >= roleRank[minimum];
  }

  // Supabase/PostgREST may embed corrective_actions as either a single object
  // (because temperature_log_id is UNIQUE) or an array. Normalize it here.
  function correctiveActionFor(log) {
    const value = log?.corrective_actions;
    if (!value) return null;
    return Array.isArray(value) ? (value[0] || null) : value;
  }

  function processActionFor(reading) {
    const value = reading?.process_corrective_actions;
    if (!value) return null;
    return Array.isArray(value) ? (value[0] || null) : value;
  }

  function toast(message, type = '') {
    const el = $('toast');
    el.textContent = message;
    el.className = `toast ${type}`.trim();
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.add('hidden'), 3300);
  }

  function setAuthMessage(message, good = false) {
    $('authMessage').textContent = message || '';
    $('authMessage').style.color = good ? '#166534' : '#991b1b';
  }

  function showOnly(id) {
    ['authScreen','passwordActionScreen','bootstrapScreen','awaitingScreen','appShell'].forEach(x => $(x).classList.toggle('hidden', x !== id));
    if (id === 'authScreen') updateAuthGreeting();
  }

  async function boot() {
    $('recordDate').value = new Date().toISOString().slice(0,10);
    $('demoNote').classList.toggle('hidden', configured);
    if (!configured) $('demoNote').textContent = authRuntimeMessage();
    if (cfg.ALLOW_SIGNUP_UI === false) {
      const signupTab = document.querySelector('[data-auth-tab="signup"]');
      if (signupTab) signupTab.classList.add('hidden');
      $('signUpForm').classList.add('hidden');
    }

    bindEvents();
    applyLanguage();

    if (!configured) {
      showOnly('authScreen');
      setAuthMessage(authRuntimeMessage());
      return;
    }

    db.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        state.authActionMode = 'recovery';
        showPasswordAction('recovery', session);
        return;
      }
      if (!session) {
        if (!state.authActionMode) {
          resetState();
          showOnly('authScreen');
        }
        return;
      }
      if (state.authActionMode === 'invite') {
        showPasswordAction('invite', session);
        return;
      }
      if (state.authActionMode === 'recovery') {
        showPasswordAction('recovery', session);
        return;
      }
      if (!state.user || state.user.id !== session.user.id) await handleSession(session);
    });

    const { data: { session } } = await db.auth.getSession();
    if (session && state.authActionMode) showPasswordAction(state.authActionMode, session);
    else if (session) await handleSession(session);
    else if (state.authActionMode) {
      showOnly('authScreen');
      setAuthMessage('This account link is invalid or has expired. Please request a new invitation or password-reset email.');
      state.authActionMode = null;
    } else showOnly('authScreen');
  }


  function resetState() {
    state.user = state.profile = state.membership = state.kitchen = null;
    state.locations = []; state.equipment = []; state.limits = []; state.members = []; state.property = null; state.processLimits = []; state.processLimitUsageIds = new Set(); state.processBatches = []; state.calibrationDevices = []; state.calibrationRecords = []; state.receivingSuppliers = []; state.receivingStandards = []; state.receivingRecords = []; state.sanitationStandards = []; state.sanitationRecords = []; state.sanitationPhotoDraft = []; state.sanitationVerifyPhotoDraft = []; state.allergens = []; state.allergenProfiles = []; state.allergenChecks = []; state.managementSummary = null; state.managementLiveSummary = null; state.managementReviews = []; state.managementCurrentReview = null; state.notifications = { generated_at:null,total:0,critical:0,warning:0,info:0,items:[] }; state.notificationFilter='all'; if(state.notificationTimer){clearInterval(state.notificationTimer);state.notificationTimer=null;}
  }

  async function handleSession(session) {
    state.user = session.user;
    const { data: profile, error: profileError } = await db.from('profiles').select('*').eq('id', state.user.id).maybeSingle();
    if (profileError) console.error(profileError);
    state.profile = profile || { id: state.user.id, full_name: state.user.email, email: state.user.email };

    const { data: memberships, error } = await db
      .from('kitchen_members')
      .select('kitchen_id,role,active,invited_at,accepted_at,kitchens(id,name,location,timezone,active)')
      .eq('user_id', state.user.id)
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error(error);
      toast('Could not load kitchen access.', 'error');
      return;
    }

    if (!memberships?.length) {
      const { data: canBootstrap, error: bootstrapError } = await db.rpc('can_bootstrap_kitchen');
      if (bootstrapError) console.error(bootstrapError);
      showOnly(canBootstrap ? 'bootstrapScreen' : 'awaitingScreen');
      return;
    }

    state.membership = memberships[0];
    state.kitchen = memberships[0].kitchens;

    if (!state.membership.accepted_at) {
      try {
        const { error: acceptError } = await db.rpc(
          'mark_kitchen_membership_accepted',
          { p_kitchen_id: state.kitchen.id }
        );

        if (acceptError) {
          console.warn('[Team Access Acceptance]', acceptError);
        } else {
          state.membership.accepted_at = new Date().toISOString();
        }
      } catch (acceptError) {
        console.warn('[Team Access Acceptance]', acceptError);
      }
    }

    $('recordDate').value = kitchenDate();
    showOnly('appShell');
    applyRoleUI();
    await loadConfiguration();
    await loadTodaySlotLogs();
    startMonitoringReminderClock();
    startProcessReminderClock();
    await loadNotifications(false);
    startNotificationClock();
    if (state.pendingQuickEquipment) {
      const quickEquipment = state.equipment.find(e => e.id === state.pendingQuickEquipment);
      if (quickEquipment) state.monitoringLocationId = quickEquipment.location_id || '__other__';
    }
    await navigate(state.pendingQuickThawing ? 'thawing' : state.pendingQuickSanitation ? 'sanitation' : state.pendingQuickEquipment ? 'check' : 'dashboard');
    await maybeShowOverdueReminder();
    if (state.pendingQuickThawing) {
      const quickThawing = state.pendingQuickThawing;
      state.pendingQuickThawing = null;
      requestAnimationFrame(async () => { try { await fetchThawingStandards(false); if ((state.thawingStandards || []).some(s => s.id === quickThawing)) { await openThawingBatch(); $('thawingBatchStandard').value=quickThawing; updateThawingBatchPreview(); } } catch(e){ console.error(e); } });
    } else if (state.pendingQuickSanitation) {
      const quickSanitation = state.pendingQuickSanitation;
      state.pendingQuickSanitation = null;
      requestAnimationFrame(() => { if ((state.sanitationStandards || []).some(s => s.id === quickSanitation)) openSanitationRecord(quickSanitation); });
    } else if (state.pendingQuickEquipment) {
      const quickId = state.pendingQuickEquipment;
      state.pendingQuickEquipment = null;
      requestAnimationFrame(() => {
        const card = document.querySelector(`[data-monitor-equipment="${CSS.escape(quickId)}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.querySelector('[data-monitor-temp]')?.focus();
        }
      });
    }
  }

  function displayRole(role) {
    return String(role || 'staff').replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function openProfileDialog() {
    if (!state.user) return;
    $('profileName').value = state.profile?.full_name || state.user?.user_metadata?.full_name || state.user?.email || '—';
    $('profileEmail').value = state.user?.email || state.profile?.email || '—';
    $('profileRole').value = displayRole(state.membership?.role);
    $('profileKitchen').value = state.kitchen?.name || '—';
    const dialog = $('profileDialog');
    if (dialog?.showModal) dialog.showModal();
  }

  function applyRoleUI() {
    $('sidebarKitchen').textContent = state.kitchen?.name || 'Kitchen';
    $('currentUserName').textContent = state.profile?.full_name || state.user?.email || 'User';
    $('currentRole').textContent = state.membership?.role || 'staff';
    $$('[data-min-role]').forEach(el => el.classList.toggle('hidden', !hasRole(el.dataset.minRole)));
    $('verifyDayBtn').classList.toggle('hidden', !hasRole('supervisor'));
    const adminOpt=$('memberRole')?.querySelector('option[value="admin"]'); const managerOpt=$('memberRole')?.querySelector('option[value="manager"]'); if(adminOpt) adminOpt.hidden=state.membership?.role!=='owner'; if(managerOpt) managerOpt.hidden=!['owner','admin'].includes(state.membership?.role);
  }

  async function loadConfiguration() {
    const [locRes, eqRes, limitRes, propertyRes] = await Promise.all([
      db.from('locations').select('*').eq('kitchen_id', state.kitchen.id).eq('active', true).order('name'),
      db.from('equipment').select('*,locations(name)').eq('kitchen_id', state.kitchen.id).eq('active', true).order('code'),
      db.from('haccp_limits').select('*').eq('kitchen_id', state.kitchen.id).eq('active', true).order('code'),
      db.from('property_settings').select('*').eq('kitchen_id', state.kitchen.id).maybeSingle()
    ]);
    if (locRes.error) throw locRes.error;
    if (eqRes.error) throw eqRes.error;
    if (limitRes.error) throw limitRes.error;
    if (propertyRes.error && propertyRes.error.code !== '42P01') throw propertyRes.error;
    state.property = propertyRes.data || null;
    state.locations = locRes.data || [];
    state.equipment = eqRes.data || [];
    state.limits = limitRes.data || [];
    renderMonitoringChecklist();
    await loadCalibrationBadge();
    await loadReceivingBadge();
    await loadSanitationBadge();
  }

  function equipmentLabel(e) {
    const loc = e.locations?.name || state.locations.find(l => l.id === e.location_id)?.name || 'No location';
    return `${e.code} — ${e.name} · ${loc} · ${e.storage_type}`;
  }

  function equipmentLimit(e) {
    return state.limits.find(l => l.id === e.default_limit_id) || null;
  }

  function previewStatus(value, limit) {
    if (!limit || value === '') return null;
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (limit.min_value != null && v < Number(limit.min_value)) return 'OUT';
    if (limit.max_value != null && v > Number(limit.max_value)) return 'OUT';
    return 'PASS';
  }

  const STANDARD_ROUNDS = [
    { key: 'Opening', hour: 7, minute: 0 },
    { key: 'Middle', hour: 12, minute: 0 },
    { key: 'Closing', hour: 23, minute: 0 }
  ];

  function kitchenNowParts(date = new Date()) {
    const tz = kitchenTimeZone();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' }).formatToParts(date);
    const v = Object.fromEntries(parts.map(x => [x.type, x.value]));
    return { date: `${v.year}-${v.month}-${v.day}`, hour: Number(v.hour), minute: Number(v.minute), second: Number(v.second) };
  }

  function activeMonitoringRound(date = new Date()) {
    const now = kitchenNowParts(date);
    const mins = now.hour * 60 + now.minute;
    let round = STANDARD_ROUNDS[0];
    if (mins >= 23 * 60) round = STANDARD_ROUNDS[2];
    else if (mins >= 12 * 60) round = STANDARD_ROUNDS[1];
    else round = STANDARD_ROUNDS[0];
    const scheduledMinutes = round.hour * 60 + round.minute;
    return { ...round, date: now.date, nowMinutes: mins, scheduledMinutes, overdue: mins >= scheduledMinutes + 30 };
  }

  async function loadTodaySlotLogs() {
    if (!state.kitchen?.id) return [];
    const round = activeMonitoringRound();
    const { data, error } = await db.from('temperature_logs')
      .select('id,equipment_id,monitoring_slot,recorded_at,actual_temperature,unit_snapshot,recorded_by,profiles!temperature_logs_recorded_by_fkey(full_name,email)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('record_date', round.date)
      .eq('monitoring_slot', round.key);
    if (error) {
      // Before the migration is installed, keep the page usable and surface a clear setup error on Save.
      if (error.code === '42703') return [];
      throw error;
    }
    state.todaySlotLogs = data || [];
    return state.todaySlotLogs;
  }

  function slotLogForEquipment(equipmentId) {
    const round = activeMonitoringRound();
    return state.todaySlotLogs.find(x => x.equipment_id === equipmentId && x.monitoring_slot === round.key) || null;
  }

  async function refreshMonitoringLocks() {
    await loadTodaySlotLogs();
    if (state.currentPage === 'check') renderMonitoringChecklist();
    await maybeShowOverdueReminder();
  }

  /* =========================================================
     MOBILE 1.4 STORAGE TEMPERATURE NATIVE NOTIFICATIONS
  ========================================================= */

  function storageReminderNotificationId(round) {
    const seed =
      `${state.kitchen?.id || 'kitchen'}|${round.date}|${round.key}`;

    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash =
        ((hash * 31) + seed.charCodeAt(i)) >>> 0;
    }

    return 100000000 + (hash % 1000000000);
  }

  async function handleNativeStorageNotification(event) {
    const notification =
      event?.detail?.notification;

    const extra =
      notification?.extra || {};

    if (extra.type !== 'storage-overdue') {
      return;
    }

    try {
      await loadTodaySlotLogs();
      await navigate('check');

    } catch (error) {
      console.error(
        '[HACCP Native Notification Routing]',
        error
      );
    }
  }

  if (!window.__haccpStorageNotificationListenerReady) {
    window.__haccpStorageNotificationListenerReady = true;

    window.addEventListener(
      'haccp:native-notification',
      handleNativeStorageNotification
    );
  }

  async function maybeShowOverdueReminder(force = false) {
    if (
      !state.user ||
      !state.kitchen ||
      !state.equipment.length
    ) {
      return;
    }

    const round =
      activeMonitoringRound();

    if (!round.overdue) {
      return;
    }

    if (
      !state.todaySlotLogs.length ||
      state.todaySlotLogs.some(
        x => x.monitoring_slot !== round.key
      )
    ) {
      await loadTodaySlotLogs();
    }

    const done = new Set(
      state.todaySlotLogs
        .filter(
          x => x.monitoring_slot === round.key
        )
        .map(
          x => x.equipment_id
        )
    );

    const remaining =
      state.equipment.filter(
        e => !done.has(e.id)
      );

    const notificationId =
      storageReminderNotificationId(round);

    /*
      If the entire monitoring round is complete,
      remove its Android notification.
    */
    if (!remaining.length) {

      if (
        window.HACCPMobile?.isNative?.() &&
        typeof window.HACCPMobile?.cancelNotification === 'function'
      ) {
        try {
          await window.HACCPMobile.cancelNotification(
            notificationId
          );

        } catch (error) {
          console.error(
            '[HACCP Storage Notification Cancel]',
            error
          );
        }
      }

      return;
    }

    /*
      Preserve the existing 15-minute reminder throttle.
    */
    const key =
      `haccp-reminder-${state.kitchen.id}-${round.date}-${round.key}`;

    const last =
      Number(
        sessionStorage.getItem(key) || 0
      );

    if (
      !force &&
      Date.now() - last < 15 * 60 * 1000
    ) {
      return;
    }

    sessionStorage.setItem(
      key,
      String(Date.now())
    );

    /*
      Android native notification.
      Only runs inside the installed Capacitor app.
    */
    if (
      window.HACCPMobile?.isNative?.() &&
      typeof window.HACCPMobile?.notify === 'function'
    ) {
      try {
        await window.HACCPMobile.notify({
          id: notificationId,

          title:
            t('monitor.overdueTitle'),

          body:
            `${round.key}: ${remaining.length} ${t('monitor.remaining')}. ` +
            t('monitor.overdueBody'),

          extra: {
            type: 'storage-overdue',
            round: round.key,
            date: round.date
          }
        });

      } catch (error) {
        console.error(
          '[HACCP Storage Notification]',
          error
        );
      }
    }

    /*
      Keep the existing in-app overdue dialog too.
    */
    const dialog =
      $('overdueDialog');

    if (
      !dialog ||
      dialog.open
    ) {
      return;
    }

    $('overdueRoundName').textContent =
      `${round.key} - ${String(round.hour).padStart(2, '0')}:${String(round.minute).padStart(2, '0')}`;

    $('overdueRemaining').textContent =
      `${remaining.length} ${t('monitor.remaining')}`;

    $('overdueEquipmentList').innerHTML =
      remaining
        .slice(0, 8)
        .map(
          e =>
            `<li>${esc(e.code)} - ${esc(e.name)}</li>`
        )
        .join('') +
      (
        remaining.length > 8
          ? `<li>+${remaining.length - 8} more</li>`
          : ''
      );

    dialog.showModal();
  }

  function startMonitoringReminderClock() {
    if (state.reminderTimer) clearInterval(state.reminderTimer);
    state.reminderTimer = setInterval(async () => {
      try { await loadTodaySlotLogs(); await maybeShowOverdueReminder(); if (state.currentPage === 'check') renderMonitoringChecklist(); } catch (e) { console.error(e); }
    }, 60 * 1000);
  }

  function renderMonitoringChecklist() {
    const list = $('monitoringList');
    const tabs = $('monitorLocationTabs');
    if (!list) return;
    if (!state.equipment.length) {
      if (tabs) tabs.innerHTML = '';
      list.innerHTML = `<div class="card empty">${t('monitor.noEquipment')}</div>`;
      return;
    }

    const locationsWithEquipment = state.locations
      .filter(l => state.equipment.some(e => e.location_id === l.id))
      .map(l => ({ id: l.id, name: l.name, count: state.equipment.filter(e => e.location_id === l.id).length }));
    const unassignedCount = state.equipment.filter(e => !e.location_id).length;
    if (unassignedCount) locationsWithEquipment.push({ id: '__other__', name: 'Other', count: unassignedCount });

    const validIds = new Set(['all', ...locationsWithEquipment.map(l => l.id)]);
    if (!validIds.has(state.monitoringLocationId)) state.monitoringLocationId = 'all';

    if (tabs) {
      tabs.setAttribute('aria-label', t('monitor.locationTabs'));
      tabs.innerHTML = [
        { id:'all', name:t('monitor.allLocations'), count:state.equipment.length },
        ...locationsWithEquipment
      ].map(loc => {
        const active = state.monitoringLocationId === loc.id;
        const done = loc.id === 'all'
          ? state.equipment.filter(e => !!slotLogForEquipment(e.id)).length
          : state.equipment.filter(e => (loc.id === '__other__' ? !e.location_id : e.location_id === loc.id) && !!slotLogForEquipment(e.id)).length;
        return `<button type="button" class="location-tab ${active ? 'active' : ''}" role="tab" aria-selected="${active}" data-monitor-location-tab="${esc(loc.id)}"><span>${esc(loc.name)}</span><small>${done}/${loc.count}</small></button>`;
      }).join('');
    }

    const visibleEquipment = state.monitoringLocationId === 'all'
      ? state.equipment
      : state.equipment.filter(e => state.monitoringLocationId === '__other__' ? !e.location_id : e.location_id === state.monitoringLocationId);

    const groups = new Map();
    visibleEquipment.forEach(e => {
      const loc = e.locations?.name || state.locations.find(l => l.id === e.location_id)?.name || 'Other';
      if (!groups.has(loc)) groups.set(loc, []);
      groups.get(loc).push(e);
    });

    list.innerHTML = Array.from(groups.entries()).map(([location, items]) => `
      <section class="monitor-location">
        <div class="monitor-location-head"><div><div class="eyebrow">${t('monitor.location')}</div><h2>${esc(location)}</h2></div><span class="pill">${items.length} ${items.length === 1 ? t('monitor.units') : t('monitor.unitsPlural')}</span></div>
        <div class="monitor-units">
          ${items.map(e => {
            const limit = equipmentLimit(e);
            const existing = slotLogForEquipment(e.id);
            const recorder = existing?.profiles?.full_name || existing?.profiles?.email || 'Staff';
            return `<article class="monitor-unit card ${existing ? 'monitor-locked' : ''}" data-monitor-equipment="${esc(e.id)}">
              <div class="monitor-unit-head">
                <div><h3>${esc(e.code)} — ${esc(e.name)}</h3><p>${esc(e.storage_type)}${e.monitoring_slots?.length ? ` · ${t('monitor.schedule')} ${esc(e.monitoring_slots.join(' / '))}` : ''}</p></div>
                <span class="storage-badge">${esc(e.storage_type)}</span>
              </div>
              ${existing ? `<div class="monitor-already"><strong>✓ ${t('monitor.alreadyRecorded')} · ${esc(activeMonitoringRound().key)}</strong><span>${t('monitor.recordedBy')} @${esc(recorder)} · ${fmtTime(existing.recorded_at)} · ${esc(existing.actual_temperature)}${esc(existing.unit_snapshot || '')}</span></div>` : ''}
              ${limit ? `<div class="monitor-limit"><strong>${esc(limit.code)} — ${esc(limit.name)}</strong><span>${t('monitor.criticalLimit')}: ${esc(limit.limit_text)}</span></div>` : `<div class="monitor-limit missing"><strong>${t('monitor.noLimit')}</strong><span>${t('monitor.noLimitHelp')}</span></div>`}
              <div class="monitor-entry-grid">
                <label>${t('monitor.temperature')}<input type="number" step="0.1" inputmode="decimal" data-monitor-temp placeholder="e.g. 3.8" ${(limit && !existing) ? '' : 'disabled'}></label>
                <label>${t('monitor.batch')}<input data-monitor-batch placeholder="${t('common.optional')}" ${(limit && !existing) ? '' : 'disabled'}></label>
                <label class="monitor-notes">${t('monitor.notes')}<input data-monitor-notes placeholder="${t('common.optional')}" ${(limit && !existing) ? '' : 'disabled'}></label>
              </div>
              <div class="monitor-unit-footer">
                <div class="monitor-result ${existing ? 'pass' : 'neutral'}" data-monitor-result>${existing ? `✓ ${t('monitor.alreadyRecorded')}` : t('monitor.enterTemp')}</div>
                <button type="button" class="primary monitor-save" data-save-monitor="${esc(e.id)}" ${(limit && !existing) ? '' : 'disabled'}>${existing ? `✓ ${t('monitor.alreadyRecorded')}` : t('common.save')}</button>
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>`).join('');
  }

  function updateMonitoringPreview(card) {
    const e = state.equipment.find(x => x.id === card?.dataset.monitorEquipment);
    const limit = e ? equipmentLimit(e) : null;
    const input = card?.querySelector('[data-monitor-temp]');
    const result = card?.querySelector('[data-monitor-result]');
    if (!result || !input) return;
    const status = previewStatus(input.value, limit);
    result.className = `monitor-result ${status === 'PASS' ? 'pass' : status === 'OUT' ? 'out' : 'neutral'}`;
    result.textContent = status === 'PASS' ? t('monitor.pass') : status === 'OUT' ? t('monitor.out') : t('monitor.enterTemp');
  }

  async function navigate(page) {
    if (['equipment','limits','process-settings','receiving-settings','thawing-settings','sanitation-settings','allergen-settings','training-settings','team','qr','management'].includes(page) && !hasRole('manager')) page = 'dashboard';
    if (page === 'calibration' && !hasRole('supervisor')) page = 'dashboard';
    if (page === 'property' && !hasRole('admin')) page = 'dashboard';
    state.currentPage = page;
    $$('.page').forEach(el => el.classList.toggle('active', el.id === `page-${page}`));
    $$('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    $('.sidebar')?.classList?.remove('open');
    $('sidebarScrim')?.classList?.remove('open');
    $('mobileMenuBtn')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');

    if (page === 'check') { await loadTodaySlotLogs(); renderMonitoringChecklist(); }
    if (page === 'dashboard') await loadDashboard();
    if (page === 'corrective') await loadCorrectiveActions();
    if (page === 'calibration') await loadCalibration();
    if (page === 'receiving') await loadReceiving();
    if (page === 'thawing') await loadThawing();
    if (page === 'sanitation') await loadSanitation();
    if (page === 'allergen') await loadAllergenControl();
    if (page === 'records') await loadRecordsHub();
    if (page === 'equipment') await loadEquipmentAdmin();
    if (page === 'limits') await loadLimitsAdmin();
    if (page === 'team') await loadTeam();
    if (page === 'qr') await loadQrLabels();
    if (page === 'property') await loadPropertySettings();
    if (page === 'process') await loadProcessControl();
    if (page === 'process-settings') await loadProcessSettings();
    if (page === 'receiving-settings') await loadReceivingSettings();
    if (page === 'thawing-settings') await loadThawingSettings();
    if (page === 'sanitation-settings') await loadSanitationSettings();
    if (page === 'allergen-settings') await loadAllergenSettings();
    if (page === 'training') await loadTraining();
    if (page === 'training-settings') await loadTrainingSettings();
    if (page === 'management') await loadManagementReview();
    if (page === 'notifications') await loadNotifications(true);
  }


  function notificationCopy(en, id) { return currentLanguage === 'id' ? id : en; }

  function applyNotificationLanguage() {
    const set=(id,en,idText)=>{const el=$(id);if(el)el.textContent=notificationCopy(en,idText);};
    set('navNotificationsLabel','Notifications','Notifikasi');
    set('notificationEyebrow','ACTION CENTER','PUSAT TINDAKAN');
    set('notificationTitle','Notifications','Notifikasi');
    set('notificationDescription','Live HACCP alerts from monitoring, verification, calibration, sanitation and training.','Peringatan HACCP aktif dari monitoring, verifikasi, kalibrasi, sanitasi, dan pelatihan.');
    set('refreshNotifications','Refresh','Segarkan');
    set('notificationTotalLabel','Open','Aktif'); set('notificationTotalSmall','active alerts','peringatan aktif');
    set('notificationCriticalLabel','Critical','Kritis'); set('notificationCriticalSmall','act now','segera tindak');
    set('notificationWarningLabel','Warning','Peringatan'); set('notificationWarningSmall','needs attention','perlu perhatian');
    set('notificationUpdatedLabel','Updated','Diperbarui'); set('notificationUpdatedSmall','auto-refreshes every minute','otomatis diperbarui setiap menit');
    set('notificationFilterAll','All','Semua'); set('notificationFilterCritical','Critical','Kritis'); set('notificationFilterWarning','Warning','Peringatan'); set('notificationFilterTraining','Training','Pelatihan'); set('notificationFilterSanitation','Sanitation','Sanitasi'); set('notificationFilterThawing','Thawing','Pencairan');
    set('notificationHelp','Alerts disappear automatically when the source issue is resolved. Snooze hides an alert only for your account.','Peringatan hilang otomatis setelah sumber masalah selesai. Tunda hanya menyembunyikan peringatan untuk akun Anda.');
    const mobile=$('mobileNotificationBtn'); if(mobile) mobile.setAttribute('aria-label',notificationCopy('Notifications','Notifikasi'));
    if(state.notifications?.items?.length || state.currentPage==='notifications') renderNotifications();
  }

  function notificationDueText(value) {
    if(!value) return '';
    const d=new Date(value); if(Number.isNaN(d.getTime())) return '';
    const diff=Math.round((d.getTime()-Date.now())/60000);
    if(Math.abs(diff)<2) return notificationCopy('Due now','Jatuh tempo sekarang');
    if(diff<0) return notificationCopy(`${Math.abs(diff)} min overdue`,`Terlambat ${Math.abs(diff)} menit`);
    if(diff<60) return notificationCopy(`Due in ${diff} min`,`Jatuh tempo dalam ${diff} menit`);
    return fmtDateTime(value);
  }

  function updateNotificationBadges() {
    const count=Number(state.notifications?.total||0);
    ['navNotificationBadge','mobileNotificationBadge'].forEach(id=>{const el=$(id);if(!el)return;el.textContent=count>99?'99+':String(count);el.classList.toggle('hidden',count===0);});
  }

  function renderNotifications() {
    const data=state.notifications||{items:[]};
    if($('notificationTotal')) $('notificationTotal').textContent=data.total||0;
    if($('notificationCritical')) $('notificationCritical').textContent=data.critical||0;
    if($('notificationWarning')) $('notificationWarning').textContent=data.warning||0;
    if($('notificationUpdated')) $('notificationUpdated').textContent=data.generated_at?fmtTime(data.generated_at):'—';
    updateNotificationBadges();
    $$('.notification-filter').forEach(b=>b.classList.toggle('active',b.dataset.notificationFilter===state.notificationFilter));
    const list=$('notificationList'); if(!list)return;
    let items=Array.isArray(data.items)?data.items:[];
    if(state.notificationFilter!=='all') items=items.filter(x=>x.severity===state.notificationFilter||x.category===state.notificationFilter);
    if(!items.length){
      list.innerHTML=`<article class="card notification-empty"><strong>${notificationCopy('No active notifications','Tidak ada notifikasi aktif')}</strong><span>${notificationCopy('Resolved items disappear automatically.','Item yang sudah selesai akan hilang otomatis.')}</span></article>`;
      return;
    }
    list.innerHTML=items.map(item=>{
      const title=currentLanguage==='id'?item.title_id:item.title_en;
      const detail=currentLanguage==='id'?item.detail_id:item.detail_en;
      const action=currentLanguage==='id'?item.action_id:item.action_en;
      const sev=String(item.severity||'warning').toLowerCase();
      return `<article class="card notification-item ${esc(sev)}" data-notification-key="${esc(item.key)}">
        <span class="notification-indicator" aria-hidden="true"></span>
        <div class="notification-main">
          <div class="notification-title-line"><strong>${esc(title||'Notification')}</strong><span class="${sev==='critical'?'status-out':'status-open'}">${esc(notificationCopy(sev==='critical'?'CRITICAL':'WARNING',sev==='critical'?'KRITIS':'PERINGATAN'))}</span></div>
          <span class="notification-detail">${esc(detail||'')}</span>
          <div class="notification-meta"><span class="notification-category">${esc(item.category||'HACCP')}</span>${item.due_at?`<span class="notification-due">${esc(notificationDueText(item.due_at))}</span>`:''}</div>
        </div>
        <div class="notification-actions"><button class="secondary" type="button" data-notification-open="${esc(item.page||'dashboard')}">${esc(action||notificationCopy('Open','Buka'))}</button><button class="ghost" type="button" data-notification-snooze="${esc(item.key)}">${notificationCopy('Snooze 1h','Tunda 1 jam')}</button></div>
      </article>`;
    }).join('');
  }

  async function loadNotifications(showError=true) {
    if(!state.kitchen?.id) return;
    const {data,error}=await db.rpc('get_haccp_notifications',{p_kitchen_id:state.kitchen.id});
    if(error){
      if(showError) toast(notificationCopy('Notification Center is not available. Run the v3.9.1 SQL migration.','Pusat Notifikasi belum tersedia. Jalankan migrasi SQL v3.9.1.'),'error');
      console.error('Notification Center:',error);
      state.notifications={generated_at:null,total:0,critical:0,warning:0,info:0,items:[]};updateNotificationBadges();renderNotifications();return;
    }
    state.notifications=data||{generated_at:null,total:0,critical:0,warning:0,info:0,items:[]};
    try {
      const extra=await db.rpc('get_thawing_notifications',{p_kitchen_id:state.kitchen.id});
      if(!extra.error && extra.data?.items){
        const extraItems=extra.data.items||[];
        const baseItems=Array.isArray(state.notifications.items)?state.notifications.items:[];
        const merged=[...baseItems,...extraItems];
        state.notifications.items=merged;
        state.notifications.total=merged.length;
        state.notifications.critical=merged.filter(x=>x.severity==='critical').length;
        state.notifications.warning=merged.filter(x=>x.severity==='warning').length;
        state.notifications.info=merged.filter(x=>x.severity==='info').length;
      }
    } catch(e){ console.warn('Thawing notifications unavailable',e); }
    renderNotifications();
  }

  function startNotificationClock(){
    if(state.notificationTimer)clearInterval(state.notificationTimer);
    state.notificationTimer=setInterval(()=>{if(state.user&&state.kitchen)loadNotifications(false).catch(console.error);},60*1000);
  }

  async function snoozeNotification(key,minutes=60){
    const {error}=await db.rpc('snooze_haccp_notification',{p_kitchen_id:state.kitchen.id,p_notification_key:key,p_minutes:minutes});
    if(error){toast(error.message||notificationCopy('Could not snooze notification.','Notifikasi tidak dapat ditunda.'),'error');return;}
    toast(notificationCopy('Notification snoozed for 1 hour.','Notifikasi ditunda selama 1 jam.'),'good');
    await loadNotifications(false);
  }


  // v3.9.2 Thawing / Defrost Control
  function thawingCopy(en,id){ return currentLanguage==='id'?id:en; }
  function applyThawingLanguage(){
    const set=(id,en,idText)=>{const el=$(id);if(el)el.textContent=thawingCopy(en,idText);};
    set('navThawingLabel','Thawing Control','Kontrol Pencairan'); set('navThawingSettingsLabel','Thawing Standards','Standar Pencairan');
    set('thawingEyebrow','THAWING / DEFROST CONTROL','KONTROL PENCAIRAN / DEFROST'); set('thawingTitle','Thawing Control','Kontrol Pencairan');
    set('thawingDescription','Control frozen-food thawing with approved methods, repeated temperature checks and corrective actions.','Kendalikan pencairan makanan beku dengan metode yang disetujui, pemeriksaan suhu berulang, dan tindakan koreksi.');
    set('thawingActiveLabel','Active','Aktif'); set('thawingActiveSmall','thawing batches','batch pencairan'); set('thawingDueLabel','Check due','Pemeriksaan jatuh tempo'); set('thawingDueSmall','needs temperature check','perlu pemeriksaan suhu'); set('thawingOutLabel','Deviations','Deviasi'); set('thawingOutSmall','open OUT readings','pembacaan OUT terbuka'); set('thawingReadyLabel','Ready today','Siap hari ini'); set('thawingReadySmall','completed for use','selesai untuk digunakan');
    set('thawingGuidanceTitle','Use only a property-approved thawing method.','Gunakan hanya metode pencairan yang disetujui properti.'); set('thawingGuidanceBody','Monitoring interval, maximum temperature and duration come from the selected standard. An OUT reading requires corrective action.','Interval monitoring, suhu maksimum, dan durasi berasal dari standar yang dipilih. Pembacaan OUT memerlukan tindakan koreksi.'); set('manageThawingStandards','Manage Thawing Standards','Kelola Standar Pencairan'); set('recordsTabThawing','Thawing','Pencairan'); set('thawingRecordsTitle','Thawing / Defrost Records','Catatan Pencairan / Defrost');
  }
  function thawingMethodLabel(v){ return ({refrigeration:thawingCopy('Refrigeration','Refrigerasi'),running_water:thawingCopy('Running cold water','Air dingin mengalir'),microwave:thawingCopy('Microwave → immediate cooking','Microwave → segera dimasak'),cook_from_frozen:thawingCopy('Cook from frozen','Masak dari beku'),other:thawingCopy('Other approved method','Metode lain yang disetujui')})[v]||v||'—'; }
  function inputDateTimeValue(d=new Date()){ const x=new Date(d.getTime()-d.getTimezoneOffset()*60000); return x.toISOString().slice(0,16); }
  function thawingStandardById(id){ return state.thawingStandards.find(x=>x.id===id); }
  function latestThawReading(batch){ const arr=batch.readings||[]; return [...arr].sort((a,b)=>new Date(b.recorded_at)-new Date(a.recorded_at))[0]||null; }
  function thawingDueAt(batch){ const i=Number(batch.monitoring_interval_minutes_snapshot||0); if(!i)return null; const last=latestThawReading(batch); return new Date(new Date(last?.recorded_at||batch.started_at).getTime()+i*60000); }
  function thawingDueState(batch){ const due=thawingDueAt(batch); if(!due)return 'none'; const now=Date.now(), grace=Number(batch.overdue_grace_minutes_snapshot||30)*60000; if(now>due.getTime()+grace)return 'overdue'; if(now>=due.getTime()-Number(batch.reminder_minutes_snapshot||15)*60000)return 'due'; return 'ok'; }
  function thawingLimitText(s){ return s?.max_temperature!=null?`≤ ${s.max_temperature}${s.unit||'°C'}`:thawingCopy('Property-approved procedure','Prosedur yang disetujui properti'); }

  async function fetchThawingStandards(includeInactive=false){ let q=db.from('thawing_standards').select('*').eq('kitchen_id',state.kitchen.id).order('code'); if(!includeInactive)q=q.eq('active',true); const {data,error}=await q; if(error)throw error; state.thawingStandards=data||[]; return state.thawingStandards; }
  async function fetchThawingBatches(activeOnly=false){
    let q=db.from('thawing_batches').select(`*,creator:profiles!thawing_batches_created_by_fkey(full_name,email),completer:profiles!thawing_batches_completed_by_fkey(full_name,email),verifier:profiles!thawing_batches_verified_by_fkey(full_name,email),source_equipment:equipment!thawing_batches_source_equipment_id_fkey(code,name),thaw_equipment:equipment!thawing_batches_thaw_equipment_id_fkey(code,name),evidence:thawing_evidence(id,reading_id,storage_path,original_name,photo_kind,uploaded_at),readings:thawing_readings(id,actual_temperature,unit,status,limit_text_snapshot,notes,recorded_at,recordedBy:profiles!thawing_readings_recorded_by_fkey(full_name,email),actions:thawing_corrective_actions(id,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,createdBy:profiles!thawing_corrective_actions_created_by_fkey(full_name,email),verifier:profiles!thawing_corrective_actions_verified_by_fkey(full_name,email)))`).eq('kitchen_id',state.kitchen.id).order('started_at',{ascending:false}).limit(150);
    if(activeOnly)q=q.eq('status','active'); const {data,error}=await q; if(error)throw error; state.thawingBatches=data||[]; return state.thawingBatches;
  }
  function thawingActionForReading(r){ const a=r?.actions; return Array.isArray(a)?a[0]||null:a||null; }
  function renderThawingBatchCard(b){
    const latest=latestThawReading(b), due=thawingDueAt(b), dueState=thawingDueState(b); const out=(b.readings||[]).filter(r=>r.status==='OUT'&&!thawingActionForReading(r)).length; const awaiting=(b.readings||[]).filter(r=>{const a=thawingActionForReading(r);return a&&!a.verified_at;}).length;
    return `<article class="card thawing-batch-card ${dueState==='overdue'?'overdue':''}"><div class="section-head"><div><div class="eyebrow">${esc(b.standard_code_snapshot)} · ${esc(thawingMethodLabel(b.method_snapshot))}</div><h2>${esc(b.product_name)}${b.batch_reference?` · ${esc(b.batch_reference)}`:''}</h2><p class="muted">${esc(b.quantity??'')} ${esc(b.quantity_unit||'')} ${b.intended_use?`· ${esc(b.intended_use)}`:''}</p></div><span class="status-pill ${b.status==='active'?'pending':'pass'}">${esc(String(b.status).toUpperCase())}</span></div>
      <div class="thawing-meta-grid"><span><b>${thawingCopy('Started','Mulai')}</b>${fmtDateTime(b.started_at)}</span><span><b>${thawingCopy('Location','Lokasi')}</b>${esc(b.thaw_location||b.thaw_equipment?.name||'—')}</span><span><b>${thawingCopy('Limit','Batas')}</b>${esc(b.max_temperature_snapshot!=null?`≤ ${b.max_temperature_snapshot}${b.unit_snapshot}`:'Procedure based')}</span><span><b>${thawingCopy('Latest','Terakhir')}</b>${latest?`${esc(latest.actual_temperature)}${esc(latest.unit)} · ${esc(latest.status)}`:'—'}</span></div>
      ${b.status==='active'?`<div class="thawing-due ${dueState}">${due?`${thawingCopy('Next check','Pemeriksaan berikutnya')}: ${fmtDateTime(due)} · ${dueState==='overdue'?thawingCopy('OVERDUE','TERLAMBAT'):dueState==='due'?thawingCopy('DUE SOON','SEGERA JATUH TEMPO'):thawingCopy('On schedule','Sesuai jadwal')}`:thawingCopy('No recurring interval configured.','Tidak ada interval berulang yang dikonfigurasi.')}${b.expected_complete_at?`<br>${thawingCopy('Expected completion','Perkiraan selesai')}: ${fmtDateTime(b.expected_complete_at)}`:''}</div>`:''}
      ${(out||awaiting)?`<div class="verification-strip warning">${out?`${out} ${thawingCopy('reading(s) need corrective action','pembacaan perlu tindakan koreksi')}`:''}${out&&awaiting?' · ':''}${awaiting?`${awaiting} ${thawingCopy('action(s) await verification','tindakan menunggu verifikasi')}`:''}</div>`:''}
      <div class="card-actions">${b.status==='active'?`<button class="primary" type="button" data-thaw-reading="${esc(b.id)}">${thawingCopy('Record Temperature','Catat Suhu')}</button><button class="secondary" type="button" data-thaw-complete="${esc(b.id)}">${thawingCopy('Complete / Disposition','Selesaikan / Disposisi')}</button>`:''}${(b.readings||[]).some(r=>r.status==='OUT')?`<button class="secondary" type="button" data-thaw-actions="${esc(b.id)}">${thawingCopy('View Deviations','Lihat Deviasi')}</button>`:''}${(b.evidence||[]).length?`<button class="secondary" type="button" data-thaw-evidence="${esc(b.id)}">${thawingCopy('Photos','Foto')} · ${(b.evidence||[]).length}</button>`:''}</div></article>`;
  }
  async function loadThawing(){
    applyThawingLanguage(); try{ await Promise.all([fetchThawingStandards(false),fetchThawingBatches(false)]); const active=state.thawingBatches.filter(b=>b.status==='active'); const due=active.filter(b=>['due','overdue'].includes(thawingDueState(b))).length; const openOut=active.reduce((n,b)=>n+(b.readings||[]).filter(r=>r.status==='OUT'&&!thawingActionForReading(r)).length,0); const today=kitchenDate(); const ready=state.thawingBatches.filter(b=>b.status==='ready'&&String(b.completed_at||'').slice(0,10)===today).length; $('thawingActiveCount').textContent=active.length; $('thawingDueCount').textContent=due; $('thawingOutCount').textContent=openOut; $('thawingReadyCount').textContent=ready; $('navThawingBadge').textContent=due+openOut; $('navThawingBadge').classList.toggle('hidden',due+openOut===0); $('thawingBatchList').innerHTML=active.length?active.map(renderThawingBatchCard).join(''):`<article class="card empty">${thawingCopy('No active thawing batches.','Tidak ada batch pencairan aktif.')}</article>`; }catch(e){toast(e.message||'Could not load thawing control.','error');}
  }
  function fillThawingBatchOptions(){ $('thawingBatchStandard').innerHTML=state.thawingStandards.map(s=>`<option value="${esc(s.id)}">${esc(s.code)} — ${esc(s.name)}</option>`).join(''); const eq=(state.equipment||[]).filter(e=>e.active!==false); const opts='<option value="">Not specified</option>'+eq.map(e=>`<option value="${esc(e.id)}">${esc(e.code)} — ${esc(e.name)}</option>`).join(''); $('thawingSourceEquipment').innerHTML=opts; $('thawingTargetEquipment').innerHTML=opts; updateThawingBatchPreview(); }
  function updateThawingBatchPreview(){ const s=thawingStandardById($('thawingBatchStandard')?.value); if(!s)return; $('thawingBatchStandardPreview').innerHTML=`<b>${esc(s.code)} — ${esc(s.name)}</b><br>${esc(thawingMethodLabel(s.method))} · ${esc(thawingLimitText(s))}${s.monitoring_interval_minutes?` · ${s.monitoring_interval_minutes} min interval`:''}${s.maximum_duration_minutes?` · max ${s.maximum_duration_minutes} min`:''}`; if(s.maximum_duration_minutes&&$('thawingStartedAt').value){ const d=new Date($('thawingStartedAt').value); d.setMinutes(d.getMinutes()+Number(s.maximum_duration_minutes)); $('thawingExpectedAt').value=inputDateTimeValue(d); } }
  async function openThawingBatch(){ if(!state.thawingStandards.length)await fetchThawingStandards(false); if(!state.thawingStandards.length){toast(thawingCopy('Create an active thawing standard first.','Buat standar pencairan aktif terlebih dahulu.'),'error');return;} fillThawingBatchOptions(); $('thawingBatchForm').reset(); $('thawingStartedAt').value=inputDateTimeValue(); fillThawingBatchOptions(); $('thawingBatchDialog').showModal(); }
  async function saveThawingBatch(e){ e.preventDefault(); const payload={kitchen_id:state.kitchen.id,standard_id:$('thawingBatchStandard').value,product_name:$('thawingBatchProduct').value.trim(),batch_reference:$('thawingBatchRef').value.trim()||null,quantity:nullableNumber($('thawingBatchQty').value),quantity_unit:$('thawingBatchQtyUnit').value.trim()||null,intended_use:$('thawingBatchUse').value.trim()||null,source_equipment_id:$('thawingSourceEquipment').value||null,thaw_equipment_id:$('thawingTargetEquipment').value||null,thaw_location:$('thawingLocation').value.trim()||null,started_at:new Date($('thawingStartedAt').value).toISOString(),expected_complete_at:$('thawingExpectedAt').value?new Date($('thawingExpectedAt').value).toISOString():null,created_by:state.user.id}; const {error}=await db.from('thawing_batches').insert(payload); if(error){toast(error.message,'error');return;} $('thawingBatchDialog').close(); toast(thawingCopy('Thawing batch started.','Batch pencairan dimulai.'),'good'); await loadThawing(); await loadNotifications(false); }

  function clearThawingPhotoDraft(){ for(const x of state.thawingPhotoDraft||[])if(x.previewUrl)URL.revokeObjectURL(x.previewUrl); state.thawingPhotoDraft=[]; renderThawingPhotoDraft(); }
  function renderThawingPhotoDraft(){ const el=$('thawingPhotoPreview');if(!el)return;el.innerHTML=(state.thawingPhotoDraft||[]).map((x,i)=>`<article class="receiving-photo-item"><img src="${esc(x.previewUrl)}" alt=""><select data-thaw-photo-kind="${i}"><option value="product" ${x.kind==='product'?'selected':''}>Product</option><option value="temperature" ${x.kind==='temperature'?'selected':''}>Temperature</option><option value="label" ${x.kind==='label'?'selected':''}>Label / Lot</option><option value="condition" ${x.kind==='condition'?'selected':''}>Condition</option><option value="corrective" ${x.kind==='corrective'?'selected':''}>Corrective</option><option value="other" ${x.kind==='other'?'selected':''}>Other</option></select><button type="button" class="icon-btn" data-remove-thaw-photo="${i}">×</button></article>`).join(''); }
  async function addThawingPhotos(files){ const list=[...files||[]]; if(state.thawingPhotoDraft.length+list.length>3){toast(thawingCopy('Maximum 3 photos per temperature check.','Maksimum 3 foto per pemeriksaan suhu.'),'error');return;} for(const file of list){ if(!file.type.startsWith('image/'))continue; const blob=await compressReceivingPhoto(file); state.thawingPhotoDraft.push({blob,originalName:file.name||'thawing-photo.jpg',kind:'product',previewUrl:URL.createObjectURL(blob)}); } renderThawingPhotoDraft(); if($('thawingPhotoInput'))$('thawingPhotoInput').value=''; }
  async function uploadThawingEvidence(batchId,readingId){ const saved=[]; for(let i=0;i<state.thawingPhotoDraft.length;i++){ const x=state.thawingPhotoDraft[i],path=`${state.kitchen.id}/${batchId}/${readingId}/${Date.now()}-${i}.jpg`; const up=await db.storage.from('thawing-evidence').upload(path,x.blob,{contentType:'image/jpeg',upsert:false}); if(up.error)throw up.error; const ins=await db.from('thawing_evidence').insert({kitchen_id:state.kitchen.id,batch_id:batchId,reading_id:readingId,storage_path:path,original_name:x.originalName,mime_type:'image/jpeg',file_size:x.blob.size,photo_kind:x.kind,uploaded_by:state.user.id}); if(ins.error)throw ins.error; saved.push(path); } return saved; }
  async function viewThawingEvidence(batchId){ const b=state.thawingBatches.find(x=>x.id===batchId); if(!b)return; const photos=b.evidence||[]; $('thawingEvidenceTitle').textContent=`${b.product_name}${b.batch_reference?' · '+b.batch_reference:''}`; if(!photos.length){$('thawingEvidenceGrid').innerHTML='<div class="empty">No photo evidence.</div>'; $('thawingEvidenceDialog').showModal();return;} const cards=[]; for(const p of photos){const {data,error}=await db.storage.from('thawing-evidence').createSignedUrl(p.storage_path,900); if(!error&&data?.signedUrl)cards.push(`<figure><img src="${esc(data.signedUrl)}" alt=""><figcaption><b>${esc(String(p.photo_kind||'evidence').replaceAll('_',' '))}</b><br>${esc(p.original_name||'')}</figcaption></figure>`);} $('thawingEvidenceGrid').innerHTML=cards.join('')||'<div class="empty">Photo evidence could not be loaded.</div>'; $('thawingEvidenceDialog').showModal(); }

  function openThawingReading(id){ const b=state.thawingBatches.find(x=>x.id===id); if(!b)return; $('thawingReadingBatchId').value=id; $('thawingReadingTitle').textContent=b.product_name; $('thawingReadingContext').innerHTML=`<b>${esc(b.standard_code_snapshot)} — ${esc(b.standard_name_snapshot)}</b><br>${thawingCopy('Limit','Batas')}: ${esc(b.max_temperature_snapshot!=null?`≤ ${b.max_temperature_snapshot}${b.unit_snapshot}`:'Procedure based')}`; $('thawingReadingTemp').value=''; $('thawingReadingNotes').value=''; clearThawingPhotoDraft(); updateThawingReadingPreview(); $('thawingReadingDialog').showModal(); }
  function updateThawingReadingPreview(){ const b=state.thawingBatches.find(x=>x.id===$('thawingReadingBatchId')?.value); const v=nullableNumber($('thawingReadingTemp')?.value); const out=v!=null&&b?.max_temperature_snapshot!=null&&v>Number(b.max_temperature_snapshot); const el=$('thawingReadingPreview'); if(!el)return; el.className=`monitor-result ${v==null?'neutral':out?'out':'pass'}`; el.textContent=v==null?thawingCopy('Enter temperature','Masukkan suhu'):out?thawingCopy('OUT OF LIMIT — corrective action required','DI LUAR BATAS — tindakan koreksi diperlukan'):thawingCopy('PASS — within approved limit','PASS — dalam batas yang disetujui'); }
  async function saveThawingReading(e){ e.preventDefault(); const batchId=$('thawingReadingBatchId').value; const {data,error}=await db.from('thawing_readings').insert({kitchen_id:state.kitchen.id,batch_id:batchId,actual_temperature:Number($('thawingReadingTemp').value),unit:'°C',status:'PASS',limit_text_snapshot:'',notes:$('thawingReadingNotes').value.trim()||null,recorded_by:state.user.id}).select('*').single(); if(error){toast(error.message,'error');return;} try{if(state.thawingPhotoDraft.length)await uploadThawingEvidence(batchId,data.id);}catch(photoError){toast(thawingCopy('Reading saved, but photo upload failed: ','Pembacaan tersimpan, tetapi unggah foto gagal: ')+(photoError.message||''),'error');} clearThawingPhotoDraft(); $('thawingReadingDialog').close(); if(data.status==='OUT'){ await loadThawing(); openThawingAction(data.id,batchId); toast(thawingCopy('OUT reading saved — complete corrective action.','Pembacaan OUT disimpan — selesaikan tindakan koreksi.'),'error'); } else { toast(thawingCopy('Thawing temperature saved.','Suhu pencairan disimpan.'),'good'); await loadThawing(); } await loadNotifications(false); }
  function openThawingAction(readingId,batchId=''){ const b=batchId?state.thawingBatches.find(x=>x.id===batchId):state.thawingBatches.find(x=>(x.readings||[]).some(r=>r.id===readingId)); const r=b?.readings?.find(x=>x.id===readingId); $('thawingActionReadingId').value=readingId; $('thawingActionImmediate').value=''; $('thawingActionDisposition').value=''; $('thawingActionFollowup').value=''; $('thawingActionNotes').value=''; $('thawingActionContext').textContent=b?`${b.product_name}${b.batch_reference?' · '+b.batch_reference:''}${r?' · '+r.actual_temperature+r.unit:''}`:thawingCopy('Thawing deviation','Deviasi pencairan'); $('thawingActionDialog').showModal(); }
  async function saveThawingAction(e){ e.preventDefault(); const {error}=await db.from('thawing_corrective_actions').insert({reading_id:$('thawingActionReadingId').value,immediate_action:$('thawingActionImmediate').value.trim(),product_disposition:$('thawingActionDisposition').value.trim()||null,followup_temperature:nullableNumber($('thawingActionFollowup').value),notes:$('thawingActionNotes').value.trim()||null,created_by:state.user.id}); if(error){toast(error.message,'error');return;} $('thawingActionDialog').close(); toast(thawingCopy('Corrective action saved.','Tindakan koreksi disimpan.'),'good'); await loadThawing(); await loadCorrectiveActions(); await loadNotifications(false); }
  function openThawingComplete(id){ $('thawingCompleteBatchId').value=id; $('thawingCompleteStatus').value='ready'; $('thawingCompleteNotes').value=''; $('thawingCompleteDialog').showModal(); }
  async function saveThawingComplete(e){ e.preventDefault(); const {error}=await db.rpc('complete_thawing_batch',{p_batch_id:$('thawingCompleteBatchId').value,p_status:$('thawingCompleteStatus').value,p_notes:$('thawingCompleteNotes').value.trim()||null}); if(error){toast(error.message,'error');return;} $('thawingCompleteDialog').close(); toast(thawingCopy('Thawing batch status updated.','Status batch pencairan diperbarui.'),'good'); await loadThawing(); await loadNotifications(false); }

  function renderThawingCorrectiveCard(item){ const {batch:b,reading:r,action:a}=item,verified=!!a?.verified_at; return `<article class="deviation-card ${verified?'resolved':''}"><div class="deviation-card-head"><div><span class="record-source-badge">Thawing / Defrost</span><h3>${esc(b.product_name)}${b.batch_reference?` · ${esc(b.batch_reference)}`:''} · ${esc(r.actual_temperature)}${esc(r.unit)}</h3><p>${fmtDateTime(r.recorded_at)} · ${esc(b.standard_code_snapshot)} · ${t('corrective.limit')} ${esc(r.limit_text_snapshot)}</p></div><span class="${verified?'status-verified':'status-open'}">${verified?t('corrective.verified'):a?t('corrective.awaiting'):t('corrective.required')}</span></div>${a?`<div class="action-detail"><div><strong>${t('corrective.immediate')}:</strong> ${esc(a.immediate_action)}</div>${a.product_disposition?`<div><strong>${t('corrective.disposition')}:</strong> ${esc(a.product_disposition)}</div>`:''}${a.followup_temperature!=null?`<div><strong>${t('corrective.followup')}:</strong> ${esc(a.followup_temperature)}°C</div>`:''}${verified?`<div><strong>${t('corrective.verifiedBy')}:</strong> ${esc(a.verifier?.full_name||a.verifier?.email||'Supervisor')} · ${fmtDateTime(a.verified_at)}</div>`:''}</div>`:''}<div class="card-actions">${!a?`<button class="primary" data-thaw-correct-reading="${esc(r.id)}">${t('corrective.complete')}</button>`:''}${a&&!verified&&hasRole('supervisor')?`<button class="primary" data-thaw-verify-action="${esc(a.id)}">${t('corrective.verify')}</button>`:''}</div></article>`; }
  async function getThawingDeviations(){ const batches=await fetchThawingBatches(false); const out=[]; for(const b of batches)for(const r of (b.readings||[]))if(r.status==='OUT')out.push({source:'thawing',recordedAt:r.recorded_at,batch:b,reading:r,action:thawingActionForReading(r)}); return out; }
  function openThawingVerify(id){ $('thawingVerifyActionId').value=id; $('thawingVerifyNotes').value=''; $('thawingVerifyDialog').showModal(); }
  async function verifyThawingAction(e){ e.preventDefault(); const {error}=await db.rpc('verify_thawing_corrective_action',{p_action_id:$('thawingVerifyActionId').value,p_notes:$('thawingVerifyNotes').value.trim()}); if(error){toast(error.message,'error');return;} $('thawingVerifyDialog').close(); toast(t('corrective.verifiedToast'),'good'); await loadCorrectiveActions(); await loadNotifications(false); }

  function resetThawingStandardForm(){ $('thawingStandardForm').reset(); $('thawingStandardId').value=''; $('thawingStandardUnit').value='°C'; $('thawingStandardReminder').value='15'; $('thawingStandardGrace').value='30'; $('thawingStandardFormTitle').textContent=thawingCopy('Add thawing standard','Tambah standar pencairan'); $('thawingStandardCancel').classList.add('hidden'); }
  function renderThawingStandards(){ $('thawingStandardCount').textContent=state.thawingStandards.length; $('thawingStandardList').innerHTML=state.thawingStandards.length?state.thawingStandards.map(x=>`<article class="setting-row ${x.active?'':'inactive'}"><div><strong>${esc(x.code)} — ${esc(x.name)}</strong><span>${esc(thawingMethodLabel(x.method))} · ${esc(thawingLimitText(x))}${x.monitoring_interval_minutes?` · ${x.monitoring_interval_minutes} min`:''}${x.maximum_duration_minutes?` · max ${x.maximum_duration_minutes} min`:''}</span></div><div class="row-actions"><button class="secondary compact-btn" data-edit-thawing-standard="${esc(x.id)}">Edit</button><button class="secondary compact-btn" data-toggle-thawing-standard="${esc(x.id)}">${x.active?'Archive':'Restore'}</button></div></article>`).join(''):'<div class="empty">No thawing standards configured.</div>'; }
  async function loadThawingSettings(){ applyThawingLanguage(); try{await fetchThawingStandards(true);renderThawingStandards();}catch(e){toast(e.message,'error');} }
  function editThawingStandard(id){ const x=state.thawingStandards.find(s=>s.id===id); if(!x)return; $('thawingStandardId').value=x.id;$('thawingStandardCode').value=x.code;$('thawingStandardName').value=x.name;$('thawingStandardMethod').value=x.method;$('thawingStandardUnit').value=x.unit||'°C';$('thawingStandardMaxTemp').value=x.max_temperature??'';$('thawingStandardInterval').value=x.monitoring_interval_minutes??'';$('thawingStandardDuration').value=x.maximum_duration_minutes??'';$('thawingStandardReminder').value=x.reminder_minutes??15;$('thawingStandardGrace').value=x.overdue_grace_minutes??30;$('thawingStandardInstruction').value=x.post_thaw_instruction||'';$('thawingStandardVerify').checked=!!x.verification_required;$('thawingStandardNotes').value=x.notes||'';$('thawingStandardFormTitle').textContent=thawingCopy('Edit thawing standard','Edit standar pencairan');$('thawingStandardCancel').classList.remove('hidden'); }
  async function saveThawingStandard(e){ e.preventDefault(); const id=$('thawingStandardId').value,payload={kitchen_id:state.kitchen.id,code:$('thawingStandardCode').value.trim(),name:$('thawingStandardName').value.trim(),method:$('thawingStandardMethod').value,unit:$('thawingStandardUnit').value.trim()||'°C',max_temperature:nullableNumber($('thawingStandardMaxTemp').value),monitoring_interval_minutes:nullableNumber($('thawingStandardInterval').value),maximum_duration_minutes:nullableNumber($('thawingStandardDuration').value),reminder_minutes:Number($('thawingStandardReminder').value||15),overdue_grace_minutes:Number($('thawingStandardGrace').value||30),post_thaw_instruction:$('thawingStandardInstruction').value.trim()||null,verification_required:$('thawingStandardVerify').checked,notes:$('thawingStandardNotes').value.trim()||null,updated_by:state.user.id}; let q=id?db.from('thawing_standards').update(payload).eq('id',id):db.from('thawing_standards').insert({...payload,created_by:state.user.id}); const {error}=await q; if(error){toast(error.message,'error');return;} resetThawingStandardForm(); toast(thawingCopy('Thawing standard saved.','Standar pencairan disimpan.'),'good'); await loadThawingSettings(); }
  async function toggleThawingStandard(id){ const x=state.thawingStandards.find(s=>s.id===id); if(!x)return; const {error}=await db.from('thawing_standards').update({active:!x.active,updated_by:state.user.id}).eq('id',id); if(error){toast(error.message,'error');return;} await loadThawingSettings(); }

  async function getThawingRecordsForDate(date){ const start=kitchenDayBoundaryUtc(date),end=kitchenDayBoundaryUtc(addCalendarDays(date,1)); const {data,error}=await db.from('thawing_batches').select(`*,creator:profiles!thawing_batches_created_by_fkey(full_name,email),completer:profiles!thawing_batches_completed_by_fkey(full_name,email),verifier:profiles!thawing_batches_verified_by_fkey(full_name,email),evidence:thawing_evidence(id,reading_id,storage_path,original_name,photo_kind,uploaded_at),readings:thawing_readings(id,actual_temperature,unit,status,limit_text_snapshot,notes,recorded_at,recordedBy:profiles!thawing_readings_recorded_by_fkey(full_name,email),actions:thawing_corrective_actions(id,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,verifier:profiles!thawing_corrective_actions_verified_by_fkey(full_name,email)))`).eq('kitchen_id',state.kitchen.id).gte('started_at',start).lt('started_at',end).order('started_at',{ascending:false}); if(error)throw error; return data||[]; }
  async function loadThawingRecords(){ try{const date=$('recordDate').value||kitchenDate(),rows=await getThawingRecordsForDate(date); state.thawingBatches=rows; const ready=rows.filter(x=>x.status==='ready').length,out=rows.reduce((n,b)=>n+(b.readings||[]).filter(r=>r.status==='OUT').length,0); $('thawingRecordsSummary').innerHTML=`<span>${rows.length} ${thawingCopy('batches','batch')}</span><span>${ready} ${thawingCopy('ready','siap')}</span><span>${out} ${thawingCopy('deviations','deviasi')}</span>`; $('thawingRecordsBody').innerHTML=rows.length?rows.map(b=>{const r=latestThawReading(b);return `<tr><td>${fmtDateTime(b.started_at)}</td><td><b>${esc(b.product_name)}</b>${b.batch_reference?`<br>${esc(b.batch_reference)}`:''}</td><td>${esc(thawingMethodLabel(b.method_snapshot))}<br><span class="muted">${esc(b.standard_code_snapshot)}</span></td><td>${esc(b.thaw_location||'—')}</td><td>${r?`${esc(r.actual_temperature)}${esc(r.unit)} · ${esc(r.status)}`:'—'}</td><td>${esc(String(b.status).toUpperCase())}</td><td>${esc(b.creator?.full_name||b.creator?.email||'Staff')}</td><td>${(b.readings||[]).filter(x=>x.status==='OUT').length} OUT${(b.evidence||[]).length?`<br><button class="secondary compact-btn" type="button" data-thaw-record-evidence="${esc(b.id)}">${thawingCopy('Photos','Foto')} · ${(b.evidence||[]).length}</button>`:''}${b.verification_status==='PENDING'&&hasRole('supervisor')?`<br><button class="secondary compact-btn" type="button" data-verify-thawing-batch="${esc(b.id)}">${thawingCopy('Verify batch','Verifikasi batch')}</button>`:b.verification_status==='VERIFIED'?`<br><span class="status-verified">VERIFIED</span>`:''}</td></tr>`;}).join(''):`<tr><td colspan="8">${thawingCopy('No thawing batches started on this date.','Tidak ada batch pencairan yang dimulai pada tanggal ini.')}</td></tr>`;}catch(e){toast(e.message,'error');} }

  function openThawingBatchVerify(id){ $('thawingBatchVerifyId').value=id; $('thawingBatchVerifyNotes').value=''; $('thawingBatchVerifyDialog').showModal(); }
  async function verifyThawingBatch(e){ e.preventDefault(); const {error}=await db.rpc('verify_thawing_batch',{p_batch_id:$('thawingBatchVerifyId').value,p_notes:$('thawingBatchVerifyNotes').value.trim()}); if(error){toast(error.message,'error');return;} $('thawingBatchVerifyDialog').close(); toast(thawingCopy('Thawing batch verified.','Batch pencairan diverifikasi.'),'good'); await loadThawingRecords(); await loadNotifications(false); }

  async function buildThawingReportHtml(date){ const rows=await getThawingRecordsForDate(date); const p=state.property||{}; const logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}">`:''; const pass=rows.reduce((n,b)=>n+(b.readings||[]).filter(r=>r.status==='PASS').length,0),out=rows.reduce((n,b)=>n+(b.readings||[]).filter(r=>r.status==='OUT').length,0); return `<!doctype html><html><head><meta charset="utf-8"><title>Thawing HACCP ${esc(date)}</title><style>@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;font-size:9px;color:#111}.property-head{display:flex;gap:12px;border-bottom:2px solid #111;padding-bottom:8px}.property-logo{max-width:95px;max-height:52px}h1{font-size:20px}table{width:100%;border-collapse:collapse}th,td{padding:5px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{font-size:7px;text-transform:uppercase}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.box{border:1px solid #ccc;padding:7px}.box b{display:block;font-size:14px}.muted{color:#666}.out{font-weight:bold}.footer{margin-top:12px;border-top:1px solid #ddd;padding-top:7px;color:#666}</style></head><body>${p.property_name||p.logo_data_url?`<div class="property-head">${logo}<div><b>${esc(p.property_name||'')}</b><br>${esc(p.address||'')}</div></div>`:''}<h1>${thawingCopy('THAWING / DEFROST HACCP RECORD','CATATAN HACCP PENCAIRAN / DEFROST')} · ${esc(state.kitchen.name)}</h1><div>${esc(date)} · ${esc(kitchenTimeZone())}</div><div class="meta"><div class="box">${thawingCopy('Batches','Batch')}<b>${rows.length}</b></div><div class="box">PASS ${thawingCopy('readings','pembacaan')}<b>${pass}</b></div><div class="box">OUT ${thawingCopy('readings','pembacaan')}<b>${out}</b></div><div class="box">${thawingCopy('Ready','Siap')}<b>${rows.filter(x=>x.status==='ready').length}</b></div></div><table><thead><tr><th>${thawingCopy('Product / batch','Produk / batch')}</th><th>${thawingCopy('Standard / method','Standar / metode')}</th><th>${thawingCopy('Start / expected','Mulai / perkiraan')}</th><th>${thawingCopy('Location','Lokasi')}</th><th>${thawingCopy('Readings','Pembacaan')}</th><th>${thawingCopy('Deviation / action','Deviasi / tindakan')}</th><th>${thawingCopy('Final status','Status akhir')}</th></tr></thead><tbody>${rows.map(b=>`<tr><td><b>${esc(b.product_name)}</b>${b.batch_reference?`<br>${esc(b.batch_reference)}`:''}${b.intended_use?`<br><span class="muted">${esc(b.intended_use)}</span>`:''}</td><td>${esc(b.standard_code_snapshot)} — ${esc(b.standard_name_snapshot)}<br><span class="muted">${esc(thawingMethodLabel(b.method_snapshot))} · ${esc(b.max_temperature_snapshot!=null?`≤ ${b.max_temperature_snapshot}${b.unit_snapshot}`:'Procedure based')}</span></td><td>${fmtDateTime(b.started_at)}${b.expected_complete_at?`<br>${fmtDateTime(b.expected_complete_at)}`:''}</td><td>${esc(b.thaw_location||'—')}</td><td>${(b.readings||[]).length?(b.readings||[]).slice().sort((a,b)=>new Date(a.recorded_at)-new Date(b.recorded_at)).map(r=>`${fmtTime(r.recorded_at)} · ${esc(r.actual_temperature)}${esc(r.unit)} · <b>${esc(r.status)}</b>`).join('<br>'):'—'}</td><td>${(b.readings||[]).filter(r=>r.status==='OUT').map(r=>{const a=thawingActionForReading(r);return `<span class="out">${esc(r.actual_temperature)}${esc(r.unit)}</span>${a?` · ${esc(a.immediate_action)}${a.verified_at?' · VERIFIED':' · awaiting verify'}`:' · ACTION REQUIRED'}`;}).join('<br>')||'—'}</td><td>${esc(String(b.status).toUpperCase())}${b.completed_at?`<br>${fmtDateTime(b.completed_at)}`:''}${b.completion_notes?`<br><span class="muted">${esc(b.completion_notes)}</span>`:''}${b.verification_status==='VERIFIED'?`<br><b>VERIFIED</b>${b.verifier?` · ${esc(b.verifier.full_name||b.verifier.email||'Supervisor')}`:''}`:b.verification_status==='PENDING'?'<br><b>VERIFICATION PENDING</b>':''}</td></tr>`).join('')}</tbody></table><div class="footer">${thawingCopy('Limits and instructions shown are historical snapshots of the property-approved thawing standard used when each batch was started.','Batas dan instruksi yang ditampilkan adalah snapshot historis dari standar pencairan yang disetujui properti saat setiap batch dimulai.')}</div></body></html>`; }
  async function runThawingReport(mode = 'print') {
    const date = $('recordDate').value || kitchenDate();

    const nativePdfShare =
      mode === 'download' &&
      window.HACCPMobile?.isNative?.() &&
      typeof window.HACCPMobile?.sharePdfHtml === 'function';

    const popup =
      mode === 'view' || nativePdfShare
        ? null
        : openReportWindow();

    if (mode !== 'view' && !nativePdfShare && !popup) {
      toast(
        'Allow pop-ups so the HACCP record window can open.',
        'error'
      );
      return;
    }

    try {
      const html =
        await buildThawingReportHtml(date);

      if (mode === 'view') {
        return showRecordPreview(
          `${thawingCopy(
            'Thawing Records',
            'Catatan Pencairan'
          )} · ${date}`,
          html
        );
      }

      if (mode === 'download') {
        const filename =
          `Thawing-HACCP-${date}.pdf`;

        if (nativePdfShare) {
          await window.HACCPMobile.sharePdfHtml({
            html,
            filename,
            title:
              `${thawingCopy(
                'Thawing Records',
                'Catatan Pencairan'
              )} · ${date}`,
            text:
              'HACCP thawing record exported from HACCP Control.'
          });

          return;
        }

        writeReportWindow(
          popup,
          pdfDownloadDocument(
            html,
            filename
          )
        );

        return;
      }

      writeReportWindow(
        popup,
        html
      );

      popup.addEventListener(
        'load',
        () =>
          setTimeout(
            () => popup.print(),
            250
          ),
        { once: true }
      );

    } catch (error) {
      if (popup && !popup.closed) {
        popup.close();
      }

      toast(
        error.message ||
          'Could not prepare thawing HACCP record.',
        'error'
      );
    }
  }

  /* =========================================================
     MOBILE 1.2 - NATIVE QR INTERNAL ROUTING
  ========================================================= */

  async function handleNativeQrScan(event) {
    const type = event?.detail?.type;
    const id = event?.detail?.id;

    if (!type || !id) {
      toast('Invalid HACCP QR code.', 'error');
      return;
    }

    if (!state.user || !state.kitchen) {
      toast('Please sign in before scanning HACCP QR codes.', 'error');
      return;
    }

    try {

      if (type === 'equipment') {
        let equipment = state.equipment.find(x => x.id === id);

        if (!equipment) {
          await loadConfiguration();
          equipment = state.equipment.find(x => x.id === id);
        }

        if (!equipment) {
          toast('Equipment QR is not active in this kitchen.', 'error');
          return;
        }

        state.monitoringLocationId =
          equipment.location_id || '__other__';

        localStorage.setItem(
          'haccpMonitoringLocation',
          state.monitoringLocationId
        );

        await navigate('check');

        requestAnimationFrame(() => {
          const card = document.querySelector(
            `[data-monitor-equipment="${CSS.escape(id)}"]`
          );

          if (!card) return;

          card.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          card.querySelector('[data-monitor-temp]')?.focus();
        });

        return;
      }

      if (type === 'sanitation') {
        await navigate('sanitation');

        const exists =
          (state.sanitationStandards || []).some(
            x => x.id === id
          );

        if (!exists) {
          toast('Sanitation QR is not active in this kitchen.', 'error');
          return;
        }

        openSanitationRecord(id);
        return;
      }

      if (type === 'thawing') {
        await navigate('thawing');

        const exists =
          (state.thawingStandards || []).some(
            x => x.id === id
          );

        if (!exists) {
          toast('Thawing QR is not active in this kitchen.', 'error');
          return;
        }

        await openThawingBatch();

        $('thawingBatchStandard').value = id;
        updateThawingBatchPreview();

        return;
      }

      toast('Unsupported HACCP QR code.', 'error');

    } catch (error) {
      console.error('[HACCP Native QR]', error);
      toast(error?.message || 'Could not open this HACCP QR code.', 'error');
    }
  }

  window.addEventListener(
    'haccp:native-qr',
    handleNativeQrScan
  );

  async function getDailyLogs(date) {
    const { data, error } = await db
      .from('temperature_logs')
      .select(`id,recorded_at,record_date,actual_temperature,status,batch_reference,notes,monitoring_slot,critical_limit_text_snapshot,limit_code_snapshot,limit_name_snapshot,unit_snapshot,equipment_id,equipment_code_snapshot,equipment_name_snapshot,equipment_storage_type_snapshot,location_name_snapshot,monitoring_slots_snapshot,equipment(code,name,storage_type,location_id,locations(name)),profiles!temperature_logs_recorded_by_fkey(full_name,email),corrective_actions(id,deviation,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,profiles!corrective_actions_created_by_fkey(full_name),verifier:profiles!corrective_actions_verified_by_fkey(full_name))`)
      .eq('kitchen_id', state.kitchen.id)
      .eq('record_date', date)
      .order('recorded_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function loadDashboard() {
    applyDashboardLanguage();
    const date = kitchenDate();
    $('dashboardDate').textContent = `${fmtDate(new Date(`${date}T12:00:00`))} · ${state.kitchen.name}`;
    const [logs, processReport] = await Promise.all([getDailyLogs(date), getDailyProcessReport(date)]);
    const openStorage = logs.filter(l => { const action = correctiveActionFor(l); return l.status === 'OUT' && (!action || !action.verified_at); });
    const processBatchMap = new Map((processReport.batches || []).map(b => [b.id, b]));
    const openProcess = (processReport.readings || []).filter(r => { const action = processActionFor(r); return r.status === 'OUT' && (!action || !action.verified_at); });
    const open = [
      ...openStorage.map(log => ({source:'storage', recordedAt:log.recorded_at, log})),
      ...openProcess.map(reading => ({source:'process', recordedAt:reading.recorded_at, reading, batch:processBatchMap.get(reading.batch_id)}))
    ].sort((a,b)=>new Date(b.recordedAt)-new Date(a.recordedAt));
    $('statChecks').textContent = logs.length;
    $('statPass').textContent = logs.filter(l => l.status === 'PASS').length;
    $('statOut').textContent = logs.filter(l => l.status === 'OUT').length;
    $('statOpenActions').textContent = open.length;
    $('navDeviationBadge').textContent = open.length;
    $('navDeviationBadge').classList.toggle('hidden', open.length === 0);

    $('recentChecks').className = 'list';
    $('recentChecks').innerHTML = logs.length ? logs.slice(0,6).map(log => `
      <div class="list-row">
        <div><strong>${esc(`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || 'Equipment'}`)}</strong><small>${esc(log.limit_code_snapshot)} · ${fmtTime(log.recorded_at)} · ${esc(log.profiles?.full_name || log.profiles?.email || 'Staff')}</small></div>
        <span class="${log.status === 'PASS' ? 'status-pass' : 'status-out'}">${esc(log.actual_temperature)}${esc(log.unit_snapshot)} · ${esc(log.status)}</span>
      </div>`).join('') : `<div class="empty">No checks recorded today.</div>`;

    $('dashboardDeviations').className = 'list';
    $('dashboardDeviations').innerHTML = open.length ? open.slice(0,6).map(item => {
      if (item.source === 'process') {
        const r = item.reading, b = item.batch;
        return `<div class="list-row"><div><strong>${esc(b?.product_name || 'Food batch')}${b?.batch_reference ? ` · ${esc(b.batch_reference)}` : ''}</strong><small>Food Process · ${esc(processLabel(r.process_type))}${r.stage_label ? ` · ${esc(r.stage_label)}` : ''} · ${esc(r.actual_temperature)}${esc(r.unit || '°C')} vs ${esc(r.limit_text_snapshot || 'critical limit')}</small></div><span class="status-open">ACTION</span></div>`;
      }
      const log = item.log;
      return `<div class="list-row"><div><strong>${esc(`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || 'Equipment'}`)}</strong><small>Storage Temperature · ${esc(log.actual_temperature)}${esc(log.unit_snapshot)} vs ${esc(log.critical_limit_text_snapshot)}</small></div><span class="status-open">ACTION</span></div>`;
    }).join('') : `<div class="empty">No open deviations today.</div>`;

    const verification = await getDailyVerification(date);
    renderVerification($('dashboardVerification'), verification);

    if (hasRole('manager')) {
      try {
        const range = managementDefaultRange();
        const summary = await fetchManagementSummary(range.start, range.end);
        renderDashboardManagement(summary);
      } catch (error) {
        const target = $('managementAttention');
        if (target) target.innerHTML = `<div class="empty">${esc(managementCopy('Run the v3.9 SQL migration to activate the management dashboard.','Jalankan migrasi SQL v3.9 untuk mengaktifkan dashboard manajemen.'))}</div>`;
        console.error('Management dashboard:', error);
      }
    }
  }

  async function getDailyVerification(date) {
    const { data, error } = await db
      .from('daily_verifications')
      .select('*,profiles!daily_verifications_verified_by_fkey(full_name,email)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('record_date', date)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  function renderVerification(el, verification) {
    if (!verification) {
      el.className = 'verification-strip';
      el.textContent = t('records.notVerified');
      return;
    }
    el.className = 'verification-strip verified';
    el.innerHTML = `<strong>${t('records.verified')}</strong> by ${esc(verification.profiles?.full_name || verification.profiles?.email || 'Supervisor')} · ${fmtDateTime(verification.verified_at)}${verification.notes ? `<br>${esc(verification.notes)}` : ''}`;
  }

  async function saveTemperatureForEquipment(equipmentId, card) {
    const equipment = state.equipment.find(e => e.id === equipmentId);
    const limit = equipment ? equipmentLimit(equipment) : null;
    if (!equipment || !card) return;
    const round = activeMonitoringRound();
    await loadTodaySlotLogs();
    const existing = slotLogForEquipment(equipmentId);
    if (existing) {
      const who = existing.profiles?.full_name || existing.profiles?.email || 'Staff';
      toast(`${equipment.code} ${t('monitor.alreadyRecorded')} ${round.key} — ${t('monitor.recordedBy')} @${who}.`, 'error');
      renderMonitoringChecklist();
      return;
    }
    if (!limit) { toast('This equipment has no default HACCP limit assigned.', 'error'); return; }

    const tempInput = card.querySelector('[data-monitor-temp]');
    const batchInput = card.querySelector('[data-monitor-batch]');
    const notesInput = card.querySelector('[data-monitor-notes]');
    const saveBtn = card.querySelector('[data-save-monitor]');
    if (!tempInput || tempInput.value === '' || !Number.isFinite(Number(tempInput.value))) {
      tempInput?.focus();
      toast('Enter a valid temperature before saving.', 'error');
      return;
    }

    const originalText = saveBtn?.textContent || 'Save';
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('common.saving'); }
    const payload = {
      kitchen_id: state.kitchen.id,
      equipment_id: equipment.id,
      limit_id: limit.id,
      recorded_at: new Date().toISOString(),
      actual_temperature: Number(tempInput.value),
      batch_reference: batchInput?.value.trim() || null,
      notes: notesInput?.value.trim() || null,
      recorded_by: state.user.id,
      monitoring_slot: round.key
    };
    const { data, error } = await db.from('temperature_logs').insert(payload).select('id,status,actual_temperature,recorded_at,critical_limit_text_snapshot,unit_snapshot,equipment_code_snapshot,equipment_name_snapshot,equipment_storage_type_snapshot,location_name_snapshot,equipment(code,name,storage_type,locations(name)),limit_name_snapshot').single();
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = originalText; }
    if (error) {
      if (error.code === '23505' || /temperature_logs_one_per_slot|duplicate key/i.test(error.message || '')) {
        await loadTodaySlotLogs();
        const locked = slotLogForEquipment(equipmentId);
        const who = locked?.profiles?.full_name || locked?.profiles?.email || 'another user';
        toast(`${equipment.code} ${t('monitor.alreadyRecorded')} ${round.key} — ${t('monitor.recordedBy')} @${who}.`, 'error');
        renderMonitoringChecklist();
        return;
      }
      if (error.code === '42703') { toast('Run v2.2-monitoring-round-lock.sql in Supabase first.', 'error'); return; }
      toast(error.message, 'error'); return;
    }

    // Save in place: keep the monitoring page and scroll position exactly where the user is.
    card.classList.add('monitor-saved');
    const result = card.querySelector('[data-monitor-result]');
    if (result) {
      result.className = `monitor-result ${data.status === 'PASS' ? 'pass' : 'out'} saved-confirmation`;
      const savedTime = data.recorded_at ? fmtTime(data.recorded_at) : fmtTime(new Date().toISOString());
      result.textContent = data.status === 'PASS'
        ? `✓ ${t('monitor.saved')} · ${data.actual_temperature}${data.unit_snapshot} · ${savedTime}`
        : `✓ ${t('monitor.outSaved')} · ${data.actual_temperature}${data.unit_snapshot} · ${savedTime}`;
    }

    // Clear only this equipment's entry fields so the next reading can be entered immediately.
    tempInput.value = '';
    if (batchInput) batchInput.value = '';
    if (notesInput) notesInput.value = '';

    // Give a second, local confirmation on the button without navigating away.
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = `✓ ${t('monitor.saved')}`;
      saveBtn.classList.add('saved');
      window.setTimeout(() => {
        if (!saveBtn.isConnected) return;
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('saved');
      }, 1400);
    }

    toast(data.status === 'PASS' ? `${equipment.code} ${t('monitor.savedToast')}` : `${equipment.code} ${t('monitor.deviationToast')}`, data.status === 'PASS' ? 'good' : 'error');
    await loadTodaySlotLogs();
    window.setTimeout(() => { if (state.currentPage === 'check') renderMonitoringChecklist(); }, 900);

    // PASS stays on this exact page. OUT still opens the corrective-action dialog immediately.
    if (data.status === 'OUT') openCorrectiveDialog(data);
  }

  function openCorrectiveDialog(log) {
    $('correctiveLogId').value = log.id;
    $('correctiveTitle').textContent = `${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || 'Out-of-limit check'}`;
    $('correctiveSummary').innerHTML = `Recorded <strong>${esc(log.actual_temperature)}${esc(log.unit_snapshot || '°C')}</strong> · Critical limit <strong>${esc(log.critical_limit_text_snapshot)}</strong>`;
    $('correctiveDeviation').value = `${log.limit_name_snapshot || 'Temperature'} out of critical limit: ${log.actual_temperature}${log.unit_snapshot || '°C'} vs ${log.critical_limit_text_snapshot}.`;
    $('correctiveImmediate').value = '';
    $('correctiveDisposition').value = '';
    $('correctiveFollowup').value = '';
    $('correctiveNotes').value = '';
    if ($('correctiveFormMessage')) {
      $('correctiveFormMessage').textContent = '';
      $('correctiveFormMessage').className = 'form-status hidden';
    }
    if ($('saveCorrectiveBtn')) {
      $('saveCorrectiveBtn').disabled = false;
      $('saveCorrectiveBtn').textContent = 'Save Corrective Action';
    }
    $('correctiveDialog').showModal();
  }

  async function saveCorrective(event) {
    event.preventDefault();
    const form = $('correctiveForm');
    const message = $('correctiveFormMessage');
    const button = $('saveCorrectiveBtn');

    message.className = 'form-status hidden';
    message.textContent = '';

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const logId = $('correctiveLogId').value;
    if (!logId || !state.user?.id) {
      message.textContent = 'The corrective action could not be linked to this temperature record. Close this window, refresh Corrective Actions, and try again.';
      message.className = 'form-status error';
      return;
    }

    const payload = {
      temperature_log_id: logId,
      deviation: $('correctiveDeviation').value.trim(),
      immediate_action: $('correctiveImmediate').value.trim(),
      product_disposition: $('correctiveDisposition').value.trim() || null,
      followup_temperature: nullableNumber($('correctiveFollowup').value),
      notes: $('correctiveNotes').value.trim() || null,
      created_by: state.user.id
    };

    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Saving…';

    try {
      const { error } = await db.from('corrective_actions').insert(payload);
      if (error) {
        let friendly = error.message || 'Unable to save corrective action.';
        if (/duplicate key|unique constraint/i.test(friendly)) friendly = 'A corrective action already exists for this temperature record. Refresh the Corrective Actions page.';
        if (/row-level security|policy/i.test(friendly)) friendly = 'Your account is not permitted to save this corrective action. Refresh your access or ask an Owner/Admin to check your kitchen role.';
        if (/foreign key|profiles/i.test(friendly)) friendly = 'Your staff profile is not fully synchronized yet. Sign out, sign in again, then retry.';
        message.textContent = friendly;
        message.className = 'form-status error';
        return;
      }

      message.textContent = 'Corrective action saved.';
      message.className = 'form-status success';
      $('correctiveDialog').close();
      toast('Corrective action saved. Supervisor verification is still required.', 'good');
      await navigate('corrective');
    } catch (err) {
      message.textContent = err?.message || 'Unexpected error while saving. Please try again.';
      message.className = 'form-status error';
    } finally {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }

  async function getOperationalProcessDeviations(limit = 100) {
    const { data: readings, error } = await db
      .from('process_readings')
      .select(`id,batch_id,process_type,stage_label,actual_temperature,unit,status,limit_text_snapshot,notes,recorded_at,profiles!process_readings_recorded_by_fkey(full_name,email),process_corrective_actions(id,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,createdBy:profiles!process_corrective_actions_created_by_fkey(full_name,email),verifier:profiles!process_corrective_actions_verified_by_fkey(full_name,email))`)
      .eq('kitchen_id', state.kitchen.id)
      .eq('status', 'OUT')
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    const rows = readings || [];
    const batchIds = [...new Set(rows.map(r => r.batch_id).filter(Boolean))];
    let batches = [];
    if (batchIds.length) {
      const { data, error: batchError } = await db
        .from('process_batches')
        .select('id,product_name,batch_reference,status,locations(name),equipment(code,name)')
        .eq('kitchen_id', state.kitchen.id)
        .in('id', batchIds);
      if (batchError) throw batchError;
      batches = data || [];
    }
    const batchMap = new Map(batches.map(b => [b.id, b]));
    return rows.map(reading => ({ reading, batch: batchMap.get(reading.batch_id), action: processActionFor(reading) }));
  }

  async function loadCorrectiveActions() {
    try {
      const [storageRes, processItems, sanitationRes, thawingItems] = await Promise.all([
        db.from('temperature_logs')
          .select(`id,recorded_at,record_date,actual_temperature,status,critical_limit_text_snapshot,limit_code_snapshot,limit_name_snapshot,unit_snapshot,equipment_code_snapshot,equipment_name_snapshot,equipment_storage_type_snapshot,location_name_snapshot,equipment(code,name,storage_type,locations(name)),profiles!temperature_logs_recorded_by_fkey(full_name,email),corrective_actions(id,deviation,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,profiles!corrective_actions_created_by_fkey(full_name),verifier:profiles!corrective_actions_verified_by_fkey(full_name))`)
          .eq('kitchen_id', state.kitchen.id)
          .eq('status', 'OUT')
          .order('recorded_at', { ascending: false })
          .limit(100),
        getOperationalProcessDeviations(100),
        db.from('sanitation_records')
          .select('*,completer:profiles!sanitation_records_completed_by_fkey(full_name,email),verifier:profiles!sanitation_records_verified_by_fkey(full_name,email),evidence:sanitation_evidence(id,storage_path,original_name,photo_kind)')
          .eq('kitchen_id', state.kitchen.id).eq('result','FAIL').order('performed_at',{ascending:false}).limit(100),
        getThawingDeviations()
      ]);
      if (storageRes.error) throw storageRes.error;
      if (sanitationRes.error && sanitationRes.error.code !== '42P01') throw sanitationRes.error;
      const storageItems = (storageRes.data || []).map(log => ({ source:'storage', recordedAt:log.recorded_at, log, action:correctiveActionFor(log) }));
      const processQueue = processItems.map(item => ({ source:'process', recordedAt:item.reading.recorded_at, ...item }));
      state.sanitationRecords = sanitationRes.data || [];
      const sanitationQueue = state.sanitationRecords.map(record => ({ source:'sanitation', recordedAt:record.performed_at, record, action:{ immediate_action:record.corrective_action, verified_at:record.verified_at } }));
      const filter = $('correctiveFilter').value;
      const all = [...storageItems, ...processQueue, ...sanitationQueue, ...(thawingItems||[])].sort((a,b)=>new Date(b.recordedAt)-new Date(a.recordedAt));
      const rows = all.filter(item => filter === 'all' || !item.action || !item.action.verified_at);
      $('correctiveList').innerHTML = rows.length ? rows.map(item => item.source === 'process' ? renderProcessCorrectiveCard(item) : item.source === 'sanitation' ? renderSanitationCorrectiveCard(item.record) : item.source === 'thawing' ? renderThawingCorrectiveCard(item) : renderCorrectiveCard(item.log)).join('') : `<div class="card empty">${filter === 'open' ? t('corrective.noOpenActions') : t('corrective.noActions')}</div>`;
      const openCount = all.filter(item => !item.action || !item.action.verified_at).length;
      $('navDeviationBadge').textContent = openCount;
      $('navDeviationBadge').classList.toggle('hidden', openCount === 0);
    } catch (error) {
      toast(error.message || 'Could not load corrective actions.', 'error');
    }
  }


  function renderCorrectiveCard(log) {
    const action = correctiveActionFor(log);
    const verified = !!action?.verified_at;
    return `<article class="deviation-card ${verified ? 'resolved' : ''}">
      <div class="deviation-card-head">
        <div><span class="record-source-badge">Storage Temperature</span><h3>${esc(`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || 'Equipment'}`)} · ${esc(log.actual_temperature)}${esc(log.unit_snapshot)}</h3><p>${fmtDateTime(log.recorded_at)} · ${esc(log.limit_code_snapshot)} · ${t('corrective.limit')} ${esc(log.critical_limit_text_snapshot)} · ${t('corrective.recorded')} ${esc(log.profiles?.full_name || log.profiles?.email || 'Staff')}</p></div>
        <span class="${verified ? 'status-verified' : 'status-open'}">${verified ? t('corrective.verified') : action ? t('corrective.awaiting') : t('corrective.required')}</span>
      </div>
      ${action ? `<div class="action-detail">
        <div><strong>${t('corrective.immediate')}:</strong> ${esc(action.immediate_action)}</div>
        ${action.product_disposition ? `<div><strong>${t('corrective.disposition')}:</strong> ${esc(action.product_disposition)}</div>` : ''}
        ${action.followup_temperature != null ? `<div><strong>${t('corrective.followup')}:</strong> ${esc(action.followup_temperature)}°C</div>` : ''}
        <div><strong>${t('corrective.completedBy')}:</strong> ${esc(action.profiles?.full_name || 'Staff')} · ${fmtDateTime(action.created_at)}</div>
        ${verified ? `<div><strong>${t('corrective.verifiedBy')}:</strong> ${esc(action.verifier?.full_name || 'Supervisor')} · ${fmtDateTime(action.verified_at)}${action.verification_notes ? ` · ${esc(action.verification_notes)}` : ''}</div>` : ''}
      </div>` : ''}
      <div class="card-actions">
        ${!action ? `<button class="primary" data-correct-log="${esc(log.id)}">${t('corrective.complete')}</button>` : ''}
        ${action && !verified && hasRole('supervisor') ? `<button class="primary" data-verify-action="${esc(action.id)}">${t('corrective.verify')}</button>` : ''}
      </div>
    </article>`;
  }

  function renderProcessCorrectiveCard(item) {
    const r = item.reading;
    const b = item.batch;
    const action = item.action;
    const verified = !!action?.verified_at;
    const title = `${b?.product_name || 'Food batch'}${b?.batch_reference ? ` · ${b.batch_reference}` : ''}`;
    const creator = action?.createdBy;
    return `<article class="deviation-card ${verified ? 'resolved' : ''}">
      <div class="deviation-card-head">
        <div><span class="record-source-badge">Food Process</span><h3>${esc(title)} · ${esc(r.actual_temperature)}${esc(r.unit || '°C')}</h3><p>${fmtDateTime(r.recorded_at)} · ${esc(processLabel(r.process_type))}${r.stage_label ? ` · ${esc(r.stage_label)}` : ''} · ${t('corrective.limit')} ${esc(r.limit_text_snapshot || '—')} · ${t('corrective.recorded')} ${esc(r.profiles?.full_name || r.profiles?.email || 'Staff')}</p></div>
        <span class="${verified ? 'status-verified' : 'status-open'}">${verified ? t('corrective.verified') : action ? t('corrective.awaiting') : t('corrective.required')}</span>
      </div>
      ${action ? `<div class="action-detail">
        <div><strong>${t('corrective.immediate')}:</strong> ${esc(action.immediate_action)}</div>
        ${action.product_disposition ? `<div><strong>${t('corrective.disposition')}:</strong> ${esc(action.product_disposition)}</div>` : ''}
        ${action.followup_temperature != null ? `<div><strong>${t('corrective.followup')}:</strong> ${esc(action.followup_temperature)}°C</div>` : ''}
        ${action.notes ? `<div><strong>${t('processPdf.notes')}:</strong> ${esc(action.notes)}</div>` : ''}
        <div><strong>${t('corrective.completedBy')}:</strong> ${esc(creator?.full_name || creator?.email || 'Staff')} · ${fmtDateTime(action.created_at)}</div>
        ${verified ? `<div><strong>${t('corrective.verifiedBy')}:</strong> ${esc(action.verifier?.full_name || action.verifier?.email || 'Supervisor')} · ${fmtDateTime(action.verified_at)}${action.verification_notes ? ` · ${esc(action.verification_notes)}` : ''}</div>` : ''}
      </div>` : ''}
      <div class="card-actions">
        ${!action ? `<button class="primary" data-process-correct-reading="${esc(r.id)}">${t('corrective.complete')}</button>` : ''}
        ${action && !verified && hasRole('supervisor') ? `<button class="primary" data-process-verify-action="${esc(action.id)}">${t('corrective.verify')}</button>` : ''}
      </div>
    </article>`;
  }
  function renderSanitationCorrectiveCard(record) {
    const verified = !!record.verified_at;
    const recheck = record.verification_status === 'RECHECK_REQUIRED';
    return `<article class="deviation-card ${verified && !recheck ? 'resolved' : ''}">
      <div class="deviation-card-head">
        <div><span class="record-source-badge">Cleaning & Sanitation</span><h3>${esc(record.standard_code_snapshot)} — ${esc(record.standard_name_snapshot)}</h3><p>${fmtDateTime(record.performed_at)} · ${esc(record.area_name_snapshot)}${record.equipment_code_snapshot ? ` · ${esc(record.equipment_code_snapshot)} — ${esc(record.equipment_name_snapshot || '')}` : ''}${record.failure_reasons ? ` · ${esc(record.failure_reasons)}` : ''}</p></div>
        <span class="${verified && !recheck ? 'status-verified' : 'status-open'}">${recheck ? sanitationCopy('RECHECK REQUIRED','PERLU PERIKSA ULANG') : verified ? t('corrective.verified') : t('corrective.awaiting')}</span>
      </div>
      <div class="action-detail"><div><strong>${t('corrective.immediate')}:</strong> ${esc(record.corrective_action || '—')}</div>${record.notes ? `<div><strong>${t('processPdf.notes')}:</strong> ${esc(record.notes)}</div>` : ''}<div><strong>${t('corrective.completedBy')}:</strong> ${esc(record.completer?.full_name || record.completer?.email || 'Staff')} · ${fmtDateTime(record.performed_at)}</div>${record.verified_at ? `<div><strong>${t('corrective.verifiedBy')}:</strong> ${esc(record.verifier?.full_name || record.verifier?.email || 'Supervisor')} · ${fmtDateTime(record.verified_at)}${record.verification_notes ? ` · ${esc(record.verification_notes)}` : ''}</div>` : ''}</div>
      <div class="card-actions">${record.evidence?.length ? `<button class="secondary" type="button" data-view-sanitation-evidence="${esc(record.id)}">${sanitationCopy('View photos','Lihat foto')} · ${record.evidence.length}</button>` : ''}${!record.verified_at && hasRole('supervisor') ? `<button class="primary" type="button" data-sanitation-verify="${esc(record.id)}">${t('corrective.verify')}</button>` : ''}${recheck ? `<button class="primary" type="button" data-go-sanitation-recheck="${esc(record.standard_id)}">${sanitationCopy('Open sanitation task','Buka tugas sanitasi')}</button>` : ''}</div>
    </article>`;
  }

  async function openActionForExistingLog(logId) {
    const { data, error } = await db
      .from('temperature_logs')
      .select('id,actual_temperature,critical_limit_text_snapshot,unit_snapshot,limit_name_snapshot,equipment_code_snapshot,equipment_name_snapshot,equipment_storage_type_snapshot,location_name_snapshot,equipment(code,name,storage_type,locations(name))')
      .eq('id', logId).single();
    if (error) { toast(error.message, 'error'); return; }
    openCorrectiveDialog(data);
  }

  function openVerifyDialog(actionId) {
    $('verifyActionId').value = actionId;
    $('verifyNotes').value = '';
    $('verifyDialog').showModal();
  }

  async function verifyAction(event) {
    event.preventDefault();
    const { error } = await db.rpc('verify_corrective_action', { p_action_id: $('verifyActionId').value, p_notes: $('verifyNotes').value.trim() });
    if (error) { toast(error.message, 'error'); return; }
    $('verifyDialog').close();
    toast(t('corrective.verifiedToast'), 'good');
    await loadCorrectiveActions();
  }

  function recordStatusForAction(action) {
    if (!action) return 'required';
    return action.verified_at ? 'verified' : 'awaiting';
  }

  async function setRecordsTab(tab, shouldLoad = true) {
    const allowed = ['storage','receiving','thawing','process','corrective','calibration','sanitation','allergen','training','verification'];
    state.recordsTab = allowed.includes(tab) ? tab : 'storage';
    localStorage.setItem('haccpRecordsTab', state.recordsTab);
    $$('[data-record-tab]').forEach(btn => {
      const active = btn.dataset.recordTab === state.recordsTab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    $$('[data-record-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.recordPanel === state.recordsTab));
    if (shouldLoad && state.kitchen) await loadRecordsHub();
  }

  async function loadRecordsHub() {
    const date = $('recordDate')?.value || kitchenDate();
    if ($('recordDate')) $('recordDate').value = date;
    await setRecordsTab(state.recordsTab, false);
    if (state.recordsTab === 'storage') return loadRecords();
    if (state.recordsTab === 'receiving') return loadReceivingRecords();
    if (state.recordsTab === 'thawing') return loadThawingRecords();
    if (state.recordsTab === 'process') return loadProcessRecords();
    if (state.recordsTab === 'corrective') return loadCorrectiveRecords();
    if (state.recordsTab === 'calibration') return loadCalibrationRecords();
    if (state.recordsTab === 'sanitation') return loadSanitationRecords();
    if (state.recordsTab === 'allergen') return loadAllergenRecords();
    if (state.recordsTab === 'training') return loadTrainingRecords();
    if (state.recordsTab === 'verification') return loadVerificationRecords();
  }

  async function loadRecords() {
    const date = $('recordDate').value || kitchenDate();
    $('recordDate').value = date;
    const logs = await getDailyLogs(date);
    const locationSelect = $('recordLocationFilter');
    if (locationSelect) {
      const current = locationSelect.value || 'all';
      const names = [...new Set(logs.map(log => log.location_name_snapshot || log.equipment?.locations?.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      locationSelect.innerHTML = `<option value="all">${currentLanguage === 'id' ? 'Semua Lokasi' : 'All Locations'}</option>` + names.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
      locationSelect.value = names.includes(current) ? current : 'all';
    }
    const locationFilter = $('recordLocationFilter')?.value || 'all';
    const roundFilter = $('recordRoundFilter')?.value || 'all';
    const statusFilter = $('recordStatusFilter')?.value || 'all';
    const filtered = logs.filter(log => {
      const locationName = log.location_name_snapshot || log.equipment?.locations?.name || '';
      return (locationFilter === 'all' || locationName === locationFilter)
        && (roundFilter === 'all' || log.monitoring_slot === roundFilter)
        && (statusFilter === 'all' || log.status === statusFilter);
    });
    $('recordsBody').innerHTML = filtered.length ? filtered.map(log => `
      <tr>
        <td>${fmtTime(log.recorded_at)}</td>
        <td>${esc(log.monitoring_slot || '—')}</td>
        <td>${esc(`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || '—'}`)}<br><span class="muted">${esc(log.location_name_snapshot || log.equipment?.locations?.name || '')} · ${esc(log.equipment_storage_type_snapshot || log.equipment?.storage_type || '')}</span></td>
        <td>${esc(log.limit_code_snapshot)}<br><span class="muted">${esc(log.limit_name_snapshot)}</span></td>
        <td>${esc(log.actual_temperature)}${esc(log.unit_snapshot)}</td>
        <td>${esc(log.critical_limit_text_snapshot)}</td>
        <td class="table-status ${log.status === 'PASS' ? 'pass' : 'out'}">${esc(log.status)}</td>
        <td>${esc(log.profiles?.full_name || log.profiles?.email || 'Staff')}</td>
        <td>${esc(log.batch_reference || '—')}</td>
      </tr>`).join('') : `<tr><td colspan="9" class="empty">${t('records.noRecords')}</td></tr>`;
    const verification = await getDailyVerification(date);
    renderVerification($('verificationBanner'), verification);
    $('verifyDayBtn').disabled = !!verification;
    $('verifyDayBtn').textContent = verification ? t('records.dayVerified') : t('records.verifyDay');
  }

  function standardIdentityFromMap(standardId, standardsById) {
    const standard=standardId ? standardsById?.get(standardId) : null;
    return standard ? `${standard.code} · v${Number(standard.version_no||1)}` : '';
  }
  function standardForProcessReading(batch, reading, standardsById) {
    const step=(batch.process_steps||[]).find(s=>s.id===reading.step_id);
    return standardIdentityFromMap(step?.process_limit_id, standardsById);
  }
  function renderProcessRecordJourney(batch, standardsById) {
    const steps = [...(batch.process_steps || [])].sort((a,b) => Number(a.sequence_no) - Number(b.sequence_no));
    if (!steps.length) return '<span class="muted">No journey data</span>';
    return steps.map((step, index) => { const standard=standardIdentityFromMap(step.process_limit_id,standardsById); return `<span class="record-journey-step ${step.status === 'active' ? 'active' : 'done'}"><b>${esc(processLabel(step.process_type))}</b><small>${standard?`${esc(standard)} · `:''}${esc(fmtDateTime(step.started_at))}${step.ended_at ? ` → ${esc(fmtDateTime(step.ended_at))}` : ''}</small></span>${index < steps.length - 1 ? '<i>→</i>' : ''}`; }).join('');
  }

  async function loadProcessRecords() {
    const date = $('recordDate').value || kitchenDate();
    const report = await getDailyProcessReport(date);
    const processFilter = $('processRecordProcessFilter')?.value || 'all';
    const statusFilter = $('processRecordStatusFilter')?.value || 'all';
    const search = ($('processRecordSearch')?.value || '').trim().toLowerCase();
    const batchMap = new Map(report.batches.map(batch => [batch.id, batch]));
    let rows = report.readings.filter(r => (processFilter === 'all' || r.process_type === processFilter) && (statusFilter === 'all' || r.status === statusFilter));
    if (search) rows = rows.filter(r => {
      const b = batchMap.get(r.batch_id);
      return [b?.product_name,b?.batch_reference,b?.locations?.name,b?.equipment?.code,b?.equipment?.name].filter(Boolean).join(' ').toLowerCase().includes(search);
    });
    const visibleBatchIds = new Set(rows.map(r => r.batch_id));
    const batches = report.batches.filter(b => visibleBatchIds.has(b.id));
    const pass = rows.filter(r => r.status === 'PASS').length;
    const out = rows.filter(r => r.status === 'OUT').length;
    $('processRecordsSummary').innerHTML = `<span><b>${batches.length}</b>${currentLanguage === 'id' ? ' batch' : ' batches'}</span><span><b>${rows.length}</b>${currentLanguage === 'id' ? ' pencatatan' : ' readings'}</span><span class="summary-pass"><b>${pass}</b>PASS</span><span class="summary-out"><b>${out}</b>OUT</span>`;
    if (!rows.length) {
      $('processRecordsList').innerHTML = `<div class="empty">${t('processPdf.noReadings')}</div>`;
      return;
    }
    const rowsByBatch = new Map();
    rows.forEach(r => { if (!rowsByBatch.has(r.batch_id)) rowsByBatch.set(r.batch_id, []); rowsByBatch.get(r.batch_id).push(r); });
    $('processRecordsList').innerHTML = batches.map(batch => {
      const batchRows = rowsByBatch.get(batch.id) || [];
      const equipment = batch.equipment ? `${batch.equipment.code || ''}${batch.equipment.code ? ' — ' : ''}${batch.equipment.name || ''}` : '—';
      const hasOut = batchRows.some(r => r.status === 'OUT');
      return `<article class="process-record-card">
        <div class="process-record-head"><div><span class="storage-badge">${esc(batch.status?.toUpperCase() || 'RECORD')}</span><h3>${esc(batch.product_name)}</h3><p>${esc(batch.batch_reference || 'No batch reference')} · ${esc(batch.locations?.name || 'No location')}</p></div><span class="${hasOut ? 'status-out' : 'status-pass'}">${hasOut ? 'DEVIATION' : 'COMPLIANT'}</span></div>
        <div class="process-record-meta"><span><b>${esc(t('processPdf.quantity'))}</b>${esc(batch.quantity || '—')}</span><span><b>${esc(t('processPdf.equipment'))}</b>${esc(equipment)}</span><span><b>${esc(t('processPdf.batchStatus'))}</b>${esc(batch.status || '—')}</span></div>
        <div class="record-journey">${renderProcessRecordJourney(batch, report.standardsById)}</div>
        <div class="table-wrap"><table class="compact-record-table"><thead><tr><th>Time</th><th>Process / stage</th><th>Actual</th><th>Critical limit</th><th>Status</th><th>Staff</th><th>Corrective / Verification</th></tr></thead><tbody>${batchRows.map(r => {
          const action = processActionFor(r);
          const actionText = action ? `${esc(action.immediate_action)}${action.verified_at ? `<br><small>✓ Verified · ${esc(action.verifier?.full_name || action.verifier?.email || 'Supervisor')}</small>` : '<br><small>Awaiting verification</small>'}` : (r.status === 'OUT' ? '<strong class="status-out">Action required</strong>' : '—');
          const standard=standardForProcessReading(batch,r,report.standardsById); return `<tr><td>${fmtTime(r.recorded_at)}</td><td><b>${esc(processLabel(r.process_type))}</b>${r.stage_label ? `<br><span class="muted">${esc(r.stage_label)}</span>` : ''}${standard?`<br><small>${esc(standard)}</small>`:''}</td><td>${esc(r.actual_temperature)}${esc(r.unit || '°C')}</td><td>${esc(r.limit_text_snapshot || '—')}</td><td class="table-status ${r.status === 'PASS' ? 'pass' : 'out'}">${esc(r.status)}</td><td>${esc(r.profiles?.full_name || r.profiles?.email || 'Staff')}</td><td>${actionText}</td></tr>`;
        }).join('')}</tbody></table></div>
      </article>`;
    }).join('');
  }

  function renderHistoricalCorrectiveCard(item) {
    const action = item.action;
    const status = recordStatusForAction(action);
    const badge = status === 'verified' ? 'VERIFIED' : status === 'awaiting' ? 'AWAITING VERIFY' : 'ACTION REQUIRED';
    const badgeClass = status === 'verified' ? 'status-verified' : 'status-open';
    const creator = action?.createdBy || action?.profiles;
    const verifier = action?.verifier;
    return `<article class="deviation-card ${status === 'verified' ? 'resolved' : ''}">
      <div class="deviation-card-head"><div><span class="record-source-badge">${esc(item.sourceLabel)}</span><h3>${esc(item.title)}</h3><p>${fmtDateTime(item.recordedAt)} · ${esc(item.detail)}</p></div><span class="${badgeClass}">${badge}</span></div>
      ${action ? `<div class="action-detail"><div><strong>${t('corrective.immediate')}:</strong> ${esc(action.immediate_action)}</div>${action.product_disposition ? `<div><strong>${t('corrective.disposition')}:</strong> ${esc(action.product_disposition)}</div>` : ''}${action.followup_temperature != null ? `<div><strong>${t('corrective.followup')}:</strong> ${esc(action.followup_temperature)}°C</div>` : ''}${action.notes ? `<div><strong>${t('processPdf.notes')}:</strong> ${esc(action.notes)}</div>` : ''}<div><strong>${t('corrective.completedBy')}:</strong> ${esc(creator?.full_name || creator?.email || 'Staff')} · ${fmtDateTime(action.created_at)}</div>${action.verified_at ? `<div><strong>${t('corrective.verifiedBy')}:</strong> ${esc(verifier?.full_name || verifier?.email || 'Supervisor')} · ${fmtDateTime(action.verified_at)}${action.verification_notes ? ` · ${esc(action.verification_notes)}` : ''}</div>` : ''}</div>` : '<div class="action-detail"><strong class="status-out">Corrective action not recorded.</strong></div>'}
    </article>`;
  }

  async function loadCorrectiveRecords() {
    const date = $('recordDate').value || kitchenDate();
    const [storageLogs, processReport, sanitationRecords] = await Promise.all([getDailyLogs(date), getDailyProcessReport(date), fetchSanitationRecordsForDate(date)]);
    const batchMap = new Map(processReport.batches.map(b => [b.id, b]));
    const storage = storageLogs.filter(l => l.status === 'OUT').map(log => ({
      source:'storage', sourceLabel:'Storage Temperature', recordedAt:log.recorded_at,
      title:`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || 'Equipment'}`,
      detail:`${log.actual_temperature}${log.unit_snapshot || '°C'} vs ${log.critical_limit_text_snapshot || 'critical limit'}`,
      action:correctiveActionFor(log)
    }));
    const process = processReport.readings.filter(r => r.status === 'OUT').map(r => {
      const b = batchMap.get(r.batch_id);
      return { source:'process', sourceLabel:'Food Process', recordedAt:r.recorded_at, title:`${b?.product_name || 'Food batch'}${b?.batch_reference ? ` · ${b.batch_reference}` : ''}`, detail:`${processLabel(r.process_type)}${r.stage_label ? ` · ${r.stage_label}` : ''} · ${r.actual_temperature}${r.unit || '°C'} vs ${r.limit_text_snapshot || 'critical limit'}`, action:processActionFor(r) };
    });
    const sanitation = sanitationRecords.filter(r => r.result === 'FAIL').map(r => ({
      source:'sanitation', sourceLabel:'Cleaning & Sanitation', recordedAt:r.performed_at,
      title:`${r.standard_code_snapshot} — ${r.standard_name_snapshot}`,
      detail:`${r.area_name_snapshot}${r.equipment_code_snapshot ? ` · ${r.equipment_code_snapshot} — ${r.equipment_name_snapshot || ''}` : ''}${r.failure_reasons ? ` · ${r.failure_reasons}` : ''}`,
      action:{ immediate_action:r.corrective_action, notes:r.notes, created_at:r.performed_at, createdBy:r.completer, verified_at:r.verified_at, verification_notes:r.verification_notes, verifier:r.verifier }
    }));
    const sourceFilter = $('recordCorrectiveType')?.value || 'all';
    const statusFilter = $('recordCorrectiveStatus')?.value || 'all';
    const all = [...storage, ...process, ...sanitation].sort((a,b)=>new Date(b.recordedAt)-new Date(a.recordedAt));
    const filtered = all.filter(item => (sourceFilter === 'all' || item.source === sourceFilter) && (statusFilter === 'all' || recordStatusForAction(item.action) === statusFilter));
    const required = all.filter(x => recordStatusForAction(x.action) === 'required').length;
    const awaiting = all.filter(x => recordStatusForAction(x.action) === 'awaiting').length;
    const verified = all.filter(x => recordStatusForAction(x.action) === 'verified').length;
    $('recordCorrectiveSummary').innerHTML = `<span class="summary-out"><b>${required}</b>Action required</span><span><b>${awaiting}</b>Awaiting verification</span><span class="summary-pass"><b>${verified}</b>Verified</span>`;
    $('recordCorrectiveList').innerHTML = filtered.length ? filtered.map(renderHistoricalCorrectiveCard).join('') : `<div class="empty">No corrective-action records match these filters.</div>`;
  }


  // v3.5 — Receiving & Supplier Control
  async function fetchReceivingSuppliers(includeInactive = false) {
    let query = db.from('receiving_suppliers').select('*').eq('kitchen_id', state.kitchen.id);
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data || [];
  }

  async function fetchReceivingStandards(includeInactive = false) {
    let query = db.from('receiving_standards').select('*').eq('kitchen_id', state.kitchen.id);
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query.order('code');
    if (error) throw error;
    return data || [];
  }

  async function fetchReceivingRecordsForDate(date) {
    const { data, error } = await db.from('receiving_records')
      .select('*,receiver:profiles!receiving_records_received_by_fkey(full_name,email),verifier:profiles!receiving_records_verified_by_fkey(full_name,email),evidence:receiving_evidence(id,storage_path,original_name,mime_type,file_size,photo_kind,uploaded_at,uploaded_by)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('receiving_date', date)
      .order('received_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function loadReceivingBadge() {
    const badge = $('navReceivingBadge');
    if (!badge || !state.kitchen) return;
    try {
      const records = await fetchReceivingRecordsForDate(kitchenDate());
      const pending = records.filter(r => r.result === 'FAIL' && !r.verified_at).length;
      badge.textContent = pending;
      badge.classList.toggle('hidden', pending === 0);
    } catch (error) {
      if (error?.code !== '42P01') console.error('Receiving badge:', error);
      badge.classList.add('hidden');
    }
  }

  function supplierApprovalClass(status) {
    return status === 'approved' ? 'status-pass' : status === 'suspended' ? 'status-out' : 'status-open';
  }


  function clearReceivingPhotoDraft() {
    (state.receivingPhotoDraft || []).forEach(item => { if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); });
    state.receivingPhotoDraft = [];
    const input = $('receivingPhotoInput');
    if (input) input.value = '';
    renderReceivingPhotoDraft();
  }

  function renderReceivingPhotoDraft() {
    const box = $('receivingPhotoPreview');
    const count = $('receivingPhotoCount');
    if (!box) return;
    const items = state.receivingPhotoDraft || [];
    if (count) count.textContent = `${items.length}/5`;
    box.innerHTML = items.length ? items.map((item,index)=>`
      <article class="receiving-photo-draft">
        <img src="${esc(item.previewUrl)}" alt="Receiving evidence preview">
        <div class="receiving-photo-draft-copy">
          <select data-receiving-photo-kind="${index}">
            <option value="product" ${item.kind==='product'?'selected':''}>Product</option>
            <option value="temperature" ${item.kind==='temperature'?'selected':''}>Temperature proof</option>
            <option value="packaging" ${item.kind==='packaging'?'selected':''}>Packaging condition</option>
            <option value="label" ${item.kind==='label'?'selected':''}>Label / Lot / Expiry</option>
            <option value="document" ${item.kind==='document'?'selected':''}>Invoice / Delivery Order</option>
            <option value="vehicle" ${item.kind==='vehicle'?'selected':''}>Vehicle / Transport</option>
            <option value="other" ${item.kind==='other'?'selected':''}>Other</option>
          </select>
          <small>${esc(item.file.name)} · ${(item.file.size/1024/1024).toFixed(1)} MB</small>
          <button class="text-btn danger-text" type="button" data-remove-receiving-photo="${index}">Remove</button>
        </div>
      </article>`).join('') : '<div class="receiving-photo-empty">No photo evidence selected.</div>';
  }

  function addReceivingPhotos(files) {
    const incoming = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (!incoming.length) return;
    const room = Math.max(0, 5 - (state.receivingPhotoDraft || []).length);
    if (!room) { toast('Maximum 5 receiving photos per record.', 'error'); return; }
    incoming.slice(0, room).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast(`${file.name}: maximum source image size is 10 MB.`, 'error'); return; }
      state.receivingPhotoDraft.push({ file, kind:'product', previewUrl:URL.createObjectURL(file) });
    });
    if (incoming.length > room) toast('Only the first 5 photos were added.', 'error');
    renderReceivingPhotoDraft();
  }

  async function compressReceivingPhoto(file) {
    if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1800;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d', { alpha:false });
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare photo.')), 'image/jpeg', 0.82));
    return blob;
  }

  function safeStorageName(name='photo.jpg') {
    const base = String(name).replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'photo';
    return `${base}.jpg`;
  }

  async function uploadReceivingEvidence(recordId) {
    const items = state.receivingPhotoDraft || [];
    if (!items.length) return [];
    const uploadedPaths = [];
    const rows = [];
    try {
      for (let i=0;i<items.length;i++) {
        const item = items[i];
        const blob = await compressReceivingPhoto(item.file);
        const storagePath = `${state.kitchen.id}/${recordId}/${String(i+1).padStart(2,'0')}-${safeStorageName(item.file.name)}`;
        const { error:uploadError } = await db.storage.from('receiving-evidence').upload(storagePath, blob, { contentType:'image/jpeg', upsert:false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);
        rows.push({
          kitchen_id: state.kitchen.id,
          receiving_record_id: recordId,
          storage_path: storagePath,
          original_name: item.file.name,
          mime_type: 'image/jpeg',
          file_size: blob.size,
          photo_kind: item.kind || 'other',
          uploaded_by: state.user.id
        });
      }
      return { rows, uploadedPaths };
    } catch (error) {
      if (uploadedPaths.length) await db.storage.from('receiving-evidence').remove(uploadedPaths);
      throw error;
    }
  }

  async function signedReceivingEvidence(evidence, expiresIn=900) {
    const items = evidence || [];
    if (!items.length) return [];
    const paths = items.map(x=>x.storage_path);
    const { data, error } = await db.storage.from('receiving-evidence').createSignedUrls(paths, expiresIn);
    if (error) throw error;
    return items.map((item,index)=>({...item, signedUrl:data?.[index]?.signedUrl || null}));
  }

  async function viewReceivingEvidence(recordId) {
    const record = (state.receivingRecords || []).find(r=>r.id===recordId);
    if (!record) return;
    if (!(record.evidence || []).length) { toast('No photo evidence attached to this receiving record.', 'error'); return; }
    try {
      const photos = await signedReceivingEvidence(record.evidence, 900);
      $('receivingEvidenceTitle').textContent = `${record.product_name} · ${record.supplier_code_snapshot}`;
      $('receivingEvidenceGrid').innerHTML = photos.map(p=>`<figure class="receiving-evidence-item"><a href="${esc(p.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(p.signedUrl)}" alt="${esc(p.photo_kind)}"></a><figcaption><b>${esc(String(p.photo_kind||'other').replaceAll('_',' '))}</b><span>${esc(p.original_name||'Evidence photo')}</span></figcaption></figure>`).join('');
      $('receivingEvidenceDialog').showModal();
    } catch (error) { toast(error.message || 'Could not open receiving photo evidence.', 'error'); }
  }

  function receivingPreviewState() {
    const supplier = state.receivingSuppliers.find(x => x.id === $('receivingCheckSupplier')?.value);
    const standard = state.receivingStandards.find(x => x.id === $('receivingCheckStandard')?.value);
    if (!supplier || !standard) return { ready:false, fail:false, reasons:[] };
    const reasons = [];
    if (supplier.approval_status === 'suspended') reasons.push('Supplier approval is suspended');
    const rawTemp = $('receivingObservedTemperature')?.value ?? '';
    const temp = rawTemp === '' ? null : Number(rawTemp);
    if (standard.temperature_required) {
      if (temp == null || !Number.isFinite(temp)) reasons.push('Required receiving temperature is missing');
      else {
        if (standard.min_value != null && temp < Number(standard.min_value)) reasons.push('Temperature below approved minimum');
        if (standard.max_value != null && temp > Number(standard.max_value)) reasons.push('Temperature above approved maximum');
      }
    }
    if (standard.require_intact_packaging && $('receivingPackagingCondition')?.value !== 'acceptable') reasons.push('Packaging condition unacceptable');
    if (standard.require_clean_vehicle && $('receivingVehicleCondition')?.value !== 'acceptable') reasons.push('Transport / vehicle condition unacceptable');
    return { ready:true, fail:reasons.length > 0, reasons, supplier, standard };
  }

  function updateReceivingPreview() {
    const preview = $('receivingResultPreview');
    if (!preview) return;
    const result = receivingPreviewState();
    const standard = result.standard;
    const tempLabel = $('receivingTemperatureLabel');
    const tempInput = $('receivingObservedTemperature');
    if (standard) {
      const required = !!standard.temperature_required;
      tempLabel?.classList.toggle('receiving-temperature-optional', !required);
      if (tempInput) {
        tempInput.required = required;
        tempInput.disabled = !required;
        if (!required) tempInput.value = '';
      }
    }
    if (!result.ready) {
      preview.className = 'result-preview neutral';
      preview.textContent = currentLanguage === 'id' ? 'Pilih supplier dan standar penerimaan.' : 'Select supplier and receiving standard.';
      $('receivingFailFields')?.classList.add('hidden');
      return;
    }
    if (result.fail) {
      preview.className = 'result-preview out';
      preview.innerHTML = `<strong>FAIL · REJECT</strong><span>${result.reasons.map(esc).join(' · ')}</span>`;
      $('receivingFailFields')?.classList.remove('hidden');
    } else {
      preview.className = 'result-preview pass';
      preview.innerHTML = `<strong>PASS · ACCEPT</strong><span>${esc(result.standard.critical_limit_text || 'Approved receiving standard met')}</span>`;
      $('receivingFailFields')?.classList.add('hidden');
    }
  }

  function populateReceivingCheckOptions() {
    const supplierSelect = $('receivingCheckSupplier');
    const standardSelect = $('receivingCheckStandard');
    if (supplierSelect) supplierSelect.innerHTML = '<option value="">Select supplier…</option>' + state.receivingSuppliers.filter(s => s.active).map(s => `<option value="${esc(s.id)}">${esc(s.code)} — ${esc(s.name)}${s.approval_status !== 'approved' ? ` · ${esc(s.approval_status.toUpperCase())}` : ''}</option>`).join('');
    if (standardSelect) standardSelect.innerHTML = '<option value="">Select receiving standard…</option>' + state.receivingStandards.filter(s => s.active).map(s => `<option value="${esc(s.id)}">${esc(s.code)} — ${esc(s.name)} · ${esc(s.critical_limit_text)}</option>`).join('');
    updateReceivingPreview();
  }

  function renderReceivingToday() {
    const records = state.receivingRecords || [];
    const accepted = records.filter(r => r.result === 'PASS').length;
    const rejected = records.filter(r => r.result === 'FAIL').length;
    const pending = records.filter(r => r.result === 'FAIL' && !r.verified_at).length;
    $('receivingTotalCount').textContent = records.length;
    $('receivingAcceptedCount').textContent = accepted;
    $('receivingRejectedCount').textContent = rejected;
    $('receivingPendingCount').textContent = pending;
    const list = $('receivingTodayList');
    list.innerHTML = records.length ? records.map(r => {
      const receiver = r.receiver?.full_name || r.receiver?.email || 'Staff';
      const verifier = r.verifier?.full_name || r.verifier?.email || 'Supervisor';
      const temp = r.temperature_required_snapshot ? `${r.observed_temperature ?? '—'}${r.unit_snapshot || '°C'}` : 'Not required';
      return `<article class="card receiving-record-card ${r.result === 'FAIL' ? 'receiving-rejected' : ''}">
        <div class="receiving-record-head"><div><span class="source-badge source-receiving">RECEIVING</span><h3>${esc(r.product_name)}</h3><p>${esc(r.supplier_code_snapshot)} — ${esc(r.supplier_name_snapshot)}${r.delivery_reference ? ` · ${esc(r.delivery_reference)}` : ''}${r.batch_lot ? ` · Lot ${esc(r.batch_lot)}` : ''}</p></div><span class="${r.result === 'PASS' ? 'status-pass' : 'status-out'}">${esc(r.disposition)}</span></div>
        <div class="receiving-record-meta"><span><b>Standard</b>${esc(r.standard_code_snapshot)} · ${esc(r.critical_limit_text_snapshot)}</span><span><b>Temperature</b>${esc(temp)}</span><span><b>Packaging</b>${esc(r.packaging_condition.replaceAll('_',' '))}</span><span><b>Transport</b>${esc(r.vehicle_condition.replaceAll('_',' '))}</span></div>
        ${r.result === 'FAIL' ? `<div class="receiving-failure"><strong>${esc(r.inspection_failures || 'Receiving requirement not met')}</strong><span>${esc(r.corrective_action || '')}</span></div>` : ''}
        <div class="receiving-record-footer"><small>${fmtDateTime(r.received_at)} · ${esc(receiver)}</small><div class="receiving-record-footer-actions">${(r.evidence||[]).length?`<button class="secondary compact-btn" type="button" data-view-receiving-evidence="${esc(r.id)}">Photos · ${(r.evidence||[]).length}</button>`:''}${r.result === 'FAIL' ? (r.verified_at ? `<small class="status-verified">✓ Verified · ${esc(verifier)} · ${fmtDateTime(r.verified_at)}</small>` : hasRole('supervisor') ? `<button class="primary compact-btn" type="button" data-verify-receiving="${esc(r.id)}">Verify Rejection</button>` : '<small class="status-open">Awaiting supervisor verification</small>') : '<small class="status-pass">Accepted</small>'}</div></div>
      </article>`;
    }).join('') : '<div class="card empty">No receiving checks recorded today.</div>';
  }

  async function loadReceiving() {
    try {
      const date = kitchenDate();
      const [suppliers, standards, records] = await Promise.all([fetchReceivingSuppliers(false), fetchReceivingStandards(false), fetchReceivingRecordsForDate(date)]);
      state.receivingSuppliers = suppliers;
      state.receivingStandards = standards;
      state.receivingRecords = records;
      populateReceivingCheckOptions();
      renderReceivingToday();
      await loadReceivingBadge();
    } catch (error) {
      toast(error.message || 'Could not load receiving control.', 'error');
    }
  }

  async function openReceivingCheck() {
    if (!state.receivingSuppliers.length || !state.receivingStandards.length) {
      try {
        state.receivingSuppliers = await fetchReceivingSuppliers(false);
        state.receivingStandards = await fetchReceivingStandards(false);
      } catch (error) { toast(error.message, 'error'); return; }
    }
    if (!state.receivingSuppliers.length || !state.receivingStandards.length) {
      toast('A Manager must configure at least one approved supplier and receiving standard first.', 'error');
      return;
    }
    $('receivingCheckForm').reset();
    clearReceivingPhotoDraft();
    $('receivingCheckAt').value = localDateTimeInput();
    $('receivingPackagingCondition').value = 'acceptable';
    $('receivingVehicleCondition').value = 'acceptable';
    populateReceivingCheckOptions();
    $('receivingCheckDialog').showModal();
  }

  async function saveReceivingCheck(event) {
    event.preventDefault();
    const preview = receivingPreviewState();
    if (!preview.ready) { toast('Select supplier and receiving standard.', 'error'); return; }
    const corrective = $('receivingCorrectiveAction').value.trim();
    if (preview.fail && !corrective) { toast('Corrective / rejection action is required for a failed receiving check.', 'error'); return; }
    const at = new Date($('receivingCheckAt').value);
    if (Number.isNaN(at.getTime())) { toast('Enter a valid receiving date/time.', 'error'); return; }
    const payload = {
      kitchen_id: state.kitchen.id,
      receiving_date: kitchenDate(at),
      received_at: at.toISOString(),
      supplier_id: $('receivingCheckSupplier').value,
      standard_id: $('receivingCheckStandard').value,
      delivery_reference: $('receivingDeliveryRef').value.trim() || null,
      product_name: $('receivingProductName').value.trim(),
      batch_lot: $('receivingBatchLot').value.trim() || null,
      quantity: $('receivingQuantity').value.trim() || null,
      quantity_unit: $('receivingQuantityUnit').value.trim() || null,
      expiry_date: $('receivingExpiryDate').value || null,
      observed_temperature: preview.standard.temperature_required ? nullableNumber($('receivingObservedTemperature').value) : null,
      packaging_condition: $('receivingPackagingCondition').value,
      vehicle_condition: $('receivingVehicleCondition').value,
      corrective_action: preview.fail ? corrective : null,
      notes: $('receivingCheckNotes').value.trim() || null,
      received_by: state.user.id,
      result: preview.fail ? 'FAIL' : 'PASS',
      disposition: preview.fail ? 'REJECTED' : 'ACCEPTED',
      supplier_code_snapshot: preview.supplier.code,
      supplier_name_snapshot: preview.supplier.name,
      supplier_approval_snapshot: preview.supplier.approval_status,
      standard_code_snapshot: preview.standard.code,
      standard_name_snapshot: preview.standard.name,
      unit_snapshot: preview.standard.unit || '°C',
      temperature_required_snapshot: !!preview.standard.temperature_required,
      critical_limit_text_snapshot: preview.standard.critical_limit_text,
      packaging_required_snapshot: !!preview.standard.require_intact_packaging,
      vehicle_required_snapshot: !!preview.standard.require_clean_vehicle
    };
    const photos = state.receivingPhotoDraft || [];
    if (preview.fail && photos.length < 1) { toast('At least one photo is required for a rejected delivery.', 'error'); return; }
    const recordId = crypto.randomUUID();
    let uploaded = { rows:[], uploadedPaths:[] };
    try {
      if (photos.length) uploaded = await uploadReceivingEvidence(recordId);
      const { error } = await db.rpc('create_receiving_record_with_evidence', { p_record:{ id:recordId, ...payload }, p_evidence:uploaded.rows });
      if (error) throw error;
    } catch (error) {
      if (uploaded.uploadedPaths?.length) await db.storage.from('receiving-evidence').remove(uploaded.uploadedPaths);
      toast(error.message || 'Receiving record could not be saved.', 'error');
      return;
    }
    clearReceivingPhotoDraft();
    $('receivingCheckDialog').close();
    toast(preview.fail ? 'Delivery rejected and recorded with photo evidence. Supervisor verification is required.' : t('receiving.saved'), preview.fail ? 'error' : 'good');
    await loadReceiving();
  }

  function openReceivingVerify(id) {
    if (!hasRole('supervisor')) return;
    const r = state.receivingRecords.find(x => x.id === id);
    if (!r || r.result !== 'FAIL') return;
    $('receivingVerifyRecordId').value = id;
    $('receivingVerifyNotes').value = '';
    $('receivingVerifySummary').innerHTML = `<strong>${esc(r.product_name)}</strong><br>${esc(r.supplier_code_snapshot)} — ${esc(r.supplier_name_snapshot)} · ${esc(r.inspection_failures || 'Receiving rejection')}`;
    $('receivingVerifyDialog').showModal();
  }

  async function verifyReceiving(event) {
    event.preventDefault();
    if (!hasRole('supervisor')) { toast('Supervisor access is required.', 'error'); return; }
    const { error } = await db.rpc('verify_receiving_record', { p_record_id: $('receivingVerifyRecordId').value, p_notes: $('receivingVerifyNotes').value.trim() });
    if (error) { toast(error.message, 'error'); return; }
    $('receivingVerifyDialog').close();
    toast(t('receiving.verified'), 'good');
    await loadReceiving();
    if (state.currentPage === 'records') await loadRecordsHub();
  }

  function resetReceivingSupplierForm() {
    $('receivingSupplierForm').reset();
    $('receivingSupplierId').value = '';
    $('receivingSupplierApproval').value = 'approved';
    $('receivingSupplierFormTitle').textContent = 'Add approved supplier';
    $('receivingSupplierSave').textContent = 'Save Supplier';
    $('receivingSupplierCancel').classList.add('hidden');
  }

  function resetReceivingStandardForm() {
    $('receivingStandardForm').reset();
    $('receivingStandardId').value = '';
    $('receivingStandardUnit').value = '°C';
    $('receivingTemperatureRequired').checked = true;
    $('receivingRequirePackaging').checked = true;
    $('receivingRequireVehicle').checked = true;
    $('receivingStandardFormTitle').textContent = 'Add receiving standard';
    $('receivingStandardSave').textContent = 'Save Receiving Standard';
    $('receivingStandardCancel').classList.add('hidden');
    updateReceivingStandardFields();
  }

  function updateReceivingStandardFields() {
    $('receivingTemperatureLimitFields')?.classList.toggle('hidden', !$('receivingTemperatureRequired')?.checked);
  }

  function renderReceivingSettings() {
    $('receivingSupplierCount').textContent = state.receivingSuppliers.length;
    $('receivingStandardCount').textContent = state.receivingStandards.length;
    $('receivingSupplierList').innerHTML = state.receivingSuppliers.length ? state.receivingSuppliers.map(s => `<article class="setting-row ${!s.active ? 'inactive' : ''}"><div><strong>${esc(s.code)} — ${esc(s.name)}</strong><small>${esc(s.categories || 'No categories')} · ${esc(s.approval_reference || 'No approval reference')}</small></div><div class="setting-meta"><span class="${supplierApprovalClass(s.approval_status)}">${esc(s.approval_status.toUpperCase())}</span><span>${s.active ? 'ACTIVE' : 'ARCHIVED'}</span><button class="secondary" type="button" data-edit-receiving-supplier="${esc(s.id)}">Edit</button><button class="secondary" type="button" data-toggle-receiving-supplier="${esc(s.id)}">${s.active ? 'Archive' : 'Restore'}</button></div></article>`).join('') : '<div class="empty">No suppliers configured.</div>';
    $('receivingStandardList').innerHTML = state.receivingStandards.length ? state.receivingStandards.map(s => `<article class="setting-row ${!s.active ? 'inactive' : ''}"><div><strong>${esc(s.code)} — ${esc(s.name)}</strong><small>${esc(s.category || 'Receiving')} · ${esc(s.critical_limit_text)}${s.temperature_required ? '' : ' · No temperature measurement'}</small></div><div class="setting-meta"><span>${s.active ? 'ACTIVE' : 'ARCHIVED'}</span><button class="secondary" type="button" data-edit-receiving-standard="${esc(s.id)}">Edit</button><button class="secondary" type="button" data-toggle-receiving-standard="${esc(s.id)}">${s.active ? 'Archive' : 'Restore'}</button></div></article>`).join('') : '<div class="empty">No receiving standards configured.</div>';
  }

  async function loadReceivingSettings() {
    if (!hasRole('manager')) return;
    try {
      const [suppliers, standards] = await Promise.all([fetchReceivingSuppliers(true), fetchReceivingStandards(true)]);
      state.receivingSuppliers = suppliers;
      state.receivingStandards = standards;
      renderReceivingSettings();
    } catch (error) { toast(error.message || 'Could not load receiving settings.', 'error'); }
  }

  function editReceivingSupplier(id) {
    const s = state.receivingSuppliers.find(x => x.id === id); if (!s) return;
    $('receivingSupplierId').value = s.id; $('receivingSupplierCode').value = s.code || ''; $('receivingSupplierName').value = s.name || '';
    $('receivingSupplierApproval').value = s.approval_status || 'approved'; $('receivingSupplierReference').value = s.approval_reference || ''; $('receivingSupplierCategories').value = s.categories || '';
    $('receivingSupplierContact').value = s.contact_person || ''; $('receivingSupplierPhone').value = s.phone || ''; $('receivingSupplierEmail').value = s.email || ''; $('receivingSupplierNotes').value = s.notes || '';
    $('receivingSupplierFormTitle').textContent = 'Edit supplier'; $('receivingSupplierSave').textContent = 'Update Supplier'; $('receivingSupplierCancel').classList.remove('hidden');
    $('receivingSupplierForm').scrollIntoView({behavior:'smooth', block:'start'});
  }

  async function saveReceivingSupplier(event) {
    event.preventDefault(); if (!hasRole('manager')) return;
    const id = $('receivingSupplierId').value;
    const payload = { kitchen_id:state.kitchen.id, code:$('receivingSupplierCode').value.trim(), name:$('receivingSupplierName').value.trim(), approval_status:$('receivingSupplierApproval').value, approval_reference:$('receivingSupplierReference').value.trim()||null, categories:$('receivingSupplierCategories').value.trim()||null, contact_person:$('receivingSupplierContact').value.trim()||null, phone:$('receivingSupplierPhone').value.trim()||null, email:$('receivingSupplierEmail').value.trim()||null, notes:$('receivingSupplierNotes').value.trim()||null, updated_at:new Date().toISOString(), updated_by:state.user.id };
    const res = id ? await db.from('receiving_suppliers').update(payload).eq('id',id).eq('kitchen_id',state.kitchen.id) : await db.from('receiving_suppliers').insert({...payload,created_by:state.user.id});
    if (res.error) { toast(res.error.message,'error'); return; }
    toast(id ? 'Supplier updated.' : 'Supplier added.','good'); resetReceivingSupplierForm(); await loadReceivingSettings();
  }

  async function toggleReceivingSupplier(id) {
    const s=state.receivingSuppliers.find(x=>x.id===id); if(!s||!hasRole('manager'))return;
    if(!confirm(`${s.active?'Archive':'Restore'} ${s.code} — ${s.name}? Historical receiving records will remain unchanged.`))return;
    const {error}=await db.from('receiving_suppliers').update({active:!s.active,updated_at:new Date().toISOString(),updated_by:state.user.id}).eq('id',id).eq('kitchen_id',state.kitchen.id);
    if(error){toast(error.message,'error');return;} await loadReceivingSettings();
  }

  function editReceivingStandard(id) {
    const s=state.receivingStandards.find(x=>x.id===id); if(!s)return;
    $('receivingStandardId').value=s.id; $('receivingStandardCode').value=s.code||''; $('receivingStandardName').value=s.name||''; $('receivingStandardCategory').value=s.category||''; $('receivingStandardUnit').value=s.unit||'°C';
    $('receivingTemperatureRequired').checked=!!s.temperature_required; $('receivingStandardMin').value=s.min_value??''; $('receivingStandardMax').value=s.max_value??''; $('receivingStandardLimitText').value=s.critical_limit_text||''; $('receivingRequirePackaging').checked=!!s.require_intact_packaging; $('receivingRequireVehicle').checked=!!s.require_clean_vehicle; $('receivingStandardNotes').value=s.notes||'';
    $('receivingStandardFormTitle').textContent='Edit receiving standard'; $('receivingStandardSave').textContent='Update Receiving Standard'; $('receivingStandardCancel').classList.remove('hidden'); updateReceivingStandardFields(); $('receivingStandardForm').scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function saveReceivingStandard(event) {
    event.preventDefault(); if(!hasRole('manager'))return;
    const id=$('receivingStandardId').value; const tempRequired=$('receivingTemperatureRequired').checked;
    const min=nullableNumber($('receivingStandardMin').value), max=nullableNumber($('receivingStandardMax').value);
    if(tempRequired && min==null && max==null){toast('Set at least one receiving temperature limit or disable temperature measurement.','error');return;}
    const payload={kitchen_id:state.kitchen.id,code:$('receivingStandardCode').value.trim(),name:$('receivingStandardName').value.trim(),category:$('receivingStandardCategory').value.trim()||null,unit:$('receivingStandardUnit').value.trim()||'°C',temperature_required:tempRequired,min_value:tempRequired?min:null,max_value:tempRequired?max:null,critical_limit_text:$('receivingStandardLimitText').value.trim(),require_intact_packaging:$('receivingRequirePackaging').checked,require_clean_vehicle:$('receivingRequireVehicle').checked,notes:$('receivingStandardNotes').value.trim()||null,updated_at:new Date().toISOString(),updated_by:state.user.id};
    const res=id?await db.from('receiving_standards').update(payload).eq('id',id).eq('kitchen_id',state.kitchen.id):await db.from('receiving_standards').insert({...payload,created_by:state.user.id});
    if(res.error){toast(res.error.message,'error');return;} toast(id?'Receiving standard updated.':'Receiving standard added.','good'); resetReceivingStandardForm(); await loadReceivingSettings();
  }

  async function toggleReceivingStandard(id) {
    const s=state.receivingStandards.find(x=>x.id===id); if(!s||!hasRole('manager'))return;
    if(!confirm(`${s.active?'Archive':'Restore'} ${s.code} — ${s.name}? Historical receiving records will remain unchanged.`))return;
    const {error}=await db.from('receiving_standards').update({active:!s.active,updated_at:new Date().toISOString(),updated_by:state.user.id}).eq('id',id).eq('kitchen_id',state.kitchen.id);
    if(error){toast(error.message,'error');return;} await loadReceivingSettings();
  }

  async function loadReceivingRecords() {
    const date=$('recordDate').value||kitchenDate();
    const records=await fetchReceivingRecordsForDate(date); state.receivingRecords=records;
    const supplierSelect=$('receivingRecordSupplier');
    if(supplierSelect){const current=supplierSelect.value||'all'; const suppliers=[...new Map(records.map(r=>[r.supplier_id,{id:r.supplier_id,name:`${r.supplier_code_snapshot} — ${r.supplier_name_snapshot}`}])).values()]; supplierSelect.innerHTML='<option value="all">All Suppliers</option>'+suppliers.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join(''); supplierSelect.value=suppliers.some(s=>s.id===current)?current:'all';}
    const supplier=$('receivingRecordSupplier')?.value||'all', status=$('receivingRecordStatus')?.value||'all', q=($('receivingRecordSearch')?.value||'').trim().toLowerCase();
    const filtered=records.filter(r=>(supplier==='all'||r.supplier_id===supplier)&&(status==='all'||r.result===status)&&(!q||[r.product_name,r.batch_lot,r.delivery_reference,r.supplier_name_snapshot].some(v=>String(v||'').toLowerCase().includes(q))));
    const accepted=records.filter(r=>r.result==='PASS').length,rejected=records.filter(r=>r.result==='FAIL').length,verified=records.filter(r=>r.result==='FAIL'&&r.verified_at).length;
    $('receivingRecordsSummary').innerHTML=`<span><b>${records.length}</b>Deliveries</span><span class="summary-pass"><b>${accepted}</b>Accepted</span><span class="summary-out"><b>${rejected}</b>Rejected</span><span><b>${verified}/${rejected}</b>Rejected verified</span>`;
    $('receivingRecordsBody').innerHTML=filtered.length?filtered.map(r=>`<tr><td>${fmtTime(r.received_at)}</td><td><b>${esc(r.supplier_code_snapshot)} — ${esc(r.supplier_name_snapshot)}</b><br><span class="muted">${esc(r.supplier_approval_snapshot)}</span></td><td><b>${esc(r.product_name)}</b>${r.batch_lot?`<br><span class="muted">Lot ${esc(r.batch_lot)}</span>`:''}${r.delivery_reference?`<br><span class="muted">${esc(r.delivery_reference)}</span>`:''}</td><td>${esc(r.standard_code_snapshot)}<br><span class="muted">${esc(r.critical_limit_text_snapshot)}</span></td><td>${r.temperature_required_snapshot?`${esc(r.observed_temperature??'—')}${esc(r.unit_snapshot)}`:'N/A'}</td><td>${esc(r.packaging_condition.replaceAll('_',' '))}<br><span class="muted">${esc(r.vehicle_condition.replaceAll('_',' '))}</span></td><td class="table-status ${r.result==='PASS'?'pass':'out'}">${esc(r.disposition)}${r.result==='FAIL'?`<br><small>${esc(r.inspection_failures||'')}</small><br><small>${esc(r.corrective_action||'')}</small>`:''}</td><td>${esc(r.receiver?.full_name||r.receiver?.email||'Staff')}</td><td>${(r.evidence||[]).length?`<button class="text-btn compact-btn" type="button" data-view-receiving-evidence="${esc(r.id)}">📷 ${(r.evidence||[]).length} photo${(r.evidence||[]).length===1?'':'s'}</button><br>`:''}${r.result==='PASS'?'Not required':r.verified_at?`✓ ${esc(r.verifier?.full_name||r.verifier?.email||'Supervisor')}<br><span class="muted">${fmtDateTime(r.verified_at)}</span>`:`<span class="status-open">PENDING</span>${hasRole('supervisor')?`<br><button class="text-btn compact-btn" type="button" data-verify-receiving-record="${esc(r.id)}">Verify</button>`:''}`}</td></tr>`).join(''):'<tr><td colspan="9" class="empty">No receiving records match these filters.</td></tr>';
  }

  async function buildReceivingReportHtml(date) {
    const [records,propertyRes]=await Promise.all([fetchReceivingRecordsForDate(date),db.from('property_settings').select('*').eq('kitchen_id',state.kitchen.id).maybeSingle()]);
    if(propertyRes.error)throw propertyRes.error;
    state.property=propertyRes.data||state.property||null;
    const p=state.property||{};
    const accepted=records.filter(r=>r.result==='PASS').length,rejected=records.filter(r=>r.result==='FAIL').length,verified=records.filter(r=>r.result==='FAIL'&&r.verified_at).length;
    const evidenceCount=records.reduce((n,r)=>n+(r.evidence||[]).length,0);
    const generatedAt=new Date().toLocaleString(currentLanguage==='id'?'id-ID':'en-GB');
    const logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}" alt="">`:'';
    const contact=[p.phone,p.website].filter(Boolean).map(esc).join(' · ');
    const evidenceRows=[];
    for(const r of records){
      if(!(r.evidence||[]).length) continue;
      try{
        const photos=await signedReceivingEvidence(r.evidence,1800);
        evidenceRows.push(`<section class="evidence-block"><h3>${esc(r.product_name)} · ${esc(r.supplier_code_snapshot)}${r.delivery_reference?` · ${esc(r.delivery_reference)}`:''}</h3><div class="evidence-grid">${photos.map(photo=>`<figure><img src="${esc(photo.signedUrl)}" alt=""><figcaption>${esc(String(photo.photo_kind||'other').replaceAll('_',' '))}</figcaption></figure>`).join('')}</div></section>`);
      }catch(error){ console.error('Receiving PDF evidence:',error); }
    }
    return `<!doctype html><html><head><meta charset="utf-8"><title>Receiving HACCP ${esc(date)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:8.5px;line-height:1.35}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:9px;margin-bottom:9px}.property-logo{max-width:95px;max-height:52px;object-fit:contain}.property-copy{flex:1}.property-name{font-size:16px;font-weight:800}.property-detail{font-size:8.5px;color:#444}.record-head{display:flex;justify-content:space-between;gap:20px;align-items:end}h1{font-size:19px;margin:2px 0}.eyebrow{font-size:7.5px;letter-spacing:.14em;color:#666;font-weight:bold}.record-meta{text-align:right;font-size:8.5px;line-height:1.55}.meta{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin:12px 0}.box{border:1px solid #ccc;border-radius:5px;padding:7px}.box strong{font-size:14px;display:block;margin-top:2px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-bottom:1px solid #ddd;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{font-size:7px;text-transform:uppercase;color:#666}.pass{font-weight:bold;color:#14532d}.out{font-weight:bold;color:#991b1b}.muted{color:#666}.footer{margin-top:13px;border-top:1px solid #ddd;padding-top:7px;color:#666;font-size:7.5px}.evidence-title{margin:18px 0 8px;border-top:2px solid #111;padding-top:10px;font-size:14px}.evidence-block{break-inside:avoid;margin:0 0 12px}.evidence-block h3{font-size:9px;margin:0 0 5px}.evidence-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.evidence-grid figure{margin:0;border:1px solid #ddd;padding:4px;border-radius:4px}.evidence-grid img{display:block;width:100%;height:92px;object-fit:cover}.evidence-grid figcaption{font-size:7px;margin-top:3px;text-transform:capitalize}@media print{button{display:none}}</style></head><body>${(p.property_name||p.address||p.phone||p.website||p.logo_data_url)?`<div class="property-head">${logo}<div class="property-copy"><div class="property-name">${esc(p.property_name||'')}</div>${p.address?`<div class="property-detail">${esc(p.address)}</div>`:''}${contact?`<div class="property-detail">${contact}</div>`:''}</div></div>`:''}<div class="record-head"><div><div class="eyebrow">HACCP RECEIVING / INCOMING FOOD RECORD</div><h1>${esc(state.kitchen.name)}</h1></div><div class="record-meta"><b>Record date:</b> ${esc(date)}<br><b>Generated:</b> ${esc(generatedAt)}<br><b>Timezone:</b> ${esc(kitchenTimeZone())}</div></div><div class="meta"><div class="box">Deliveries<strong>${records.length}</strong></div><div class="box">Accepted<strong>${accepted}</strong></div><div class="box">Rejected<strong>${rejected}</strong></div><div class="box">Rejected verified<strong>${verified}/${rejected}</strong></div><div class="box">Evidence photos<strong>${evidenceCount}</strong></div></div><table><thead><tr><th>Time</th><th>Supplier</th><th>Product / Lot</th><th>Standard</th><th>Temp.</th><th>Packaging / Transport</th><th>Decision</th><th>Received by</th><th>Evidence / Verification</th></tr></thead><tbody>${records.length?records.map(r=>`<tr><td>${esc(fmtTime(r.received_at))}</td><td><b>${esc(r.supplier_code_snapshot)} — ${esc(r.supplier_name_snapshot)}</b><br><span class="muted">${esc(r.supplier_approval_snapshot)}</span></td><td><b>${esc(r.product_name)}</b>${r.batch_lot?`<br><span class="muted">Lot ${esc(r.batch_lot)}</span>`:''}${r.delivery_reference?`<br><span class="muted">${esc(r.delivery_reference)}</span>`:''}${r.quantity?`<br><span class="muted">${esc(r.quantity)} ${esc(r.quantity_unit||'')}</span>`:''}</td><td>${esc(r.standard_code_snapshot)} — ${esc(r.standard_name_snapshot)}<br><span class="muted">${esc(r.critical_limit_text_snapshot)}</span></td><td>${r.temperature_required_snapshot?`${esc(r.observed_temperature??'—')}${esc(r.unit_snapshot)}`:'N/A'}</td><td>${esc(r.packaging_condition.replaceAll('_',' '))}<br><span class="muted">${esc(r.vehicle_condition.replaceAll('_',' '))}</span></td><td class="${r.result==='PASS'?'pass':'out'}">${esc(r.disposition)}${r.result==='FAIL'?`<br><span class="muted">${esc(r.inspection_failures||'')}</span><br>${esc(r.corrective_action||'')}`:''}</td><td>${esc(r.receiver?.full_name||r.receiver?.email||'Staff')}</td><td>${(r.evidence||[]).length} photo${(r.evidence||[]).length===1?'':'s'}<br>${r.result==='PASS'?'Verification N/A':r.verified_at?`${esc(r.verifier?.full_name||r.verifier?.email||'Supervisor')}<br><span class="muted">${esc(fmtDateTime(r.verified_at))}${r.verification_notes?` · ${esc(r.verification_notes)}`:''}</span>`:'Verification pending'}</td></tr>`).join(''):'<tr><td colspan="9">No receiving checks recorded for this date.</td></tr>'}</tbody></table>${evidenceRows.length?`<h2 class="evidence-title">Photo Evidence</h2>${evidenceRows.join('')}`:''}<div class="footer">Receiving photo evidence is retained as supporting evidence for the recorded inspection. Receiving requirements shown are historical snapshots from the property-approved receiving standard used at the time of inspection.</div></body></html>`;
  }

  async function generateReceivingPdf(mode='print'){return runRecordAction('receiving',mode);}

  function calibrationMethodLabel(method) {
    const labels = {
      ice_point: currentLanguage === 'id' ? 'Titik es' : 'Ice-point check',
      boiling_point: currentLanguage === 'id' ? 'Titik didih' : 'Boiling-point check',
      comparison: currentLanguage === 'id' ? 'Perbandingan / alat referensi' : 'Comparison / reference device',
      external_certificate: currentLanguage === 'id' ? 'Sertifikat eksternal' : 'External certificate',
      other: currentLanguage === 'id' ? 'Metode lain' : 'Other approved method'
    };
    return labels[method] || method || '—';
  }

  function dateDiffDays(fromDate, toDate) {
    const a = new Date(`${fromDate}T00:00:00Z`).getTime();
    const b = new Date(`${toDate}T00:00:00Z`).getTime();
    return Math.round((b - a) / 86400000);
  }

  function calibrationDueState(device) {
    if (!device?.active) return { key:'archived', label:'ARCHIVED', className:'calibration-muted' };
    if (device.last_result === 'FAIL' || device.service_status === 'out_of_service') return { key:'failed', label:'FAILED · OUT OF SERVICE', className:'status-out' };
    if (!device.next_due_date) return { key:'due', label:'CALIBRATION DUE', className:'status-open' };
    const today = kitchenDate();
    const days = dateDiffDays(today, device.next_due_date);
    if (days < 0) return { key:'overdue', label:`OVERDUE ${Math.abs(days)} DAY${Math.abs(days) === 1 ? '' : 'S'}`, className:'status-out' };
    if (days <= 7) return { key:'due_soon', label: days === 0 ? 'DUE TODAY' : `DUE IN ${days} DAY${days === 1 ? '' : 'S'}`, className:'status-open' };
    return { key:'current', label:`CURRENT · DUE ${device.next_due_date}`, className:'status-pass' };
  }

  async function fetchCalibrationDevices(includeInactive = true) {
    let query = db.from('calibration_devices').select('*,locations(name)').eq('kitchen_id', state.kitchen.id);
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query.order('code');
    if (error) throw error;
    return data || [];
  }

  async function fetchCalibrationRecordsForDate(date) {
    const { data, error } = await db.from('calibration_records')
      .select('*,performedBy:profiles!calibration_records_performed_by_fkey(full_name,email),verifier:profiles!calibration_records_verified_by_fkey(full_name,email)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('calibration_date', date)
      .order('calibrated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function fetchRecentCalibrationRecords(limit = 50) {
    const { data, error } = await db.from('calibration_records')
      .select('*,performedBy:profiles!calibration_records_performed_by_fkey(full_name,email),verifier:profiles!calibration_records_verified_by_fkey(full_name,email)')
      .eq('kitchen_id', state.kitchen.id)
      .order('calibrated_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  async function loadCalibrationBadge() {
    try {
      const devices = await fetchCalibrationDevices(false);
      const overdue = devices.filter(d => ['overdue','failed','due'].includes(calibrationDueState(d).key)).length;
      const badge = $('navCalibrationBadge');
      if (badge) {
        badge.textContent = overdue;
        badge.classList.toggle('hidden', overdue === 0);
      }
    } catch (error) {
      if (error?.code !== '42P01') console.error('Calibration badge:', error);
    }
  }

  function populateCalibrationLocationSelect() {
    const select = $('calibrationDeviceLocation');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">No fixed location</option>' + state.locations.map(l => `<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
    select.value = state.locations.some(l => l.id === current) ? current : '';
  }

  function renderCalibrationPage() {
    const devices = state.calibrationDevices || [];
    const active = devices.filter(d => d.active);
    const dueSoon = active.filter(d => calibrationDueState(d).key === 'due_soon').length;
    const overdue = active.filter(d => ['overdue','due'].includes(calibrationDueState(d).key)).length;
    const failed = active.filter(d => calibrationDueState(d).key === 'failed').length;
    $('calibrationDeviceCount').textContent = active.length;
    $('calibrationDueSoonCount').textContent = dueSoon;
    $('calibrationOverdueCount').textContent = overdue;
    $('calibrationFailedCount').textContent = failed;
    $('calibrationRecentCount').textContent = state.calibrationRecords.length;

    $('calibrationDeviceList').innerHTML = devices.length ? devices.map(d => {
      const due = calibrationDueState(d);
      const loc = d.locations?.name || state.locations.find(l => l.id === d.location_id)?.name || 'No fixed location';
      const identity = [d.manufacturer, d.model, d.serial_number ? `S/N ${d.serial_number}` : null].filter(Boolean).join(' · ');
      return `<article class="calibration-device-card ${!d.active ? 'inactive' : ''}">
        <div class="calibration-device-head"><div><span class="storage-badge">${esc(d.device_type || 'Thermometer')}</span><h3>${esc(d.code)} — ${esc(d.name)}</h3><p>${esc(loc)}${identity ? ` · ${esc(identity)}` : ''}</p></div><span class="${due.className}">${esc(due.label)}</span></div>
        <div class="calibration-device-meta"><span><b>Tolerance</b>±${esc(d.tolerance)}°C</span><span><b>Interval</b>${esc(d.calibration_interval_days)} days</span><span><b>Last check</b>${d.last_calibrated_at ? esc(fmtDateTime(d.last_calibrated_at)) : 'Never'}</span><span><b>Next due</b>${esc(d.next_due_date || 'Due now')}</span></div>
        ${d.notes ? `<p class="small muted">${esc(d.notes)}</p>` : ''}
        <div class="form-actions">${d.active && hasRole('supervisor') ? `<button class="primary compact-btn" type="button" data-calibrate-device="${esc(d.id)}">Calibrate</button>` : ''}${hasRole('manager') ? `<button class="secondary compact-btn" type="button" data-edit-calibration-device="${esc(d.id)}">Edit</button><button class="secondary compact-btn" type="button" data-toggle-calibration-device="${esc(d.id)}">${d.active ? 'Archive' : 'Restore'}</button>` : ''}</div>
      </article>`;
    }).join('') : '<div class="empty">No thermometers or measuring devices are registered yet.</div>';

    $('calibrationRecentList').innerHTML = state.calibrationRecords.length ? state.calibrationRecords.map(r => {
      const performed = r.performedBy?.full_name || r.performedBy?.email || 'Supervisor';
      const verifier = r.verifier?.full_name || r.verifier?.email || 'Manager';
      return `<article class="calibration-history-row"><div><strong>${esc(r.device_code_snapshot)} — ${esc(r.device_name_snapshot)}</strong><small>${esc(calibrationMethodLabel(r.method))} · ${fmtDateTime(r.calibrated_at)} · ${esc(performed)}</small><small>Reference ${esc(r.reference_temperature)}°C · Observed ${esc(r.observed_temperature)}°C · Δ ${esc(r.deviation)}°C / ±${esc(r.tolerance)}°C</small>${r.result === 'FAIL' && r.corrective_action ? `<small class="calibration-fail-note">Action: ${esc(r.corrective_action)}</small>` : ''}</div><div class="calibration-history-status"><span class="${r.result === 'PASS' ? 'status-pass' : 'status-out'}">${esc(r.result)}</span>${r.verified_at ? `<small>✓ Verified<br>${esc(verifier)}</small>` : hasRole('manager') ? `<button class="secondary compact-btn" type="button" data-verify-calibration="${esc(r.id)}">Verify</button>` : '<small>Pending verification</small>'}</div></article>`;
    }).join('') : '<div class="empty">No calibration checks have been recorded yet.</div>';
  }

  async function loadCalibration() {
    try {
      const [devices, records] = await Promise.all([fetchCalibrationDevices(true), fetchRecentCalibrationRecords(50)]);
      state.calibrationDevices = devices;
      state.calibrationRecords = records;
      populateCalibrationLocationSelect();
      renderCalibrationPage();
      await loadCalibrationBadge();
    } catch (error) {
      toast(error.message || 'Could not load calibration records.', 'error');
    }
  }

  function resetCalibrationDeviceForm() {
    $('calibrationDeviceForm').reset();
    $('calibrationDeviceId').value = '';
    $('calibrationDeviceTolerance').value = '0.5';
    $('calibrationDeviceInterval').value = '30';
    $('calibrationDeviceDialogTitle').textContent = 'Add Thermometer';
    $('saveCalibrationDevice').textContent = 'Save Thermometer';
    populateCalibrationLocationSelect();
  }

  function openCalibrationDeviceDialog(id = null) {
    if (!hasRole('manager')) return;
    resetCalibrationDeviceForm();
    if (id) {
      const d = state.calibrationDevices.find(x => x.id === id);
      if (!d) return;
      $('calibrationDeviceId').value = d.id;
      $('calibrationDeviceCode').value = d.code || '';
      $('calibrationDeviceName').value = d.name || '';
      $('calibrationDeviceType').value = d.device_type || 'Digital Probe';
      $('calibrationDeviceLocation').value = d.location_id || '';
      $('calibrationDeviceTolerance').value = d.tolerance ?? 0.5;
      $('calibrationDeviceInterval').value = d.calibration_interval_days ?? 30;
      $('calibrationDeviceManufacturer').value = d.manufacturer || '';
      $('calibrationDeviceModel').value = d.model || '';
      $('calibrationDeviceSerial').value = d.serial_number || '';
      $('calibrationDeviceNotes').value = d.notes || '';
      $('calibrationDeviceDialogTitle').textContent = 'Edit Thermometer';
      $('saveCalibrationDevice').textContent = 'Update Thermometer';
    }
    $('calibrationDeviceDialog').showModal();
  }

  async function saveCalibrationDevice(event) {
    event.preventDefault();
    if (!hasRole('manager')) { toast('Manager access is required.', 'error'); return; }
    const id = $('calibrationDeviceId').value;
    const payload = {
      kitchen_id: state.kitchen.id,
      code: $('calibrationDeviceCode').value.trim(),
      name: $('calibrationDeviceName').value.trim(),
      device_type: $('calibrationDeviceType').value,
      location_id: $('calibrationDeviceLocation').value || null,
      tolerance: Number($('calibrationDeviceTolerance').value),
      calibration_interval_days: Number($('calibrationDeviceInterval').value),
      manufacturer: $('calibrationDeviceManufacturer').value.trim() || null,
      model: $('calibrationDeviceModel').value.trim() || null,
      serial_number: $('calibrationDeviceSerial').value.trim() || null,
      notes: $('calibrationDeviceNotes').value.trim() || null,
      updated_at: new Date().toISOString(),
      updated_by: state.user.id
    };
    let response;
    if (id) response = await db.from('calibration_devices').update(payload).eq('id', id).eq('kitchen_id', state.kitchen.id);
    else response = await db.from('calibration_devices').insert({...payload, created_by: state.user.id});
    if (response.error) { toast(response.error.message, 'error'); return; }
    $('calibrationDeviceDialog').close();
    toast(id ? 'Thermometer updated.' : 'Thermometer registered.', 'good');
    await loadCalibration();
  }

  async function toggleCalibrationDevice(id) {
    if (!hasRole('manager')) return;
    const d = state.calibrationDevices.find(x => x.id === id);
    if (!d) return;
    const label = d.active ? 'archive' : 'restore';
    if (!confirm(`${label === 'archive' ? 'Archive' : 'Restore'} ${d.code} — ${d.name}? Historical calibration records will remain unchanged.`)) return;
    const { error } = await db.from('calibration_devices').update({ active: !d.active, updated_at: new Date().toISOString(), updated_by: state.user.id }).eq('id', id).eq('kitchen_id', state.kitchen.id);
    if (error) { toast(error.message, 'error'); return; }
    toast(`Thermometer ${label}d.`, 'good');
    await loadCalibration();
  }

  function populateCalibrationCheckDevices(selectedId = null) {
    const select = $('calibrationCheckDevice');
    const active = state.calibrationDevices.filter(d => d.active);
    select.innerHTML = '<option value="">Select thermometer…</option>' + active.map(d => `<option value="${esc(d.id)}">${esc(d.code)} — ${esc(d.name)}</option>`).join('');
    if (selectedId && active.some(d => d.id === selectedId)) select.value = selectedId;
    updateCalibrationCheckDevice();
  }

  function updateCalibrationCheckDevice() {
    const d = state.calibrationDevices.find(x => x.id === $('calibrationCheckDevice')?.value);
    if ($('calibrationCheckTolerance')) $('calibrationCheckTolerance').value = d?.tolerance ?? '';
    updateCalibrationPreview();
  }

  function updateCalibrationMethod() {
    if ($('calibrationCheckMethod').value === 'ice_point') {
      if ($('calibrationReferenceTemp').value === '') $('calibrationReferenceTemp').value = '0';
      if (!$('calibrationReferenceSource').value.trim()) $('calibrationReferenceSource').value = 'Ice-water slurry';
    }
    updateCalibrationPreview();
  }

  function updateCalibrationPreview() {
    const ref = Number($('calibrationReferenceTemp')?.value);
    const observed = Number($('calibrationObservedTemp')?.value);
    const tolerance = Number($('calibrationCheckTolerance')?.value);
    const preview = $('calibrationResultPreview');
    if (!preview) return;
    if (![ref, observed, tolerance].every(Number.isFinite)) {
      preview.className = 'result-preview neutral';
      preview.textContent = 'Enter reference and observed temperatures.';
      $('calibrationFailFields')?.classList.add('hidden');
      return;
    }
    const deviation = Math.abs(observed - ref);
    const pass = deviation <= tolerance;
    preview.className = `result-preview ${pass ? 'pass' : 'out'}`;
    preview.textContent = `${pass ? 'PASS' : 'FAIL'} — deviation ${deviation.toFixed(2)}°C · allowed ±${tolerance.toFixed(2)}°C`;
    $('calibrationFailFields')?.classList.toggle('hidden', pass);
  }

  function openCalibrationCheck(deviceId = null) {
    if (!hasRole('supervisor')) return;
    const active = state.calibrationDevices.filter(d => d.active);
    if (!active.length) { toast('Register an active thermometer before recording calibration.', 'error'); return; }
    $('calibrationCheckForm').reset();
    $('calibrationCheckAt').value = localDateTimeInput();
    populateCalibrationCheckDevices(deviceId);
    $('calibrationCheckMethod').value = 'ice_point';
    $('calibrationReferenceTemp').value = '0';
    $('calibrationReferenceSource').value = 'Ice-water slurry';
    $('calibrationCorrectiveAction').value = '';
    updateCalibrationCheckDevice();
    updateCalibrationPreview();
    $('calibrationCheckDialog').showModal();
  }

  async function saveCalibrationCheck(event) {
    event.preventDefault();
    if (!hasRole('supervisor')) { toast('Supervisor access is required.', 'error'); return; }
    const d = state.calibrationDevices.find(x => x.id === $('calibrationCheckDevice').value);
    if (!d) { toast('Select a thermometer.', 'error'); return; }
    const ref = Number($('calibrationReferenceTemp').value);
    const observed = Number($('calibrationObservedTemp').value);
    const tolerance = Number(d.tolerance);
    const fail = Math.abs(observed - ref) > tolerance;
    const corrective = $('calibrationCorrectiveAction').value.trim();
    if (fail && !corrective) { toast('Corrective action is required for a failed calibration.', 'error'); return; }
    const at = new Date($('calibrationCheckAt').value);
    if (Number.isNaN(at.getTime())) { toast('Enter a valid calibration date/time.', 'error'); return; }
    const payload = {
      kitchen_id: state.kitchen.id,
      device_id: d.id,
      calibration_date: kitchenDate(at),
      calibrated_at: at.toISOString(),
      method: $('calibrationCheckMethod').value,
      reference_source: $('calibrationReferenceSource').value.trim(),
      reference_temperature: ref,
      observed_temperature: observed,
      tolerance,
      deviation: Math.abs(observed - ref),
      result: fail ? 'FAIL' : 'PASS',
      corrective_action: fail ? corrective : null,
      certificate_reference: $('calibrationCertificateRef').value.trim() || null,
      notes: $('calibrationCheckNotes').value.trim() || null,
      next_due_date: kitchenDate(at),
      performed_by: state.user.id,
      device_code_snapshot: d.code,
      device_name_snapshot: d.name,
      tolerance_snapshot: tolerance,
      interval_days_snapshot: d.calibration_interval_days
    };
    const { error } = await db.from('calibration_records').insert(payload);
    if (error) { toast(error.message, 'error'); return; }
    $('calibrationCheckDialog').close();
    toast(fail ? 'Calibration FAILED — device marked out of service.' : 'Calibration PASS recorded.', fail ? 'error' : 'good');
    await loadCalibration();
  }

  function openCalibrationVerify(id) {
    if (!hasRole('manager')) return;
    const r = state.calibrationRecords.find(x => x.id === id);
    if (!r) return;
    $('calibrationVerifyRecordId').value = id;
    $('calibrationVerifyNotes').value = '';
    $('calibrationVerifySummary').innerHTML = `<strong>${esc(r.device_code_snapshot)} — ${esc(r.device_name_snapshot)}</strong><br>${esc(calibrationMethodLabel(r.method))} · ${esc(r.result)} · Δ ${esc(r.deviation)}°C / ±${esc(r.tolerance)}°C`;
    $('calibrationVerifyDialog').showModal();
  }

  async function verifyCalibration(event) {
    event.preventDefault();
    if (!hasRole('manager')) { toast('Manager access is required to verify calibration.', 'error'); return; }
    const { error } = await db.rpc('verify_calibration_record', { p_record_id: $('calibrationVerifyRecordId').value, p_notes: $('calibrationVerifyNotes').value.trim() });
    if (error) { toast(error.message, 'error'); return; }
    $('calibrationVerifyDialog').close();
    toast('Calibration record verified.', 'good');
    await loadCalibration();
    if (state.currentPage === 'records') await loadRecordsHub();
  }

  async function loadCalibrationRecords() {
    const date = $('recordDate').value || kitchenDate();
    const records = await fetchCalibrationRecordsForDate(date);
    state.calibrationRecords = records;
    const status = $('calibrationRecordStatus')?.value || 'all';
    const verification = $('calibrationRecordVerification')?.value || 'all';
    const filtered = records.filter(r => (status === 'all' || r.result === status) && (verification === 'all' || (verification === 'verified' ? !!r.verified_at : !r.verified_at)));
    const pass = records.filter(r => r.result === 'PASS').length;
    const fail = records.filter(r => r.result === 'FAIL').length;
    const verified = records.filter(r => r.verified_at).length;
    $('calibrationRecordsSummary').innerHTML = `<span><b>${records.length}</b>Checks</span><span class="summary-pass"><b>${pass}</b>PASS</span><span class="summary-out"><b>${fail}</b>FAIL</span><span><b>${verified}/${records.length}</b>Verified</span>`;
    $('calibrationRecordsBody').innerHTML = filtered.length ? filtered.map(r => `<tr><td>${fmtTime(r.calibrated_at)}</td><td><b>${esc(r.device_code_snapshot)} — ${esc(r.device_name_snapshot)}</b><br><span class="muted">${esc(r.device_type_snapshot || '')}${r.location_name_snapshot ? ` · ${esc(r.location_name_snapshot)}` : ''}</span></td><td>${esc(calibrationMethodLabel(r.method))}<br><span class="muted">${esc(r.reference_source)}</span></td><td>${esc(r.reference_temperature)}°C</td><td>${esc(r.observed_temperature)}°C</td><td>Δ ${esc(r.deviation)}°C<br><span class="muted">±${esc(r.tolerance)}°C allowed</span></td><td class="table-status ${r.result === 'PASS' ? 'pass' : 'out'}">${esc(r.result)}${r.result === 'FAIL' && r.corrective_action ? `<br><small>${esc(r.corrective_action)}</small>` : ''}</td><td>${esc(r.performedBy?.full_name || r.performedBy?.email || 'Supervisor')}</td><td>${r.verified_at ? `✓ ${esc(r.verifier?.full_name || r.verifier?.email || 'Manager')}<br><span class="muted">${fmtDateTime(r.verified_at)}</span>` : `${'<span class="status-open">PENDING</span>'}${hasRole('manager') ? `<br><button class="text-btn compact-btn" type="button" data-verify-calibration-record="${esc(r.id)}">Verify</button>` : ''}`}</td></tr>`).join('') : '<tr><td colspan="9" class="empty">No calibration records match these filters.</td></tr>';
  }

  async function buildCalibrationReportHtml(date) {
    const [records, propertyRes] = await Promise.all([
      fetchCalibrationRecordsForDate(date),
      db.from('property_settings').select('*').eq('kitchen_id', state.kitchen.id).maybeSingle()
    ]);
    if (propertyRes.error) throw propertyRes.error;
    state.property = propertyRes.data || state.property || null;
    const p = state.property || {};
    const pass = records.filter(r => r.result === 'PASS').length;
    const fail = records.filter(r => r.result === 'FAIL').length;
    const verified = records.filter(r => r.verified_at).length;
    const generatedAt = new Date().toLocaleString(currentLanguage === 'id' ? 'id-ID' : 'en-GB');
    const logo = p.logo_data_url ? `<img class="property-logo" src="${esc(p.logo_data_url)}" alt="">` : '';
    const contact = [p.phone, p.website].filter(Boolean).map(esc).join(' · ');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Calibration HACCP ${esc(date)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:9px;line-height:1.35}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:9px;margin-bottom:9px}.property-logo{max-width:95px;max-height:52px;object-fit:contain}.property-copy{flex:1}.property-name{font-size:16px;font-weight:800}.property-detail{font-size:8.5px;color:#444}.record-head{display:flex;justify-content:space-between;gap:20px;align-items:end}h1{font-size:19px;margin:2px 0}.eyebrow{font-size:7.5px;letter-spacing:.14em;color:#666;font-weight:bold}.record-meta{text-align:right;font-size:8.5px;line-height:1.55}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.box{border:1px solid #ccc;border-radius:5px;padding:7px}.box strong{font-size:14px;display:block;margin-top:2px}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border-bottom:1px solid #ddd;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{font-size:7px;text-transform:uppercase;color:#666}.pass{font-weight:bold;color:#14532d}.out{font-weight:bold;color:#991b1b}.muted{color:#666}.footer{margin-top:13px;border-top:1px solid #ddd;padding-top:7px;color:#666;font-size:7.5px}.review{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:15px;padding-top:8px}.review span{border-top:1px solid #777;padding-top:4px;color:#555}@media print{button{display:none}}</style></head><body>${(p.property_name || p.address || p.phone || p.website || p.logo_data_url) ? `<div class="property-head">${logo}<div class="property-copy"><div class="property-name">${esc(p.property_name || '')}</div>${p.address ? `<div class="property-detail">${esc(p.address)}</div>` : ''}${contact ? `<div class="property-detail">${contact}</div>` : ''}</div></div>` : ''}<div class="record-head"><div><div class="eyebrow">HACCP CALIBRATION RECORD</div><h1>${esc(state.kitchen.name)}</h1></div><div class="record-meta"><b>Record date:</b> ${esc(date)}<br><b>Generated:</b> ${esc(generatedAt)}<br><b>Timezone:</b> ${esc(kitchenTimeZone())}</div></div><div class="meta"><div class="box">Total checks<strong>${records.length}</strong></div><div class="box">Passed<strong>${pass}</strong></div><div class="box">Failed<strong>${fail}</strong></div><div class="box">Verified<strong>${verified}/${records.length}</strong></div></div><table><thead><tr><th>Time</th><th>Device</th><th>Method / reference</th><th>Reference</th><th>Observed</th><th>Deviation / tolerance</th><th>Result</th><th>Performed by</th><th>Verification</th></tr></thead><tbody>${records.length ? records.map(r => `<tr><td>${esc(fmtTime(r.calibrated_at))}</td><td><b>${esc(r.device_code_snapshot)} — ${esc(r.device_name_snapshot)}</b><br><span class="muted">${esc(r.device_type_snapshot || '')}${r.serial_number_snapshot ? ` · S/N ${esc(r.serial_number_snapshot)}` : ''}${r.location_name_snapshot ? ` · ${esc(r.location_name_snapshot)}` : ''}</span></td><td>${esc(calibrationMethodLabel(r.method))}<br><span class="muted">${esc(r.reference_source)}${r.certificate_reference ? ` · Ref ${esc(r.certificate_reference)}` : ''}</span></td><td>${esc(r.reference_temperature)}°C</td><td>${esc(r.observed_temperature)}°C</td><td>Δ ${esc(r.deviation)}°C<br>±${esc(r.tolerance)}°C</td><td class="${r.result === 'PASS' ? 'pass' : 'out'}">${esc(r.result)}${r.result === 'FAIL' && r.corrective_action ? `<br><span class="muted">${esc(r.corrective_action)}</span>` : ''}</td><td>${esc(r.performedBy?.full_name || r.performedBy?.email || 'Supervisor')}</td><td>${r.verified_at ? `${esc(r.verifier?.full_name || r.verifier?.email || 'Manager')}<br><span class="muted">${esc(fmtDateTime(r.verified_at))}${r.verification_notes ? ` · ${esc(r.verification_notes)}` : ''}</span>` : 'Pending'}</td></tr>`).join('') : '<tr><td colspan="9">No calibration checks recorded for this date.</td></tr>'}</tbody></table><div class="review"><span>Manager / HACCP reviewer</span><span>Signature</span><span>Date / Time</span></div><div class="footer">Calibration records support verification that monitoring equipment is accurate and fit for use. Reference temperatures, methods and tolerances must follow the property’s approved procedure and applicable requirements.</div></body></html>`;
  }

  async function loadVerificationRecords() {
    const date = $('recordDate').value || kitchenDate();
    const [storageVerification, storageLogs, receivingRecords, processReport, calibrationRecords, calibrationDevices, sanitationStandards, sanitationRecords] = await Promise.all([getDailyVerification(date), getDailyLogs(date), fetchReceivingRecordsForDate(date), getDailyProcessReport(date), fetchCalibrationRecordsForDate(date), fetchCalibrationDevices(false), fetchSanitationStandards(false), fetchSanitationRecordsForDate(date)]);
    const storageOut = storageLogs.filter(l => l.status === 'OUT');
    const storageVerifiedActions = storageOut.filter(l => correctiveActionFor(l)?.verified_at).length;
    const receivingRejected = receivingRecords.filter(r => r.result === 'FAIL');
    const receivingVerified = receivingRejected.filter(r => r.verified_at).length;
    const receivingComplete = receivingRejected.length === receivingVerified;
    const processOut = processReport.readings.filter(r => r.status === 'OUT');
    const processVerifiedActions = processOut.filter(r => processActionFor(r)?.verified_at).length;
    const storageComplete = !!storageVerification;
    const processComplete = processOut.length === processVerifiedActions;
    const calibrationVerified = calibrationRecords.filter(r => r.verified_at).length;
    const calibrationFailed = calibrationRecords.filter(r => r.result === 'FAIL').length;
    const calibrationOverdue = calibrationDevices.filter(d => ['overdue','due','failed'].includes(calibrationDueState(d).key)).length;
    const calibrationComplete = calibrationRecords.length === calibrationVerified && calibrationOverdue === 0;
    const sanitationDue = sanitationStandards.filter(s => sanitationStandardDueOn(s,date));
    const sanitationLatest = latestSanitationByStandard(sanitationRecords);
    const sanitationIncomplete = sanitationDue.filter(s => !sanitationLatest.has(s.id)).length;
    const sanitationPending = sanitationRecords.filter(r => r.verification_status === 'PENDING').length;
    const sanitationRecheck = sanitationRecords.filter(r => r.verification_status === 'RECHECK_REQUIRED').length;
    const sanitationFailed = sanitationRecords.filter(r => r.result === 'FAIL').length;
    const sanitationComplete = sanitationIncomplete === 0 && sanitationPending === 0 && sanitationRecheck === 0;
    const storageWho = storageVerification?.profiles?.full_name || storageVerification?.profiles?.email || 'Supervisor';
    $('recordVerificationContent').innerHTML = `
      <article class="card verification-record-card ${storageComplete ? 'verified-card' : ''}">
        <div class="section-head"><div><div class="eyebrow">STORAGE TEMPERATURE</div><h2>Daily Record Verification</h2></div><span class="${storageComplete ? 'status-verified' : 'status-open'}">${storageComplete ? 'VERIFIED' : 'PENDING'}</span></div>
        <div class="verification-metrics"><span><b>${storageLogs.length}</b>Checks</span><span><b>${storageOut.length}</b>Deviations</span><span><b>${storageVerifiedActions}/${storageOut.length}</b>Corrective actions verified</span></div>
        ${storageComplete ? `<div class="verification-strip verified"><strong>Verified</strong> by ${esc(storageWho)} · ${fmtDateTime(storageVerification.verified_at)}${storageVerification.notes ? `<br>${esc(storageVerification.notes)}` : ''}</div>` : `<div class="verification-strip">Daily record has not been signed off.${hasRole('supervisor') ? ' <button class="text-btn" type="button" data-record-tab-action="storage">Open Storage Records</button>' : ''}</div>`}
      </article>
      <article class="card verification-record-card ${receivingComplete ? 'verified-card' : ''}">
        <div class="section-head"><div><div class="eyebrow">RECEIVING</div><h2>Rejected Delivery Verification</h2></div><span class="${receivingComplete ? 'status-verified' : 'status-open'}">${receivingComplete ? 'COMPLETE' : 'PENDING'}</span></div>
        <div class="verification-metrics"><span><b>${receivingRecords.length}</b>Deliveries</span><span><b>${receivingRejected.length}</b>Rejected</span><span><b>${receivingVerified}/${receivingRejected.length}</b>Rejections verified</span></div>
        <div class="verification-strip ${receivingComplete ? 'verified' : ''}">${receivingComplete ? 'All rejected deliveries for this date have supervisor verification.' : 'One or more rejected receiving records still require supervisor verification.'}${hasRole('supervisor') ? ' <button class="text-btn" type="button" data-record-tab-action="receiving">Open Receiving Records</button>' : ''}</div>
      </article>
      <article class="card verification-record-card ${processComplete ? 'verified-card' : ''}">
        <div class="section-head"><div><div class="eyebrow">FOOD PROCESS</div><h2>Corrective Action Verification</h2></div><span class="${processComplete ? 'status-verified' : 'status-open'}">${processComplete ? 'COMPLETE' : 'PENDING'}</span></div>
        <div class="verification-metrics"><span><b>${processReport.readings.length}</b>Readings</span><span><b>${processOut.length}</b>Deviations</span><span><b>${processVerifiedActions}/${processOut.length}</b>Deviations verified</span></div>
        <div class="verification-strip ${processComplete ? 'verified' : ''}">${processComplete ? 'All recorded food-process deviations for this date have completed verification.' : 'One or more food-process deviations still require corrective action or supervisor verification.'}</div>
      </article>
      <article class="card verification-record-card ${sanitationComplete ? 'verified-card' : ''}">
        <div class="section-head"><div><div class="eyebrow">CLEANING & SANITATION</div><h2>SSOP Completion & Verification</h2></div><span class="${sanitationComplete ? 'status-verified' : 'status-open'}">${sanitationComplete ? 'COMPLETE' : 'ATTENTION'}</span></div>
        <div class="verification-metrics"><span><b>${sanitationRecords.length}</b>Checks</span><span><b>${sanitationFailed}</b>Failed</span><span><b>${sanitationIncomplete}</b>Scheduled incomplete</span><span><b>${sanitationPending + sanitationRecheck}</b>Verification / recheck</span></div>
        <div class="verification-strip ${sanitationComplete ? 'verified' : ''}">${sanitationComplete ? 'Scheduled sanitation tasks are complete and required supervisor verification is resolved.' : `${sanitationIncomplete ? sanitationIncomplete + ' scheduled sanitation task(s) are incomplete. ' : ''}${sanitationPending ? sanitationPending + ' record(s) await verification. ' : ''}${sanitationRecheck ? sanitationRecheck + ' record(s) require re-cleaning / recheck.' : ''}`}${hasRole('supervisor') ? ' <button class="text-btn" type="button" data-record-tab-action="sanitation">Open Sanitation Records</button>' : ''}</div>
      </article>
      <article class="card verification-record-card ${calibrationComplete ? 'verified-card' : ''}">
        <div class="section-head"><div><div class="eyebrow">CALIBRATION</div><h2>Measuring Device Verification</h2></div><span class="${calibrationComplete ? 'status-verified' : 'status-open'}">${calibrationComplete ? 'CURRENT' : 'ATTENTION'}</span></div>
        <div class="verification-metrics"><span><b>${calibrationRecords.length}</b>Checks</span><span><b>${calibrationVerified}/${calibrationRecords.length}</b>Records verified</span><span><b>${calibrationOverdue}</b>Due / failed devices</span></div>
        <div class="verification-strip ${calibrationComplete ? 'verified' : ''}">${calibrationComplete ? 'Calibration checks for this date are verified and no registered device is currently overdue or failed.' : `${calibrationFailed ? calibrationFailed + ' failed calibration check(s). ' : ''}${calibrationOverdue ? calibrationOverdue + ' device(s) require calibration attention. ' : ''}${calibrationRecords.length !== calibrationVerified ? 'One or more calibration records still require manager verification.' : ''}`}${hasRole('supervisor') ? ' <button class="text-btn" type="button" data-record-tab-action="calibration">Open Calibration Records</button>' : ''}</div>
      </article>`;
  }


  async function verifyDay(event) {
    event.preventDefault();
    const { error } = await db.rpc('verify_daily_record', {
      p_kitchen_id: state.kitchen.id,
      p_record_date: $('recordDate').value,
      p_notes: $('verifyDayNotes').value.trim()
    });
    if (error) { toast(error.message, 'error'); return; }
    $('verifyDayDialog').close();
    toast(t('records.dailyVerified'), 'good');
    await loadRecords();
  }

  async function buildStorageReportHtml(date) {
      const [logs, verification, propertyRes] = await Promise.all([
        getDailyLogs(date),
        getDailyVerification(date),
        db.from('property_settings').select('*').eq('kitchen_id', state.kitchen.id).maybeSingle()
      ]);
      if (propertyRes.error) throw propertyRes.error;
      state.property = propertyRes.data || state.property || null;
      const p = state.property || {};
      const pass = logs.filter(x => x.status === 'PASS').length;
      const out = logs.filter(x => x.status === 'OUT').length;
      const generatedAt = new Date().toLocaleString(currentLanguage === 'id' ? 'id-ID' : 'en-GB');
      const logo = p.logo_data_url ? `<img class="property-logo" src="${esc(p.logo_data_url)}" alt="">` : '';
      const contact = [p.phone, p.website].filter(Boolean).map(esc).join(' · ');
      return (`<!doctype html><html><head><meta charset="utf-8"><title>HACCP Daily Record ${esc(date)}</title><style>
        @page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:10px}h1{font-size:20px;margin:2px 0}h2{font-size:12px;margin:18px 0 7px}.eyebrow{font-size:8px;letter-spacing:.14em;color:#666;font-weight:bold}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:10px}.property-logo{max-width:95px;max-height:54px;object-fit:contain}.property-copy{flex:1}.property-name{font-size:17px;font-weight:800;margin-bottom:3px}.property-detail{font-size:9px;color:#444;line-height:1.45}.record-head{display:flex;justify-content:space-between;gap:20px;align-items:end}.record-meta{text-align:right;font-size:9px;line-height:1.6}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:15px 0}.box{border:1px solid #ccc;border-radius:6px;padding:8px}.box strong{font-size:15px;display:block;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}th{font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#666}.muted{color:#666}.pass{font-weight:bold}.out{font-weight:bold}.action{background:#f5f5f5;padding:5px;margin-top:4px}.verify{border:1px solid #bbb;padding:10px;margin-top:14px}.footer{margin-top:14px;color:#666;font-size:8px}@media print{button{display:none}}</style></head><body>
        ${(p.property_name || p.address || p.phone || p.website || p.logo_data_url) ? `<div class="property-head">${logo}<div class="property-copy"><div class="property-name">${esc(p.property_name || '')}</div>${p.address ? `<div class="property-detail">${esc(p.address)}</div>` : ''}${contact ? `<div class="property-detail">${contact}</div>` : ''}</div></div>` : ''}
        <div class="record-head"><div><div class="eyebrow">${esc(t('pdf.recordTitle'))}</div><h1>${esc(state.kitchen.name)}</h1>${state.kitchen.location ? `<div class="muted">${esc(state.kitchen.location)}</div>` : ''}</div><div class="record-meta"><b>${esc(t('pdf.kitchen'))}:</b> ${esc(state.kitchen.name)}<br><b>${esc(t('pdf.recordDate'))}:</b> ${esc(date)}<br><b>${esc(t('pdf.generated'))}:</b> ${esc(generatedAt)}<br><b>${esc(t('pdf.timezone'))}:</b> ${esc(kitchenTimeZone())}</div></div>
        <div class="meta"><div class="box">${esc(t('pdf.total'))}<strong>${logs.length}</strong></div><div class="box">${esc(t('pdf.passed'))}<strong>${pass}</strong></div><div class="box">${esc(t('pdf.deviations'))}<strong>${out}</strong></div><div class="box">${esc(t('pdf.dailyVerification'))}<strong>${verification ? esc(t('pdf.complete')) : esc(t('pdf.pending'))}</strong></div></div>
        <table><thead><tr><th>${esc(t('pdf.time'))}</th><th>${esc(t('pdf.round'))}</th><th>${esc(t('pdf.equipment'))}</th><th>${esc(t('pdf.point'))}</th><th>${esc(t('pdf.actual'))}</th><th>${esc(t('pdf.limit'))}</th><th>${esc(t('pdf.status'))}</th><th>${esc(t('pdf.staffBatch'))}</th><th>${esc(t('pdf.corrective'))}</th></tr></thead><tbody>
        ${logs.map(log => { const a = correctiveActionFor(log); return `<tr><td>${fmtTime(log.recorded_at)}</td><td>${esc(log.monitoring_slot || '—')}</td><td>${esc(`${log.equipment_code_snapshot || log.equipment?.code || ''}${log.equipment_code_snapshot || log.equipment?.code ? ' — ' : ''}${log.equipment_name_snapshot || log.equipment?.name || '—'}`)}<br><span class="muted">${esc(log.location_name_snapshot || log.equipment?.locations?.name || '')} · ${esc(log.equipment_storage_type_snapshot || log.equipment?.storage_type || '')}</span></td><td>${esc(log.limit_code_snapshot)}<br>${esc(log.limit_name_snapshot)}</td><td>${esc(log.actual_temperature)}${esc(log.unit_snapshot)}</td><td>${esc(log.critical_limit_text_snapshot)}</td><td class="${log.status === 'PASS' ? 'pass' : 'out'}">${esc(log.status)}</td><td>${esc(log.profiles?.full_name || log.profiles?.email || 'Staff')}<br>${esc(log.batch_reference || '')}</td><td>${a ? `<div class="action"><b>${esc(a.immediate_action)}</b>${a.product_disposition ? `<br>${esc(a.product_disposition)}` : ''}${a.followup_temperature != null ? `<br>${esc(t('pdf.followup'))} ${esc(a.followup_temperature)}°C` : ''}<br>${a.verified_at ? `${esc(t('pdf.verified'))} ${esc(a.verifier?.full_name || '')}` : esc(t('pdf.verificationPending'))}</div>` : log.status === 'OUT' ? `<b>${esc(t('pdf.actionMissing'))}</b>` : '—'}</td></tr>`; }).join('')}
        </tbody></table>
        <div class="verify"><b>${esc(t('pdf.supervisorVerification'))}:</b> ${verification ? `${esc(verification.profiles?.full_name || verification.profiles?.email || 'Supervisor')} · ${fmtDateTime(verification.verified_at)}<br>${esc(verification.notes || '')}` : esc(t('pdf.notVerified'))}</div>
        <div class="footer">${esc(t('pdf.footer'))}</div>
        </body></html>`);
  }

  function showRecordPreview(title, html) {
    const dialog = $('recordPreviewDialog');
    const frame = $('recordPreviewFrame');
    if (!dialog || !frame) return;
    $('recordPreviewTitle').textContent = title || t('records.previewTitle');
    frame.srcdoc = html;
    if (!dialog.open) dialog.showModal();
  }

  function reportFilename(kind, date) {
    const kitchen = String(state.kitchen?.name || 'Kitchen').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'Kitchen';
    const prefix = kind === 'process' ? 'Food-Process-HACCP' : kind === 'calibration' ? 'Calibration-HACCP' : kind === 'receiving' ? 'Receiving-HACCP' : kind === 'sanitation' ? 'Sanitation-SSOP-HACCP' : 'Storage-Temperature-HACCP';
    return `${prefix}-${kitchen}-${date}.pdf`;
  }

  function openReportWindow() {
    const popup = window.open('', '_blank');
    if (popup) popup.document.write('<p style="font-family:Arial,sans-serif;padding:24px">Preparing HACCP record…</p>');
    return popup;
  }

  function writeReportWindow(popup, html) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  function pdfDownloadDocument(html, filename) {
    const safeName = JSON.stringify(filename);
    const downloader = `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script><script>
      window.addEventListener('load',()=>setTimeout(()=>{
        if(!window.html2pdf){document.body.insertAdjacentHTML('afterbegin','<div style="font:14px Arial;padding:12px;border:1px solid #f59e0b;background:#fffbeb;margin-bottom:12px">Direct PDF download could not start. Please use Print and choose Save as PDF.</div>');return;}
        window.html2pdf().set({margin:[8,8,8,8],filename:${safeName},image:{type:'jpeg',quality:.98},html2canvas:{scale:2,useCORS:true,logging:false},jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},pagebreak:{mode:['css','legacy']}}).from(document.body).save().then(()=>setTimeout(()=>window.close(),700));
      },250));
    <\/script>`;
    return html.replace('</body>', downloader + '</body>');
  }

  async function runRecordAction(kind, mode) {
    const date = $('recordDate')?.value || kitchenDate();
    const isProcess = kind === 'process';
    const isCalibration = kind === 'calibration';
    const isReceiving = kind === 'receiving';
    const isSanitation = kind === 'sanitation';
    const title = isProcess ? t('records.processTitle') : isCalibration ? t('calibration.recordsTitle') : isReceiving ? t('records.receivingTitle') : isSanitation ? sanitationCopy('Cleaning & Sanitation Records','Catatan Cleaning & Sanitation') : t('records.storageTitle');
    const nativePdfShare =
      mode === 'download' &&
      window.HACCPMobile?.isNative?.() &&
      typeof window.HACCPMobile?.sharePdfHtml === 'function';

    const popup =
      mode === 'view' || nativePdfShare
        ? null
        : openReportWindow();

    if (mode !== 'view' && !nativePdfShare && !popup) {
      toast(isProcess ? t('processPdf.popupBlocked') : 'Allow pop-ups so the HACCP record window can open.', 'error');
      return;
    }
    try {
      const html = isProcess ? await buildProcessReportHtml(date) : isCalibration ? await buildCalibrationReportHtml(date) : isReceiving ? await buildReceivingReportHtml(date) : isSanitation ? await buildSanitationReportHtml(date) : await buildStorageReportHtml(date);
      if (mode === 'view') {
        showRecordPreview(`${title} · ${date}`, html);
        return;
      }
      if (mode === 'download') {
        if (nativePdfShare) {
          await window.HACCPMobile.sharePdfHtml({
            html,
            filename: reportFilename(kind, date),
            title: `${title} ? ${date}`,
            text: 'HACCP record exported from HACCP Control.'
          });

          return;
        }

        writeReportWindow(
          popup,
          pdfDownloadDocument(
            html,
            reportFilename(kind, date)
          )
        );

        return;
      }
      writeReportWindow(popup, html);
      popup.addEventListener('load', () => setTimeout(() => popup.print(), 250), { once:true });
    } catch (error) {
      if (popup && !popup.closed) popup.close();
      toast(error.message || 'Could not prepare HACCP record.', 'error');
    }
  }

  async function generateDailyPdf(mode = 'print') { return runRecordAction('storage', mode); }
  async function generateProcessDailyPdf(mode = 'print') { return runRecordAction('process', mode); }
  async function generateCalibrationPdf(mode = 'print') { return runRecordAction('calibration', mode); }


  async function getDailyProcessReport(date) {
    const start = kitchenDayBoundaryUtc(date);
    const end = kitchenDayBoundaryUtc(addCalendarDays(date, 1));
    const { data: readings, error: readingsError } = await db
      .from('process_readings')
      .select(`id,batch_id,step_id,process_type,stage_label,actual_temperature,unit,status,limit_text_snapshot,notes,recorded_at,profiles!process_readings_recorded_by_fkey(full_name,email),process_corrective_actions(id,immediate_action,product_disposition,followup_temperature,notes,created_at,verified_at,verification_notes,createdBy:profiles!process_corrective_actions_created_by_fkey(full_name,email),verifier:profiles!process_corrective_actions_verified_by_fkey(full_name,email))`)
      .eq('kitchen_id', state.kitchen.id)
      .gte('recorded_at', start)
      .lt('recorded_at', end)
      .order('recorded_at', { ascending: true });
    if (readingsError) throw readingsError;
    const rows = readings || [];
    const batchIds = [...new Set(rows.map(r => r.batch_id).filter(Boolean))];
    if (!batchIds.length) return { readings: rows, batches: [], start, end };
    const { data: batches, error: batchesError } = await db
      .from('process_batches')
      .select(`id,product_name,batch_reference,quantity,status,current_process,process_started_at,created_at,completed_at,locations(name),equipment(code,name),process_steps(id,process_type,sequence_no,started_at,ended_at,status,process_limit_id)`)
      .eq('kitchen_id', state.kitchen.id)
      .in('id', batchIds);
    if (batchesError) throw batchesError;
    const batchRows = batches || [];
    const standardIds = [...new Set(batchRows.flatMap(b => (b.process_steps || []).map(step => step.process_limit_id)).filter(Boolean))];
    let standardRows = [];
    if (standardIds.length) {
      const {data,error} = await db.from('process_limits').select('id,code,name,version_no,process_type,active,effective_from,effective_to').eq('kitchen_id',state.kitchen.id).in('id',standardIds);
      if(error) throw error; standardRows=data||[];
    }
    const standardsById = new Map(standardRows.map(x => [x.id, x]));
    const firstReadingAt = new Map();
    rows.forEach(r => { if (!firstReadingAt.has(r.batch_id)) firstReadingAt.set(r.batch_id, new Date(r.recorded_at).getTime()); });
    return {
      readings: rows,
      batches: batchRows.sort((a, b) => (firstReadingAt.get(a.id) || 0) - (firstReadingAt.get(b.id) || 0)),
      standardsById,
      start,
      end
    };
  }

  async function buildProcessReportHtml(date) {
      const [report, propertyRes] = await Promise.all([
        getDailyProcessReport(date),
        db.from('property_settings').select('*').eq('kitchen_id', state.kitchen.id).maybeSingle()
      ]);
      if (propertyRes.error) throw propertyRes.error;
      state.property = propertyRes.data || state.property || null;
      const p = state.property || {};
      const rows = report.readings;
      const pass = rows.filter(x => x.status === 'PASS').length;
      const out = rows.filter(x => x.status === 'OUT').length;
      const locale = currentLanguage === 'id' ? 'id-ID' : 'en-GB';
      const timeZone = kitchenTimeZone();
      const reportTime = value => new Intl.DateTimeFormat(locale, { timeZone, hour:'2-digit', minute:'2-digit' }).format(new Date(value));
      const reportDateTime = value => new Intl.DateTimeFormat(locale, { timeZone, day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
      const generatedAt = reportDateTime(new Date());
      const logo = p.logo_data_url ? `<img class="property-logo" src="${esc(p.logo_data_url)}" alt="">` : '';
      const contact = [p.phone, p.website].filter(Boolean).map(esc).join(' · ');
      const byBatch = new Map(report.batches.map(b => [b.id, { batch:b, readings:[] }]));
      rows.forEach(r => { if (byBatch.has(r.batch_id)) byBatch.get(r.batch_id).readings.push(r); });
      const processTypes = ['cooking','cooling','reheating','hot_holding','cold_holding'];
      const processSummary = processTypes.map(type => `<span><b>${esc(processLabel(type))}</b> ${rows.filter(r => r.process_type === type).length}</span>`).join('');
      const batchSections = report.batches.map(batch => {
        const batchRows = byBatch.get(batch.id)?.readings || [];
        const steps = [...(batch.process_steps || [])]
          .filter(s => new Date(s.started_at) < report.end && (!s.ended_at || new Date(s.ended_at) >= report.start))
          .sort((a,b) => Number(a.sequence_no) - Number(b.sequence_no));
        const journey = steps.length ? steps.map(s => { const standard=standardIdentityFromMap(s.process_limit_id,report.standardsById); return `${esc(processLabel(s.process_type))}<small>${standard?`${esc(standard)} · `:''}${esc(reportDateTime(s.started_at))}${s.ended_at ? ` - ${esc(reportDateTime(s.ended_at))}` : ''}</small>`; }).join('<i>→</i>') : '—';
        const equipment = batch.equipment ? `${batch.equipment.code || ''}${batch.equipment.code ? ' — ' : ''}${batch.equipment.name || ''}` : '—';
        const statusAtDayEnd = batch.completed_at && new Date(batch.completed_at) < report.end ? 'COMPLETED' : batch.status === 'cancelled' ? 'CANCELLED' : 'ACTIVE';
        return `<section class="batch-block">
          <div class="batch-head"><div><div class="eyebrow">${esc(t('processPdf.batch'))}</div><h2>${esc(batch.product_name)}</h2><div class="batch-sub">${esc(batch.batch_reference || 'No batch reference')}</div></div><div class="batch-status">${esc(statusAtDayEnd)}</div></div>
          <div class="batch-meta"><span><b>${esc(t('processPdf.quantity'))}</b>${esc(batch.quantity || '—')}</span><span><b>${esc(t('processPdf.location'))}</b>${esc(batch.locations?.name || '—')}</span><span><b>${esc(t('processPdf.equipment'))}</b>${esc(equipment)}</span><span><b>${esc(t('processPdf.batchStatus'))}</b>${esc(statusAtDayEnd)}</span></div>
          <div class="journey"><b>${esc(t('processPdf.journey'))}</b><div>${journey}</div></div>
          <table><thead><tr><th>${esc(t('pdf.time'))}</th><th>${esc(t('processPdf.processStage'))}</th><th>${esc(t('pdf.actual'))}</th><th>${esc(t('pdf.limit'))}</th><th>${esc(t('pdf.status'))}</th><th>${esc(t('processPdf.staff'))}</th><th>${esc(t('processPdf.notes'))}</th><th>${esc(t('processPdf.corrective'))}</th></tr></thead><tbody>
          ${batchRows.map(r => {
            const action = processActionFor(r);
            const actionHtml = action ? `<div class="action"><b>${esc(action.immediate_action)}</b>${action.product_disposition ? `<br>${esc(action.product_disposition)}` : ''}${action.followup_temperature != null ? `<br>${esc(t('pdf.followup'))}: ${esc(action.followup_temperature)}°C` : ''}${action.notes ? `<br>${esc(action.notes)}` : ''}<br><small>${esc(t('processPdf.createdBy'))}: ${esc(action.createdBy?.full_name || action.createdBy?.email || 'Staff')} · ${esc(reportDateTime(action.created_at))}</small><br><small>${action.verified_at ? `${esc(t('processPdf.verifiedBy'))}: ${esc(action.verifier?.full_name || action.verifier?.email || 'Supervisor')} · ${esc(reportDateTime(action.verified_at))}${action.verification_notes ? ` · ${esc(action.verification_notes)}` : ''}` : esc(t('pdf.verificationPending'))}</small></div>` : r.status === 'OUT' ? `<b class="out">${esc(t('processPdf.actionMissing'))}</b>` : '—';
            const standard=standardForProcessReading(batch,r,report.standardsById); return `<tr><td>${esc(reportTime(r.recorded_at))}</td><td><b>${esc(processLabel(r.process_type))}</b>${r.stage_label ? `<br><span class="muted">${esc(r.stage_label)}</span>` : ''}${standard?`<br><small>${esc(standard)}</small>`:''}</td><td>${esc(r.actual_temperature)}${esc(r.unit || '°C')}</td><td>${esc(r.limit_text_snapshot || '—')}</td><td class="${r.status === 'PASS' ? 'pass' : 'out'}">${esc(r.status)}</td><td>${esc(r.profiles?.full_name || r.profiles?.email || 'Staff')}</td><td>${esc(r.notes || '—')}</td><td>${actionHtml}</td></tr>`;
          }).join('')}
          </tbody></table>
        </section>`;
      }).join('');
      return (`<!doctype html><html><head><meta charset="utf-8"><title>Food Process HACCP ${esc(date)}</title><style>
        @page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:9px;line-height:1.35}h1{font-size:19px;margin:2px 0}h2{font-size:14px;margin:2px 0}.eyebrow{font-size:7.5px;letter-spacing:.14em;color:#666;font-weight:bold;text-transform:uppercase}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:9px;margin-bottom:9px}.property-logo{max-width:95px;max-height:52px;object-fit:contain}.property-copy{flex:1}.property-name{font-size:16px;font-weight:800;margin-bottom:2px}.property-detail{font-size:8.5px;color:#444;line-height:1.45}.record-head{display:flex;justify-content:space-between;gap:20px;align-items:end}.record-meta{text-align:right;font-size:8.5px;line-height:1.55}.muted{color:#666}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.box{border:1px solid #ccc;border-radius:5px;padding:7px}.box strong{font-size:14px;display:block;margin-top:2px}.process-summary{display:flex;gap:8px;flex-wrap:wrap;border:1px solid #ddd;border-radius:6px;padding:7px 9px;margin-bottom:11px}.process-summary>strong{margin-right:3px}.process-summary span{background:#f4f4f4;border-radius:999px;padding:3px 7px}.batch-block{margin-top:14px;border-top:1px solid #888;padding-top:9px;break-inside:avoid;page-break-inside:avoid}.batch-head{display:flex;justify-content:space-between;gap:12px;align-items:start;break-after:avoid}.batch-sub{color:#555;font-size:8.5px}.batch-status{font-weight:800;border:1px solid #aaa;border-radius:999px;padding:4px 7px}.batch-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:7px 0}.batch-meta span{border:1px solid #ddd;border-radius:5px;padding:5px 6px;min-width:0}.batch-meta b{display:block;font-size:7px;text-transform:uppercase;color:#666;margin-bottom:2px}.journey{display:flex;gap:10px;align-items:center;background:#f7f7f7;border-radius:5px;padding:6px 8px;margin:6px 0 7px;break-after:avoid}.journey>div{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.journey div>small{display:block;color:#666;font-weight:normal}.journey i{font-style:normal;color:#888}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}th,td{border-bottom:1px solid #ddd;padding:5px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{font-size:7px;text-transform:uppercase;letter-spacing:.05em;color:#666}th:nth-child(1){width:6%}th:nth-child(2){width:11%}th:nth-child(3){width:7%}th:nth-child(4){width:17%}th:nth-child(5){width:6%}th:nth-child(6){width:11%}th:nth-child(7){width:14%}th:nth-child(8){width:28%}tr{break-inside:avoid}.pass{font-weight:bold;color:#14532d}.out{font-weight:bold;color:#991b1b}.action{background:#f5f5f5;border-radius:4px;padding:4px}.empty{border:1px dashed #bbb;padding:20px;text-align:center;color:#666;margin-top:14px}.footer{margin-top:13px;border-top:1px solid #ddd;padding-top:7px;color:#666;font-size:7.5px}.review{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:15px;padding-top:8px}.review span{border-top:1px solid #777;padding-top:4px;color:#555}@media print{button{display:none}}
      </style></head><body>
        ${(p.property_name || p.address || p.phone || p.website || p.logo_data_url) ? `<div class="property-head">${logo}<div class="property-copy"><div class="property-name">${esc(p.property_name || '')}</div>${p.address ? `<div class="property-detail">${esc(p.address)}</div>` : ''}${contact ? `<div class="property-detail">${contact}</div>` : ''}</div></div>` : ''}
        <div class="record-head"><div><div class="eyebrow">${esc(t('processPdf.recordTitle'))}</div><h1>${esc(state.kitchen.name)}</h1>${state.kitchen.location ? `<div class="muted">${esc(state.kitchen.location)}</div>` : ''}</div><div class="record-meta"><b>${esc(t('pdf.kitchen'))}:</b> ${esc(state.kitchen.name)}<br><b>${esc(t('processPdf.date'))}:</b> ${esc(date)}<br><b>${esc(t('pdf.generated'))}:</b> ${esc(generatedAt)}<br><b>${esc(t('processPdf.generatedBy'))}:</b> ${esc(state.profile?.full_name || state.user?.email || 'User')}<br><b>${esc(t('pdf.timezone'))}:</b> ${esc(timeZone)}</div></div>
        <div class="meta"><div class="box">${esc(t('processPdf.totalReadings'))}<strong>${rows.length}</strong></div><div class="box">${esc(t('processPdf.batches'))}<strong>${report.batches.length}</strong></div><div class="box">${esc(t('processPdf.passed'))}<strong>${pass}</strong></div><div class="box">${esc(t('processPdf.deviations'))}<strong>${out}</strong></div></div>
        <div class="process-summary"><strong>${esc(t('processPdf.processSummary'))}:</strong>${processSummary}</div>
        ${rows.length ? batchSections : `<div class="empty">${esc(t('processPdf.noReadings'))}</div>`}
        <div class="review"><span>Supervisor / Manager</span><span>Signature</span><span>Date / Time</span></div>
        <div class="footer">${esc(t('processPdf.footer'))}</div>
        </body></html>`);
  }


  async function loadPropertySettings() {
    const { data, error } = await db.from('property_settings').select('*').eq('kitchen_id', state.kitchen.id).maybeSingle();
    if (error) { toast(error.message, 'error'); return; }
    state.property = data || null;
    const p = state.property || {};
    $('propertyName').value = p.property_name || '';
    $('propertyAddress').value = p.address || '';
    $('propertyPhone').value = p.phone || '';
    $('propertyWebsite').value = p.website || '';
    $('propertyLogoData').value = p.logo_data_url || '';
    renderPropertyLogoPreview();
  }

  function renderPropertyLogoPreview() {
    const data = $('propertyLogoData')?.value || '';
    const wrap = $('propertyLogoPreview');
    if (!wrap) return;
    wrap.innerHTML = data
      ? `<img src="${esc(data)}" alt="Property logo"><span>${esc(state.property?.property_name || $('propertyName')?.value || 'Property logo')}</span>`
      : '<div class="property-logo-placeholder">LOGO</div><span>No logo uploaded</span>';
    $('removePropertyLogo')?.classList.toggle('hidden', !data);
  }

  async function fileToLogoDataUrl(file) {
    if (!file) return '';
    if (file.size > 5 * 1024 * 1024) throw new Error(t('property.logoTooLarge'));
    const raw = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
    const img = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = raw; });
    const max = 700;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  }

  async function savePropertySettings(event) {
    event.preventDefault();
    if (!hasRole('admin')) { toast(t('property.ownerAdmin'), 'error'); return; }
    const payload = {
      kitchen_id: state.kitchen.id,
      property_name: $('propertyName').value.trim() || null,
      address: $('propertyAddress').value.trim() || null,
      phone: $('propertyPhone').value.trim() || null,
      website: $('propertyWebsite').value.trim() || null,
      logo_data_url: $('propertyLogoData').value || null,
      updated_by: state.user.id,
      updated_at: new Date().toISOString()
    };
    const btn = $('propertySaveBtn');
    btn.disabled = true; btn.textContent = t('common.saving');
    const { data, error } = await db.from('property_settings').upsert(payload, { onConflict: 'kitchen_id' }).select().single();
    btn.disabled = false; btn.textContent = t('property.save');
    if (error) { toast(error.message, 'error'); return; }
    state.property = data;
    renderPropertyLogoPreview();
    toast(t('property.saved'), 'good');
  }

  async function loadEquipmentAdmin() {
    await loadConfiguration();
    const [{ data: allEquipment, error: eqError }, { data: audits, error: auditError }] = await Promise.all([
      db.from('equipment').select('*,locations(name),haccp_limits(code,name,limit_text)').eq('kitchen_id', state.kitchen.id).order('active', { ascending:false }).order('code'),
      db.from('configuration_audit').select('id,entity_type,entity_id,action,before_data,after_data,changed_at,profiles:changed_by(full_name,email)').eq('kitchen_id', state.kitchen.id).order('changed_at',{ascending:false}).limit(40)
    ]);
    if (eqError) { toast(eqError.message,'error'); return; }
    if (auditError) console.error(auditError);
    $('locationCount').textContent = state.locations.length;
    $('locationList').innerHTML = state.locations.length ? state.locations.map(l => `<div class="setting-row"><div><strong>${esc(l.name)}</strong><small>${esc(l.description || 'Location')}</small></div><div class="setting-meta"><button type="button" class="secondary" data-edit-location="${esc(l.id)}">Edit</button><button class="secondary" data-archive-location="${esc(l.id)}">Archive</button></div></div>`).join('') : '<div class="empty">No active locations.</div>';
    populateEquipmentAdminSelectors();
    $('equipmentCount').textContent = (allEquipment || []).filter(e=>e.active).length;
    $('equipmentList').innerHTML = (allEquipment || []).length ? (allEquipment || []).map(e => `<div class="setting-row ${e.active ? '' : 'archived-row'}"><div><strong>${esc(e.code)} — ${esc(e.name)}</strong><small>${esc(e.locations?.name || 'No location')} · ${esc(e.storage_type)}${e.haccp_limits ? ` · ${esc(e.haccp_limits.code)} ${esc(e.haccp_limits.limit_text)}` : ''}${e.monitoring_slots?.length ? ` · ${esc(e.monitoring_slots.join(' / '))}` : ''}${!e.active ? ' · ARCHIVED' : ''}</small></div><div class="setting-meta"><button class="secondary" data-edit-equipment="${esc(e.id)}">Edit</button>${e.active ? `<button class="secondary" data-deactivate-equipment="${esc(e.id)}">Archive</button>` : `<button class="secondary" data-restore-equipment="${esc(e.id)}">Restore</button>`}</div></div>`).join('') : '<div class="empty">No equipment configured.</div>';
    $('auditList').innerHTML = audits?.length ? audits.map(a => `<div class="setting-row"><div><strong>${esc(a.entity_type.replaceAll('_',' '))} · ${esc(a.action)}</strong><small>${fmtDateTime(a.changed_at)} · ${esc(a.profiles?.full_name || a.profiles?.email || 'System')}</small></div><div class="audit-change">${esc(a.after_data?.code || a.after_data?.name || a.entity_id)}</div></div>`).join('') : '<div class="empty">No configuration changes yet.</div>';
  }

  function populateEquipmentAdminSelectors() {
    $('equipmentLocation').innerHTML = `<option value="">Select location…</option>` + state.locations.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join('');
    $('equipmentDefaultLimit').innerHTML = `<option value="">No default</option>` + state.limits.map(l=>`<option value="${esc(l.id)}">${esc(l.code)} — ${esc(l.name)} · ${esc(l.limit_text)}</option>`).join('');
  }

  function resetLocationForm() {
    $('locationForm').reset(); $('locationId').value=''; $('locationFormTitle').textContent='Add location'; $('locationSaveBtn').textContent='Add Location'; $('locationCancelBtn').classList.add('hidden');
  }

  async function saveLocation(event) {
    event.preventDefault(); const id=$('locationId').value;
    const payload={kitchen_id:state.kitchen.id,name:$('locationName').value.trim(),description:$('locationDescription').value.trim()||null};
    const q=id?db.from('locations').update(payload).eq('id',id).eq('kitchen_id',state.kitchen.id):db.from('locations').insert(payload);
    const {error}=await q; if(error){toast(error.message,'error');return;} toast(id?'Location updated.':'Location added.','good'); resetLocationForm(); await loadEquipmentAdmin();
  }

  function editLocation(id) { const l=state.locations.find(x=>x.id===id); if(!l)return; $('locationId').value=l.id;$('locationName').value=l.name;$('locationDescription').value=l.description||'';$('locationFormTitle').textContent='Edit location';$('locationSaveBtn').textContent='Save Changes';$('locationCancelBtn').classList.remove('hidden'); }

  /*
     Reliable Kitchen Location Edit handler.
     Independent from the main bindEvents() chain.
  */
  if (!window.__haccpLocationEditListenerReady) {
    window.__haccpLocationEditListenerReady = true;

    document.addEventListener(
      'click',
      event => {
        const button =
          event.target?.closest?.('[data-edit-location]');

        if (!button) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const locationId =
          button.dataset.editLocation;

        if (!locationId) {
          console.error(
            '[Location Edit] Missing location ID.'
          );
          return;
        }

        try {
          editLocation(locationId);

          const form =
            document.getElementById('locationForm');

          const panel =
            form?.closest('details');

          if (panel) {
            panel.open = true;
          }

          requestAnimationFrame(() => {
            form?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });

            setTimeout(() => {
              document
                .getElementById('locationName')
                ?.focus();
            }, 300);
          });

        } catch (error) {
          console.error(
            '[Location Edit]',
            error
          );
        }
      },
      true
    );
  }



  async function archiveLocation(id) {
    const used=state.equipment.filter(e=>e.location_id===id && e.active); if(used.length){toast(`Archive or move ${used.length} active equipment unit(s) first.`,'error');return;}
    if(!confirm('Archive this location? Historical records remain unchanged.'))return;
    const {error}=await db.from('locations').update({active:false}).eq('id',id).eq('kitchen_id',state.kitchen.id); if(error){toast(error.message,'error');return;} toast('Location archived.','good');await loadEquipmentAdmin();
  }

  function resetEquipmentForm(){ $('equipmentForm').reset(); $('equipmentId').value=''; $('equipmentFormTitle').textContent='Add equipment'; $('equipmentSaveBtn').textContent='Add Equipment'; $('equipmentCancelBtn').classList.add('hidden'); populateEquipmentAdminSelectors(); }

  async function addEquipment(event) {
    event.preventDefault(); const id=$('equipmentId').value; const slots=$('equipmentSchedule').value.split(',').map(x=>x.trim()).filter(Boolean);
    const payload={kitchen_id:state.kitchen.id,location_id:$('equipmentLocation').value,code:$('equipmentCode').value.trim().toUpperCase(),name:$('equipmentName').value.trim(),storage_type:$('equipmentStorageType').value,category:$('equipmentStorageType').value,area:state.locations.find(l=>l.id===$('equipmentLocation').value)?.name||null,default_limit_id:$('equipmentDefaultLimit').value||null,monitoring_slots:slots,description:$('equipmentDescription').value.trim()||null};
    const q=id?db.from('equipment').update(payload).eq('id',id).eq('kitchen_id',state.kitchen.id):db.from('equipment').insert(payload);
    const {error}=await q; if(error){toast(error.message,'error');return;} toast(id?'Equipment updated.':'Equipment added.','good'); resetEquipmentForm(); await loadEquipmentAdmin();
  }

  async function editEquipment(id){ const {data:e,error}=await db.from('equipment').select('*').eq('id',id).eq('kitchen_id',state.kitchen.id).single(); if(error){toast(error.message,'error');return;} $('equipmentId').value=e.id;$('equipmentLocation').value=e.location_id||'';$('equipmentStorageType').value=e.storage_type||'Other';$('equipmentCode').value=e.code||'';$('equipmentName').value=e.name||'';$('equipmentDefaultLimit').value=e.default_limit_id||'';$('equipmentSchedule').value=(e.monitoring_slots||[]).join(', ');$('equipmentDescription').value=e.description||'';$('equipmentFormTitle').textContent='Edit equipment';$('equipmentSaveBtn').textContent='Save Changes';$('equipmentCancelBtn').classList.remove('hidden'); window.scrollTo({top:0,behavior:'smooth'}); }

  /*
     EQUIPMENT EDIT - DEDICATED CLICK HANDLER

     This is deliberately independent from bindEvents().
     It prevents an unrelated event-binding failure elsewhere
     from disabling Equipment -> Edit.
  */
  if (!window.__haccpEquipmentEditListenerReady) {
    window.__haccpEquipmentEditListenerReady = true;

    document.addEventListener(
      'click',
      event => {
        const button =
          event.target?.closest?.('[data-edit-equipment]');

        if (!button) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const equipmentId =
          button.dataset.editEquipment;

        if (!equipmentId) {
          console.error(
            '[Equipment Edit] Missing equipment ID.'
          );
          return;
        }

        editEquipment(equipmentId)
          .catch(error => {
            console.error(
              '[Equipment Edit]',
              error
            );

            toast(
              error?.message ||
              'Unable to open equipment for editing.',
              'error'
            );
          });
      },
      true
    );
  }


  async function deactivateEquipment(id) {
    if (!confirm('Archive this equipment? Historical records remain unchanged and the QR will stop accepting new checks.')) return;
    const { error } = await db.from('equipment').update({ active: false }).eq('id', id).eq('kitchen_id', state.kitchen.id);
    if (error) { toast(error.message, 'error'); return; } toast('Equipment archived.', 'good'); await loadEquipmentAdmin();
  }

  async function restoreEquipment(id){ const {error}=await db.from('equipment').update({active:true}).eq('id',id).eq('kitchen_id',state.kitchen.id); if(error){toast(error.message,'error');return;} toast('Equipment restored.','good');await loadEquipmentAdmin(); }

  async function loadLimitsAdmin() {
    await loadConfiguration();
    $('limitCount').textContent = state.limits.length;
    $('limitList').innerHTML = state.limits.length ? state.limits.map(l => `<div class="setting-row"><div><strong>${esc(l.code)} — ${esc(l.name)}</strong><small>${esc(l.ccp_cp)} · ${esc(l.limit_text)}${l.monitoring_frequency ? ` · ${esc(l.monitoring_frequency)}` : ''}</small></div><div class="setting-meta"><button class="secondary" data-deactivate-limit="${esc(l.id)}">Deactivate</button></div></div>`).join('') : '<div class="empty">No HACCP points configured.</div>';
  }

  async function addLimit(event) {
    event.preventDefault();
    const min = nullableNumber($('limitMin').value), max = nullableNumber($('limitMax').value);
    if (min == null && max == null) { toast('Enter a minimum, maximum, or both.', 'error'); return; }
    if (min != null && max != null && min > max) { toast('Minimum cannot be higher than maximum.', 'error'); return; }
    const { error } = await db.from('haccp_limits').insert({
      kitchen_id: state.kitchen.id,
      code: $('limitCode').value.trim(),
      name: $('limitName').value.trim(),
      ccp_cp: $('limitType').value,
      min_value: min,
      max_value: max,
      unit: $('limitUnit').value.trim(),
      limit_text: $('limitText').value.trim(),
      monitoring_frequency: $('limitFrequency').value.trim() || null,
      corrective_guidance: $('limitGuidance').value.trim() || null
    });
    if (error) { toast(error.message, 'error'); return; }
    event.target.reset(); $('limitUnit').value = '°C';
    toast('HACCP point added.', 'good');
    await loadLimitsAdmin();
  }

  async function deactivateLimit(id) {
    if (!confirm('Deactivate this HACCP point? Historical records retain their critical-limit snapshot.')) return;
    const { error } = await db.from('haccp_limits').update({ active: false }).eq('id', id).eq('kitchen_id', state.kitchen.id);
    if (error) { toast(error.message, 'error'); return; }
    toast('HACCP point deactivated.', 'good');
    await loadLimitsAdmin();
  }

  // ---------------------------------------------------------------------------
  // Team Management v2 — invitation-first onboarding
  // ---------------------------------------------------------------------------
  function teamRoleOptions(selectedRole, member) {
    const callerRole = state.membership?.role || 'staff';

    const roles =
      callerRole === 'owner'
        ? ['admin','manager','supervisor','chef','staff']
        : callerRole === 'admin'
          ? ['manager','supervisor','chef','staff']
          : ['supervisor','chef','staff'];

    if (member?.role && !roles.includes(member.role)) roles.unshift(member.role);

    return roles
      .map(role => `<option value="${esc(role)}" ${role === selectedRole ? 'selected' : ''}>${esc(displayRole(role))}</option>`)
      .join('');
  }

  function teamMemberStatus(member) {
    if (member.accepted_at) {
      return {
        key: 'active',
        label: 'ACTIVE',
        detail: `Access active · ${fmtDateTime(member.accepted_at)}`
      };
    }

    if (member.invited_at) {
      return {
        key: 'invited',
        label: 'INVITED',
        detail: `Invitation sent · ${fmtDateTime(member.invited_at)}`
      };
    }

    return { key: 'active', label: 'ACTIVE', detail: 'Existing account' };
  }

  async function loadTeam() {
    const { data, error } = await db
      .from('kitchen_members')
      .select('user_id,role,active,created_at,invited_at,accepted_at,profiles!kitchen_members_user_id_fkey(full_name,email)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('active', true)
      .order('created_at');

    if (error) {
      toast(error.message, 'error');
      return;
    }

    state.members = data || [];
    $('memberCount').textContent = state.members.length;

    $('memberList').innerHTML = state.members.length
      ? state.members.map(member => {
          const profile = member.profiles || {};
          const status = teamMemberStatus(member);

          const protectedMember =
            member.user_id === state.user.id ||
            member.role === 'owner';

          const management = protectedMember
            ? `<span class="team-role-label">${esc(displayRole(member.role))}</span>`
            : `
              <div class="team-role-control">
                <select data-member-role-select="${esc(member.user_id)}" aria-label="Role for ${esc(profile.full_name || profile.email || 'team member')}">
                  ${teamRoleOptions(member.role, member)}
                </select>
                <button class="secondary compact-btn" type="button" data-change-member-role="${esc(member.user_id)}">Save Role</button>
              </div>
              <button class="ghost danger-text compact-btn" type="button" data-remove-member="${esc(member.user_id)}">Remove Access</button>
            `;

          return `
            <article class="team-member-row">
              <div class="team-member-identity">
                <div class="team-member-title-line">
                  <strong>${esc(profile.full_name || profile.email || 'User')}</strong>
                  <span class="team-access-status ${esc(status.key)}">${esc(status.label)}</span>
                </div>
                <small>${esc(profile.email || '')}</small>
                <span class="team-member-status-copy">${esc(status.detail)}</span>
              </div>
              <div class="team-member-actions">${management}</div>
            </article>
          `;
        }).join('')
      : '<div class="empty">No team members yet.</div>';
  }

  async function addMember(event) {
    event.preventDefault();

    const submit = $('memberSubmitBtn');
    const originalText = submit?.textContent || 'Send Invitation';
    const email = $('memberEmail').value.trim().toLowerCase();
    const fullName = $('memberName')?.value.trim() || '';
    const role = $('memberRole').value;

    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }

    try {
      const { data, error } = await db.functions.invoke(
        'invite-kitchen-member',
        {
          body: {
            kitchen_id: state.kitchen.id,
            email,
            full_name: fullName,
            role
          }
        }
      );

      if (error) {
        let message = error.message || 'Could not invite staff member.';

        try {
          if (error.context && typeof error.context.json === 'function') {
            const responseBody = await error.context.json();
            if (responseBody?.error) message = responseBody.error;
          }
        } catch (_) {}

        toast(message, 'error');
        return;
      }

      if (!data?.ok) {
        toast(data?.error || 'Could not invite staff member.', 'error');
        return;
      }

      event.target.reset();

      toast(
        data.status === 'invited'
          ? `Invitation sent to ${email}.`
          : `${email} already has an account and was added to this kitchen.`,
        'good'
      );

      await loadTeam();

    } catch (error) {
      console.error('[Team Invitation]', error);
      toast(error?.message || 'Could not invite staff member.', 'error');

    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = originalText;
      }
    }
  }

  async function changeMemberRole(userId) {
    const select = document.querySelector(
      `[data-member-role-select="${CSS.escape(userId)}"]`
    );
    if (!select) return;

    const role = select.value;

    const { error } = await db.rpc(
      'set_kitchen_member_role',
      {
        p_kitchen_id: state.kitchen.id,
        p_user_id: userId,
        p_role: role
      }
    );

    if (error) {
      toast(error.message, 'error');
      await loadTeam();
      return;
    }

    toast(`Role updated to ${displayRole(role)}.`, 'good');
    await loadTeam();
  }

  async function removeMember(userId) {
    const member = state.members.find(x => x.user_id === userId);
    const name =
      member?.profiles?.full_name ||
      member?.profiles?.email ||
      'this user';

    if (!confirm(`Remove kitchen access for ${name}?`)) return;

    const { error } = await db.rpc(
      'deactivate_kitchen_member',
      {
        p_kitchen_id: state.kitchen.id,
        p_user_id: userId
      }
    );

    if (error) {
      toast(error.message, 'error');
      return;
    }

    toast('Kitchen access removed.', 'good');
    await loadTeam();
  }

  async function loadQrLabels() {
    await loadConfiguration();
    const sanitationStandards = await fetchSanitationStandards(false).catch(() => []);
    const thawingStandards = await fetchThawingStandards(false).catch(() => []);
    const configuredPublicUrl = String(cfg.PUBLIC_APP_URL || '').trim();
    const isNativeShell = !!window.Capacitor?.isNativePlatform?.();
    if (isNativeShell && !configuredPublicUrl) {
      $('qrGrid').innerHTML = '<div class="card empty">Set PUBLIC_APP_URL in www/config.js before generating QR labels from the mobile app.</div>';
      if ($('sanitationQrGrid')) $('sanitationQrGrid').innerHTML = '<div class="card empty">PUBLIC_APP_URL is required for mobile QR labels.</div>';
      if ($('thawingQrGrid')) $('thawingQrGrid').innerHTML = '<div class="card empty">PUBLIC_APP_URL is required for mobile QR labels.</div>';
      toast('Set PUBLIC_APP_URL to your deployed HACCP web address before generating QR labels.', 'error');
      return;
    }
    const base = configuredPublicUrl
      ? configuredPublicUrl.replace(/\/+$/, '')
      : `${location.origin}${location.pathname}`;
    $('qrGrid').innerHTML = state.equipment.length ? state.equipment.map(e => `<article class="qr-card"><div class="qr-code" id="qr-${esc(e.id)}"></div><h3>${esc(e.code)} — ${esc(e.name)}</h3><p>${esc(e.locations?.name || 'No location')} · ${esc(e.storage_type)}${e.monitoring_slots?.length ? `<br>${esc(e.monitoring_slots.join(' · '))}` : ''}</p></article>`).join('') : '<div class="card empty">Add equipment first.</div>';
    if ($('sanitationQrGrid')) $('sanitationQrGrid').innerHTML = sanitationStandards.length ? sanitationStandards.map(s => `<article class="qr-card"><div class="qr-code" id="qr-san-${esc(s.id)}"></div><h3>${esc(s.code)} — ${esc(s.name)}</h3><p>${esc(s.area_name)}<br>${esc(sanitationScheduleLabel(s))}</p></article>`).join('') : `<div class="card empty">${sanitationCopy('Add active sanitation standards first.','Tambahkan standar sanitasi aktif terlebih dahulu.')}</div>`;
    if ($('thawingQrGrid')) $('thawingQrGrid').innerHTML = thawingStandards.length ? thawingStandards.map(s => `<article class="qr-card"><div class="qr-code" id="qr-thaw-${esc(s.id)}"></div><h3>${esc(s.code)} — ${esc(s.name)}</h3><p>${esc(thawingMethodLabel(s.method))}<br>${esc(thawingLimitText(s))}</p></article>`).join('') : `<div class="card empty">${thawingCopy('Add active thawing standards first.','Tambahkan standar pencairan aktif terlebih dahulu.')}</div>`;
    if (!window.QRCode) { toast('QR library did not load. Check your internet connection.', 'error'); return; }
    state.equipment.forEach(e => new window.QRCode(document.getElementById(`qr-${e.id}`), { text: `${base}?equipment=${encodeURIComponent(e.id)}`, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M }));
    sanitationStandards.forEach(s => new window.QRCode(document.getElementById(`qr-san-${s.id}`), { text: `${base}?sanitation=${encodeURIComponent(s.id)}`, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M }));
    thawingStandards.forEach(s => new window.QRCode(document.getElementById(`qr-thaw-${s.id}`), { text: `${base}?thawing=${encodeURIComponent(s.id)}`, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M }));
  }


  async function bootstrapKitchen(event) {
    event.preventDefault();
    const { error } = await db.rpc('bootstrap_kitchen', {
      p_name: $('bootstrapName').value.trim(),
      p_location: $('bootstrapLocation').value.trim() || null,
      p_timezone: $('bootstrapTimezone').value.trim()
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Kitchen workspace created.', 'good');
    const { data: { session } } = await db.auth.getSession();
    await handleSession(session);
  }

  function cleanAppUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function clearAuthCallbackUrl() {
    if (window.history?.replaceState) window.history.replaceState({}, document.title, cleanAppUrl());
  }

  function setInlineMessage(id, message, good = false) {
    const el = $(id);
    el.textContent = message || '';
    el.style.color = good ? '#166534' : '#991b1b';
  }

  function showPasswordAction(mode, session) {
    state.authActionMode = mode;
    const isInvite = mode === 'invite';
    $('passwordActionEyebrow').textContent = isInvite ? 'INVITATION ACCEPTED' : 'ACCOUNT RECOVERY';
    $('passwordActionTitle').textContent = isInvite ? 'Create your password' : 'Set a new password';
    $('passwordActionCopy').textContent = isInvite
      ? 'Your email has been verified. Create a secure password to finish activating your HACCP Control account.'
      : 'Choose a new password for your HACCP Control account.';
    $('passwordActionBrandCopy').textContent = isInvite
      ? 'Finish your invited staff account securely, then continue to your assigned kitchen.'
      : 'Securely update your password and return to your kitchen records.';
    $('passwordActionSubmit').textContent = isInvite ? 'Create password' : 'Update password';
    const email = session?.user?.email || '';
    $('passwordActionEmail').textContent = email;
    $('passwordActionEmail').classList.toggle('hidden', !email);
    $('passwordActionForm').reset();
    setInlineMessage('passwordActionMessage', '');
    showOnly('passwordActionScreen');
  }

  async function requestPasswordReset(event) {
    event.preventDefault();
    if (!configured) return;
    const email = $('forgotPasswordEmail').value.trim();
    setInlineMessage('forgotPasswordMessage', '');
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: cleanAppUrl() });
    if (error) {
      setInlineMessage('forgotPasswordMessage', friendlyAuthError(error));
      return;
    }
    setInlineMessage('forgotPasswordMessage', `Password reset email sent to ${email}. Check your inbox and spam folder.`, true);
  }

  async function saveNewPassword(event) {
    event.preventDefault();
    const password = $('newAccountPassword').value;
    const confirmPassword = $('confirmAccountPassword').value;
    if (password.length < 8) {
      setInlineMessage('passwordActionMessage', 'Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setInlineMessage('passwordActionMessage', 'The passwords do not match. Please enter them again.');
      return;
    }
    setInlineMessage('passwordActionMessage', '');
    const { error } = await db.auth.updateUser({ password });
    if (error) {
      setInlineMessage('passwordActionMessage', friendlyAuthError(error));
      return;
    }
    const wasInvite = state.authActionMode === 'invite';
    state.authActionMode = null;
    clearAuthCallbackUrl();
    toast(wasInvite ? 'Account activated. Password created.' : 'Password updated successfully.', 'good');
    const { data: { session } } = await db.auth.getSession();
    if (session) await handleSession(session);
    else showOnly('authScreen');
  }

  function friendlyAuthError(error) {
    const raw = String(error?.message || 'Authentication failed.');
    const message = raw.toLowerCase();
    if (message.includes('email not confirmed')) {
      return 'Email verification required. Please open the verification email we sent you, confirm your address, then sign in again.';
    }
    if (message.includes('rate limit')) {
      return 'Too many email requests were sent recently. Please wait before requesting another verification email.';
    }
    if (message.includes('invalid login credentials')) {
      return 'The email or password is incorrect. Please check your details and try again.';
    }
    if (message.includes('password') && (message.includes('weak') || message.includes('characters'))) {
      return 'Please choose a stronger password with at least 8 characters.';
    }
    if (message.includes('expired') || message.includes('otp')) {
      return 'This email link has expired or is no longer valid. Please request a new one.';
    }
    return raw;
  }

  function showSignupSuccess(email) {
    $('signupSuccessEmail').textContent = email;
    const dialog = $('signupSuccessDialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else setAuthMessage(`Verification email sent to ${email}. Please verify your email before signing in.`, true);
  }

  async function signIn(event) {
    event.preventDefault();
    if (!configured) { setAuthMessage(authRuntimeMessage()); return; }
    setAuthMessage('');
    const { error } = await db.auth.signInWithPassword({ email: $('signInEmail').value.trim(), password: $('signInPassword').value });
    if (error) setAuthMessage(friendlyAuthError(error));
  }

  async function signUp(event) {
    event.preventDefault();
    if (!configured) { setAuthMessage(authRuntimeMessage()); return; }
    setAuthMessage('');
    const email = $('signUpEmail').value.trim();
    const { data, error } = await db.auth.signUp({
      email,
      password: $('signUpPassword').value,
      options: {
        data: { full_name: $('signUpName').value.trim() },
        emailRedirectTo: cleanAppUrl()
      }
    });
    if (error) { setAuthMessage(friendlyAuthError(error)); return; }
    $('signUpForm').reset();
    if (!data.session) {
      showSignupSuccess(email);
    } else {
      setAuthMessage('Account created successfully. You are now signed in.', true);
    }
  }

  async function signOut() { if (db) await db.auth.signOut(); }


  const PROCESS_LABELS = { cooking:'Cooking', cooling:'Cooling', reheating:'Reheating', hot_holding:'Hot Holding', cold_holding:'Cold Holding' };
  function processLabel(type) { return PROCESS_LABELS[type] || type; }
  function processLimitText(limit) {
    if (!limit) return 'No limit configured';
    if (limit.process_type === 'cooling') return `Stage 1 ≤ ${limit.stage1_max_value ?? '—'}${limit.unit} / ${limit.stage1_minutes ?? '—'} min · Final ≤ ${limit.final_max_value ?? '—'}${limit.unit} / ${limit.total_minutes ?? '—'} min`;
    const parts=[]; if(limit.min_value!=null) parts.push(`≥ ${limit.min_value}${limit.unit}`); if(limit.max_value!=null) parts.push(`≤ ${limit.max_value}${limit.unit}`);
    if (limit.time_limit_minutes && ['cooking','reheating'].includes(limit.process_type)) parts.push(`within ${limit.time_limit_minutes} min`);
    if (['hot_holding','cold_holding'].includes(limit.process_type) && limit.monitoring_interval_minutes) parts.push(`check every ${limit.monitoring_interval_minutes} min`);
    return parts.join(' · ') || 'Configured standard';
  }
  function processLimitVersion(limit) { return Number(limit?.version_no || 1); }
  function processLimitIdentity(limit) { return limit ? `${limit.code} · v${processLimitVersion(limit)}` : 'No standard'; }
  function processLimitIsUsed(id) { return state.processLimitUsageIds?.has(id) || false; }
  function fillProcessLimitSelect(selectId, type, selected='') {
    const el=$(selectId); if(!el) return; const options=state.processLimits.filter(x=>x.active!==false && x.process_type===type);
    el.innerHTML = options.length ? options.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.code)} · v${esc(processLimitVersion(x))} — ${esc(x.name)} · ${esc(processLimitText(x))}</option>`).join('') : '<option value="">No approved limit configured</option>';
  }
  async function loadProcessLimits(includeInactive=false) {
    let query=db.from('process_limits').select('*').eq('kitchen_id',state.kitchen.id);
    if(!includeInactive) query=query.eq('active',true);
    const {data,error}=await query.order('process_type').order('code').order('version_no',{ascending:false});
    if(error) throw error; state.processLimits=data||[];
  }
  async function loadProcessControl() {
    // Load retired versions too: an in-progress batch must continue using the exact standard version it started with.
    await loadProcessLimits(true);
    const {data,error}=await db.from('process_batches').select('*,locations(name),equipment(code,name),process_steps(id,process_type,process_limit_id,sequence_no,started_at,ended_at,status),process_readings(id,step_id,process_type,stage_label,actual_temperature,unit,status,notes,recorded_at,profiles!process_readings_recorded_by_fkey(full_name,email),process_corrective_actions(id,immediate_action,verified_at))').eq('kitchen_id',state.kitchen.id).eq('status','active').order('process_started_at',{ascending:false});
    if(error) throw error; state.processBatches=data||[]; renderProcessBatches();
  }
  function activeProcessStep(batch) {
    const steps=[...(batch.process_steps||[])].sort((a,b)=>Number(a.sequence_no)-Number(b.sequence_no));
    return steps.find(s=>s.status==='active') || steps[steps.length-1] || null;
  }
  function processStepStart(batch) { return activeProcessStep(batch)?.started_at || batch.process_started_at; }
  function readingsForCurrentStep(batch) {
    const step=activeProcessStep(batch), all=batch.process_readings||[];
    return step?.id ? all.filter(r=>r.step_id===step.id) : all.filter(r=>r.process_type===batch.current_process);
  }
  function processTiming(batch, limit) {
    if(!limit) return {state:'none',label:'',remaining:null};
    const now=Date.now(), start=new Date(processStepStart(batch)).getTime();
    let deadline=null, subject='';
    if(batch.current_process==='cooling') {
      const s1=readingsForCurrentStep(batch).some(r=>r.stage_label==='Stage 1'&&r.status==='PASS');
      const mins=s1?Number(limit.total_minutes||0):Number(limit.stage1_minutes||0);
      if(!mins) return {state:'none',label:'',remaining:null};
      deadline=start+mins*60000; subject=s1?'Final cooling':'Cooling Stage 1';
    } else if(['hot_holding','cold_holding'].includes(batch.current_process)&&limit.monitoring_interval_minutes) {
      const rs=readingsForCurrentStep(batch).sort((a,b)=>new Date(b.recorded_at)-new Date(a.recorded_at));
      const base=rs[0]?new Date(rs[0].recorded_at).getTime():start;
      deadline=base+Number(limit.monitoring_interval_minutes)*60000; subject=`${processLabel(batch.current_process)} check`;
    } else if(limit.time_limit_minutes) {
      deadline=start+Number(limit.time_limit_minutes)*60000; subject=processLabel(batch.current_process);
    } else return {state:'none',label:'',remaining:null};
    const remaining=Math.ceil((deadline-now)/60000), remind=Math.max(0,Number(limit.reminder_minutes??15)), grace=Math.max(0,Number(limit.overdue_minutes??30));
    let stateName='ok';
    if(remaining<=remind && remaining>0) stateName='soon';
    if(remaining<=0 && remaining>-grace) stateName='due';
    if(remaining<=-grace) stateName='overdue';
    const text=stateName==='overdue'?`OVERDUE ${Math.abs(remaining)} min`:stateName==='due'?`DUE NOW · ${Math.abs(remaining)} min late`:`${remaining} min remaining`;
    return {state:stateName,label:`${subject} · ${text}`,remaining};
  }
  function processJourneyHtml(batch) {
    const steps=[...(batch.process_steps||[])].sort((a,b)=>Number(a.sequence_no)-Number(b.sequence_no));
    return steps.length?`<div class="process-journey">${steps.map((s,i)=>`<div class="journey-step ${s.status==='completed'?'done':''} ${s.status==='active'?'active':''}"><span class="journey-dot">${s.status==='completed'?'✓':s.status==='active'?'●':'○'}</span><div><strong>${esc(processLabel(s.process_type))}</strong><small>${fmtDateTime(s.started_at)}${s.ended_at?` → ${fmtTime(s.ended_at)}`:''}</small></div></div>${i<steps.length-1?'<span class="journey-line"></span>':''}`).join('')}</div>`:'';
  }
  function evaluateProcessReading(batch, limit, temp) {
    const v=Number(temp); let status='PASS', stage=''; let text=processLimitText(limit);
    if(!limit || !Number.isFinite(v)) return {status:'OUT',stage,text};
    if(batch.current_process==='cooling') {
      const elapsed=(Date.now()-new Date(processStepStart(batch)).getTime())/60000;
      const readings=readingsForCurrentStep(batch); const stage1Done=readings.some(r=>r.process_type==='cooling' && r.stage_label==='Stage 1' && r.status==='PASS');
      if(!stage1Done) { stage='Stage 1'; status=(limit.stage1_max_value!=null && v<=Number(limit.stage1_max_value) && elapsed<=Number(limit.stage1_minutes||0))?'PASS':'OUT'; }
      else { stage='Final'; status=(limit.final_max_value!=null && v<=Number(limit.final_max_value) && elapsed<=Number(limit.total_minutes||0))?'PASS':'OUT'; }
    } else {
      if(limit.min_value!=null && v<Number(limit.min_value)) status='OUT'; if(limit.max_value!=null && v>Number(limit.max_value)) status='OUT';
    }
    return {status,stage,text};
  }
  function processDueInfo(batch, limit) { return processTiming(batch,limit).label; }
  function renderProcessBatches(){
    const list=$('processBatchList'); if(!list) return; const batches=state.processBatches||[];
    $('processActiveCount').textContent=batches.length; $('processCoolingCount').textContent=batches.filter(b=>b.current_process==='cooling').length; $('processHoldingCount').textContent=batches.filter(b=>['hot_holding','cold_holding'].includes(b.current_process)).length;
    let attention=0;
    list.innerHTML=batches.length?batches.map(b=>{
      const limit=state.processLimits.find(x=>x.id===b.process_limit_id), rs=[...(b.process_readings||[])].sort((a,c)=>new Date(c.recorded_at)-new Date(a.recorded_at)), currentRs=readingsForCurrentStep(b).sort((a,c)=>new Date(c.recorded_at)-new Date(a.recorded_at)), latest=currentRs[0]||rs[0], timing=processTiming(b,limit);
      const bad=rs.some(r=>r.status==='OUT')||['due','overdue'].includes(timing.state); if(bad) attention++;
      return `<article class="card process-batch-card ${bad?'process-attention':''}" data-process-batch="${esc(b.id)}"><div class="process-card-head"><div><span class="storage-badge">${esc(processLabel(b.current_process))}</span><h3>${esc(b.product_name)}</h3><p>${esc(b.batch_reference||'No batch reference')} · ${esc(b.locations?.name||'No location')}</p></div><span class="${bad?'status-out':'status-pass'}">${timing.state==='overdue'?'OVERDUE':bad?'ATTENTION':'ACTIVE'}</span></div>${processJourneyHtml(b)}<div class="process-meta"><span><b>Step started</b>${fmtDateTime(processStepStart(b))}</span><span><b>Standard</b>${esc(processLimitIdentity(limit))} · ${esc(processLimitText(limit))}</span>${latest?`<span><b>Latest</b>${esc(latest.actual_temperature)}${esc(latest.unit)} · ${esc(latest.status)} · ${fmtTime(latest.recorded_at)}</span>`:''}${timing.label?`<span class="process-due ${timing.state}"><b>Timer</b>${esc(timing.label)}</span>`:''}</div><div class="form-actions"><button class="primary" type="button" data-process-reading="${esc(b.id)}">Record Temperature</button><button class="secondary" type="button" data-process-advance="${esc(b.id)}">Next Step</button></div>${rs.length?`<div class="process-history">${rs.slice(0,6).map(r=>{ const action=Array.isArray(r.process_corrective_actions)?r.process_corrective_actions[0]:r.process_corrective_actions; return `<div><span>${fmtTime(r.recorded_at)} · ${esc(r.stage_label||processLabel(r.process_type))}</span><span><strong class="${r.status==='PASS'?'status-pass':'status-out'}">${esc(r.actual_temperature)}${esc(r.unit)} · ${esc(r.status)}</strong>${r.status==='OUT'&&!action?` <button class="text-btn" type="button" data-process-action="${esc(r.id)}">Action Required</button>`:action&&!action.verified_at?` <small>Action saved · awaiting verify</small>${hasRole('supervisor')?` <button class="text-btn" type="button" data-process-action-verify="${esc(action.id)}">Verify</button>`:''}`:action?` <small>✓ Verified</small>`:''}</span></div>`;}).join('')}</div>`:''}</article>`;
    }).join(''):'<div class="card empty">No active food batches. Start a new batch when food enters a controlled process.</div>';
    $('processAttentionCount').textContent=attention;
  }
  function populateProcessBatchOptions(){
    $('processLocation').innerHTML='<option value="">No location</option>'+state.locations.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    $('processEquipment').innerHTML='<option value="">No equipment</option>'+state.equipment.map(x=>`<option value="${esc(x.id)}">${esc(x.code)} — ${esc(x.name)}</option>`).join('');
    fillProcessLimitSelect('processStartLimit',$('processStartType').value);
  }
  async function createProcessBatch(e){ e.preventDefault(); const limitId=$('processStartLimit').value; if(!limitId){toast('Configure an approved process limit first.','error');return;} const payload={kitchen_id:state.kitchen.id,product_name:$('processProductName').value.trim(),batch_reference:$('processBatchRef').value.trim()||null,quantity:$('processQuantity').value.trim()||null,location_id:$('processLocation').value||null,equipment_id:$('processEquipment').value||null,current_process:$('processStartType').value,process_limit_id:limitId,process_started_at:new Date().toISOString(),created_by:state.user.id}; const {error}=await db.from('process_batches').insert(payload); if(error){toast(error.message,'error');return;} $('processBatchDialog').close(); $('processBatchForm').reset(); toast('Food batch started.','good'); await loadProcessControl(); await maybeShowProcessOverdueAlert(); }
  function openProcessReading(id){ const b=state.processBatches.find(x=>x.id===id); if(!b)return; const limit=state.processLimits.find(x=>x.id===b.process_limit_id); $('processReadingBatchId').value=id; $('processReadingTitle').textContent=`${b.product_name} · ${processLabel(b.current_process)}`; $('processReadingLimit').textContent=`${processLimitIdentity(limit)} · ${processLimitText(limit)}`; $('processReadingTemp').value=''; $('processReadingNotes').value=''; $('processReadingDialog').showModal(); setTimeout(()=>$('processReadingTemp').focus(),50); }
  async function saveProcessReading(e){ e.preventDefault(); const b=state.processBatches.find(x=>x.id===$('processReadingBatchId').value); if(!b)return; const limit=state.processLimits.find(x=>x.id===b.process_limit_id); const temp=Number($('processReadingTemp').value); const result=evaluateProcessReading(b,limit,temp); const payload={kitchen_id:state.kitchen.id,batch_id:b.id,step_id:activeProcessStep(b)?.id||null,process_type:b.current_process,stage_label:result.stage||null,actual_temperature:temp,unit:limit?.unit||'°C',status:result.status,limit_text_snapshot:result.text,notes:$('processReadingNotes').value.trim()||null,recorded_by:state.user.id}; const {error}=await db.from('process_readings').insert(payload); if(error){toast(error.message,'error');return;} $('processReadingDialog').close(); toast(result.status==='PASS'?'Temperature saved — PASS.':'Temperature saved — OUT OF LIMIT. Corrective action required. ',result.status==='PASS'?'good':'error'); await loadProcessControl(); }
  function openProcessAdvance(id){ const b=state.processBatches.find(x=>x.id===id); if(!b)return; $('processAdvanceBatchId').value=id; const suggestions={cooking:'cooling',cooling:'reheating',reheating:'hot_holding',hot_holding:'completed',cold_holding:'completed'}; $('processNextType').value=suggestions[b.current_process]||'completed'; fillProcessLimitSelect('processNextLimit',$('processNextType').value); $('processNextLimit').disabled=$('processNextType').value==='completed'; $('processAdvanceDialog').showModal(); }
  async function advanceProcessBatch(e){ e.preventDefault(); const id=$('processAdvanceBatchId').value, next=$('processNextType').value; if(next==='completed'){const {error}=await db.from('process_batches').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',id); if(error){toast(error.message,'error');return;}} else {const limitId=$('processNextLimit').value; if(!limitId){toast('Select an approved limit for the next process.','error');return;} const {error}=await db.from('process_batches').update({current_process:next,process_limit_id:limitId,process_started_at:new Date().toISOString(),equipment_id:null}).eq('id',id); if(error){toast(error.message,'error');return;}} $('processAdvanceDialog').close(); toast(next==='completed'?'Food batch completed.':`Moved to ${processLabel(next)}.`,'good'); await loadProcessControl(); await maybeShowProcessOverdueAlert(); }

  function openProcessAction(readingId){ $('processActionReadingId').value=readingId; $('processActionImmediate').value=''; $('processActionDisposition').value=''; $('processActionFollowup').value=''; $('processActionNotes').value=''; $('processActionDialog').showModal(); }
  async function saveProcessAction(e){ e.preventDefault(); const readingId=$('processActionReadingId').value; const {error}=await db.from('process_corrective_actions').insert({kitchen_id:state.kitchen.id,reading_id:readingId,immediate_action:$('processActionImmediate').value.trim(),product_disposition:$('processActionDisposition').value.trim()||null,followup_temperature:nullableNumber($('processActionFollowup').value),notes:$('processActionNotes').value.trim()||null,created_by:state.user.id}); if(error){toast(error.message,'error');return;} $('processActionDialog').close(); toast('Process corrective action saved.','good'); if(state.currentPage==='corrective') await loadCorrectiveActions(); else await loadProcessControl(); }

  async function verifyProcessAction(actionId){ if(!hasRole('supervisor')) return; if(!confirm('Verify this process corrective action?')) return; const {error}=await db.from('process_corrective_actions').update({verified_by:state.user.id,verified_at:new Date().toISOString()}).eq('id',actionId); if(error){toast(error.message,'error');return;} toast('Process corrective action verified.','good'); if(state.currentPage==='corrective') await loadCorrectiveActions(); else await loadProcessControl(); }
  async function loadProcessSettings(){
    await loadProcessLimits(true);
    const [stepRes,batchRes]=await Promise.all([
      db.from('process_steps').select('process_limit_id').eq('kitchen_id',state.kitchen.id),
      db.from('process_batches').select('process_limit_id').eq('kitchen_id',state.kitchen.id)
    ]);
    if(stepRes.error) throw stepRes.error;
    if(batchRes.error) throw batchRes.error;
    state.processLimitUsageIds=new Set([...(stepRes.data||[]),...(batchRes.data||[])].map(x=>x.process_limit_id).filter(Boolean));
    renderProcessLimits(); toggleProcessLimitFields();
  }
  function toggleProcessLimitFields(){ const type=$('processLimitType').value, cooling=type==='cooling', holding=['hot_holding','cold_holding'].includes(type); $('processCoolingLimitFields').classList.toggle('hidden',!cooling); $('processSimpleLimitFields').classList.toggle('hidden',cooling); $('processIntervalLabel').classList.toggle('hidden',!holding); $('processTimeLimitLabel').classList.toggle('hidden',cooling||holding); }
  function resetProcessLimitForm(){
    $('processLimitForm').reset(); $('processLimitId').value=''; $('processLimitMode').value='new'; $('processReminderMinutes').value='15'; $('processOverdueMinutes').value='30';
    $('processLimitType').disabled=false; $('processLimitCode').readOnly=false; $('processVersionNotice').classList.add('hidden'); $('processVersionReasonLabel').classList.add('hidden'); $('processVersionReason').required=false; $('processVersionReason').value='';
    $('processLimitFormTitle').textContent='Add process standard'; $('processLimitSubmit').textContent='Save Process Standard'; $('processLimitCancel').classList.add('hidden'); toggleProcessLimitFields();
  }
  function populateProcessLimitEditor(x){
    $('processLimitId').value=x.id; $('processLimitType').value=x.process_type; $('processLimitCode').value=x.code||''; $('processLimitName').value=x.name||'';
    $('processMinValue').value=x.min_value??''; $('processMaxValue').value=x.max_value??''; $('processTimeLimitMinutes').value=x.time_limit_minutes??'';
    $('processStage1Max').value=x.stage1_max_value??''; $('processStage1Minutes').value=x.stage1_minutes??''; $('processFinalMax').value=x.final_max_value??''; $('processTotalMinutes').value=x.total_minutes??'';
    $('processIntervalMinutes').value=x.monitoring_interval_minutes??''; $('processReminderMinutes').value=x.reminder_minutes??15; $('processOverdueMinutes').value=x.overdue_minutes??30;
    $('processLimitCancel').classList.remove('hidden'); toggleProcessLimitFields(); $('processLimitForm').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function editProcessLimit(id){
    const x=state.processLimits.find(v=>v.id===id); if(!x)return;
    if(processLimitIsUsed(id)){ openProcessLimitVersion(id); return; }
    resetProcessLimitForm(); populateProcessLimitEditor(x); $('processLimitMode').value='edit'; $('processLimitFormTitle').textContent=`Edit ${x.code} · v${processLimitVersion(x)}`; $('processLimitSubmit').textContent='Update Process Standard';
  }
  function openProcessLimitVersion(id){
    const x=state.processLimits.find(v=>v.id===id); if(!x)return;
    resetProcessLimitForm(); populateProcessLimitEditor(x); $('processLimitMode').value='version'; $('processLimitType').disabled=true; $('processLimitCode').readOnly=true;
    $('processVersionNotice').classList.remove('hidden'); $('processVersionReasonLabel').classList.remove('hidden'); $('processVersionReason').required=true;
    $('processLimitFormTitle').textContent=`Create new version of ${x.code}`; $('processLimitSubmit').textContent=`Create v${processLimitVersion(x)+1}`;
  }
  async function toggleProcessLimitActive(id){
    const x=state.processLimits.find(v=>v.id===id); if(!x)return; const next=!x.active;
    if(next && processLimitIsUsed(id)){ toast('A historical standard version cannot be reactivated. Create a new version instead.','error'); return; }
    const {error}=await db.from('process_limits').update({active:next,effective_to:next?null:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('kitchen_id',state.kitchen.id);
    if(error){toast(error.message,'error');return;} toast(next?'Process standard activated.':'Process standard retired.','good'); await loadProcessSettings();
  }
  async function deleteProcessLimit(id){
    const x=state.processLimits.find(v=>v.id===id); if(!x)return;
    if(processLimitIsUsed(id)){toast('This standard version is part of HACCP batch history and cannot be deleted. Create a new version or retire it instead.','error');return;}
    if(!confirm(`Delete ${x.code} · v${processLimitVersion(x)} — ${x.name}? This cannot be undone.`)) return;
    const {error}=await db.from('process_limits').delete().eq('id',id).eq('kitchen_id',state.kitchen.id);
    if(error){toast(error.message,'error');return;} resetProcessLimitForm(); toast('Unused process standard deleted.','good'); await loadProcessSettings();
  }
  function renderProcessLimits(){
    const el=$('processLimitList'); if(!el)return;
    el.innerHTML=state.processLimits.length?state.processLimits.map(x=>{
      const used=processLimitIsUsed(x.id), version=processLimitVersion(x), current=x.active!==false;
      const sameSeries=state.processLimits.filter(v=>v.series_id===x.series_id);
      const latestVersion=Math.max(...sameSeries.map(processLimitVersion),version), hasCurrent=sameSeries.some(v=>v.active!==false);
      const canCreateVersion=used && (current || (!hasCurrent && version===latestVersion));
      const versionAction=used?(canCreateVersion?`<button type="button" class="primary compact-btn" data-version-process-limit="${esc(x.id)}">New Version</button>`:''):`<button type="button" class="text-btn" data-edit-process-limit="${esc(x.id)}">Edit</button>`;
      const toggleAction=current?`<button type="button" class="secondary compact-btn" data-toggle-process-limit="${esc(x.id)}">Retire</button>`:(!used?`<button type="button" class="secondary compact-btn" data-toggle-process-limit="${esc(x.id)}">Activate</button>`:'');
      const deleteAction=!used?`<button type="button" class="danger-action compact-btn" data-delete-process-limit="${esc(x.id)}">Delete</button>`:'';
      return `<div class="list-row process-limit-row ${current?'':'inactive'}"><div><div class="process-limit-title"><strong>${esc(x.code)} — ${esc(x.name)}</strong><span class="process-version-badge">v${esc(version)}</span><span class="${current?'status-pass':'status-open'}">${current?'CURRENT':'RETIRED'}</span>${used?'<span class="process-immutable-badge">USED · LOCKED</span>':''}</div><small>${esc(processLabel(x.process_type))} · ${esc(processLimitText(x))}</small><small>Warn ${esc(x.reminder_minutes??15)} min before · overdue grace ${esc(x.overdue_minutes??30)} min${x.change_reason?` · Change: ${esc(x.change_reason)}`:''}</small></div><div class="process-limit-actions">${versionAction}${toggleAction}${deleteAction}</div></div>`;
    }).join(''):'<div class="empty">No process standards configured yet.</div>';
  }
  async function saveProcessLimit(e){
    e.preventDefault(); const type=$('processLimitType').value, id=$('processLimitId').value, mode=$('processLimitMode').value||'new';
    const payload={kitchen_id:state.kitchen.id,process_type:type,code:$('processLimitCode').value.trim(),name:$('processLimitName').value.trim(),unit:'°C',min_value:type==='cooling'?null:nullableNumber($('processMinValue').value),max_value:type==='cooling'?null:nullableNumber($('processMaxValue').value),time_limit_minutes:['cooking','reheating'].includes(type)?nullableNumber($('processTimeLimitMinutes').value):null,stage1_max_value:type==='cooling'?nullableNumber($('processStage1Max').value):null,stage1_minutes:type==='cooling'?nullableNumber($('processStage1Minutes').value):null,final_max_value:type==='cooling'?nullableNumber($('processFinalMax').value):null,total_minutes:type==='cooling'?nullableNumber($('processTotalMinutes').value):null,monitoring_interval_minutes:['hot_holding','cold_holding'].includes(type)?nullableNumber($('processIntervalMinutes').value):null,reminder_minutes:nullableNumber($('processReminderMinutes').value)??15,overdue_minutes:nullableNumber($('processOverdueMinutes').value)??30};
    let error;
    if(mode==='version'){
      const reason=$('processVersionReason').value.trim(); if(!reason){toast('Enter a reason for the new standard version.','error');return;}
      ({error}=await db.rpc('create_process_limit_version',{p_source_id:id,p_payload:payload,p_change_reason:reason}));
    } else if(id){
      payload.updated_at=new Date().toISOString(); ({error}=await db.from('process_limits').update(payload).eq('id',id).eq('kitchen_id',state.kitchen.id));
    } else {
      ({error}=await db.from('process_limits').insert(payload));
    }
    if(error){toast(error.message,'error');return;} resetProcessLimitForm(); toast(mode==='version'?'New process standard version created.':id?'Process standard updated.':'Process standard saved.','good'); await loadProcessSettings();
  }

  async function maybeShowProcessOverdueAlert(force=false){
    if(!state.user||!state.kitchen) return;
    const overdue=(state.processBatches||[]).map(b=>({batch:b,timing:processTiming(b,state.processLimits.find(x=>x.id===b.process_limit_id))})).filter(x=>x.timing.state==='overdue');
    if(!overdue.length) return;
    const sig=overdue.map(x=>x.batch.id+':'+x.batch.current_process).sort().join('|'), key=`haccp-process-overdue-${state.kitchen.id}-${sig}`, last=Number(sessionStorage.getItem(key)||0);
    if(!force&&Date.now()-last<15*60*1000) return;
    const dialog=$('processOverdueDialog'); if(!dialog||dialog.open||$('overdueDialog')?.open) return;
    sessionStorage.setItem(key,String(Date.now()));
    $('processOverdueTitle').textContent=overdue.length===1?`${overdue[0].batch.product_name} needs attention`:'Food process checks overdue';
    $('processOverdueBody').textContent='A required process temperature check is overdue. Record the temperature immediately and follow the approved HACCP corrective-action procedure if needed.';
    $('processOverdueCount').textContent=`${overdue.length} active process${overdue.length===1?'':'es'} overdue`;
    $('processOverdueList').innerHTML=overdue.slice(0,8).map(({batch,timing})=>`<li><strong>${esc(batch.product_name)}</strong> — ${esc(processLabel(batch.current_process))} · ${esc(timing.label)}</li>`).join('')+(overdue.length>8?`<li>+${overdue.length-8} more</li>`:'');
    dialog.showModal();
  }
  function startProcessReminderClock(){
    if(state.processReminderTimer) clearInterval(state.processReminderTimer);
    const tick=async()=>{try{if(!state.kitchen)return; await loadProcessControl(state.currentPage==='process'); await maybeShowProcessOverdueAlert();}catch(e){console.error(e);}};
    state.processReminderTimer=setInterval(tick,60*1000); setTimeout(tick,1800);
  }





  // v3.7 — Cleaning & Sanitation / SSOP
  async function fetchSanitationStandards(includeInactive = false) {
    let query = db.from('sanitation_standards').select('*').eq('kitchen_id', state.kitchen.id);
    if (!includeInactive) query = query.eq('active', true);
    const { data, error } = await query.order('area_name').order('code');
    if (error) throw error;
    return data || [];
  }

  async function fetchSanitationRecordsForDate(date) {
    const { data, error } = await db.from('sanitation_records')
      .select('*,completer:profiles!sanitation_records_completed_by_fkey(full_name,email),verifier:profiles!sanitation_records_verified_by_fkey(full_name,email),evidence:sanitation_evidence(id,storage_path,original_name,mime_type,file_size,photo_kind,uploaded_at,uploaded_by)')
      .eq('kitchen_id', state.kitchen.id)
      .eq('record_date', date)
      .order('performed_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  function sanitationCopy(en, id) { return currentLanguage === 'id' ? id : en; }

  function sanitationStandardDueOn(standard, date) {
    if (!standard?.active || standard.frequency === 'as_needed') return false;
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const monthday = Number(String(date).slice(8,10));
    if (standard.frequency === 'daily') return true;
    if (standard.frequency === 'weekly') return Number(standard.weekday) === weekday;
    if (standard.frequency === 'monthly') return Number(standard.monthday) === monthday;
    return false;
  }

  function sanitationScheduleLabel(s) {
    const daysEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const daysId = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
    let label = s.frequency === 'daily' ? sanitationCopy('Daily','Harian') : s.frequency === 'weekly' ? `${sanitationCopy('Weekly','Mingguan')} · ${(currentLanguage==='id'?daysId:daysEn)[Number(s.weekday)||0]}` : s.frequency === 'monthly' ? `${sanitationCopy('Monthly','Bulanan')} · ${sanitationCopy('day','tanggal')} ${s.monthday || 1}` : sanitationCopy('As needed','Sesuai kebutuhan');
    if (s.due_time) label += ` · ${String(s.due_time).slice(0,5)}`;
    return label;
  }

  function sanitationRequirementLabel(s) {
    const parts = [];
    if (s.chemical_name) parts.push(s.chemical_name);
    if (s.concentration_required) {
      const min = s.concentration_min != null ? Number(s.concentration_min) : null;
      const max = s.concentration_max != null ? Number(s.concentration_max) : null;
      const range = min != null && max != null ? `${min}–${max}` : min != null ? `≥${min}` : max != null ? `≤${max}` : '—';
      parts.push(`${range} ${s.concentration_unit || ''}`.trim());
    }
    if (s.contact_time_seconds != null) parts.push(`${s.contact_time_seconds}s ${sanitationCopy('contact','kontak')}`);
    return parts.length ? parts.join(' · ') : sanitationCopy('No chemical measurement required','Tidak memerlukan pengukuran bahan kimia');
  }

  function latestSanitationByStandard(records) {
    const map = new Map();
    (records || []).forEach(r => { if (!map.has(r.standard_id)) map.set(r.standard_id, r); });
    return map;
  }

  async function loadSanitationBadge() {
    const badge = $('navSanitationBadge');
    if (!badge || !state.kitchen) return;
    try {
      const date = kitchenDate();
      const [standards, records] = await Promise.all([fetchSanitationStandards(false), fetchSanitationRecordsForDate(date)]);
      const due = standards.filter(s => sanitationStandardDueOn(s, date));
      const latest = latestSanitationByStandard(records);
      const incomplete = due.filter(s => !latest.has(s.id)).length;
      const pendingVerify = records.filter(r => r.verification_status === 'PENDING').length;
      const attention = incomplete + pendingVerify;
      badge.textContent = attention;
      badge.classList.toggle('hidden', attention === 0);
    } catch (error) {
      if (error?.code !== '42P01') console.error('Sanitation badge:', error);
      badge.classList.add('hidden');
    }
  }

  function clearSanitationPhotoDraft() {
    (state.sanitationPhotoDraft || []).forEach(item => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    state.sanitationPhotoDraft = [];
    if ($('sanitationPhotoInput')) $('sanitationPhotoInput').value = '';
    renderSanitationPhotoDraft();
  }

  function renderSanitationPhotoDraft() {
    const box = $('sanitationPhotoPreview');
    if (!box) return;
    const items = state.sanitationPhotoDraft || [];
    box.innerHTML = items.length ? items.map((item,index)=>`
      <article class="receiving-photo-draft">
        <img src="${esc(item.previewUrl)}" alt="Sanitation evidence preview">
        <div class="receiving-photo-draft-copy">
          <select data-sanitation-photo-kind="${index}">
            <option value="before" ${item.kind==='before'?'selected':''}>${sanitationCopy('Before cleaning','Sebelum dibersihkan')}</option>
            <option value="after" ${item.kind==='after'?'selected':''}>${sanitationCopy('After cleaning','Setelah dibersihkan')}</option>
            <option value="failure" ${item.kind==='failure'?'selected':''}>${sanitationCopy('Failure evidence','Bukti kegagalan')}</option>
            <option value="corrective" ${item.kind==='corrective'?'selected':''}>${sanitationCopy('Corrective action','Tindakan koreksi')}</option>
            <option value="evidence" ${item.kind==='evidence'?'selected':''}>${sanitationCopy('Other evidence','Bukti lain')}</option>
          </select>
          <small>${esc(item.file.name)} · ${(item.file.size/1024/1024).toFixed(1)} MB</small>
          <button class="text-btn danger-text" type="button" data-remove-sanitation-photo="${index}">${sanitationCopy('Remove','Hapus')}</button>
        </div>
      </article>`).join('') : `<div class="receiving-photo-empty">${sanitationCopy('No photo evidence selected.','Belum ada foto bukti.')}</div>`;
  }

  function addSanitationPhotos(files) {
    const incoming = Array.from(files || []).filter(file => file.type.startsWith('image/'));
    if (!incoming.length) return;
    const room = Math.max(0, 4 - (state.sanitationPhotoDraft || []).length);
    if (!room) { toast(sanitationCopy('Maximum 4 sanitation photos per record.','Maksimal 4 foto sanitasi per catatan.'), 'error'); return; }
    incoming.slice(0, room).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { toast(`${file.name}: ${sanitationCopy('maximum source image size is 10 MB.','ukuran gambar sumber maksimum 10 MB.')}`, 'error'); return; }
      state.sanitationPhotoDraft.push({ file, kind:'after', previewUrl:URL.createObjectURL(file) });
    });
    if (incoming.length > room) toast(sanitationCopy('Only the first 4 photos were added.','Hanya 4 foto pertama yang ditambahkan.'), 'error');
    renderSanitationPhotoDraft();
  }

  async function uploadSanitationEvidence(recordId) {
    const items = state.sanitationPhotoDraft || [];
    if (!items.length) return { rows:[], uploadedPaths:[] };
    const uploadedPaths = [];
    const rows = [];
    try {
      for (let i=0;i<items.length;i++) {
        const item = items[i];
        const blob = await compressReceivingPhoto(item.file);
        const storagePath = `${state.kitchen.id}/${recordId}/${String(i+1).padStart(2,'0')}-${safeStorageName(item.file.name)}`;
        const { error:uploadError } = await db.storage.from('sanitation-evidence').upload(storagePath, blob, { contentType:'image/jpeg', upsert:false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(storagePath);
        rows.push({ storage_path:storagePath, original_name:item.file.name, mime_type:'image/jpeg', file_size:blob.size, photo_kind:item.kind || 'evidence' });
      }
      return { rows, uploadedPaths };
    } catch (error) {
      if (uploadedPaths.length) await db.storage.from('sanitation-evidence').remove(uploadedPaths);
      throw error;
    }
  }

  async function signedSanitationEvidence(evidence, expiresIn=900) {
    const items = evidence || [];
    if (!items.length) return [];
    const { data, error } = await db.storage.from('sanitation-evidence').createSignedUrls(items.map(x=>x.storage_path), expiresIn);
    if (error) throw error;
    return items.map((item,index)=>({...item, signedUrl:data?.[index]?.signedUrl || null}));
  }

  async function viewSanitationEvidence(recordId) {
    const record = (state.sanitationRecords || []).find(r=>r.id===recordId);
    if (!record || !(record.evidence || []).length) { toast(sanitationCopy('No sanitation photo evidence attached.','Tidak ada foto bukti sanitasi.'), 'error'); return; }
    try {
      const photos = await signedSanitationEvidence(record.evidence, 900);
      $('sanitationEvidenceTitle').textContent = `${record.standard_code_snapshot} · ${record.standard_name_snapshot}`;
      $('sanitationEvidenceGrid').innerHTML = photos.map(p=>`<figure class="receiving-evidence-item"><a href="${esc(p.signedUrl)}" target="_blank" rel="noopener"><img src="${esc(p.signedUrl)}" alt="${esc(p.photo_kind)}"></a><figcaption><b>${esc(String(p.photo_kind||'evidence').replaceAll('_',' '))}</b><span>${esc(p.original_name||'Evidence photo')}</span></figcaption></figure>`).join('');
      $('sanitationEvidenceDialog').showModal();
    } catch (error) { toast(error.message || sanitationCopy('Could not open sanitation evidence.','Tidak dapat membuka bukti sanitasi.'), 'error'); }
  }

  function sanitationPreviewState() {
    const standard = (state.sanitationStandards || []).find(s => s.id === $('sanitationRecordStandard')?.value);
    if (!standard) return { ready:false, fail:false, reasons:[], standard:null };
    const reasons = [];
    if ($('sanitationVisualCondition')?.value !== 'acceptable') reasons.push(sanitationCopy('Visual condition unacceptable','Kondisi visual tidak dapat diterima'));
    const raw = $('sanitationMeasuredConcentration')?.value ?? '';
    const measured = raw === '' ? null : Number(raw);
    if (standard.concentration_required) {
      if (measured == null || !Number.isFinite(measured)) reasons.push(sanitationCopy('Required concentration is missing','Konsentrasi wajib belum dicatat'));
      else {
        if (standard.concentration_min != null && measured < Number(standard.concentration_min)) reasons.push(sanitationCopy('Concentration below approved minimum','Konsentrasi di bawah minimum yang disetujui'));
        if (standard.concentration_max != null && measured > Number(standard.concentration_max)) reasons.push(sanitationCopy('Concentration above approved maximum','Konsentrasi di atas maksimum yang disetujui'));
      }
    }
    return { ready:true, fail:reasons.length>0, reasons, standard, measured };
  }

  function updateSanitationRecordPreview() {
    const statePreview = sanitationPreviewState();
    const s = statePreview.standard;
    const box = $('sanitationRecordRequirement');
    const concentrationWrap = $('sanitationMeasuredConcentrationWrap');
    const correctiveWrap = $('sanitationCorrectiveWrap');
    if (!s) {
      if (box) box.innerHTML = sanitationCopy('Choose a sanitation task.','Pilih tugas sanitasi.');
      if (concentrationWrap) concentrationWrap.classList.add('hidden');
      return;
    }
    if (concentrationWrap) concentrationWrap.classList.toggle('hidden', !s.concentration_required);
    if ($('sanitationMeasuredConcentration')) $('sanitationMeasuredConcentration').required = !!s.concentration_required;
    if (correctiveWrap) correctiveWrap.classList.toggle('hidden', !statePreview.fail);
    if ($('sanitationCorrectiveAction')) $('sanitationCorrectiveAction').required = !!statePreview.fail;
    const resultClass = statePreview.fail ? 'status-out' : 'status-pass';
    const resultText = statePreview.fail ? 'FAIL' : 'PASS';
    box.className = `verification-strip ${statePreview.fail ? '' : 'verified'}`;
    box.innerHTML = `<div class="sanitation-requirement-copy"><strong>${esc(s.standard_code || s.code)} · ${esc(s.name)}</strong><span>${esc(s.method_text)}</span><span>${esc(sanitationRequirementLabel(s))}</span>${statePreview.reasons.length ? `<span class="${resultClass}">${esc(statePreview.reasons.join(' · '))}</span>` : ''}</div><strong class="${resultClass}">${resultText}</strong>`;
  }

  function fillSanitationStandardSelect(selected='') {
    const select = $('sanitationRecordStandard');
    if (!select) return;
    select.innerHTML = (state.sanitationStandards || []).map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.code)} — ${esc(s.name)} · ${esc(s.area_name)}</option>`).join('');
    if (!select.value && select.options.length) select.selectedIndex = 0;
  }

  function openSanitationRecord(standardId='') {
    if (!(state.sanitationStandards || []).length) { toast(sanitationCopy('No active sanitation standards configured.','Belum ada standar sanitasi aktif.'), 'error'); return; }
    $('sanitationRecordForm').reset();
    clearSanitationPhotoDraft();
    fillSanitationStandardSelect(standardId);
    $('sanitationRecordStandardId').value = $('sanitationRecordStandard')?.value || '';
    updateSanitationRecordPreview();
    $('sanitationRecordDialog').showModal();
  }

  async function saveSanitationRecord(event) {
    event.preventDefault();
    const preview = sanitationPreviewState();
    if (!preview.ready || !preview.standard) return;
    const corrective = $('sanitationCorrectiveAction').value.trim();
    if (preview.fail && !corrective) { toast(sanitationCopy('Corrective action is required for a failed sanitation check.','Tindakan koreksi wajib untuk pemeriksaan sanitasi yang gagal.'), 'error'); return; }
    if (preview.fail && preview.standard.photo_required_on_fail && !(state.sanitationPhotoDraft || []).length) { toast(sanitationCopy('At least one photo is required for this failed sanitation check.','Minimal satu foto wajib untuk pemeriksaan sanitasi yang gagal.'), 'error'); return; }
    const recordId = crypto.randomUUID();
    let upload = { rows:[], uploadedPaths:[] };
    try {
      upload = await uploadSanitationEvidence(recordId);
      const payload = {
        id:recordId,
        kitchen_id:state.kitchen.id,
        standard_id:preview.standard.id,
        record_date:kitchenDate(),
        performed_at:new Date().toISOString(),
        visual_condition:$('sanitationVisualCondition').value,
        measured_concentration:preview.standard.concentration_required ? $('sanitationMeasuredConcentration').value : '',
        result:preview.fail ? 'FAIL' : 'PASS',
        corrective_action:preview.fail ? corrective : '',
        notes:$('sanitationRecordNotes').value.trim(),
        completed_by:state.user.id
      };
      const { error } = await db.rpc('create_sanitation_record_with_evidence', { p_record:payload, p_evidence:upload.rows });
      if (error) throw error;
    } catch (error) {
      if (upload.uploadedPaths?.length) await db.storage.from('sanitation-evidence').remove(upload.uploadedPaths);
      toast(error.message || sanitationCopy('Sanitation check could not be saved.','Pemeriksaan sanitasi tidak dapat disimpan.'), 'error');
      return;
    }
    $('sanitationRecordDialog').close();
    clearSanitationPhotoDraft();
    toast(preview.fail ? sanitationCopy('Sanitation deviation saved. Supervisor verification may be required.','Deviasi sanitasi tersimpan. Verifikasi supervisor mungkin diperlukan.') : sanitationCopy('Sanitation check saved.','Pemeriksaan sanitasi tersimpan.'), preview.fail ? 'error' : 'good');
    await loadSanitation();
    if (state.currentPage === 'records') await loadRecordsHub();
  }

  function renderSanitationTaskCard(s, latestRecord) {
    const equipment = s.equipment_id ? state.equipment.find(e=>e.id===s.equipment_id) : null;
    const area = s.area_name || equipment?.locations?.name || '—';
    let status = sanitationCopy('PENDING','BELUM SELESAI');
    let statusClass = 'status-open';
    if (latestRecord) {
      if (latestRecord.verification_status === 'RECHECK_REQUIRED') { status=sanitationCopy('RECHECK REQUIRED','PERLU PERIKSA ULANG'); statusClass='status-out'; }
      else if (latestRecord.result === 'FAIL') { status=latestRecord.verification_status === 'VERIFIED' ? sanitationCopy('FAIL · VERIFIED','FAIL · TERVERIFIKASI') : 'FAIL'; statusClass='status-out'; }
      else if (latestRecord.verification_status === 'PENDING') { status=sanitationCopy('AWAITING VERIFY','MENUNGGU VERIFIKASI'); statusClass='status-open'; }
      else { status='PASS'; statusClass='status-pass'; }
    }
    const completer = latestRecord?.completer?.full_name || latestRecord?.completer?.email || 'Staff';
    return `<article class="card sanitation-task-card ${latestRecord?.result==='FAIL' || latestRecord?.verification_status==='RECHECK_REQUIRED' ? 'sanitation-failed':''}">
      <div class="sanitation-task-head"><div><span class="source-badge source-sanitation">SSOP</span><h3>${esc(s.code)} — ${esc(s.name)}</h3><p>${esc(area)}${equipment ? ` · ${esc(equipment.code)} — ${esc(equipment.name)}` : ''}</p></div><span class="${statusClass}">${esc(status)}</span></div>
      <div class="sanitation-task-meta"><span><b>${sanitationCopy('Schedule','Jadwal')}</b>${esc(sanitationScheduleLabel(s))}</span><span><b>${sanitationCopy('Chemical / requirement','Bahan kimia / persyaratan')}</b>${esc(sanitationRequirementLabel(s))}</span><span><b>${sanitationCopy('Verification','Verifikasi')}</b>${s.verification_required ? sanitationCopy('Supervisor required','Wajib supervisor') : sanitationCopy('Not required','Tidak wajib')}</span></div>
      <div class="sanitation-method"><b>${sanitationCopy('Approved method','Metode disetujui')}</b><span>${esc(s.method_text)}</span></div>
      ${latestRecord ? `<div class="sanitation-task-footer"><small>${fmtDateTime(latestRecord.performed_at)} · ${esc(completer)}${latestRecord.evidence?.length ? ` · ${latestRecord.evidence.length} ${sanitationCopy('photo(s)','foto')}`:''}</small><div class="receiving-record-footer-actions">${latestRecord.evidence?.length ? `<button class="secondary compact-btn" type="button" data-view-sanitation-evidence="${esc(latestRecord.id)}">${sanitationCopy('Photos','Foto')} · ${latestRecord.evidence.length}</button>`:''}${latestRecord.verification_status==='PENDING' && hasRole('supervisor') ? `<button class="primary compact-btn" type="button" data-verify-sanitation="${esc(latestRecord.id)}">${sanitationCopy('Verify','Verifikasi')}</button>`:''}${latestRecord.verification_status==='RECHECK_REQUIRED' ? `<button class="primary compact-btn" type="button" data-complete-sanitation="${esc(s.id)}">${sanitationCopy('Re-clean & Check','Bersihkan & Periksa Ulang')}</button>`:''}</div></div>` : `<div class="sanitation-task-footer"><small>${sanitationCopy('Not completed yet.','Belum diselesaikan.')}</small><button class="primary compact-btn" type="button" data-complete-sanitation="${esc(s.id)}">${sanitationCopy('Start','Mulai')}</button></div>`}
    </article>`;
  }

  function renderSanitationToday() {
    const date = kitchenDate();
    const due = (state.sanitationStandards || []).filter(s=>sanitationStandardDueOn(s,date));
    const latest = latestSanitationByStandard(state.sanitationRecords || []);
    const completed = due.filter(s=>latest.has(s.id)).length;
    const failed = (state.sanitationRecords || []).filter(r=>r.result==='FAIL').length;
    const pending = (state.sanitationRecords || []).filter(r=>r.verification_status==='PENDING').length;
    $('sanitationDueCount').textContent = due.length;
    $('sanitationCompletedCount').textContent = completed;
    $('sanitationFailedCount').textContent = failed;
    $('sanitationPendingCount').textContent = pending;
    const box = $('sanitationTaskList');
    if (!box) return;
    const dueCards = due.map(s=>renderSanitationTaskCard(s,latest.get(s.id))).join('');
    const asNeeded = (state.sanitationStandards || []).filter(s=>s.frequency==='as_needed');
    box.innerHTML = `${dueCards || `<div class="card empty">${sanitationCopy('No scheduled sanitation tasks are due today.','Tidak ada tugas sanitasi terjadwal hari ini.')}</div>`}${asNeeded.length ? `<div class="sanitation-as-needed-head"><div><div class="eyebrow">${sanitationCopy('AS NEEDED','SESUAI KEBUTUHAN')}</div><h2>${sanitationCopy('Additional sanitation tasks','Tugas sanitasi tambahan')}</h2></div></div>${asNeeded.map(s=>renderSanitationTaskCard(s,latest.get(s.id))).join('')}`:''}`;
  }

  async function loadSanitation() {
    try {
      const date = kitchenDate();
      const [standards, records] = await Promise.all([fetchSanitationStandards(false), fetchSanitationRecordsForDate(date)]);
      state.sanitationStandards = standards;
      state.sanitationRecords = records;
      renderSanitationToday();
      await loadSanitationBadge();
    } catch (error) { toast(error.message || sanitationCopy('Could not load sanitation control.','Tidak dapat memuat kontrol sanitasi.'), 'error'); }
  }

  function clearSanitationVerifyPhotoDraft() {
    (state.sanitationVerifyPhotoDraft || []).forEach(item => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    state.sanitationVerifyPhotoDraft = [];
    if ($('sanitationVerifyPhotoInput')) $('sanitationVerifyPhotoInput').value='';
    renderSanitationVerifyPhotoDraft();
  }

  function renderSanitationVerifyPhotoDraft() {
    const box=$('sanitationVerifyPhotoPreview'); if(!box)return;
    const items=state.sanitationVerifyPhotoDraft||[];
    box.innerHTML=items.length?items.map((item,index)=>`<article class="receiving-photo-draft"><img src="${esc(item.previewUrl)}" alt="Verification evidence"><div class="receiving-photo-draft-copy"><small>${esc(item.file.name)} · ${(item.file.size/1024/1024).toFixed(1)} MB</small><button class="text-btn danger-text" type="button" data-remove-sanitation-verify-photo="${index}">${sanitationCopy('Remove','Hapus')}</button></div></article>`).join(''):`<div class="receiving-photo-empty">${sanitationCopy('No verification photo selected.','Belum ada foto verifikasi.')}</div>`;
  }

  function addSanitationVerifyPhotos(files) {
    const incoming=Array.from(files||[]).filter(f=>f.type.startsWith('image/')); if(!incoming.length)return;
    const room=Math.max(0,2-(state.sanitationVerifyPhotoDraft||[]).length); if(!room){toast(sanitationCopy('Maximum 2 verification photos.','Maksimal 2 foto verifikasi.'),'error');return;}
    incoming.slice(0,room).forEach(file=>{if(file.size>10*1024*1024){toast(`${file.name}: maximum 10 MB.`,'error');return;}state.sanitationVerifyPhotoDraft.push({file,previewUrl:URL.createObjectURL(file)});});
    renderSanitationVerifyPhotoDraft();
  }

  async function uploadSanitationVerificationEvidence(recordId) {
    const items=state.sanitationVerifyPhotoDraft||[]; const uploadedPaths=[]; const rows=[];
    try { for(let i=0;i<items.length;i++){const item=items[i];const blob=await compressReceivingPhoto(item.file);const storagePath=`${state.kitchen.id}/${recordId}/verify-${Date.now()}-${i+1}-${safeStorageName(item.file.name)}`;const {error}=await db.storage.from('sanitation-evidence').upload(storagePath,blob,{contentType:'image/jpeg',upsert:false});if(error)throw error;uploadedPaths.push(storagePath);rows.push({storage_path:storagePath,original_name:item.file.name,mime_type:'image/jpeg',file_size:blob.size,photo_kind:'failure'});} return {rows,uploadedPaths}; }
    catch(error){if(uploadedPaths.length)await db.storage.from('sanitation-evidence').remove(uploadedPaths);throw error;}
  }

  function openSanitationVerify(id) {
    const record = (state.sanitationRecords || []).find(r=>r.id===id);
    if (!record || !hasRole('supervisor')) return;
    $('sanitationVerifyRecordId').value = id;
    $('sanitationVerifyResult').value = 'VERIFIED';
    $('sanitationVerifyNotes').value = '';
    clearSanitationVerifyPhotoDraft();
    $('sanitationVerifyDialog').showModal();
  }

  async function verifySanitation(event) {
    event.preventDefault();
    const recordId=$('sanitationVerifyRecordId').value;
    const result=$('sanitationVerifyResult').value;
    const notes=$('sanitationVerifyNotes').value.trim();
    if(result==='RECHECK_REQUIRED' && !(state.sanitationVerifyPhotoDraft||[]).length){toast(sanitationCopy('A verification photo is required when recheck is required.','Foto verifikasi wajib ketika perlu periksa ulang.'),'error');return;}
    let upload={rows:[],uploadedPaths:[]};
    try{
      upload=await uploadSanitationVerificationEvidence(recordId);
      const { error } = await db.rpc('verify_sanitation_record', { p_record_id:recordId, p_result:result, p_notes:notes, p_evidence:upload.rows });
      if(error)throw error;
    }catch(error){if(upload.uploadedPaths?.length)await db.storage.from('sanitation-evidence').remove(upload.uploadedPaths);toast(error.message,'error');return;}
    $('sanitationVerifyDialog').close();
    clearSanitationVerifyPhotoDraft();
    toast(sanitationCopy('Sanitation verification saved.','Verifikasi sanitasi tersimpan.'),'good');
    await loadSanitation();
    if (state.currentPage === 'records') await loadRecordsHub();
    if (state.currentPage === 'corrective') await loadCorrectiveActions();
  }


  function updateSanitationStandardFields() {
    const required = $('sanitationConcentrationRequired')?.checked;
    ['sanitationConcentrationMin','sanitationConcentrationMax','sanitationConcentrationUnit'].forEach(id=>{ if ($(id)) $(id).disabled=!required; });
    const f = $('sanitationFrequency')?.value;
    if ($('sanitationWeekday')) $('sanitationWeekday').disabled = f !== 'weekly';
    if ($('sanitationMonthday')) $('sanitationMonthday').disabled = f !== 'monthly';
  }

  function resetSanitationStandardForm() {
    $('sanitationStandardForm')?.reset();
    $('sanitationStandardId').value='';
    $('sanitationStandardFormTitle').textContent = sanitationCopy('Add sanitation standard','Tambah standar sanitasi');
    $('sanitationStandardCancel').classList.add('hidden');
    $('sanitationVerificationRequired').checked=true;
    $('sanitationPhotoOnFail').checked=true;
    $('sanitationMonthday').value='1';
    updateSanitationStandardFields();
  }

  function renderSanitationSettings() {
    const list = $('sanitationStandardList');
    const all = state.sanitationStandards || [];
    $('sanitationStandardCount').textContent = all.length;
    if ($('sanitationStandardEquipment')) $('sanitationStandardEquipment').innerHTML = `<option value="">${sanitationCopy('No specific equipment','Tidak ada equipment khusus')}</option>` + state.equipment.map(e=>`<option value="${esc(e.id)}">${esc(e.code)} — ${esc(e.name)}</option>`).join('');
    list.innerHTML = all.length ? all.map(s=>{
      const e = state.equipment.find(x=>x.id===s.equipment_id);
      return `<div class="setting-row sanitation-setting-row ${s.active?'':'inactive'}"><div><div class="setting-row-title"><strong>${esc(s.code)} — ${esc(s.name)}</strong><span class="${s.active?'status-pass':'calibration-muted'}">${s.active?'ACTIVE':'INACTIVE'}</span></div><small>${esc(s.area_name)}${e?` · ${esc(e.code)} — ${esc(e.name)}`:''}<br>${esc(sanitationScheduleLabel(s))} · ${esc(sanitationRequirementLabel(s))}</small></div><div class="setting-actions"><button class="secondary compact-btn" type="button" data-edit-sanitation-standard="${esc(s.id)}">${sanitationCopy('Edit','Edit')}</button><button class="secondary compact-btn" type="button" data-toggle-sanitation-standard="${esc(s.id)}">${s.active?sanitationCopy('Archive','Arsipkan'):sanitationCopy('Restore','Pulihkan')}</button></div></div>`;
    }).join('') : `<div class="empty">${sanitationCopy('No sanitation standards configured.','Belum ada standar sanitasi.')}</div>`;
  }

  async function loadSanitationSettings() {
    try {
      state.sanitationStandards = await fetchSanitationStandards(true);
      renderSanitationSettings();
      updateSanitationStandardFields();
    } catch (error) { toast(error.message || sanitationCopy('Could not load sanitation settings.','Tidak dapat memuat pengaturan sanitasi.'), 'error'); }
  }

  function editSanitationStandard(id) {
    const s = (state.sanitationStandards || []).find(x=>x.id===id); if (!s) return;
    $('sanitationStandardId').value=s.id; $('sanitationStandardCode').value=s.code||''; $('sanitationStandardName').value=s.name||''; $('sanitationStandardArea').value=s.area_name||''; $('sanitationStandardEquipment').value=s.equipment_id||''; $('sanitationStandardMethod').value=s.method_text||''; $('sanitationStandardChemical').value=s.chemical_name||''; $('sanitationStandardContact').value=s.contact_time_seconds??''; $('sanitationConcentrationRequired').checked=!!s.concentration_required; $('sanitationConcentrationMin').value=s.concentration_min??''; $('sanitationConcentrationMax').value=s.concentration_max??''; $('sanitationConcentrationUnit').value=s.concentration_unit||''; $('sanitationFrequency').value=s.frequency||'daily'; $('sanitationDueTime').value=s.due_time ? String(s.due_time).slice(0,5) : ''; $('sanitationWeekday').value=s.weekday??1; $('sanitationMonthday').value=s.monthday??1; $('sanitationVerificationRequired').checked=!!s.verification_required; $('sanitationPhotoOnFail').checked=!!s.photo_required_on_fail; $('sanitationStandardNotes').value=s.notes||'';
    $('sanitationStandardFormTitle').textContent=sanitationCopy('Edit sanitation standard','Edit standar sanitasi'); $('sanitationStandardCancel').classList.remove('hidden'); updateSanitationStandardFields(); $('sanitationStandardForm').scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function saveSanitationStandard(event) {
    event.preventDefault();
    const id=$('sanitationStandardId').value;
    const payload={kitchen_id:state.kitchen.id,code:$('sanitationStandardCode').value.trim(),name:$('sanitationStandardName').value.trim(),area_name:$('sanitationStandardArea').value.trim(),equipment_id:$('sanitationStandardEquipment').value||null,method_text:$('sanitationStandardMethod').value.trim(),chemical_name:$('sanitationStandardChemical').value.trim()||null,concentration_required:$('sanitationConcentrationRequired').checked,concentration_min:$('sanitationConcentrationRequired').checked?nullableNumber($('sanitationConcentrationMin').value):null,concentration_max:$('sanitationConcentrationRequired').checked?nullableNumber($('sanitationConcentrationMax').value):null,concentration_unit:$('sanitationConcentrationRequired').checked?($('sanitationConcentrationUnit').value.trim()||null):null,contact_time_seconds:nullableNumber($('sanitationStandardContact').value),frequency:$('sanitationFrequency').value,due_time:$('sanitationDueTime').value||null,weekday:$('sanitationFrequency').value==='weekly'?Number($('sanitationWeekday').value):null,monthday:$('sanitationFrequency').value==='monthly'?Number($('sanitationMonthday').value):null,verification_required:$('sanitationVerificationRequired').checked,photo_required_on_fail:$('sanitationPhotoOnFail').checked,notes:$('sanitationStandardNotes').value.trim()||null,updated_by:state.user.id,updated_at:new Date().toISOString()};
    if (!payload.code || !payload.name || !payload.area_name || !payload.method_text) return;
    if (payload.concentration_required && payload.concentration_min==null && payload.concentration_max==null) { toast(sanitationCopy('Enter at least a minimum or maximum concentration.','Masukkan minimal batas minimum atau maksimum konsentrasi.'),'error'); return; }
    let res;
    if (id) res=await db.from('sanitation_standards').update(payload).eq('id',id);
    else { payload.created_by=state.user.id; res=await db.from('sanitation_standards').insert(payload); }
    if (res.error) { toast(res.error.message,'error'); return; }
    toast(id?sanitationCopy('Sanitation standard updated.','Standar sanitasi diperbarui.'):sanitationCopy('Sanitation standard added.','Standar sanitasi ditambahkan.'),'good'); resetSanitationStandardForm(); await loadSanitationSettings();
  }

  async function toggleSanitationStandard(id) {
    const s=(state.sanitationStandards||[]).find(x=>x.id===id); if(!s)return;
    const verb=s.active?sanitationCopy('archive','arsipkan'):sanitationCopy('restore','pulihkan');
    if(!confirm(`${sanitationCopy('Confirm','Konfirmasi')} ${verb} ${s.code} — ${s.name}?`))return;
    const {error}=await db.from('sanitation_standards').update({active:!s.active,updated_by:state.user.id,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){toast(error.message,'error');return;} await loadSanitationSettings();
  }

  async function loadSanitationRecords() {
    const date=$('recordDate').value||kitchenDate();
    try {
      const records=await fetchSanitationRecordsForDate(date); state.sanitationRecords=records;
      const status=$('sanitationRecordStatus')?.value||'all'; const verification=$('sanitationRecordVerification')?.value||'all'; const search=($('sanitationRecordSearch')?.value||'').trim().toLowerCase();
      const filtered=records.filter(r=>(status==='all'||r.result===status)&&(verification==='all'||(verification==='pending'?r.verification_status==='PENDING':['VERIFIED','NOT_REQUIRED'].includes(r.verification_status)))&&(!search||`${r.standard_code_snapshot} ${r.standard_name_snapshot} ${r.area_name_snapshot} ${r.equipment_code_snapshot||''} ${r.equipment_name_snapshot||''}`.toLowerCase().includes(search)));
      const pass=records.filter(r=>r.result==='PASS').length, fail=records.filter(r=>r.result==='FAIL').length, pending=records.filter(r=>r.verification_status==='PENDING').length;
      $('sanitationRecordsSummary').innerHTML=`<span><b>${records.length}</b>${sanitationCopy('Checks','Pemeriksaan')}</span><span class="summary-pass"><b>${pass}</b>PASS</span><span class="summary-out"><b>${fail}</b>FAIL</span><span><b>${pending}</b>${sanitationCopy('Awaiting verification','Menunggu verifikasi')}</span>`;
      $('sanitationRecordsBody').innerHTML=filtered.length?filtered.map(r=>{const concentration=r.concentration_required_snapshot?`${r.measured_concentration??'—'} ${r.concentration_unit_snapshot||''}`:'—';const who=r.completer?.full_name||r.completer?.email||'Staff';const ver=r.verification_status==='NOT_REQUIRED'?sanitationCopy('Not required','Tidak wajib'):r.verification_status==='VERIFIED'?`${sanitationCopy('Verified','Diverifikasi')} · ${esc(r.verifier?.full_name||r.verifier?.email||'Supervisor')}`:r.verification_status==='RECHECK_REQUIRED'?sanitationCopy('Recheck required','Perlu periksa ulang'):sanitationCopy('Pending','Menunggu');return `<tr><td>${fmtTime(r.performed_at)}</td><td><b>${esc(r.standard_code_snapshot)}</b><br>${esc(r.standard_name_snapshot)}</td><td>${esc(r.area_name_snapshot)}${r.equipment_code_snapshot?`<br><small>${esc(r.equipment_code_snapshot)} — ${esc(r.equipment_name_snapshot||'')}</small>`:''}</td><td>${esc(r.chemical_name_snapshot||'—')}</td><td>${esc(concentration)}</td><td>${esc(r.visual_condition)}</td><td class="table-status ${r.result==='PASS'?'pass':'out'}">${esc(r.result)}</td><td>${esc(who)}</td><td>${r.evidence?.length?`<button class="text-btn" type="button" data-view-sanitation-evidence="${esc(r.id)}">${r.evidence.length} ${sanitationCopy('photo(s)','foto')}</button><br>`:''}<small>${esc(ver)}</small>${r.verification_status==='PENDING'&&hasRole('supervisor')?`<br><button class="text-btn" type="button" data-verify-sanitation="${esc(r.id)}">${sanitationCopy('Verify','Verifikasi')}</button>`:''}</td></tr>`;}).join(''):`<tr><td colspan="9" class="empty">${sanitationCopy('No sanitation records match these filters.','Tidak ada catatan sanitasi yang sesuai filter.')}</td></tr>`;
    } catch(error){toast(error.message||sanitationCopy('Could not load sanitation records.','Tidak dapat memuat catatan sanitasi.'),'error');}
  }

  async function buildSanitationReportHtml(date) {
    const [records, propertyRes] = await Promise.all([fetchSanitationRecordsForDate(date), db.from('property_settings').select('*').eq('kitchen_id',state.kitchen.id).maybeSingle()]);
    if (propertyRes.error) throw propertyRes.error;
    const p=propertyRes.data||state.property||{}; state.property=p;
    const photosByRecord=new Map();
    for (const r of records) if ((r.evidence||[]).length) { try { photosByRecord.set(r.id,await signedSanitationEvidence(r.evidence,1800)); } catch(e){ console.error(e); } }
    const pass=records.filter(r=>r.result==='PASS').length, fail=records.filter(r=>r.result==='FAIL').length, pending=records.filter(r=>r.verification_status==='PENDING').length;
    const generatedAt=new Date().toLocaleString(currentLanguage==='id'?'id-ID':'en-GB');
    const logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}" alt="">`:''; const contact=[p.phone,p.website].filter(Boolean).map(esc).join(' · ');
    return `<!doctype html><html><head><meta charset="utf-8"><title>Sanitation HACCP ${esc(date)}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:9px}h1{font-size:20px;margin:2px 0}h2{font-size:12px;margin:18px 0 7px}.eyebrow{font-size:8px;letter-spacing:.14em;color:#666;font-weight:bold}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:10px}.property-logo{max-width:95px;max-height:54px;object-fit:contain}.property-copy{flex:1}.property-name{font-size:17px;font-weight:800;margin-bottom:3px}.property-detail{font-size:9px;color:#444;line-height:1.45}.record-head{display:flex;justify-content:space-between;gap:20px;align-items:end}.record-meta{text-align:right;line-height:1.6}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:15px 0}.box{border:1px solid #ccc;border-radius:6px;padding:8px}.box strong{font-size:15px;display:block;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}th{font-size:8px;text-transform:uppercase;letter-spacing:.05em;color:#666}.muted{color:#666}.pass{font-weight:bold}.out{font-weight:bold}.photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.photo{break-inside:avoid;border:1px solid #ddd;padding:5px}.photo img{width:100%;height:115px;object-fit:cover}.photo b{display:block;margin-top:4px;text-transform:capitalize}.footer{margin-top:14px;color:#666;font-size:8px}.page-break{break-before:page}@media print{button{display:none}}</style></head><body>${(p.property_name||p.address||p.phone||p.website||p.logo_data_url)?`<div class="property-head">${logo}<div class="property-copy"><div class="property-name">${esc(p.property_name||'')}</div>${p.address?`<div class="property-detail">${esc(p.address)}</div>`:''}${contact?`<div class="property-detail">${contact}</div>`:''}</div></div>`:''}<div class="record-head"><div><div class="eyebrow">${sanitationCopy('CLEANING & SANITATION / SSOP RECORD','CATATAN CLEANING & SANITATION / SSOP')}</div><h1>${esc(state.kitchen.name)}</h1></div><div class="record-meta"><b>${sanitationCopy('Record date','Tanggal catatan')}:</b> ${esc(date)}<br><b>${sanitationCopy('Generated','Dibuat')}:</b> ${esc(generatedAt)}<br><b>${sanitationCopy('Timezone','Zona waktu')}:</b> ${esc(kitchenTimeZone())}</div></div><div class="meta"><div class="box">${sanitationCopy('Checks','Pemeriksaan')}<strong>${records.length}</strong></div><div class="box">PASS<strong>${pass}</strong></div><div class="box">FAIL<strong>${fail}</strong></div><div class="box">${sanitationCopy('Awaiting verification','Menunggu verifikasi')}<strong>${pending}</strong></div></div><table><thead><tr><th>${sanitationCopy('Time','Waktu')}</th><th>${sanitationCopy('Task','Tugas')}</th><th>${sanitationCopy('Area / Equipment','Area / Equipment')}</th><th>${sanitationCopy('Chemical / concentration','Bahan kimia / konsentrasi')}</th><th>${sanitationCopy('Result','Hasil')}</th><th>${sanitationCopy('Completed by','Diselesaikan oleh')}</th><th>${sanitationCopy('Corrective action','Tindakan koreksi')}</th><th>${sanitationCopy('Verification','Verifikasi')}</th></tr></thead><tbody>${records.map(r=>`<tr><td>${fmtTime(r.performed_at)}</td><td><b>${esc(r.standard_code_snapshot)}</b><br>${esc(r.standard_name_snapshot)}<br><span class="muted">${esc(r.method_text_snapshot)}</span></td><td>${esc(r.area_name_snapshot)}${r.equipment_code_snapshot?`<br>${esc(r.equipment_code_snapshot)} — ${esc(r.equipment_name_snapshot||'')}`:''}</td><td>${esc(r.chemical_name_snapshot||'—')}<br>${r.concentration_required_snapshot?`${esc(r.measured_concentration??'—')} ${esc(r.concentration_unit_snapshot||'')} (${r.concentration_min_snapshot!=null?'≥'+esc(r.concentration_min_snapshot):''}${r.concentration_min_snapshot!=null&&r.concentration_max_snapshot!=null?' / ':''}${r.concentration_max_snapshot!=null?'≤'+esc(r.concentration_max_snapshot):''})`:'—'}</td><td class="${r.result==='PASS'?'pass':'out'}">${esc(r.result)}${r.failure_reasons?`<br><span class="muted">${esc(r.failure_reasons)}</span>`:''}</td><td>${esc(r.completer?.full_name||r.completer?.email||'Staff')}</td><td>${esc(r.corrective_action||'—')}${r.notes?`<br><span class="muted">${esc(r.notes)}</span>`:''}</td><td>${esc(r.verification_status.replaceAll('_',' '))}${r.verified_at?`<br>${esc(r.verifier?.full_name||r.verifier?.email||'Supervisor')} · ${fmtDateTime(r.verified_at)}${r.verification_notes?`<br>${esc(r.verification_notes)}`:''}`:''}</td></tr>`).join('')}</tbody></table>${Array.from(photosByRecord.entries()).length?`<div class="page-break"><h2>${sanitationCopy('Photo Evidence','Bukti Foto')}</h2>${Array.from(photosByRecord.entries()).map(([id,photos])=>{const r=records.find(x=>x.id===id);return `<h3>${esc(r?.standard_code_snapshot||'')} — ${esc(r?.standard_name_snapshot||'')}</h3><div class="photo-grid">${photos.map(p=>`<div class="photo"><img src="${esc(p.signedUrl)}"><b>${esc(String(p.photo_kind||'evidence').replaceAll('_',' '))}</b><span>${esc(p.original_name||'')}</span></div>`).join('')}</div>`;}).join('')}</div>`:''}<div class="footer">${sanitationCopy('Historical sanitation requirements shown above are snapshots of the property-approved standard used when each record was created.','Persyaratan sanitasi historis di atas merupakan snapshot standar yang disetujui properti pada saat setiap catatan dibuat.')}</div></body></html>`;
  }

  async function generateSanitationPdf(mode='print'){ return runRecordAction('sanitation',mode); }


  async function loadTrainingRecords(){
    const date=$('recordDate')?.value||kitchenDate(); const start=`${date}T00:00:00`; const end=new Date(`${date}T00:00:00`); end.setDate(end.getDate()+1);
    let q=db.from('training_attempts').select('*,training_assessments(code,version,title_en,title_id),profiles!training_attempts_user_id_fkey(full_name,email)').eq('kitchen_id',state.kitchen.id).gte('submitted_at',start).lt('submitted_at',end.toISOString()).order('submitted_at',{ascending:false});
    if(!hasRole('supervisor'))q=q.eq('user_id',state.user.id); const {data,error}=await q;if(error){toast(error.message,'error');return;} const rows=data||[];
    let cq=db.from('training_competencies').select('*').eq('kitchen_id',state.kitchen.id);if(!hasRole('supervisor'))cq=cq.eq('user_id',state.user.id);const cr=await cq;const comps=cr.data||[];
    $('trainingRecordsSummary').innerHTML=`<span><strong>${rows.length}</strong> attempts</span><span><strong>${rows.filter(x=>x.result==='PASS').length}</strong> PASS</span><span><strong>${rows.filter(x=>x.result==='FAIL').length}</strong> FAIL</span>`;
    $('trainingRecordsBody').innerHTML=rows.length?rows.map(r=>{const c=comps.filter(x=>x.assignment_id===r.assignment_id).sort((a,b)=>new Date(b.assessed_at)-new Date(a.assessed_at))[0];return `<tr><td>${fmtTime(r.submitted_at)}</td><td>${esc(r.profiles?.full_name||r.profiles?.email||'Staff')}</td><td>${esc(currentLanguage==='id'?r.training_assessments?.title_id:r.training_assessments?.title_en)}</td><td>${esc(r.training_assessments?.code)} · v${esc(r.training_assessments?.version)}</td><td>${r.language==='id'?'Bahasa Indonesia':'English'}</td><td>${esc(r.attempt_no)}</td><td><strong>${esc(r.score)}%</strong></td><td class="table-status ${r.result==='PASS'?'pass':'out'}">${esc(r.result)}</td><td>${esc(c?.result||'—')}</td></tr>`;}).join(''):'<tr><td colspan="9" class="empty">No training attempts for this date.</td></tr>';
  }

  // ---------------------------------------------------------------------------
  // v3.6 Training, Assessment & Competency
  // ---------------------------------------------------------------------------
  const trText = (en, id) => currentLanguage === 'id' ? (id || en) : en;
  const trainingTitle = a => trText(a?.title_en || '', a?.title_id || '');
  const trainingDescription = a => trText(a?.description_en || '', a?.description_id || '');

  function trainingStatusFor(assignment) {
    const a = assignment.training_assessments || state.trainingAssessments.find(x => x.id === assignment.assessment_id);
    const attempts = state.trainingAttempts.filter(x => x.assignment_id === assignment.id);
    const passed = attempts.find(x => x.result === 'PASS');
    const competency = state.trainingCompetencies.filter(x => x.assignment_id === assignment.id).sort((x,y)=>new Date(y.assessed_at)-new Date(x.assessed_at))[0];
    if (!passed) return { key:'knowledge', label:trText('Knowledge assessment required','Penilaian pengetahuan diperlukan'), tone:'warn', passed:false, competency:null };
    if (a?.practical_required && competency?.result !== 'COMPETENT') return { key:'practical', label:trText('Practical assessment required','Penilaian praktik diperlukan'), tone:'warn', passed:true, competency };
    return { key:'complete', label:trText('COMPETENT / COMPLETE','KOMPETEN / SELESAI'), tone:'good', passed:true, competency };
  }

  async function fetchTrainingCore(managerView=false) {
    let aq = db.from('training_assessments').select('*').eq('kitchen_id',state.kitchen.id).order('code').order('version',{ascending:false});
    if (!managerView) aq = aq.eq('status','published');
    const assignmentSelect = '*,training_assessments(*)' + (managerView ? ',profiles!training_assignments_user_id_fkey(full_name,email)' : '');
    let asq = db.from('training_assignments').select(assignmentSelect).eq('kitchen_id',state.kitchen.id).eq('active',true).order('assigned_at',{ascending:false});
    if (!managerView) asq = asq.eq('user_id',state.user.id);
    let atq = db.from('training_attempts').select('*').eq('kitchen_id',state.kitchen.id).order('submitted_at',{ascending:false});
    if (!managerView && !hasRole('supervisor')) atq = atq.eq('user_id',state.user.id);
    let cq = db.from('training_competencies').select('*').eq('kitchen_id',state.kitchen.id).order('assessed_at',{ascending:false});
    if (!managerView && !hasRole('supervisor')) cq = cq.eq('user_id',state.user.id);
    const [ar,asr,atr,cr] = await Promise.all([aq,asq,atq,cq]);
    for (const r of [ar,asr,atr,cr]) if (r.error) throw r.error;
    state.trainingAssessments=ar.data||[]; state.trainingAssignments=asr.data||[]; state.trainingAttempts=atr.data||[]; state.trainingCompetencies=cr.data||[];
  }

  async function loadTraining() {
    try { await fetchTrainingCore(false); } catch(e){ toast(e.message,'error'); return; }
    const id=currentLanguage==='id';
    $('trainingEyebrow').textContent=id?'PELATIHAN & KOMPETENSI':'TRAINING & COMPETENCY';
    $('trainingTitle').textContent=id?'Pelatihan Saya':'My Training';
    $('trainingDescription').textContent=id?'Selesaikan penilaian pengetahuan yang ditugaskan dan pemeriksaan kompetensi praktik.':'Complete assigned knowledge assessments and practical competency checks.';
    $('trainingAssignedLabel').textContent=id?'Ditugaskan':'Assigned'; $('trainingAssignedSmall').textContent=id?'modul aktif':'active modules';
    $('trainingPassedLabel').textContent=id?'Pengetahuan lulus':'Knowledge passed'; $('trainingCompetentLabel').textContent=id?'Kompeten':'Competent'; $('trainingCompetentSmall').textContent=id?'selesai':'completed';
    $('trainingDueLabel').textContent=id?'Jatuh tempo / Tindakan':'Due / Action'; $('trainingDueSmall').textContent=id?'perlu perhatian':'requires attention';
    $('trainingGuidanceTitle').textContent=id?'Pengetahuan + keterampilan praktik = kompetensi.':'Knowledge + practical skill = competency.';
    $('trainingGuidanceBody').textContent=id?'Penilaian online menguji pengetahuan. Modul operasional juga dapat memerlukan verifikasi praktik oleh supervisor sebelum kompetensi dinyatakan selesai.':'Online assessments test knowledge. Operational modules can also require supervisor practical verification before competency is complete.';
    const items=state.trainingAssignments;
    const statuses=items.map(trainingStatusFor);
    $('trainingAssignedCount').textContent=items.length;
    $('trainingPassedCount').textContent=statuses.filter(x=>x.passed).length;
    $('trainingCompetentCount').textContent=statuses.filter(x=>x.key==='complete').length;
    $('trainingDueCount').textContent=statuses.filter(x=>x.key!=='complete').length;
    $('trainingAssignmentList').innerHTML=items.length?items.map(x=>{
      const a=x.training_assessments||state.trainingAssessments.find(y=>y.id===x.assessment_id)||{}; const st=trainingStatusFor(x);
      const attempts=state.trainingAttempts.filter(y=>y.assignment_id===x.id); const latest=attempts[0]; const remaining=Math.max(0,(a.max_attempts||1)-attempts.length);
      const canStart=!attempts.some(y=>y.result==='PASS') && remaining>0;
      return `<article class="card training-assignment-card"><div class="training-card-top"><div><span class="pill">${esc(a.code||'TRAINING')} · v${esc(a.version||1)}</span><h2>${esc(trainingTitle(a))}</h2><p class="muted">${esc(trainingDescription(a)||'')}</p></div><span class="status-pill ${st.tone}">${esc(st.label)}</span></div><div class="training-card-meta"><span>${id?'Nilai lulus':'Pass mark'} <strong>${esc(a.pass_mark)}%</strong></span><span>${id?'Percobaan':'Attempts'} <strong>${attempts.length}/${esc(a.max_attempts)}</strong></span><span>${id?'Jatuh tempo':'Due'} <strong>${x.due_date?esc(x.due_date):'—'}</strong></span>${latest?`<span>${id?'Hasil terakhir':'Latest'} <strong>${esc(latest.score)}% ${esc(latest.result)}</strong></span>`:''}</div><div class="form-actions">${canStart?`<button class="primary" data-start-training="${esc(x.id)}">${id?'Mulai Penilaian':'Start Assessment'}</button>`:''}${st.key==='practical'?`<span class="muted">${id?'Menunggu penilaian praktik Supervisor.':'Awaiting Supervisor practical assessment.'}</span>`:''}${st.key==='complete'?`<strong class="success-text">✓ ${id?'Pelatihan selesai':'Training complete'}</strong>`:''}</div></article>`;
    }).join(''):`<div class="card empty">${id?'Belum ada pelatihan yang ditugaskan.':'No training has been assigned yet.'}</div>`;
  }

  async function loadTrainingSettings() {
    if(!hasRole('manager')) return;
    try { await fetchTrainingCore(true); if(!state.members.length) await loadTeam(); } catch(e){ toast(e.message,'error'); return; }
    renderTrainingAssessmentList(); renderTrainingMatrix();
    if(state.trainingSelectedAssessmentId) await selectTrainingAssessment(state.trainingSelectedAssessmentId);
  }

  function renderTrainingAssessmentList(){
    const el=$('trainingAssessmentList'); if(!el)return;
    el.innerHTML=state.trainingAssessments.length?state.trainingAssessments.map(a=>`<div class="setting-row training-setting-row"><div><strong>${esc(a.code)} · v${esc(a.version)} — ${esc(trainingTitle(a))}</strong><small>${esc(a.status.toUpperCase())} · Pass ${esc(a.pass_mark)}% · ${esc(a.max_attempts)} attempt(s)${a.practical_required?' · Practical required':''}</small></div><div class="setting-actions"><button class="secondary" data-training-questions="${esc(a.id)}">Questions</button>${a.status==='draft'?`<button class="secondary" data-edit-training-assessment="${esc(a.id)}">Edit</button><button class="primary" data-publish-training="${esc(a.id)}">Publish</button>`:''}${a.status==='published'?`<button class="secondary" data-assign-training="${esc(a.id)}">Assign</button>`:''}</div></div>`).join(''):'<div class="empty">No assessments yet.</div>';
  }

  async function selectTrainingAssessment(id){
    state.trainingSelectedAssessmentId=id; const a=state.trainingAssessments.find(x=>x.id===id); if(!a)return;
    $('trainingQuestionPanelTitle').textContent=`${a.code} · v${a.version} — ${trainingTitle(a)}`;
    $('addTrainingQuestionBtn').classList.toggle('hidden',a.status!=='draft');
    const {data,error}=await db.from('training_questions').select('*').eq('assessment_id',id).order('sequence'); if(error){toast(error.message,'error');return;}
    $('trainingQuestionList').innerHTML=(data||[]).length?(data||[]).map(q=>`<div class="setting-row"><div><strong>${esc(q.sequence)}. ${esc(currentLanguage==='id'?q.prompt_id:q.prompt_en)}</strong><small>${esc(q.question_type)} · ${esc(q.points)} point</small></div>${a.status==='draft'?`<div class="setting-actions"><button class="secondary" data-edit-training-question="${esc(q.id)}">Edit</button><button class="danger secondary" data-delete-training-question="${esc(q.id)}">Delete</button></div>`:''}</div>`).join(''):'<div class="empty">No questions yet.</div>';
  }

  function openTrainingAssessment(id=null){
    const a=id?state.trainingAssessments.find(x=>x.id===id):null;
    $('trainingAssessmentId').value=a?.id||''; $('trainingAssessmentCode').value=a?.code||''; $('trainingAssessmentVersion').value=a?.version||1;
    $('trainingAssessmentTitleEn').value=a?.title_en||''; $('trainingAssessmentTitleId').value=a?.title_id||''; $('trainingAssessmentDescEn').value=a?.description_en||''; $('trainingAssessmentDescId').value=a?.description_id||'';
    $('trainingAssessmentPass').value=a?.pass_mark??80; $('trainingAssessmentAttempts').value=a?.max_attempts??3; $('trainingAssessmentTime').value=a?.time_limit_minutes||''; $('trainingAssessmentValidity').value=a?.validity_months||''; $('trainingAssessmentPractical').checked=!!a?.practical_required;
    $('trainingAssessmentDialogTitle').textContent=a?'Edit Draft Assessment':'New Assessment'; $('trainingAssessmentDialog').showModal();
  }

  async function saveTrainingAssessment(e){
    e.preventDefault(); const id=$('trainingAssessmentId').value; const payload={kitchen_id:state.kitchen.id,code:$('trainingAssessmentCode').value.trim().toUpperCase(),version:Number($('trainingAssessmentVersion').value),title_en:$('trainingAssessmentTitleEn').value.trim(),title_id:$('trainingAssessmentTitleId').value.trim(),description_en:$('trainingAssessmentDescEn').value.trim()||null,description_id:$('trainingAssessmentDescId').value.trim()||null,pass_mark:Number($('trainingAssessmentPass').value),max_attempts:Number($('trainingAssessmentAttempts').value),time_limit_minutes:nullableNumber($('trainingAssessmentTime').value),validity_months:nullableNumber($('trainingAssessmentValidity').value),practical_required:$('trainingAssessmentPractical').checked,updated_at:new Date().toISOString()};
    let res;if(id)res=await db.from('training_assessments').update(payload).eq('id',id); else {payload.created_by=state.user.id;res=await db.from('training_assessments').insert(payload);} if(res.error){toast(res.error.message,'error');return;} $('trainingAssessmentDialog').close(); toast('Assessment draft saved.','good'); await loadTrainingSettings();
  }

  async function openTrainingQuestion(id=null){
    const assessment=state.trainingAssessments.find(x=>x.id===state.trainingSelectedAssessmentId); if(!assessment||assessment.status!=='draft')return;
    let q=null;if(id){const {data,error}=await db.from('training_questions').select('*').eq('id',id).single();if(error){toast(error.message,'error');return;}q=data;}
    $('trainingQuestionId').value=q?.id||'';$('trainingQuestionAssessmentId').value=assessment.id;$('trainingQuestionSequence').value=q?.sequence||(($('trainingQuestionList').children.length||0)+1);$('trainingQuestionType').value=q?.question_type||'mcq';$('trainingQuestionPromptEn').value=q?.prompt_en||'';$('trainingQuestionPromptId').value=q?.prompt_id||'';
    const opts=q?.options||[]; for(const key of ['A','B','C','D']){const o=opts.find(x=>x.key===key)||{};$(`trainingOption${key}En`).value=o.en||'';$(`trainingOption${key}Id`).value=o.id||'';}
    $$('input[name="trainingCorrect"]').forEach(r=>r.checked=(r.value===(q?.correct_key||'A'))); $('trainingQuestionDialog').showModal();
  }

  async function saveTrainingQuestion(e){
    e.preventDefault(); const id=$('trainingQuestionId').value,assessment_id=$('trainingQuestionAssessmentId').value,correct=$('trainingQuestionForm').querySelector('input[name="trainingCorrect"]:checked')?.value; const options=['A','B','C','D'].map(k=>({key:k,en:$(`trainingOption${k}En`).value.trim(),id:$(`trainingOption${k}Id`).value.trim()}));
    const payload={assessment_id,sequence:Number($('trainingQuestionSequence').value),question_type:$('trainingQuestionType').value,prompt_en:$('trainingQuestionPromptEn').value.trim(),prompt_id:$('trainingQuestionPromptId').value.trim(),options,correct_key:correct,points:1}; let res=id?await db.from('training_questions').update(payload).eq('id',id):await db.from('training_questions').insert(payload); if(res.error){toast(res.error.message,'error');return;} $('trainingQuestionDialog').close(); await selectTrainingAssessment(assessment_id); toast('Bilingual question saved.','good');
  }

  async function deleteTrainingQuestion(id){if(!confirm('Delete this draft question?'))return;const {error}=await db.from('training_questions').delete().eq('id',id);if(error){toast(error.message,'error');return;}await selectTrainingAssessment(state.trainingSelectedAssessmentId);}
  async function publishTrainingAssessment(id){if(!confirm('Publish this assessment version? Published questions become locked for historical integrity.'))return;const {error}=await db.rpc('publish_training_assessment',{p_assessment_id:id});if(error){toast(error.message,'error');return;}toast('Assessment published.','good');await loadTrainingSettings();}

  function openTrainingAssign(id){const a=state.trainingAssessments.find(x=>x.id===id);$('trainingAssignAssessmentId').value=id;$('trainingAssignTitle').textContent=`Assign ${trainingTitle(a)}`;$('trainingAssignUser').innerHTML=state.members.map(m=>`<option value="${esc(m.user_id)}">${esc(m.profiles?.full_name||m.profiles?.email||m.user_id)} · ${esc(m.role)}</option>`).join('');$('trainingAssignDue').value='';$('trainingAssignDialog').showModal();}
  async function saveTrainingAssignment(e){e.preventDefault();const payload={kitchen_id:state.kitchen.id,assessment_id:$('trainingAssignAssessmentId').value,user_id:$('trainingAssignUser').value,due_date:$('trainingAssignDue').value||null,assigned_by:state.user.id,active:true};const {error}=await db.from('training_assignments').upsert(payload,{onConflict:'assessment_id,user_id'});if(error){toast(error.message,'error');return;}$('trainingAssignDialog').close();toast('Training assigned.','good');await loadTrainingSettings();}

  function renderTrainingMatrix(){
    const body=$('trainingMatrixBody');if(!body)return; body.innerHTML=state.trainingAssignments.length?state.trainingAssignments.map(x=>{const a=x.training_assessments||state.trainingAssessments.find(y=>y.id===x.assessment_id)||{};const st=trainingStatusFor(x);const attempts=state.trainingAttempts.filter(y=>y.assignment_id===x.id);const pass=attempts.find(y=>y.result==='PASS');const comp=state.trainingCompetencies.filter(y=>y.assignment_id===x.id).sort((m,n)=>new Date(n.assessed_at)-new Date(m.assessed_at))[0];const person=x.profiles?.full_name||x.profiles?.email||x.user_id;return `<tr><td>${esc(person)}</td><td>${esc(a.code)} · v${esc(a.version)}<br><small>${esc(trainingTitle(a))}</small></td><td>${pass?`<strong class="success-text">${esc(pass.score)}% PASS</strong>`:(attempts[0]?`${esc(attempts[0].score)}% FAIL`:'Not taken')}</td><td>${a.practical_required?(comp?esc(comp.result):(pass?'Awaiting':'—')):'Not required'}</td><td><span class="status-pill ${st.tone}">${esc(st.key==='complete'?'COMPLETE':'IN PROGRESS')}</span></td><td>${x.due_date?esc(x.due_date):'—'}</td><td>${a.practical_required&&pass&&hasRole('supervisor')?`<button class="secondary" data-assess-competency="${esc(x.id)}">Assess practical</button>`:'—'}</td></tr>`;}).join(''):'<tr><td colspan="7" class="empty">No training assignments yet.</td></tr>';
  }

  function openTrainingCompetency(assignmentId){const x=state.trainingAssignments.find(y=>y.id===assignmentId);const a=x?.training_assessments||state.trainingAssessments.find(y=>y.id===x?.assessment_id);$('trainingCompetencyAssignmentId').value=assignmentId;$('trainingCompetencyTitle').textContent=`${trainingTitle(a)} — Practical Competency`;$$('[data-training-criterion]').forEach(c=>c.checked=false);$('trainingCompetencyResult').value='COMPETENT';$('trainingCompetencyNotes').value='';$('trainingCompetencyDialog').showModal();}
  async function saveTrainingCompetency(e){e.preventDefault();const criteria=$$('[data-training-criterion]').map(c=>({criterion:c.value,met:c.checked}));const {error}=await db.rpc('save_training_competency',{p_assignment_id:$('trainingCompetencyAssignmentId').value,p_result:$('trainingCompetencyResult').value,p_criteria:criteria,p_notes:$('trainingCompetencyNotes').value.trim()||null});if(error){toast(error.message,'error');return;}$('trainingCompetencyDialog').close();toast('Practical competency recorded.','good');await loadTrainingSettings();}

  async function startTrainingExam(assignmentId){
    const assignment=state.trainingAssignments.find(x=>x.id===assignmentId);const assessment=assignment?.training_assessments||state.trainingAssessments.find(x=>x.id===assignment?.assessment_id);if(!assessment)return;
    const {data,error}=await db.rpc('get_training_assessment_questions',{p_assignment_id:assignmentId});if(error){toast(error.message,'error');return;}if(!data?.length){toast('Assessment has no questions.','error');return;}
    state.trainingExam={assignment,assessment,questions:data,index:0,answers:{},startedAt:new Date(),timer:null};renderTrainingExam();$('trainingExamDialog').showModal(); if(assessment.time_limit_minutes){const end=Date.now()+Number(assessment.time_limit_minutes)*60000;state.trainingExam.timer=setInterval(()=>{const left=Math.max(0,Math.floor((end-Date.now())/1000));$('trainingExamTimer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;if(left<=0){clearInterval(state.trainingExam.timer);submitTrainingExam(true);}},1000);}
  }

  function renderTrainingExam(){const ex=state.trainingExam;if(!ex)return;const q=ex.questions[ex.index],id=currentLanguage==='id';$('trainingExamEyebrow').textContent=id?'PENILAIAN ONLINE':'ONLINE ASSESSMENT';$('trainingExamTitle').textContent=trainingTitle(ex.assessment);$('trainingExamProgress').textContent=`${id?'Pertanyaan':'Question'} ${ex.index+1} ${id?'dari':'of'} ${ex.questions.length}`;const prompt=id?q.prompt_id:q.prompt_en;const opts=q.options||[];$('trainingExamQuestion').innerHTML=`<div class="training-question-type">${esc(q.question_type.replace('_',' ').toUpperCase())}</div><h3>${esc(prompt)}</h3><div class="training-answer-list">${opts.map(o=>`<label class="training-answer-option"><input type="radio" name="trainingExamAnswer" value="${esc(o.key)}" ${ex.answers[q.question_id]===o.key?'checked':''}><span><b>${esc(o.key)}.</b> ${esc(id?o.id:o.en)}</span></label>`).join('')}</div>`;$('trainingExamPrevious').disabled=ex.index===0;$('trainingExamNext').classList.toggle('hidden',ex.index===ex.questions.length-1);$('trainingExamSubmit').classList.toggle('hidden',ex.index!==ex.questions.length-1);$('trainingExamPrevious').textContent=id?'Sebelumnya':'Previous';$('trainingExamNext').textContent=id?'Berikutnya':'Next';$('trainingExamSubmit').textContent=id?'Kirim Penilaian':'Submit Assessment';$('trainingExamExit').textContent=id?'Keluar':'Exit';}
  function captureTrainingAnswer(){const ex=state.trainingExam;if(!ex)return;const q=ex.questions[ex.index],sel=$('trainingExamQuestion').querySelector('input[name="trainingExamAnswer"]:checked');if(sel)ex.answers[q.question_id]=sel.value;}
  function moveTrainingExam(delta){captureTrainingAnswer();state.trainingExam.index=Math.max(0,Math.min(state.trainingExam.questions.length-1,state.trainingExam.index+delta));renderTrainingExam();}
  async function submitTrainingExam(force=false){const ex=state.trainingExam;if(!ex)return;captureTrainingAnswer();const unanswered=ex.questions.filter(q=>!ex.answers[q.question_id]).length;if(unanswered&&!force&&!confirm(`${unanswered} question(s) unanswered. Submit anyway?`))return;if(!force&&!confirm(currentLanguage==='id'?'Kirim jawaban Anda sekarang?':'Submit your answers now?'))return;if(ex.timer)clearInterval(ex.timer);const answers=ex.questions.map(q=>({question_id:q.question_id,selected_key:ex.answers[q.question_id]||''}));const {data,error}=await db.rpc('submit_training_attempt',{p_assignment_id:ex.assignment.id,p_language:currentLanguage,p_started_at:ex.startedAt.toISOString(),p_answers:answers});if(error){toast(error.message,'error');return;}$('trainingExamDialog').close();state.trainingExam=null;await loadTraining();const attemptRes=await db.from('training_attempts').select('score,result').eq('id',data).single();if(attemptRes.error){toast('Assessment submitted.','good');return;}const r=attemptRes.data;alert(currentLanguage==='id'?`Hasil Penilaian

Nilai: ${r.score}%
${r.result==='PASS'?'LULUS':'BELUM LULUS'}`:`Assessment Result

Score: ${r.score}%
${r.result}`);}



  // v3.8 — Allergen Management & Menu Allergen Matrix
  const allergenCopy = (en, id) => currentLanguage === 'id' ? id : en;
  const allergenName = a => currentLanguage === 'id' ? (a?.name_id || a?.allergen_name_id_snapshot || a?.name_en || '') : (a?.name_en || a?.allergen_name_en_snapshot || a?.name_id || '');
  function allergenResultMeta(result) {
    if (result === 'DECLARED_CONTAINS') return { cls:'out', short:allergenCopy('DECLARED CONTAINS','MENGANDUNG'), text:allergenCopy('Declared allergen match. Do not treat this menu item as suitable for the reported allergy.','Alergen dinyatakan pada profil. Jangan menganggap item ini sesuai untuk alergi yang diinformasikan.') };
    if (result === 'CROSS_CONTACT_RISK') return { cls:'warn', short:allergenCopy('CROSS-CONTACT RISK','RISIKO KONTAK SILANG'), text:allergenCopy('Cross-contact risk is declared. Follow the property allergen procedure before service.','Risiko kontak silang dinyatakan. Ikuti prosedur alergen properti sebelum pelayanan.') };
    return { cls:'good', short:allergenCopy('NO DECLARED MATCH','TIDAK ADA KECOCOKAN DINYATAKAN'), text:allergenCopy('No declared match in this approved profile. This is not an allergen-free guarantee; complete the property procedure before service.','Tidak ada kecocokan yang dinyatakan pada profil yang disetujui. Ini bukan jaminan bebas alergen; selesaikan prosedur properti sebelum pelayanan.') };
  }
  async function fetchAllergenLibrary(includeInactive=false) {
    let q=db.from('allergen_library').select('*').eq('kitchen_id',state.kitchen.id).order('sort_order').order('name_en');
    if(!includeInactive) q=q.eq('active',true);
    const {data,error}=await q; if(error) throw error; return data||[];
  }
  async function fetchAllergenProfiles(includeAll=false) {
    let q=db.from('allergen_menu_profiles').select('*,allergen_menu_profile_entries(*)').eq('kitchen_id',state.kitchen.id).order('menu_code').order('version_no',{ascending:false});
    if(!includeAll) q=q.eq('status','published');
    const {data,error}=await q; if(error) throw error; return data||[];
  }
  async function fetchAllergenChecksForDate(date) {
    const {data,error}=await db.from('allergen_guest_checks').select('*,checker:profiles!allergen_guest_checks_checked_by_fkey(full_name,email)').eq('kitchen_id',state.kitchen.id).eq('record_date',date).order('checked_at',{ascending:false});
    if(error) throw error; return data||[];
  }
  function currentPublishedAllergenProfiles(rows) {
    return (rows||[]).filter(p=>p.status==='published').sort((a,b)=>String(a.menu_name||'').localeCompare(String(b.menu_name||'')));
  }
  function profileEntryRelationship(profile, allergenId) { return profile?.allergen_menu_profile_entries?.find(e=>e.allergen_id===allergenId)?.relationship || 'none'; }
  function evaluateAllergenSelection(profile, ids) {
    const entries=profile?.allergen_menu_profile_entries||[];
    if(entries.some(e=>ids.includes(e.allergen_id)&&e.relationship==='contains')) return 'DECLARED_CONTAINS';
    if(entries.some(e=>ids.includes(e.allergen_id)&&e.relationship==='cross_contact')) return 'CROSS_CONTACT_RISK';
    return 'NO_DECLARED_MATCH';
  }
  function selectedAllergenCheckIds() { return $$('[data-allergen-check-id]:checked').map(x=>x.dataset.allergenCheckId); }
  function renderAllergenCheckInputs() {
    const wrap=$('allergenCheckAllergens'); if(!wrap)return;
    wrap.innerHTML=state.allergens.length?state.allergens.map(a=>`<label class="allergen-chip"><input type="checkbox" data-allergen-check-id="${esc(a.id)}"><span>${esc(allergenName(a))}</span></label>`).join(''):`<div class="empty">${allergenCopy('No active allergens configured.','Belum ada alergen aktif yang dikonfigurasi.')}</div>`;
    const select=$('allergenCheckMenu'); const current=select?.value||'';
    if(select){ select.innerHTML=`<option value="">${allergenCopy('Select menu item','Pilih item menu')}</option>`+state.allergenProfiles.map(p=>`<option value="${esc(p.id)}">${esc(p.menu_code)} — ${esc(p.menu_name)} · v${Number(p.version_no||1)}</option>`).join(''); if(state.allergenProfiles.some(p=>p.id===current))select.value=current; }
  }
  function updateAllergenCheckPreview() {
    const box=$('allergenCheckPreview'); if(!box)return;
    const ids=selectedAllergenCheckIds(); const profile=state.allergenProfiles.find(p=>p.id===$('allergenCheckMenu')?.value);
    if(!ids.length||!profile){box.className='allergen-result-preview neutral';box.textContent=t('allergen.selectPrompt');return;}
    const result=evaluateAllergenSelection(profile,ids), meta=allergenResultMeta(result);
    const hits=(profile.allergen_menu_profile_entries||[]).filter(e=>ids.includes(e.allergen_id)).map(e=>`${allergenName(e)} (${e.relationship==='contains'?allergenCopy('Contains','Mengandung'):allergenCopy('Cross-contact','Kontak silang')})`);
    box.className=`allergen-result-preview ${meta.cls}`; box.innerHTML=`<strong>${esc(meta.short)}</strong><span>${esc(meta.text)}</span>${hits.length?`<small>${hits.map(esc).join(' · ')}</small>`:''}`;
  }
  function renderAllergenRecent() {
    const rows=state.allergenChecks||[]; $('allergenRecentCount').textContent=rows.length;
    $('allergenRecentChecks').innerHTML=rows.length?rows.slice(0,8).map(r=>{const m=allergenResultMeta(r.result), p=r.menu_profile_snapshot||{}, req=Array.isArray(r.requested_allergens_snapshot)?r.requested_allergens_snapshot:[]; return `<div class="allergen-recent-row"><div><strong>${esc(p.menu_name||'Menu')}</strong><small>${esc(fmtTime(r.checked_at))} · ${req.map(allergenName).map(esc).join(', ')||'—'}${r.order_reference?` · ${esc(r.order_reference)}`:''}</small></div><span class="status-pill ${m.cls==='good'?'good':m.cls==='warn'?'warn':'danger'}">${esc(m.short)}</span></div>`}).join(''):`<div class="empty">${allergenCopy('No allergen checks recorded today.','Belum ada pemeriksaan alergen hari ini.')}</div>`;
  }
  function allergenMatrixFilteredProfiles() {
    const search=($('allergenMatrixSearch')?.value||'').trim().toLowerCase(), cat=$('allergenMatrixCategory')?.value||'all', outlet=$('allergenMatrixOutlet')?.value||'all';
    return state.allergenProfiles.filter(p=>(!search||`${p.menu_code} ${p.menu_name} ${p.category||''} ${p.outlet||''}`.toLowerCase().includes(search))&&(cat==='all'||(p.category||'')===cat)&&(outlet==='all'||(p.outlet||'')===outlet));
  }
  function renderAllergenMatrixFilters() {
    const cats=[...new Set(state.allergenProfiles.map(p=>p.category).filter(Boolean))].sort(), outs=[...new Set(state.allergenProfiles.map(p=>p.outlet).filter(Boolean))].sort();
    const c=$('allergenMatrixCategory'),o=$('allergenMatrixOutlet'); if(c){const v=c.value;c.innerHTML=`<option value="all">${allergenCopy('All','Semua')}</option>`+cats.map(x=>`<option>${esc(x)}</option>`).join('');c.value=cats.includes(v)?v:'all';} if(o){const v=o.value;o.innerHTML=`<option value="all">${allergenCopy('All','Semua')}</option>`+outs.map(x=>`<option>${esc(x)}</option>`).join('');o.value=outs.includes(v)?v:'all';}
  }
  function renderAllergenMatrix() {
    const head=$('allergenMatrixHead'),body=$('allergenMatrixBody'); if(!head||!body)return;
    head.innerHTML=`<tr><th>${allergenCopy('Menu item','Item menu')}</th><th>${allergenCopy('Category / Outlet','Kategori / Outlet')}</th>${state.allergens.map(a=>`<th title="${esc(allergenName(a))}">${esc(allergenName(a))}</th>`).join('')}<th>${allergenCopy('Review','Tinjau')}</th></tr>`;
    const rows=allergenMatrixFilteredProfiles();
    body.innerHTML=rows.length?rows.map(p=>`<tr><td><b>${esc(p.menu_code)} — ${esc(p.menu_name)}</b><br><span class="muted">v${Number(p.version_no||1)} · ${p.published_at?esc(fmtDateTime(p.published_at)):''}</span></td><td>${esc(p.category||'—')}<br><span class="muted">${esc(p.outlet||'—')}</span></td>${state.allergens.map(a=>{const rel=profileEntryRelationship(p,a.id);return `<td class="allergen-matrix-cell ${rel==='contains'?'contains':rel==='cross_contact'?'cross':''}" title="${esc(allergenName(a))}: ${esc(rel)}">${rel==='contains'?'C':rel==='cross_contact'?'X':'—'}</td>`}).join('')}<td>${esc(p.review_due_date||'—')}</td></tr>`).join(''):`<tr><td colspan="${state.allergens.length+3}" class="empty">${allergenCopy('No published menu allergen profiles.','Belum ada profil alergen menu yang dipublikasikan.')}</td></tr>`;
  }
  async function loadAllergenControl() {
    try{
      const date=kitchenDate(); const [allergens,profiles,checks]=await Promise.all([fetchAllergenLibrary(false),fetchAllergenProfiles(false),fetchAllergenChecksForDate(date)]); state.allergens=allergens; state.allergenProfiles=currentPublishedAllergenProfiles(profiles); state.allergenChecks=checks;
      $('allergenMenuCount').textContent=state.allergenProfiles.length; $('allergenLibraryCount').textContent=allergens.length; $('allergenChecksTodayCount').textContent=checks.length; $('allergenReviewDueCount').textContent=state.allergenProfiles.filter(p=>p.review_due_date&&p.review_due_date<=date).length;
      renderAllergenCheckInputs(); renderAllergenRecent(); renderAllergenMatrixFilters(); renderAllergenMatrix(); updateAllergenCheckPreview();
    }catch(error){console.error(error);toast(error.message,'error');}
  }
  async function saveAllergenGuestCheck(event) {
    event.preventDefault(); const ids=selectedAllergenCheckIds(), profileId=$('allergenCheckMenu').value;
    if(!ids.length){toast(allergenCopy('Select at least one allergen.','Pilih minimal satu alergen.'),'error');return;} if(!profileId){toast(allergenCopy('Select a menu item.','Pilih item menu.'),'error');return;}
    const {error}=await db.rpc('record_allergen_guest_check',{p_kitchen_id:state.kitchen.id,p_menu_profile_id:profileId,p_requested_allergen_ids:ids,p_order_reference:$('allergenCheckOrderRef').value.trim()||null,p_service_location:$('allergenCheckLocation').value.trim()||null,p_notes:$('allergenCheckNotes').value.trim()||null});
    if(error){toast(error.message,'error');return;} toast(allergenCopy('Allergen check recorded.','Pemeriksaan alergen tersimpan.'),'good'); $('allergenCheckOrderRef').value=''; $('allergenCheckNotes').value=''; $$('[data-allergen-check-id]').forEach(x=>x.checked=false); await loadAllergenControl();
  }
  function resetAllergenLibraryForm(){ $('allergenLibraryId').value=''; $('allergenLibraryForm').reset(); $('allergenLibrarySort').value='100'; $('allergenLibraryCancel').classList.add('hidden'); }
  function editAllergenLibrary(id){const a=state.allergens.find(x=>x.id===id);if(!a)return;$('allergenLibraryId').value=a.id;$('allergenLibraryCode').value=a.code;$('allergenLibraryNameEn').value=a.name_en;$('allergenLibraryNameId').value=a.name_id;$('allergenLibrarySort').value=a.sort_order??100;$('allergenLibraryNotes').value=a.notes||'';$('allergenLibraryCancel').classList.remove('hidden');$('allergenLibraryCode').focus();}
  async function saveAllergenLibrary(event){event.preventDefault();const id=$('allergenLibraryId').value,payload={kitchen_id:state.kitchen.id,code:$('allergenLibraryCode').value.trim().toUpperCase(),name_en:$('allergenLibraryNameEn').value.trim(),name_id:$('allergenLibraryNameId').value.trim(),sort_order:Number($('allergenLibrarySort').value||100),notes:$('allergenLibraryNotes').value.trim()||null,active:true}; const q=id?db.from('allergen_library').update(payload).eq('id',id):db.from('allergen_library').insert(payload);const {error}=await q;if(error){toast(error.message,'error');return;}resetAllergenLibraryForm();toast(allergenCopy('Allergen saved.','Alergen tersimpan.'),'good');await loadAllergenSettings();}
  async function toggleAllergenLibrary(id){const a=state.allergens.find(x=>x.id===id);if(!a)return;const {error}=await db.from('allergen_library').update({active:!a.active}).eq('id',id);if(error){toast(error.message,'error');return;}await loadAllergenSettings();}
  function renderAllergenLibraryList(){ $('allergenSettingsCount').textContent=state.allergens.filter(a=>a.active).length; $('allergenLibraryList').innerHTML=state.allergens.length?state.allergens.map(a=>`<div class="setting-row ${a.active?'':'inactive'}"><div><div class="setting-row-title"><strong>${esc(a.code)} — ${esc(a.name_en)} / ${esc(a.name_id)}</strong><span class="pill">${a.active?'ACTIVE':'INACTIVE'}</span></div><small>${esc(a.notes||'')}</small></div><div class="setting-actions"><button class="secondary compact-btn" type="button" data-edit-allergen="${esc(a.id)}">Edit</button><button class="secondary compact-btn" type="button" data-toggle-allergen="${esc(a.id)}">${a.active?'Archive':'Restore'}</button></div></div>`).join(''):'<div class="empty">No allergens configured.</div>'; }
  function resetAllergenProfileForm(){ $('allergenProfileId').value=''; $('allergenProfileForm').reset(); $('allergenProfileVersionInfo').classList.add('hidden'); $('allergenProfileEditorTitle').textContent=t('allergen.newProfile'); $('allergenProfileCancel').classList.add('hidden'); renderAllergenProfileGrid(null); }
  function renderAllergenProfileGrid(profile){const map=new Map((profile?.allergen_menu_profile_entries||[]).map(e=>[e.allergen_id,e.relationship]));$('allergenProfileAllergenGrid').innerHTML=state.allergens.filter(a=>a.active||map.has(a.id)).map(a=>`<div class="allergen-profile-row"><div><strong>${esc(a.name_en)}</strong><small>${esc(a.name_id)} · ${esc(a.code)}</small></div><select data-allergen-profile-id="${esc(a.id)}"><option value="none">${allergenCopy('None declared','Tidak dinyatakan')}</option><option value="contains" ${map.get(a.id)==='contains'?'selected':''}>${allergenCopy('Contains','Mengandung')}</option><option value="cross_contact" ${map.get(a.id)==='cross_contact'?'selected':''}>${allergenCopy('Cross-contact risk','Risiko kontak silang')}</option></select></div>`).join('');}
  function editAllergenProfile(id){const p=state.allergenProfiles.find(x=>x.id===id);if(!p||p.status!=='draft')return;$('allergenProfileId').value=p.id;$('allergenProfileCode').value=p.menu_code;$('allergenProfileName').value=p.menu_name;$('allergenProfileCategory').value=p.category||'';$('allergenProfileOutlet').value=p.outlet||'';$('allergenProfileIngredients').value=p.ingredients_text||'';$('allergenProfileHandling').value=p.handling_notes||'';$('allergenProfileReviewDue').value=p.review_due_date||'';$('allergenProfileVersionInfo').textContent=`${p.menu_code} · v${p.version_no} · DRAFT`;$('allergenProfileVersionInfo').classList.remove('hidden');$('allergenProfileEditorTitle').textContent=allergenCopy('Edit Draft Profile','Edit Profil Draft');$('allergenProfileCancel').classList.remove('hidden');renderAllergenProfileGrid(p);window.scrollTo({top:$('page-allergen-settings').offsetTop,behavior:'smooth'});}
  async function saveAllergenProfile(event){event.preventDefault();const id=$('allergenProfileId').value;let profileId=id;const code=$('allergenProfileCode').value.trim().toUpperCase();const payload={kitchen_id:state.kitchen.id,menu_code:code,menu_name:$('allergenProfileName').value.trim(),category:$('allergenProfileCategory').value.trim()||null,outlet:$('allergenProfileOutlet').value.trim()||null,ingredients_text:$('allergenProfileIngredients').value.trim()||null,handling_notes:$('allergenProfileHandling').value.trim()||null,review_due_date:$('allergenProfileReviewDue').value||null};
    if(id){const {error}=await db.from('allergen_menu_profiles').update(payload).eq('id',id).eq('status','draft');if(error){toast(error.message,'error');return;}}else{const existing=state.allergenProfiles.filter(p=>p.menu_code===code),version=existing.length?Math.max(...existing.map(p=>Number(p.version_no||1)))+1:1;if(existing.some(p=>p.status==='draft')){toast(allergenCopy('A draft already exists for this menu code.','Draft untuk kode menu ini sudah ada.'),'error');return;}const {data,error}=await db.from('allergen_menu_profiles').insert({...payload,version_no:version,status:'draft',created_by:state.user.id}).select('id').single();if(error){toast(error.message,'error');return;}profileId=data.id;}
    const {error:delErr}=await db.from('allergen_menu_profile_entries').delete().eq('profile_id',profileId);if(delErr){toast(delErr.message,'error');return;}const entries=$$('[data-allergen-profile-id]').map(el=>({allergen_id:el.dataset.allergenProfileId,relationship:el.value})).filter(x=>x.relationship!=='none').map(x=>({kitchen_id:state.kitchen.id,profile_id:profileId,allergen_id:x.allergen_id,relationship:x.relationship,allergen_code_snapshot:'',allergen_name_en_snapshot:'',allergen_name_id_snapshot:''}));if(entries.length){const {error}=await db.from('allergen_menu_profile_entries').insert(entries);if(error){toast(error.message,'error');return;}}
    toast(allergenCopy('Draft menu allergen profile saved.','Draft profil alergen menu tersimpan.'),'good');await loadAllergenSettings();editAllergenProfile(profileId);
  }
  async function publishAllergenProfile(id){if(!confirm(allergenCopy('Publish this allergen profile? Published content is locked; later changes require a new revision.','Publikasikan profil alergen ini? Konten yang sudah dipublikasikan akan dikunci; perubahan berikutnya memerlukan revisi baru.')))return;const {error}=await db.rpc('publish_allergen_menu_profile',{p_profile_id:id});if(error){toast(error.message,'error');return;}toast(allergenCopy('Menu allergen profile published.','Profil alergen menu dipublikasikan.'),'good');resetAllergenProfileForm();await loadAllergenSettings();}
  async function reviseAllergenProfile(id){const {data,error}=await db.rpc('create_allergen_profile_revision',{p_profile_id:id});if(error){toast(error.message,'error');return;}await loadAllergenSettings();editAllergenProfile(data);}
  function renderAllergenProfileList(){const rows=state.allergenProfiles;$('allergenProfileCount').textContent=rows.length;$('allergenProfileList').innerHTML=rows.length?rows.map(p=>{const entries=p.allergen_menu_profile_entries||[],contains=entries.filter(e=>e.relationship==='contains').map(allergenName),cross=entries.filter(e=>e.relationship==='cross_contact').map(allergenName);return `<div class="setting-row allergen-profile-list-row ${p.status==='retired'?'inactive':''}"><div><div class="setting-row-title"><strong>${esc(p.menu_code)} — ${esc(p.menu_name)}</strong><span class="pill">v${Number(p.version_no||1)} · ${esc(p.status.toUpperCase())}</span></div><small>${esc(p.category||'—')} · ${esc(p.outlet||'—')}${p.review_due_date?` · ${allergenCopy('Review','Tinjau')} ${esc(p.review_due_date)}`:''}</small><div class="allergen-profile-summary"><span><b>C</b> ${contains.length?contains.map(esc).join(', '):'—'}</span><span><b>X</b> ${cross.length?cross.map(esc).join(', '):'—'}</span></div></div><div class="setting-actions">${p.status==='draft'?`<button class="secondary compact-btn" type="button" data-edit-allergen-profile="${esc(p.id)}">${allergenCopy('Edit Draft','Edit Draft')}</button><button class="primary compact-btn" type="button" data-publish-allergen-profile="${esc(p.id)}">${allergenCopy('Publish','Publikasikan')}</button>`:p.status==='published'?`<button class="secondary compact-btn" type="button" data-revise-allergen-profile="${esc(p.id)}">${allergenCopy('New Revision','Revisi Baru')}</button>`:''}</div></div>`}).join(''):'<div class="empty">No menu allergen profiles yet.</div>';}
  async function loadAllergenSettings(){try{const [allergens,profiles]=await Promise.all([fetchAllergenLibrary(true),fetchAllergenProfiles(true)]);state.allergens=allergens;state.allergenProfiles=profiles;renderAllergenLibraryList();renderAllergenProfileList();if(!$('allergenProfileId').value)renderAllergenProfileGrid(null);}catch(error){console.error(error);toast(error.message,'error');}}
  async function loadAllergenRecords(){const date=$('recordDate').value||kitchenDate();let rows=await fetchAllergenChecksForDate(date);const status=$('allergenRecordStatus')?.value||'all',search=($('allergenRecordSearch')?.value||'').trim().toLowerCase();rows=rows.filter(r=>(status==='all'||r.result===status)&&(!search||`${r.menu_profile_snapshot?.menu_name||''} ${r.menu_profile_snapshot?.menu_code||''} ${r.order_reference||''} ${r.service_location||''}`.toLowerCase().includes(search)));$('allergenRecordsBody').innerHTML=rows.length?rows.map(r=>{const m=allergenResultMeta(r.result),req=Array.isArray(r.requested_allergens_snapshot)?r.requested_allergens_snapshot:[],p=r.menu_profile_snapshot||{};return `<tr><td>${esc(fmtTime(r.checked_at))}</td><td><b>${esc(p.menu_code||'')} — ${esc(p.menu_name||'')}</b><br><span class="muted">v${esc(p.version_no||'—')}</span></td><td>${req.map(allergenName).map(esc).join(', ')||'—'}</td><td class="table-status ${r.result==='DECLARED_CONTAINS'?'out':r.result==='CROSS_CONTACT_RISK'?'warn':'pass'}">${esc(m.short)}</td><td>${esc(r.order_reference||'—')}<br><span class="muted">${esc(r.service_location||'')}</span></td><td>${esc(r.checker?.full_name||r.checker?.email||'Staff')}</td><td>${esc(r.notes||'—')}</td></tr>`}).join(''):`<tr><td colspan="7" class="empty">${t('records.noRecords')}</td></tr>`;}
  async function buildAllergenRecordReportHtml(date){const [records,propertyRes]=await Promise.all([fetchAllergenChecksForDate(date),db.from('property_settings').select('*').eq('kitchen_id',state.kitchen.id).maybeSingle()]);if(propertyRes.error)throw propertyRes.error;const p=propertyRes.data||{},generatedAt=new Date().toLocaleString(currentLanguage==='id'?'id-ID':'en-GB'),logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}">`:'';return `<!doctype html><html><head><meta charset="utf-8"><title>Allergen Checks ${esc(date)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:9px}.property-head{display:flex;gap:14px;align-items:center;border-bottom:2px solid #111;padding-bottom:9px}.property-logo{max-width:95px;max-height:52px}.property-name{font-size:16px;font-weight:800}.head{display:flex;justify-content:space-between;align-items:end;margin:10px 0}.meta{text-align:right;line-height:1.5}h1{font-size:19px;margin:2px 0}.eyebrow{font-size:7px;letter-spacing:.14em;color:#666;font-weight:bold}table{width:100%;border-collapse:collapse}th,td{padding:6px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{font-size:7px;text-transform:uppercase;color:#666}.out{font-weight:bold;color:#991b1b}.warn{font-weight:bold;color:#92400e}.pass{font-weight:bold;color:#14532d}.footer{margin-top:14px;border-top:1px solid #ddd;padding-top:7px;color:#666;font-size:7.5px}</style></head><body>${p.property_name||p.logo_data_url?`<div class="property-head">${logo}<div><div class="property-name">${esc(p.property_name||'')}</div><div>${esc(p.address||'')}</div></div></div>`:''}<div class="head"><div><div class="eyebrow">${allergenCopy('GUEST ALLERGEN CHECK RECORD','CATATAN PEMERIKSAAN ALERGEN TAMU')}</div><h1>${esc(state.kitchen.name)}</h1></div><div class="meta"><b>${allergenCopy('Date','Tanggal')}:</b> ${esc(date)}<br><b>${allergenCopy('Generated','Dibuat')}:</b> ${esc(generatedAt)}</div></div><table><thead><tr><th>Time</th><th>Menu / version</th><th>Requested allergens</th><th>Result</th><th>Order / location</th><th>Checked by</th><th>Notes</th></tr></thead><tbody>${records.length?records.map(r=>{const m=allergenResultMeta(r.result),req=Array.isArray(r.requested_allergens_snapshot)?r.requested_allergens_snapshot:[],pr=r.menu_profile_snapshot||{};return `<tr><td>${esc(fmtTime(r.checked_at))}</td><td><b>${esc(pr.menu_code||'')} — ${esc(pr.menu_name||'')}</b><br>v${esc(pr.version_no||'—')}</td><td>${req.map(allergenName).map(esc).join(', ')}</td><td class="${m.cls==='out'?'out':m.cls==='warn'?'warn':'pass'}">${esc(m.short)}</td><td>${esc(r.order_reference||'—')}<br>${esc(r.service_location||'')}</td><td>${esc(r.checker?.full_name||r.checker?.email||'Staff')}</td><td>${esc(r.notes||'—')}</td></tr>`}).join(''):'<tr><td colspan="7">No records.</td></tr>'}</tbody></table><div class="footer">${allergenCopy('This record documents the approved menu allergen profile checked at the time. “No declared match” is not a guarantee of an allergen-free meal. Follow the property allergen procedure, ingredient specifications and cross-contact controls.','Catatan ini mendokumentasikan profil alergen menu yang disetujui pada saat pemeriksaan. “Tidak ada kecocokan yang dinyatakan” bukan jaminan makanan bebas alergen. Ikuti prosedur alergen properti, spesifikasi bahan, dan kontrol kontak silang.')}</div></body></html>`;}
  async function buildAllergenMatrixReportHtml(){const [allergens,profiles,propertyRes]=await Promise.all([fetchAllergenLibrary(false),fetchAllergenProfiles(false),db.from('property_settings').select('*').eq('kitchen_id',state.kitchen.id).maybeSingle()]);if(propertyRes.error)throw propertyRes.error;const p=propertyRes.data||{},rows=currentPublishedAllergenProfiles(profiles),generatedAt=new Date().toLocaleString(currentLanguage==='id'?'id-ID':'en-GB'),logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}">`:'';return `<!doctype html><html><head><meta charset="utf-8"><title>Menu Allergen Matrix</title><style>@page{size:A4 landscape;margin:8mm}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:8px}.property-head{display:flex;gap:12px;align-items:center;border-bottom:2px solid #111;padding-bottom:8px}.property-logo{max-width:90px;max-height:48px}.property-name{font-size:15px;font-weight:bold}.head{display:flex;justify-content:space-between;align-items:end;margin:9px 0}.eyebrow{font-size:7px;letter-spacing:.14em;color:#666;font-weight:bold}h1{font-size:18px;margin:2px 0}.meta{text-align:right}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1px solid #ddd;padding:4px;text-align:center;vertical-align:middle}th{font-size:6.5px;color:#555}.menu{text-align:left;min-width:130px}.c{font-weight:bold;background:#fee2e2}.x{font-weight:bold;background:#fef3c7}.footer{margin-top:10px;font-size:7px;color:#666}</style></head><body>${p.property_name||p.logo_data_url?`<div class="property-head">${logo}<div><div class="property-name">${esc(p.property_name||'')}</div><div>${esc(p.address||'')}</div></div></div>`:''}<div class="head"><div><div class="eyebrow">${allergenCopy('MENU ALLERGEN MATRIX','MATRIKS ALERGEN MENU')}</div><h1>${esc(state.kitchen.name)}</h1></div><div class="meta">${esc(generatedAt)}</div></div><table><thead><tr><th class="menu">Menu item</th><th>Category / Outlet</th>${allergens.map(a=>`<th>${esc(allergenName(a))}</th>`).join('')}<th>Profile</th></tr></thead><tbody>${rows.map(pr=>`<tr><td class="menu"><b>${esc(pr.menu_code)} — ${esc(pr.menu_name)}</b></td><td>${esc(pr.category||'—')}<br>${esc(pr.outlet||'—')}</td>${allergens.map(a=>{const rel=profileEntryRelationship(pr,a.id);return `<td class="${rel==='contains'?'c':rel==='cross_contact'?'x':''}">${rel==='contains'?'C':rel==='cross_contact'?'X':'—'}</td>`}).join('')}<td>v${pr.version_no}${pr.review_due_date?`<br>${esc(pr.review_due_date)}`:''}</td></tr>`).join('')}</tbody></table><div class="footer">C = ${allergenCopy('Contains','Mengandung')} · X = ${allergenCopy('Cross-contact risk','Risiko kontak silang')} · — = ${allergenCopy('No declared match in the published profile','Tidak ada kecocokan yang dinyatakan pada profil yang dipublikasikan')}. ${allergenCopy('This matrix is not an allergen-free guarantee. Verify current ingredients and follow the property allergen procedure before service.','Matriks ini bukan jaminan bebas alergen. Verifikasi bahan terkini dan ikuti prosedur alergen properti sebelum pelayanan.')}</div></body></html>`;}
  async function runAllergenReport(mode,kind='records'){const popup=mode==='view'?null:openReportWindow();if(mode!=='view'&&!popup){toast('Allow pop-ups so the record window can open.','error');return;}try{const html=kind==='matrix'?await buildAllergenMatrixReportHtml():await buildAllergenRecordReportHtml($('recordDate')?.value||kitchenDate()),title=kind==='matrix'?t('allergen.matrixTitle'):t('allergen.recordTitle'),filename=kind==='matrix'?`Menu-Allergen-Matrix-${String(state.kitchen.name||'Kitchen').replace(/[^a-z0-9]+/gi,'-')}.pdf`:`Allergen-Checks-${String(state.kitchen.name||'Kitchen').replace(/[^a-z0-9]+/gi,'-')}-${$('recordDate')?.value||kitchenDate()}.pdf`;if(mode==='view'){showRecordPreview(title,html);return;}writeReportWindow(popup,mode==='download'?pdfDownloadDocument(html,filename):html);if(mode==='print')popup.addEventListener('load',()=>setTimeout(()=>popup.print(),200));}catch(error){if(popup)popup.close();toast(error.message,'error');}}



  // ---------------------------------------------------------------------------
  // v3.9 — Management Review & HACCP Dashboard
  // ---------------------------------------------------------------------------
  function managementCopy(en, id) { return currentLanguage === 'id' ? id : en; }
  function managementNumber(value) { const n=Number(value); return Number.isFinite(n)?n:0; }
  function managementPercent(part,total) { const t=managementNumber(total); return t?Math.round((managementNumber(part)/t)*100):null; }
  function managementDefaultRange(days=30) {
    const end=kitchenDate();
    const d=new Date(`${end}T12:00:00Z`); d.setUTCDate(d.getUTCDate()-(Math.max(1,days)-1));
    return {start:d.toISOString().slice(0,10),end};
  }

  function applyDashboardLanguage() {
    const set=(id,en,idText)=>{const el=$(id);if(el)el.textContent=managementCopy(en,idText);};
    set('dashboardEyebrow','TODAY','HARI INI'); updateDashboardGreeting();
    set('dashboardPrimaryAction','+ Storage Temperature','+ Suhu Penyimpanan'); set('dashboardManagementBtn','Management Review','Tinjauan Manajemen');
    set('dashChecksLabel','Checks','Pemeriksaan'); set('dashChecksSmall','today','hari ini'); set('dashPassLabel','Passed','Lulus'); set('dashPassSmall','within limits','dalam batas');
    set('dashOutLabel','Deviations','Deviasi'); set('dashOutSmall','out of limit','di luar batas'); set('dashActionsLabel','Open actions','Tindakan terbuka'); set('dashActionsSmall','need completion','perlu diselesaikan');
    set('dashRecentEyebrow','RECENT','TERBARU'); set('dashRecentTitle','Latest checks','Pemeriksaan terbaru'); set('dashViewRecords','View records','Lihat catatan');
    set('dashAttentionEyebrow','ATTENTION','PERHATIAN'); set('dashOpenTitle','Open deviations','Deviasi terbuka'); set('dashOpenActions','Open actions','Buka tindakan');
    set('dashDailyEyebrow','DAILY CONTROL','KONTROL HARIAN'); set('dashVerificationTitle','Verification status','Status verifikasi');
    set('dashMgmtEyebrow','MANAGEMENT SNAPSHOT','RINGKASAN MANAJEMEN'); set('dashMgmtTitle','Food-safety controls at a glance','Ringkasan kontrol keamanan pangan');
    set('dashMgmtDescription','Live status plus the last 30 days of HACCP activity.','Status langsung dan aktivitas HACCP 30 hari terakhir.'); set('dashMgmtOpen','Open full review','Buka tinjauan lengkap');
    set('dashStorageLabel','Storage completion','Penyelesaian penyimpanan'); set('dashStorageDetail','due rounds today','round yang jatuh tempo hari ini');
    set('dashProcessLabel','Food process','Proses makanan'); set('dashProcessDetail','active batches','batch aktif'); set('dashReceivingLabel','Receiving','Penerimaan'); set('dashReceivingDetail','rejected · 30 days','ditolak · 30 hari');
    set('dashSanitationLabel','Sanitation','Sanitasi'); set('dashSanitationDetail','PASS · 30 days','PASS · 30 hari'); set('dashCalibrationLabel','Calibration','Kalibrasi'); set('dashCalibrationDetail','devices need attention','alat perlu perhatian');
    set('dashTrainingLabel','Training','Pelatihan'); set('dashTrainingDetail','overdue / incomplete','terlambat / belum selesai'); set('dashAllergenLabel','Allergen checks','Pemeriksaan alergen'); set('dashAllergenDetail','30 days','30 hari');
    set('dashPendingLabel','Attention items','Item perhatian'); set('dashPendingDetail','open / overdue','terbuka / terlambat'); set('dashMgmtAttentionEyebrow','ACTION REQUIRED','TINDAKAN DIPERLUKAN'); set('dashMgmtAttentionTitle','Outstanding controls','Kontrol yang belum selesai');
    set('dashTrendEyebrow','30-DAY TREND','TREN 30 HARI'); set('dashTrendTitle','Deviation activity','Aktivitas deviasi');
    const nav=$('navManagementLabel'); if(nav)nav.textContent=managementCopy('Management Review','Tinjauan Manajemen');
  }

  function applyManagementLanguage() {
    applyDashboardLanguage();
    const set=(id,en,idText)=>{const el=$(id);if(el)el.textContent=managementCopy(en,idText);};
    set('managementEyebrow','MANAGEMENT REVIEW','TINJAUAN MANAJEMEN'); set('managementTitle','HACCP Management Review','Tinjauan Manajemen HACCP');
    set('managementDescription','Review performance, recurring deviations and outstanding actions across the HACCP system.','Tinjau kinerja, deviasi berulang, dan tindakan yang belum selesai di seluruh sistem HACCP.');
    set('managementViewBtn','View Report','Lihat Laporan'); set('managementDownloadBtn','Download PDF','Unduh PDF'); set('managementPrintBtn','Print','Cetak');
    set('managementStartLabel','From','Dari'); set('managementEndLabel','To','Sampai'); set('managementLast30','Last 30 Days','30 Hari Terakhir'); set('refreshManagement','Refresh','Muat Ulang');
    set('mgStorageLabel','Storage','Penyimpanan'); set('mgStorageSmall','checks / deviations','pemeriksaan / deviasi'); set('mgProcessLabel','Food Process','Proses Makanan'); set('mgProcessSmall','readings / deviations','pencatatan / deviasi');
    set('mgReceivingLabel','Receiving','Penerimaan'); set('mgReceivingSmall','deliveries / rejected','pengiriman / ditolak'); set('mgSanitationLabel','Sanitation','Sanitasi'); set('mgSanitationSmall','checks / failed','pemeriksaan / gagal');
    set('mgCalibrationLabel','Calibration','Kalibrasi'); set('mgCalibrationSmall','checks / failed','pemeriksaan / gagal'); set('mgTrainingLabel','Training','Pelatihan'); set('mgTrainingSmall','overdue / incomplete','terlambat / belum selesai');
    set('mgAllergenLabel','Allergen','Alergen'); set('mgAllergenSmall','checks / flagged','pemeriksaan / ditandai'); set('mgAttentionLabel','Open Attention','Perhatian Terbuka'); set('mgAttentionSmall','current outstanding items','item yang masih perlu tindakan');
    set('mgTrendEyebrow','TREND','TREN'); set('mgTrendTitle','Daily deviations','Deviasi harian'); set('mgOutstandingEyebrow','ATTENTION','PERHATIAN'); set('mgOutstandingTitle','Outstanding controls','Kontrol yang belum selesai');
    set('mgTopStorageTitle','Recurring temperature deviations','Deviasi suhu berulang'); set('mgTopSanitationTitle','Recurring sanitation failures','Kegagalan sanitasi berulang'); set('mgTopReceivingTitle','Supplier rejection activity','Aktivitas penolakan supplier');
    set('mgReviewEyebrow','REVIEW RECORD','CATATAN TINJAUAN'); set('mgReviewTitle','Management notes & actions','Catatan & tindakan manajemen');
    set('mgReviewHelp','Save a draft while discussing the period, then finalize it to create an immutable management-review record.','Simpan draft selama pembahasan, lalu finalisasi untuk membuat catatan tinjauan manajemen yang tidak dapat diubah.');
    set('mgNotesLabel','Management observations','Observasi manajemen'); set('mgActionsLabel','Management actions / follow-up','Tindakan / tindak lanjut manajemen'); set('saveManagementDraft','Save Draft','Simpan Draft'); set('finalizeManagementReview','Finalize Review','Finalisasi Tinjauan');
    set('mgHistoryEyebrow','HISTORY','RIWAYAT'); set('mgHistoryTitle','Previous management reviews','Tinjauan manajemen sebelumnya');
  }

  async function fetchManagementSummary(start,end) {
    const {data,error}=await db.rpc('get_haccp_management_summary',{p_kitchen_id:state.kitchen.id,p_start:start,p_end:end});
    if(error)throw error;
    return data||{};
  }

  function managementAttentionRows(summary) {
    const a=summary?.attention||{};
    return [
      {key:'storage_actions',label:managementCopy('Storage corrective actions','Tindakan koreksi suhu penyimpanan'),help:managementCopy('OUT readings not yet verified','Pencatatan OUT belum diverifikasi'),count:managementNumber(a.storage_actions)},
      {key:'process_actions',label:managementCopy('Food-process corrective actions','Tindakan koreksi proses makanan'),help:managementCopy('Process deviations not yet verified','Deviasi proses belum diverifikasi'),count:managementNumber(a.process_actions)},
      {key:'receiving_verification',label:managementCopy('Receiving rejections awaiting verification','Penolakan penerimaan menunggu verifikasi'),help:managementCopy('Rejected deliveries requiring supervisor review','Pengiriman ditolak yang perlu tinjauan supervisor'),count:managementNumber(a.receiving_verification)},
      {key:'sanitation_verification',label:managementCopy('Sanitation verification','Verifikasi sanitasi'),help:managementCopy('Pending or recheck-required sanitation records','Catatan sanitasi pending atau perlu periksa ulang'),count:managementNumber(a.sanitation_verification)},
      {key:'storage_overdue',label:managementCopy('Overdue storage checks','Pemeriksaan penyimpanan terlambat'),help:managementCopy('Due monitoring slots more than 30 minutes late','Slot monitoring lebih dari 30 menit terlambat'),count:managementNumber(a.storage_overdue)},
      {key:'sanitation_overdue',label:managementCopy('Overdue sanitation tasks','Tugas sanitasi terlambat'),help:managementCopy('Scheduled SSOP tasks more than 30 minutes late','Tugas SSOP terjadwal lebih dari 30 menit terlambat'),count:managementNumber(a.sanitation_overdue)},
      {key:'calibration_overdue',label:managementCopy('Calibration attention','Perhatian kalibrasi'),help:managementCopy('Overdue, failed or out-of-service devices','Alat terlambat, gagal, atau tidak digunakan'),count:managementNumber(a.calibration_overdue)},
      {key:'training_overdue',label:managementCopy('Overdue training','Pelatihan terlambat'),help:managementCopy('Incomplete assignments past due date','Penugasan belum selesai melewati tanggal jatuh tempo'),count:managementNumber(a.training_overdue)}
    ];
  }

  function managementAttentionTotal(summary){return managementAttentionRows(summary).reduce((n,x)=>n+x.count,0);}

  function renderManagementAttention(container,summary,limit=99) {
    if(!container)return;
    const items=managementAttentionRows(summary).filter(x=>x.count>0).slice(0,limit);
    if(!items.length){container.innerHTML=`<div class="management-attention-item good"><div><strong>${managementCopy('No outstanding management attention items','Tidak ada item perhatian manajemen yang terbuka')}</strong><small>${managementCopy('Current monitored controls have no open or overdue item in this summary.','Kontrol yang dipantau saat ini tidak memiliki item terbuka atau terlambat pada ringkasan ini.')}</small></div><span class="management-attention-count">✓</span></div>`;return;}
    container.innerHTML=items.map(x=>`<div class="management-attention-item ${x.key.includes('overdue')?'warn':''}"><div><strong>${esc(x.label)}</strong><small>${esc(x.help)}</small></div><span class="management-attention-count">${x.count}</span></div>`).join('');
  }

  function renderManagementTrend(container,rows) {
    if(!container)return;
    const data=Array.isArray(rows)?rows:[];
    if(!data.length){container.innerHTML=`<div class="empty">${managementCopy('No trend data for this period.','Tidak ada data tren untuk periode ini.')}</div>`;return;}
    const max=Math.max(1,...data.map(x=>managementNumber(x.count)));
    container.innerHTML=data.map((x,i)=>{const count=managementNumber(x.count);const h=count?Math.max(7,Math.round((count/max)*118)):2;const showLabel=data.length<=31||i%Math.max(1,Math.ceil(data.length/15))===0;const label=String(x.date||'').slice(5);return `<div class="management-trend-bar-wrap" title="${esc(x.date)} · ${count}"><b>${count||''}</b><i class="management-trend-bar ${count?'':'zero'}" style="height:${h}px"></i><span>${showLabel?esc(label):''}</span></div>`}).join('');
  }

  function renderManagementRanked(container,rows,emptyText) {
    if(!container)return; const data=Array.isArray(rows)?rows:[];
    if(!data.length){container.innerHTML=`<div class="empty">${esc(emptyText)}</div>`;return;}
    const max=Math.max(1,...data.map(x=>managementNumber(x.count)));
    container.innerHTML=data.map(x=>`<div class="management-ranked-row"><strong>${esc(x.label||'—')}</strong><span>${managementNumber(x.count)}</span><div class="management-ranked-meter"><i style="width:${Math.round((managementNumber(x.count)/max)*100)}%"></i></div></div>`).join('');
  }

  function renderDashboardManagement(summary) {
    const st=summary?.storage||{},pr=summary?.process||{},rc=summary?.receiving||{},sa=summary?.sanitation||{},ca=summary?.calibration||{},tr=summary?.training||{},al=summary?.allergen||{};
    const storagePct=managementPercent(st.completed_today,st.expected_today),sanPct=managementPercent(sa.pass,sa.total);
    $('dashStorageProgress').textContent=storagePct==null?'—':`${storagePct}%`;
    $('dashProcessActive').textContent=managementNumber(pr.active_batches);
    $('dashReceivingRejected').textContent=managementNumber(rc.rejected);
    $('dashSanitationProgress').textContent=sanPct==null?'—':`${sanPct}%`;
    $('dashCalibrationDue').textContent=managementNumber(ca.overdue_devices);
    $('dashTrainingAttention').textContent=`${managementNumber(tr.overdue)} / ${managementNumber(tr.incomplete)}`;
    $('dashAllergenChecks').textContent=managementNumber(al.checks);
    $('dashPendingTotal').textContent=managementAttentionTotal(summary);
    renderManagementAttention($('managementAttention'),summary,5);
    renderManagementTrend($('dashboardTrend'),summary?.daily_deviations||[]);
  }

  async function fetchManagementReviews() {
    const {data,error}=await db.from('management_reviews')
      .select('*,creator:profiles!management_reviews_created_by_fkey(full_name,email),reviewer:profiles!management_reviews_reviewed_by_fkey(full_name,email)')
      .eq('kitchen_id',state.kitchen.id).order('period_end',{ascending:false}).order('created_at',{ascending:false}).limit(30);
    if(error)throw error; return data||[];
  }

  function renderManagementSummary(summary) {
    const st=summary?.storage||{},pr=summary?.process||{},rc=summary?.receiving||{},sa=summary?.sanitation||{},ca=summary?.calibration||{},tr=summary?.training||{},al=summary?.allergen||{};
    $('mgStorageValue').textContent=`${managementNumber(st.checks)} / ${managementNumber(st.out)}`;
    $('mgProcessValue').textContent=`${managementNumber(pr.readings)} / ${managementNumber(pr.out)}`;
    $('mgReceivingValue').textContent=`${managementNumber(rc.total)} / ${managementNumber(rc.rejected)}`;
    $('mgSanitationValue').textContent=`${managementNumber(sa.total)} / ${managementNumber(sa.fail)}`;
    $('mgCalibrationValue').textContent=`${managementNumber(ca.checks)} / ${managementNumber(ca.fail)}`;
    $('mgTrainingValue').textContent=`${managementNumber(tr.overdue)} / ${managementNumber(tr.incomplete)}`;
    $('mgAllergenValue').textContent=`${managementNumber(al.checks)} / ${managementNumber(al.declared_contains)+managementNumber(al.cross_contact)}`;
    $('mgAttentionValue').textContent=managementAttentionTotal(summary);
    renderManagementTrend($('managementTrend'),summary?.daily_deviations||[]);
    renderManagementAttention($('managementOutstanding'),summary);
    renderManagementRanked($('managementTopStorage'),summary?.top_storage_equipment||[],managementCopy('No storage-temperature deviations in this period.','Tidak ada deviasi suhu penyimpanan pada periode ini.'));
    renderManagementRanked($('managementTopSanitation'),summary?.top_sanitation_tasks||[],managementCopy('No sanitation failures in this period.','Tidak ada kegagalan sanitasi pada periode ini.'));
    renderManagementRanked($('managementTopReceiving'),summary?.top_receiving_suppliers||[],managementCopy('No supplier rejections in this period.','Tidak ada penolakan supplier pada periode ini.'));
  }

  function renderManagementReviewForm(review) {
    state.managementCurrentReview=review||null;
    $('managementReviewId').value=review?.id||'';
    $('managementNotes').value=review?.management_notes||'';
    $('managementActions').value=review?.management_actions||'';
    const finalized=review?.status==='finalized';
    $('managementReviewBadge').textContent=finalized?managementCopy('FINALIZED','FINAL'):managementCopy('DRAFT','DRAFT');
    $('managementReviewBadge').className=finalized?'status-verified':'status-open';
    $('managementNotes').disabled=finalized; $('managementActions').disabled=finalized;
    $('saveManagementDraft').disabled=finalized; $('finalizeManagementReview').disabled=finalized;
    if(finalized){
      $('managementStatus').textContent=`${managementCopy('Finalized','Final')} · ${fmtDateTime(review.reviewed_at)} · ${review.reviewer?.full_name||review.reviewer?.email||managementCopy('Manager','Manajer')}`;
    } else if(review) {
      $('managementStatus').textContent=managementCopy('Draft review loaded. Refreshing the period keeps the live metrics until the review is finalized.','Draft tinjauan dimuat. Metrik tetap menggunakan data langsung sampai tinjauan difinalisasi.');
    } else {
      $('managementStatus').textContent=managementCopy('Live management summary. Save a draft when you are ready to document the review.','Ringkasan manajemen langsung. Simpan draft saat siap mendokumentasikan tinjauan.');
    }
  }

  function renderManagementHistory() {
    const wrap=$('managementReviewHistory'); if(!wrap)return;
    const rows=state.managementReviews||[];
    wrap.innerHTML=rows.length?rows.map(r=>`<div class="list-row management-history-row"><div><strong>${esc(r.period_start)} → ${esc(r.period_end)}</strong><small>${r.status==='finalized'?managementCopy('Finalized','Final'):managementCopy('Draft','Draft')} · ${esc(r.status==='finalized'?(r.reviewer?.full_name||r.reviewer?.email||'Manager'):(r.creator?.full_name||r.creator?.email||'Manager'))}${r.reviewed_at?` · ${esc(fmtDateTime(r.reviewed_at))}`:''}</small></div><div class="history-actions"><button class="secondary" type="button" data-open-management-review="${esc(r.id)}">${managementCopy('Open','Buka')}</button></div></div>`).join(''):`<div class="empty">${managementCopy('No management reviews saved yet.','Belum ada tinjauan manajemen yang disimpan.')}</div>`;
  }

  async function loadManagementReview() {
    if(!hasRole('manager'))return;
    applyManagementLanguage();
    if(!$('managementStart').value||!$('managementEnd').value){const range=managementDefaultRange();$('managementStart').value=range.start;$('managementEnd').value=range.end;}
    const start=$('managementStart').value,end=$('managementEnd').value;
    if(!start||!end||end<start){toast(managementCopy('Choose a valid management-review period.','Pilih periode tinjauan manajemen yang valid.'),'error');return;}
    $('managementStatus').textContent=managementCopy('Loading management summary…','Memuat ringkasan manajemen…');
    try{
      const [live,reviews]=await Promise.all([fetchManagementSummary(start,end),fetchManagementReviews()]);
      state.managementLiveSummary=live; state.managementReviews=reviews;
      const review=reviews.find(r=>r.period_start===start&&r.period_end===end)||null;
      state.managementSummary=review?.status==='finalized'&&review.summary_snapshot&&Object.keys(review.summary_snapshot).length?review.summary_snapshot:live;
      renderManagementSummary(state.managementSummary); renderManagementReviewForm(review); renderManagementHistory();
    }catch(error){
      console.error(error); $('managementStatus').textContent=managementCopy('Management summary could not be loaded.','Ringkasan manajemen tidak dapat dimuat.');
      toast(error?.message||managementCopy('Run the v3.9 SQL migration first.','Jalankan migrasi SQL v3.9 terlebih dahulu.'),'error');
    }
  }

  async function saveManagementReview(finalize=false) {
    if(!hasRole('manager'))return;
    const start=$('managementStart').value,end=$('managementEnd').value;
    if(!state.managementLiveSummary){toast(managementCopy('Refresh the management summary first.','Muat ulang ringkasan manajemen terlebih dahulu.'),'error');return;}
    if(finalize&&!confirm(managementCopy('Finalize this management review? The review record and its summary snapshot will become immutable.','Finalisasi tinjauan manajemen ini? Catatan dan snapshot ringkasan tidak dapat diubah setelah final.')))return;
    const button=finalize?$('finalizeManagementReview'):$('saveManagementDraft'),original=button.textContent;button.disabled=true;button.textContent=managementCopy('Saving…','Menyimpan…');
    try{
      const {error}=await db.rpc('save_management_review',{
        p_review_id:$('managementReviewId').value||null,p_kitchen_id:state.kitchen.id,p_period_start:start,p_period_end:end,
        p_summary:state.managementLiveSummary,p_notes:$('managementNotes').value.trim()||null,p_actions:$('managementActions').value.trim()||null,p_finalize:finalize
      });
      if(error)throw error;
      toast(finalize?managementCopy('Management review finalized.','Tinjauan manajemen difinalisasi.'):managementCopy('Management review draft saved.','Draft tinjauan manajemen disimpan.'),'good');
      await loadManagementReview();
    }catch(error){toast(error.message,'error');}
    finally{button.disabled=false;button.textContent=original;}
  }

  async function openManagementHistoryReview(id) {
    const r=state.managementReviews.find(x=>x.id===id); if(!r)return;
    $('managementStart').value=r.period_start; $('managementEnd').value=r.period_end; await loadManagementReview();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function managementMetricRows(summary) {
    const st=summary?.storage||{},pr=summary?.process||{},rc=summary?.receiving||{},sa=summary?.sanitation||{},ca=summary?.calibration||{},tr=summary?.training||{},al=summary?.allergen||{};
    return [
      [managementCopy('Storage Temperature','Suhu Penyimpanan'),managementNumber(st.checks),managementNumber(st.out),managementPercent(st.pass,st.checks)],
      [managementCopy('Food Process','Proses Makanan'),managementNumber(pr.readings),managementNumber(pr.out),managementPercent(pr.pass,pr.readings)],
      [managementCopy('Receiving','Penerimaan'),managementNumber(rc.total),managementNumber(rc.rejected),managementPercent(rc.accepted,rc.total)],
      [managementCopy('Cleaning & Sanitation','Cleaning & Sanitasi'),managementNumber(sa.total),managementNumber(sa.fail),managementPercent(sa.pass,sa.total)],
      [managementCopy('Calibration','Kalibrasi'),managementNumber(ca.checks),managementNumber(ca.fail),managementPercent(managementNumber(ca.checks)-managementNumber(ca.fail),ca.checks)],
      [managementCopy('Allergen Checks','Pemeriksaan Alergen'),managementNumber(al.checks),managementNumber(al.declared_contains)+managementNumber(al.cross_contact),null]
    ];
  }

  async function buildManagementReportHtml() {
    const summary=state.managementSummary||state.managementLiveSummary;if(!summary)throw new Error(managementCopy('Load a management summary first.','Muat ringkasan manajemen terlebih dahulu.'));
    const review=state.managementCurrentReview, start=$('managementStart').value,end=$('managementEnd').value,p=state.property||{};
    const generatedAt=new Date().toLocaleString(currentLanguage==='id'?'id-ID':'en-GB');
    const logo=p.logo_data_url?`<img class="property-logo" src="${esc(p.logo_data_url)}">`:'';
    const metrics=managementMetricRows(summary),attention=managementAttentionRows(summary),topStorage=summary.top_storage_equipment||[],topSan=summary.top_sanitation_tasks||[],topRec=summary.top_receiving_suppliers||[];
    const rowList=(rows,empty)=>rows.length?rows.map(x=>`<tr><td>${esc(x.label||'—')}</td><td>${managementNumber(x.count)}</td></tr>`).join(''):`<tr><td colspan="2">${esc(empty)}</td></tr>`;
    return `<!doctype html><html><head><meta charset="utf-8"><title>HACCP Management Review ${esc(start)} ${esc(end)}</title><style>@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;margin:0;font-size:9px}.property-head{display:flex;align-items:center;gap:14px;border-bottom:2px solid #111;padding-bottom:9px;margin-bottom:10px}.property-logo{max-width:95px;max-height:52px}.property-name{font-size:16px;font-weight:800}.muted{color:#666}.head{display:flex;justify-content:space-between;align-items:end;gap:18px}.meta{text-align:right;line-height:1.55}.eyebrow{font-size:7px;letter-spacing:.14em;color:#666;font-weight:bold}h1{font-size:20px;margin:2px 0}h2{font-size:12px;margin:16px 0 6px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.box{border:1px solid #ccc;padding:7px;border-radius:5px}.box b{display:block;font-size:15px;margin-top:3px}table{width:100%;border-collapse:collapse}th,td{padding:5px 6px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{font-size:7px;text-transform:uppercase;color:#666}.cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.review{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.review>div{border:1px solid #ccc;padding:9px;min-height:80px;white-space:pre-wrap}.attention{font-weight:700}.footer{margin-top:12px;padding-top:7px;border-top:1px solid #ddd;color:#666;font-size:7.5px}</style></head><body>${p.property_name||p.logo_data_url?`<div class="property-head">${logo}<div><div class="property-name">${esc(p.property_name||'')}</div><div>${esc(p.address||'')}</div></div></div>`:''}<div class="head"><div><div class="eyebrow">${managementCopy('HACCP MANAGEMENT REVIEW','TINJAUAN MANAJEMEN HACCP')}</div><h1>${esc(state.kitchen.name)}</h1></div><div class="meta"><b>${managementCopy('Period','Periode')}:</b> ${esc(start)} → ${esc(end)}<br><b>${managementCopy('Generated','Dibuat')}:</b> ${esc(generatedAt)}<br><b>${managementCopy('Status','Status')}:</b> ${esc(review?.status==='finalized'?managementCopy('FINALIZED','FINAL'):managementCopy('LIVE / DRAFT','LIVE / DRAFT'))}</div></div><div class="cards"><div class="box">${managementCopy('Open attention','Perhatian terbuka')}<b>${managementAttentionTotal(summary)}</b></div><div class="box">${managementCopy('Active food batches','Batch makanan aktif')}<b>${managementNumber(summary.process?.active_batches)}</b></div><div class="box">${managementCopy('Calibration attention','Perhatian kalibrasi')}<b>${managementNumber(summary.calibration?.overdue_devices)}</b></div><div class="box">${managementCopy('Training overdue','Pelatihan terlambat')}<b>${managementNumber(summary.training?.overdue)}</b></div></div><h2>${managementCopy('Performance Summary','Ringkasan Kinerja')}</h2><table><thead><tr><th>${managementCopy('Control','Kontrol')}</th><th>${managementCopy('Records','Catatan')}</th><th>${managementCopy('Deviations / flagged','Deviasi / ditandai')}</th><th>${managementCopy('Pass / acceptance rate','Tingkat lulus / diterima')}</th></tr></thead><tbody>${metrics.map(x=>`<tr><td><b>${esc(x[0])}</b></td><td>${x[1]}</td><td>${x[2]}</td><td>${x[3]==null?'—':x[3]+'%'}</td></tr>`).join('')}</tbody></table><h2>${managementCopy('Outstanding Controls','Kontrol yang Belum Selesai')}</h2><table><thead><tr><th>${managementCopy('Item','Item')}</th><th>${managementCopy('Count','Jumlah')}</th><th>${managementCopy('Context','Konteks')}</th></tr></thead><tbody>${attention.map(x=>`<tr class="${x.count?'attention':''}"><td>${esc(x.label)}</td><td>${x.count}</td><td>${esc(x.help)}</td></tr>`).join('')}</tbody></table><div class="cols"><div><h2>${managementCopy('Recurring Storage Deviations','Deviasi Penyimpanan Berulang')}</h2><table>${rowList(topStorage,managementCopy('None','Tidak ada'))}</table></div><div><h2>${managementCopy('Recurring Sanitation Failures','Kegagalan Sanitasi Berulang')}</h2><table>${rowList(topSan,managementCopy('None','Tidak ada'))}</table></div><div><h2>${managementCopy('Supplier Rejection Activity','Aktivitas Penolakan Supplier')}</h2><table>${rowList(topRec,managementCopy('None','Tidak ada'))}</table></div></div><div class="review"><div><b>${managementCopy('Management observations','Observasi manajemen')}</b><br><br>${esc(review?.management_notes||$('managementNotes')?.value||managementCopy('Not recorded.','Belum dicatat.'))}</div><div><b>${managementCopy('Management actions / follow-up','Tindakan / tindak lanjut manajemen')}</b><br><br>${esc(review?.management_actions||$('managementActions')?.value||managementCopy('Not recorded.','Belum dicatat.'))}</div></div>${review?.status==='finalized'?`<div class="footer"><b>${managementCopy('Reviewed by','Ditinjau oleh')}:</b> ${esc(review.reviewer?.full_name||review.reviewer?.email||'Manager')} · ${esc(fmtDateTime(review.reviewed_at))}</div>`:''}<div class="footer">${managementCopy('This management report summarizes HACCP Control records for the selected period. Detailed source records remain available in HACCP Records and retain their original immutable monitoring snapshots.','Laporan manajemen ini merangkum catatan HACCP Control untuk periode yang dipilih. Catatan sumber terperinci tetap tersedia di HACCP Records dan mempertahankan snapshot monitoring asli yang tidak dapat diubah.')}</div></body></html>`;
  }

  async function runManagementReport(mode='view') {
    const popup=mode==='view'?null:openReportWindow();if(mode!=='view'&&!popup){toast(managementCopy('Allow pop-ups so the report window can open.','Izinkan pop-up agar jendela laporan dapat terbuka.'),'error');return;}
    try{const html=await buildManagementReportHtml(),start=$('managementStart').value,end=$('managementEnd').value,filename=`HACCP-Management-Review-${String(state.kitchen.name||'Kitchen').replace(/[^a-z0-9]+/gi,'-')}-${start}-${end}.pdf`;if(mode==='view'){showRecordPreview(`${managementCopy('HACCP Management Review','Tinjauan Manajemen HACCP')} · ${start} → ${end}`,html);return;}writeReportWindow(popup,mode==='download'?pdfDownloadDocument(html,filename):html);if(mode==='print')popup.addEventListener('load',()=>setTimeout(()=>popup.print(),220),{once:true});}catch(error){if(popup&&!popup.closed)popup.close();toast(error.message,'error');}
  }
  function bindEvents() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      updateAuthGreeting();
      if (state.user && state.kitchen) updateDashboardGreeting();
    });
    $$('[data-auth-tab]').forEach(btn => btn.addEventListener('click', () => {
      $$('[data-auth-tab]').forEach(x => x.classList.toggle('active', x === btn));
      $('signInForm').classList.toggle('hidden', btn.dataset.authTab !== 'signin');
      $('signUpForm').classList.toggle('hidden', btn.dataset.authTab !== 'signup');
      setAuthMessage('');
    }));
    $('signInForm').addEventListener('submit', signIn);
    $('signUpForm').addEventListener('submit', signUp);
    $('signupSuccessOk').addEventListener('click', () => {
      $('signupSuccessDialog').close();
      const signInTab = document.querySelector('[data-auth-tab="signin"]');
      if (signInTab) signInTab.click();
      else {
        $('signInForm').classList.remove('hidden');
        $('signUpForm').classList.add('hidden');
        updateAuthGreeting();
      }
    });
    $('forgotPasswordBtn').addEventListener('click', () => {
      $('forgotPasswordEmail').value = $('signInEmail').value.trim();
      setInlineMessage('forgotPasswordMessage', '');
      $('forgotPasswordDialog').showModal();
    });
    $('forgotPasswordForm').addEventListener('submit', requestPasswordReset);
    $('closeForgotPassword').addEventListener('click', () => $('forgotPasswordDialog').close());
    $('cancelForgotPassword').addEventListener('click', () => $('forgotPasswordDialog').close());
    $('passwordActionForm').addEventListener('submit', saveNewPassword);
    $('passwordActionCancel').addEventListener('click', async () => {
      state.authActionMode = null;
      clearAuthCallbackUrl();
      await db.auth.signOut();
      resetState();
      showOnly('authScreen');
      setAuthMessage('You can sign in or request another password-reset email.');
    });
    $('bootstrapForm').addEventListener('submit', bootstrapKitchen);
    $('bootstrapLogout').addEventListener('click', signOut);
    $('awaitingLogout').addEventListener('click', signOut);
    $('profileBtn')?.addEventListener('click', openProfileDialog);
    $('logoutBtn').addEventListener('click', signOut);
    $('refreshAccessBtn').addEventListener('click', async () => { const { data:{session} } = await db.auth.getSession(); await handleSession(session); });

    $$('[data-page]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.page)));
    $$('[data-go]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.go)));
    const setMobileMenu = (open) => {
      $('.sidebar')?.classList.toggle('open', open);
      $('sidebarScrim')?.classList.toggle('open', open);
      $('mobileMenuBtn')?.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open && window.innerWidth <= 780);
    };
    $('mobileMenuBtn').addEventListener('click', () => setMobileMenu(!$('.sidebar')?.classList.contains('open')));
    $('sidebarScrim')?.addEventListener('click', () => setMobileMenu(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMobileMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth > 780) setMobileMenu(false); });
    $('languageSelect')?.addEventListener('change', e => { currentLanguage = e.target.value === 'id' ? 'id' : 'en'; localStorage.setItem('haccpLanguage', currentLanguage); applyLanguage(); });
    $('propertyForm')?.addEventListener('submit', savePropertySettings);
    $('propertyLogo')?.addEventListener('change', async e => { try { const file=e.target.files?.[0]; if (!file) return; $('propertyLogoData').value=await fileToLogoDataUrl(file); renderPropertyLogoPreview(); } catch (error) { toast(error.message,'error'); } finally { e.target.value=''; } });
    $('removePropertyLogo')?.addEventListener('click', () => { $('propertyLogoData').value=''; renderPropertyLogoPreview(); });

    $('monitorLocationTabs')?.addEventListener('click', e => {
      const tab = e.target.closest('[data-monitor-location-tab]');
      if (!tab) return;
      state.monitoringLocationId = tab.dataset.monitorLocationTab || 'all';
      localStorage.setItem('haccpMonitoringLocation', state.monitoringLocationId);
      renderMonitoringChecklist();
      window.scrollTo({ top: Math.max(0, $('monitorLocationTabs').getBoundingClientRect().top + window.scrollY - 84), behavior: 'smooth' });
    });

    $('monitoringList').addEventListener('input', e => {
      if (e.target.matches('[data-monitor-temp]')) {
        const card = e.target.closest('[data-monitor-equipment]');
        card?.classList.remove('monitor-saved');
        card?.querySelector('[data-save-monitor]')?.classList.remove('saved');
        updateMonitoringPreview(card);
      }
    });
    $('monitoringList').addEventListener('click', e => {
      const btn = e.target.closest('[data-save-monitor]');
      if (!btn) return;
      saveTemperatureForEquipment(btn.dataset.saveMonitor, btn.closest('[data-monitor-equipment]'));
    });
    $('overdueDismiss')?.addEventListener('click', () => $('overdueDialog').close());
    $('overdueGoCheck')?.addEventListener('click', async () => { $('overdueDialog').close(); await navigate('check'); });
    $('processOverdueDismiss')?.addEventListener('click', () => $('processOverdueDialog').close());
    $('processOverdueGo')?.addEventListener('click', async () => { $('processOverdueDialog').close(); await navigate('process'); });
    $('refreshMonitoring').addEventListener('click', async () => {
      await loadConfiguration();
      toast(t('monitor.refreshed'), 'good');
    });
    $('correctiveForm').addEventListener('submit', saveCorrective);
    $('closeCorrective').addEventListener('click', () => $('correctiveDialog').close());
    $('cancelCorrective').addEventListener('click', () => $('correctiveDialog').close());

    $('refreshCorrective').addEventListener('click', loadCorrectiveActions);
    $('correctiveFilter').addEventListener('change', loadCorrectiveActions);
    $('correctiveList').addEventListener('click', e => {
      const correct = e.target.closest('[data-correct-log]');
      const verify = e.target.closest('[data-verify-action]');
      const processCorrect = e.target.closest('[data-process-correct-reading]');
      const processVerify = e.target.closest('[data-process-verify-action]');
      const sanitationVerify = e.target.closest('[data-sanitation-verify]');
      const sanitationPhotos = e.target.closest('[data-view-sanitation-evidence]');
      const sanitationRecheck = e.target.closest('[data-go-sanitation-recheck]');
      if (correct) openActionForExistingLog(correct.dataset.correctLog);
      if (verify) openVerifyDialog(verify.dataset.verifyAction);
      if (processCorrect) openProcessAction(processCorrect.dataset.processCorrectReading);
      if (processVerify) verifyProcessAction(processVerify.dataset.processVerifyAction);
      if (sanitationVerify) openSanitationVerify(sanitationVerify.dataset.sanitationVerify);
      if (sanitationPhotos) viewSanitationEvidence(sanitationPhotos.dataset.viewSanitationEvidence);
      if (sanitationRecheck) navigate('sanitation').then(()=>openSanitationRecord(sanitationRecheck.dataset.goSanitationRecheck));
    });

    $('verifyForm').addEventListener('submit', verifyAction);
    $('closeVerify').addEventListener('click', () => $('verifyDialog').close());
    $('cancelVerify').addEventListener('click', () => $('verifyDialog').close());

    $('recordsTabs')?.addEventListener('click', e => { const tab=e.target.closest('[data-record-tab]'); if(tab) setRecordsTab(tab.dataset.recordTab); });
    $('recordDate').addEventListener('change', loadRecordsHub);
    $('refreshRecords').addEventListener('click', loadRecordsHub);
    $('recordLocationFilter')?.addEventListener('change', loadRecords);
    $('recordRoundFilter')?.addEventListener('change', loadRecords);
    $('recordStatusFilter')?.addEventListener('change', loadRecords);
    $('processRecordProcessFilter')?.addEventListener('change', loadProcessRecords);
    $('processRecordStatusFilter')?.addEventListener('change', loadProcessRecords);
    $('processRecordSearch')?.addEventListener('change', loadProcessRecords);
    $('recordCorrectiveType')?.addEventListener('change', loadCorrectiveRecords);
    $('recordCorrectiveStatus')?.addEventListener('change', loadCorrectiveRecords);
    $('receivingRecordSupplier')?.addEventListener('change', loadReceivingRecords);
    $('receivingRecordStatus')?.addEventListener('change', loadReceivingRecords);
    $('receivingRecordSearch')?.addEventListener('change', loadReceivingRecords);
    $('receivingRecordsBody')?.addEventListener('click', e => { const verify=e.target.closest('[data-verify-receiving-record]'); if(verify){ const r=state.receivingRecords.find(x=>x.id===verify.dataset.verifyReceivingRecord); if(r){ state.receivingRecords=[...state.receivingRecords]; openReceivingVerify(r.id); } } });
    $('calibrationRecordStatus')?.addEventListener('change', loadCalibrationRecords);
    $('calibrationRecordVerification')?.addEventListener('change', loadCalibrationRecords);
    $('calibrationRecordsBody')?.addEventListener('click', e => { const verify=e.target.closest('[data-verify-calibration-record]'); if(verify) openCalibrationVerify(verify.dataset.verifyCalibrationRecord); });
    $('sanitationRecordStatus')?.addEventListener('change', loadSanitationRecords);
    $('sanitationRecordVerification')?.addEventListener('change', loadSanitationRecords);
    $('sanitationRecordSearch')?.addEventListener('input', loadSanitationRecords);
    $('sanitationRecordsBody')?.addEventListener('click', e => {
      const view=e.target.closest('[data-view-sanitation-evidence]');
      const verify=e.target.closest('[data-verify-sanitation]');
      if(view) viewSanitationEvidence(view.dataset.viewSanitationEvidence);
      if(verify) openSanitationVerify(verify.dataset.verifySanitation);
    });
    $('recordVerificationContent')?.addEventListener('click', e => { const btn=e.target.closest('[data-record-tab-action]'); if(btn) setRecordsTab(btn.dataset.recordTabAction); });
    $('storageViewBtn')?.addEventListener('click', () => generateDailyPdf('view'));
    $('storageDownloadBtn')?.addEventListener('click', () => generateDailyPdf('download'));
    $('storagePrintBtn')?.addEventListener('click', () => generateDailyPdf('print'));
    $('receivingPhotoInput')?.addEventListener('change', e => addReceivingPhotos(e.target.files));
    $('receivingPhotoPreview')?.addEventListener('change', e => {
      const select=e.target.closest('[data-receiving-photo-kind]'); if(!select)return;
      const item=state.receivingPhotoDraft?.[Number(select.dataset.receivingPhotoKind)]; if(item)item.kind=select.value;
    });
    $('receivingPhotoPreview')?.addEventListener('click', e => {
      const btn=e.target.closest('[data-remove-receiving-photo]'); if(!btn)return;
      const index=Number(btn.dataset.removeReceivingPhoto); const [item]=state.receivingPhotoDraft.splice(index,1); if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl); renderReceivingPhotoDraft();
    });
    $('receivingTodayList')?.addEventListener('click', e => { const btn=e.target.closest('[data-view-receiving-evidence]'); if(btn)viewReceivingEvidence(btn.dataset.viewReceivingEvidence); });
    $('receivingRecordsBody')?.addEventListener('click', e => { const btn=e.target.closest('[data-view-receiving-evidence]'); if(btn)viewReceivingEvidence(btn.dataset.viewReceivingEvidence); });
    $('closeReceivingEvidence')?.addEventListener('click', () => $('receivingEvidenceDialog').close());
    $('receivingEvidenceDialog')?.addEventListener('click', e => { if(e.target===$('receivingEvidenceDialog'))$('receivingEvidenceDialog').close(); });
    $('receivingViewBtn')?.addEventListener('click', () => generateReceivingPdf('view'));
    $('receivingDownloadBtn')?.addEventListener('click', () => generateReceivingPdf('download'));
    $('receivingPrintBtn')?.addEventListener('click', () => generateReceivingPdf('print'));
    $('closeRecordPreview')?.addEventListener('click', () => $('recordPreviewDialog').close());
    $('verifyDayBtn').addEventListener('click', () => { $('verifyDayNotes').value = ''; $('verifyDayDialog').showModal(); });
    $('verifyDayForm').addEventListener('submit', verifyDay);
    $('closeVerifyDay').addEventListener('click', () => $('verifyDayDialog').close());
    $('cancelVerifyDay').addEventListener('click', () => $('verifyDayDialog').close());

    $('locationForm').addEventListener('submit', saveLocation);
    $('locationCancelBtn').addEventListener('click', resetLocationForm);
    $('locationList').addEventListener('click', e => { const edit=e.target.closest('[data-edit-location]'); const arch=e.target.closest('[data-archive-location]'); if(edit) editLocation(edit.dataset.editLocation); if(arch) archiveLocation(arch.dataset.archiveLocation); });
    $('equipmentForm').addEventListener('submit', addEquipment);
    $('equipmentCancelBtn').addEventListener('click', resetEquipmentForm);
    $('equipmentList').addEventListener('click', e => { const edit=e.target.closest('[data-edit-equipment]'); const arch=e.target.closest('[data-deactivate-equipment]'); const restore=e.target.closest('[data-restore-equipment]'); if(edit) editEquipment(edit.dataset.editEquipment); if(arch) deactivateEquipment(arch.dataset.deactivateEquipment); if(restore) restoreEquipment(restore.dataset.restoreEquipment); });
    $('limitForm').addEventListener('submit', addLimit);
    $('limitList').addEventListener('click', e => { const b = e.target.closest('[data-deactivate-limit]'); if (b) deactivateLimit(b.dataset.deactivateLimit); });
    $('memberForm').addEventListener('submit', addMember);
    $('memberList').addEventListener('click', e => {
      const remove = e.target.closest('[data-remove-member]');
      const changeRole = e.target.closest('[data-change-member-role]');
      if (remove) removeMember(remove.dataset.removeMember);
      if (changeRole) changeMemberRole(changeRole.dataset.changeMemberRole);
    });
    $('newProcessBatchBtn')?.addEventListener('click',()=>{populateProcessBatchOptions(); $('processBatchDialog').showModal();});
    $('closeProcessBatch')?.addEventListener('click',()=>$('processBatchDialog').close()); $('cancelProcessBatch')?.addEventListener('click',()=>$('processBatchDialog').close()); $('processBatchForm')?.addEventListener('submit',createProcessBatch);
    $('processStartType')?.addEventListener('change',e=>fillProcessLimitSelect('processStartLimit',e.target.value));
    $('refreshProcess')?.addEventListener('click',loadProcessControl);
    $('processViewBtn')?.addEventListener('click', () => generateProcessDailyPdf('view'));
    $('processDownloadBtn')?.addEventListener('click', () => generateProcessDailyPdf('download'));
    $('processPrintBtn')?.addEventListener('click', () => generateProcessDailyPdf('print'));
    $('calibrationViewBtn')?.addEventListener('click', () => generateCalibrationPdf('view'));
    $('calibrationDownloadBtn')?.addEventListener('click', () => generateCalibrationPdf('download'));
    $('calibrationPrintBtn')?.addEventListener('click', () => generateCalibrationPdf('print'));
    $('sanitationViewBtn')?.addEventListener('click', () => generateSanitationPdf('view'));
    $('sanitationDownloadBtn')?.addEventListener('click', () => generateSanitationPdf('download'));
    $('sanitationPrintBtn')?.addEventListener('click', () => generateSanitationPdf('print'));
    $('processBatchList')?.addEventListener('click',e=>{const r=e.target.closest('[data-process-reading]'),a=e.target.closest('[data-process-advance]'); if(r)openProcessReading(r.dataset.processReading); if(a)openProcessAdvance(a.dataset.processAdvance); const c=e.target.closest('[data-process-action]'); if(c)openProcessAction(c.dataset.processAction); const v=e.target.closest('[data-process-action-verify]'); if(v)verifyProcessAction(v.dataset.processActionVerify);});
    $('processReadingForm')?.addEventListener('submit',saveProcessReading); $('closeProcessReading')?.addEventListener('click',()=>$('processReadingDialog').close()); $('cancelProcessReading')?.addEventListener('click',()=>$('processReadingDialog').close());
    $('processActionForm')?.addEventListener('submit',saveProcessAction); $('closeProcessAction')?.addEventListener('click',()=>$('processActionDialog').close()); $('cancelProcessAction')?.addEventListener('click',()=>$('processActionDialog').close());
    $('processAdvanceForm')?.addEventListener('submit',advanceProcessBatch); $('closeProcessAdvance')?.addEventListener('click',()=>$('processAdvanceDialog').close()); $('cancelProcessAdvance')?.addEventListener('click',()=>$('processAdvanceDialog').close());
    $('processNextType')?.addEventListener('change',e=>{const done=e.target.value==='completed'; $('processNextLimit').disabled=done; if(!done)fillProcessLimitSelect('processNextLimit',e.target.value); else $('processNextLimit').innerHTML='<option>Not required</option>';});
    $('processLimitType')?.addEventListener('change',toggleProcessLimitFields); $('processLimitForm')?.addEventListener('submit',saveProcessLimit);
    $('processLimitCancel')?.addEventListener('click',resetProcessLimitForm);
    $('processLimitList')?.addEventListener('click',e=>{ const edit=e.target.closest('[data-edit-process-limit]'); const version=e.target.closest('[data-version-process-limit]'); const toggle=e.target.closest('[data-toggle-process-limit]'); const del=e.target.closest('[data-delete-process-limit]'); if(edit) editProcessLimit(edit.dataset.editProcessLimit); if(version) openProcessLimitVersion(version.dataset.versionProcessLimit); if(toggle) toggleProcessLimitActive(toggle.dataset.toggleProcessLimit); if(del) deleteProcessLimit(del.dataset.deleteProcessLimit); });
    $('refreshCalibration')?.addEventListener('click', loadCalibration);
    $('addCalibrationDeviceBtn')?.addEventListener('click', () => openCalibrationDeviceDialog());
    $('newCalibrationBtn')?.addEventListener('click', () => openCalibrationCheck());
    // v3.9.2 Thawing / Defrost Control
    $('refreshThawing')?.addEventListener('click',loadThawing);
    $('newThawingBatchBtn')?.addEventListener('click',openThawingBatch);
    $('thawingBatchStandard')?.addEventListener('change',updateThawingBatchPreview);
    $('thawingStartedAt')?.addEventListener('change',updateThawingBatchPreview);
    $('thawingBatchForm')?.addEventListener('submit',saveThawingBatch);
    $('closeThawingBatch')?.addEventListener('click',()=>$('thawingBatchDialog').close()); $('cancelThawingBatch')?.addEventListener('click',()=>$('thawingBatchDialog').close());
    $('thawingBatchList')?.addEventListener('click',e=>{const r=e.target.closest('[data-thaw-reading]'),c=e.target.closest('[data-thaw-complete]'),a=e.target.closest('[data-thaw-actions]'),ph=e.target.closest('[data-thaw-evidence]');if(r)openThawingReading(r.dataset.thawReading);if(c)openThawingComplete(c.dataset.thawComplete);if(a)navigate('corrective');if(ph)viewThawingEvidence(ph.dataset.thawEvidence);});
    $('thawingPhotoInput')?.addEventListener('change',e=>addThawingPhotos(e.target.files)); $('thawingPhotoPreview')?.addEventListener('change',e=>{const x=e.target.closest('[data-thaw-photo-kind]');if(x&&state.thawingPhotoDraft[Number(x.dataset.thawPhotoKind)])state.thawingPhotoDraft[Number(x.dataset.thawPhotoKind)].kind=x.value;}); $('thawingPhotoPreview')?.addEventListener('click',e=>{const b=e.target.closest('[data-remove-thaw-photo]');if(!b)return;const i=Number(b.dataset.removeThawPhoto),[x]=state.thawingPhotoDraft.splice(i,1);if(x?.previewUrl)URL.revokeObjectURL(x.previewUrl);renderThawingPhotoDraft();});
    $('closeThawingEvidence')?.addEventListener('click',()=>$('thawingEvidenceDialog').close()); $('thawingEvidenceDialog')?.addEventListener('click',e=>{if(e.target===$('thawingEvidenceDialog'))$('thawingEvidenceDialog').close();});
    $('thawingReadingTemp')?.addEventListener('input',updateThawingReadingPreview); $('thawingReadingForm')?.addEventListener('submit',saveThawingReading); $('closeThawingReading')?.addEventListener('click',()=>$('thawingReadingDialog').close()); $('cancelThawingReading')?.addEventListener('click',()=>$('thawingReadingDialog').close());
    $('thawingActionForm')?.addEventListener('submit',saveThawingAction); $('closeThawingAction')?.addEventListener('click',()=>$('thawingActionDialog').close()); $('cancelThawingAction')?.addEventListener('click',()=>$('thawingActionDialog').close());
    $('thawingCompleteForm')?.addEventListener('submit',saveThawingComplete); $('closeThawingComplete')?.addEventListener('click',()=>$('thawingCompleteDialog').close()); $('cancelThawingComplete')?.addEventListener('click',()=>$('thawingCompleteDialog').close());
    $('thawingVerifyForm')?.addEventListener('submit',verifyThawingAction); $('closeThawingVerify')?.addEventListener('click',()=>$('thawingVerifyDialog').close()); $('cancelThawingVerify')?.addEventListener('click',()=>$('thawingVerifyDialog').close());
    $('correctiveList')?.addEventListener('click',e=>{const c=e.target.closest('[data-thaw-correct-reading]'),v=e.target.closest('[data-thaw-verify-action]');if(c)openThawingAction(c.dataset.thawCorrectReading);if(v)openThawingVerify(v.dataset.thawVerifyAction);});
    $('thawingStandardForm')?.addEventListener('submit',saveThawingStandard); $('thawingStandardCancel')?.addEventListener('click',resetThawingStandardForm); $('thawingStandardList')?.addEventListener('click',e=>{const ed=e.target.closest('[data-edit-thawing-standard]'),tg=e.target.closest('[data-toggle-thawing-standard]');if(ed)editThawingStandard(ed.dataset.editThawingStandard);if(tg)toggleThawingStandard(tg.dataset.toggleThawingStandard);});
    $('thawingRecordsBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-verify-thawing-batch]'),ph=e.target.closest('[data-thaw-record-evidence]');if(b)openThawingBatchVerify(b.dataset.verifyThawingBatch);if(ph)viewThawingEvidence(ph.dataset.thawRecordEvidence);}); $('thawingBatchVerifyForm')?.addEventListener('submit',verifyThawingBatch); $('closeThawingBatchVerify')?.addEventListener('click',()=>$('thawingBatchVerifyDialog').close()); $('cancelThawingBatchVerify')?.addEventListener('click',()=>$('thawingBatchVerifyDialog').close());
    $('thawingRecordViewBtn')?.addEventListener('click',()=>runThawingReport('view')); $('thawingRecordDownloadBtn')?.addEventListener('click',()=>runThawingReport('download')); $('thawingRecordPrintBtn')?.addEventListener('click',()=>runThawingReport('print'));

    $('refreshReceiving')?.addEventListener('click', loadReceiving);
    $('newReceivingBtn')?.addEventListener('click', openReceivingCheck);
    $('receivingTodayList')?.addEventListener('click', e => { const verify=e.target.closest('[data-verify-receiving]'); if(verify) openReceivingVerify(verify.dataset.verifyReceiving); });
    $('receivingCheckSupplier')?.addEventListener('change', updateReceivingPreview);
    $('receivingCheckStandard')?.addEventListener('change', updateReceivingPreview);
    $('receivingObservedTemperature')?.addEventListener('input', updateReceivingPreview);
    $('receivingPackagingCondition')?.addEventListener('change', updateReceivingPreview);
    $('receivingVehicleCondition')?.addEventListener('change', updateReceivingPreview);
    $('receivingCheckForm')?.addEventListener('submit', saveReceivingCheck);
    $('closeReceivingCheck')?.addEventListener('click', () => $('receivingCheckDialog').close());
    $('cancelReceivingCheck')?.addEventListener('click', () => $('receivingCheckDialog').close());
    $('receivingVerifyForm')?.addEventListener('submit', verifyReceiving);
    $('closeReceivingVerify')?.addEventListener('click', () => $('receivingVerifyDialog').close());
    $('cancelReceivingVerify')?.addEventListener('click', () => $('receivingVerifyDialog').close());
    $('receivingSupplierForm')?.addEventListener('submit', saveReceivingSupplier);
    $('receivingSupplierCancel')?.addEventListener('click', resetReceivingSupplierForm);
    $('receivingSupplierList')?.addEventListener('click', e => { const edit=e.target.closest('[data-edit-receiving-supplier]'); const toggle=e.target.closest('[data-toggle-receiving-supplier]'); if(edit) editReceivingSupplier(edit.dataset.editReceivingSupplier); if(toggle) toggleReceivingSupplier(toggle.dataset.toggleReceivingSupplier); });
    $('receivingTemperatureRequired')?.addEventListener('change', updateReceivingStandardFields);
    $('receivingStandardForm')?.addEventListener('submit', saveReceivingStandard);
    $('receivingStandardCancel')?.addEventListener('click', resetReceivingStandardForm);
    $('receivingStandardList')?.addEventListener('click', e => { const edit=e.target.closest('[data-edit-receiving-standard]'); const toggle=e.target.closest('[data-toggle-receiving-standard]'); if(edit) editReceivingStandard(edit.dataset.editReceivingStandard); if(toggle) toggleReceivingStandard(toggle.dataset.toggleReceivingStandard); });

    $('refreshSanitation')?.addEventListener('click', loadSanitation);
    $('newSanitationRecordBtn')?.addEventListener('click', () => openSanitationRecord());
    $('sanitationTaskList')?.addEventListener('click', e => {
      const complete=e.target.closest('[data-complete-sanitation]');
      const verify=e.target.closest('[data-verify-sanitation]');
      const view=e.target.closest('[data-view-sanitation-evidence]');
      if(complete) openSanitationRecord(complete.dataset.completeSanitation);
      if(verify) openSanitationVerify(verify.dataset.verifySanitation);
      if(view) viewSanitationEvidence(view.dataset.viewSanitationEvidence);
    });
    $('sanitationRecordStandard')?.addEventListener('change', () => { $('sanitationRecordStandardId').value=$('sanitationRecordStandard').value; updateSanitationRecordPreview(); });
    $('sanitationVisualCondition')?.addEventListener('change', updateSanitationRecordPreview);
    $('sanitationMeasuredConcentration')?.addEventListener('input', updateSanitationRecordPreview);
    $('sanitationRecordForm')?.addEventListener('submit', saveSanitationRecord);
    $('closeSanitationRecord')?.addEventListener('click', () => $('sanitationRecordDialog').close());
    $('cancelSanitationRecord')?.addEventListener('click', () => $('sanitationRecordDialog').close());
    $('sanitationPhotoInput')?.addEventListener('change', e => addSanitationPhotos(e.target.files));
    $('sanitationPhotoPreview')?.addEventListener('change', e => { const select=e.target.closest('[data-sanitation-photo-kind]'); if(!select)return; const item=state.sanitationPhotoDraft?.[Number(select.dataset.sanitationPhotoKind)]; if(item)item.kind=select.value; });
    $('sanitationPhotoPreview')?.addEventListener('click', e => { const btn=e.target.closest('[data-remove-sanitation-photo]'); if(!btn)return; const index=Number(btn.dataset.removeSanitationPhoto); const [item]=state.sanitationPhotoDraft.splice(index,1); if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl); renderSanitationPhotoDraft(); });
    $('sanitationVerifyPhotoInput')?.addEventListener('change', e => addSanitationVerifyPhotos(e.target.files));
    $('sanitationVerifyPhotoPreview')?.addEventListener('click', e => { const btn=e.target.closest('[data-remove-sanitation-verify-photo]'); if(!btn)return; const index=Number(btn.dataset.removeSanitationVerifyPhoto); const [item]=state.sanitationVerifyPhotoDraft.splice(index,1); if(item?.previewUrl)URL.revokeObjectURL(item.previewUrl); renderSanitationVerifyPhotoDraft(); });
    $('sanitationVerifyForm')?.addEventListener('submit', verifySanitation);
    $('closeSanitationVerify')?.addEventListener('click', () => $('sanitationVerifyDialog').close());
    $('cancelSanitationVerify')?.addEventListener('click', () => $('sanitationVerifyDialog').close());
    $('closeSanitationEvidence')?.addEventListener('click', () => $('sanitationEvidenceDialog').close());
    $('sanitationEvidenceDialog')?.addEventListener('click', e => { if(e.target===$('sanitationEvidenceDialog'))$('sanitationEvidenceDialog').close(); });
    $('sanitationConcentrationRequired')?.addEventListener('change', updateSanitationStandardFields);
    $('sanitationFrequency')?.addEventListener('change', updateSanitationStandardFields);
    $('sanitationStandardForm')?.addEventListener('submit', saveSanitationStandard);
    $('sanitationStandardCancel')?.addEventListener('click', resetSanitationStandardForm);
    $('sanitationStandardList')?.addEventListener('click', e => { const edit=e.target.closest('[data-edit-sanitation-standard]'); const toggle=e.target.closest('[data-toggle-sanitation-standard]'); if(edit)editSanitationStandard(edit.dataset.editSanitationStandard); if(toggle)toggleSanitationStandard(toggle.dataset.toggleSanitationStandard); });

    $('refreshAllergen')?.addEventListener('click',loadAllergenControl);
    $('allergenCheckAllergens')?.addEventListener('change',updateAllergenCheckPreview);
    $('allergenCheckMenu')?.addEventListener('change',updateAllergenCheckPreview);
    $('allergenGuestCheckForm')?.addEventListener('submit',saveAllergenGuestCheck);
    $('allergenMatrixSearch')?.addEventListener('input',renderAllergenMatrix);
    $('allergenMatrixCategory')?.addEventListener('change',renderAllergenMatrix);
    $('allergenMatrixOutlet')?.addEventListener('change',renderAllergenMatrix);
    $('allergenMatrixViewBtn')?.addEventListener('click',()=>runAllergenReport('view','matrix'));
    $('allergenMatrixDownloadBtn')?.addEventListener('click',()=>runAllergenReport('download','matrix'));
    $('allergenMatrixPrintBtn')?.addEventListener('click',()=>runAllergenReport('print','matrix'));
    $('refreshAllergenSettings')?.addEventListener('click',loadAllergenSettings);
    $('allergenLibraryForm')?.addEventListener('submit',saveAllergenLibrary);
    $('allergenLibraryCancel')?.addEventListener('click',resetAllergenLibraryForm);
    $('allergenLibraryList')?.addEventListener('click',e=>{const ed=e.target.closest('[data-edit-allergen]'),tg=e.target.closest('[data-toggle-allergen]');if(ed)editAllergenLibrary(ed.dataset.editAllergen);if(tg)toggleAllergenLibrary(tg.dataset.toggleAllergen);});
    $('newAllergenProfileBtn')?.addEventListener('click',resetAllergenProfileForm);
    $('allergenProfileForm')?.addEventListener('submit',saveAllergenProfile);
    $('allergenProfileCancel')?.addEventListener('click',resetAllergenProfileForm);
    $('allergenProfileList')?.addEventListener('click',e=>{const ed=e.target.closest('[data-edit-allergen-profile]'),pub=e.target.closest('[data-publish-allergen-profile]'),rev=e.target.closest('[data-revise-allergen-profile]');if(ed)editAllergenProfile(ed.dataset.editAllergenProfile);if(pub)publishAllergenProfile(pub.dataset.publishAllergenProfile);if(rev)reviseAllergenProfile(rev.dataset.reviseAllergenProfile);});
    $('allergenRecordStatus')?.addEventListener('change',loadAllergenRecords);
    $('allergenRecordSearch')?.addEventListener('input',loadAllergenRecords);
    $('allergenRecordViewBtn')?.addEventListener('click',()=>runAllergenReport('view','records'));
    $('allergenRecordDownloadBtn')?.addEventListener('click',()=>runAllergenReport('download','records'));
    $('allergenRecordPrintBtn')?.addEventListener('click',()=>runAllergenReport('print','records'));

    // v3.9.1 Notification Center
    $('refreshNotifications')?.addEventListener('click',()=>loadNotifications(true));
    $('mobileNotificationBtn')?.addEventListener('click',()=>navigate('notifications'));
    $('notificationList')?.addEventListener('click',e=>{
      const open=e.target.closest('[data-notification-open]');
      const snooze=e.target.closest('[data-notification-snooze]');
      if(open) navigate(open.dataset.notificationOpen || 'dashboard');
      if(snooze) snoozeNotification(snooze.dataset.notificationSnooze,60);
    });
    $$('.notification-filter').forEach(btn=>btn.addEventListener('click',()=>{state.notificationFilter=btn.dataset.notificationFilter||'all';renderNotifications();}));

    // v3.9 Management Review & Dashboard
    $('managementLast30')?.addEventListener('click', async () => { const range=managementDefaultRange(); $('managementStart').value=range.start; $('managementEnd').value=range.end; await loadManagementReview(); });
    $('refreshManagement')?.addEventListener('click', loadManagementReview);
    $('managementStart')?.addEventListener('change', () => { state.managementCurrentReview=null; state.managementSummary=null; state.managementLiveSummary=null; });
    $('managementEnd')?.addEventListener('change', () => { state.managementCurrentReview=null; state.managementSummary=null; state.managementLiveSummary=null; });
    $('saveManagementDraft')?.addEventListener('click', () => saveManagementReview(false));
    $('finalizeManagementReview')?.addEventListener('click', () => saveManagementReview(true));
    $('managementReviewHistory')?.addEventListener('click', e => { const btn=e.target.closest('[data-open-management-review]'); if(btn)openManagementHistoryReview(btn.dataset.openManagementReview); });
    $('managementViewBtn')?.addEventListener('click', () => runManagementReport('view'));
    $('managementDownloadBtn')?.addEventListener('click', () => runManagementReport('download'));
    $('managementPrintBtn')?.addEventListener('click', () => runManagementReport('print'));

    $('calibrationDeviceForm')?.addEventListener('submit', saveCalibrationDevice);
    $('closeCalibrationDevice')?.addEventListener('click', () => $('calibrationDeviceDialog').close());
    $('cancelCalibrationDevice')?.addEventListener('click', () => $('calibrationDeviceDialog').close());
    $('calibrationDeviceList')?.addEventListener('click', e => {
      const calibrate=e.target.closest('[data-calibrate-device]');
      const edit=e.target.closest('[data-edit-calibration-device]');
      const toggle=e.target.closest('[data-toggle-calibration-device]');
      if(calibrate) openCalibrationCheck(calibrate.dataset.calibrateDevice);
      if(edit) openCalibrationDeviceDialog(edit.dataset.editCalibrationDevice);
      if(toggle) toggleCalibrationDevice(toggle.dataset.toggleCalibrationDevice);
    });
    $('calibrationRecentList')?.addEventListener('click', e => { const verify=e.target.closest('[data-verify-calibration]'); if(verify) openCalibrationVerify(verify.dataset.verifyCalibration); });
    $('calibrationCheckDevice')?.addEventListener('change', updateCalibrationCheckDevice);
    $('calibrationCheckMethod')?.addEventListener('change', updateCalibrationMethod);
    $('calibrationReferenceTemp')?.addEventListener('input', updateCalibrationPreview);
    $('calibrationObservedTemp')?.addEventListener('input', updateCalibrationPreview);
    $('calibrationCheckForm')?.addEventListener('submit', saveCalibrationCheck);
    $('closeCalibrationCheck')?.addEventListener('click', () => $('calibrationCheckDialog').close());
    $('cancelCalibrationCheck')?.addEventListener('click', () => $('calibrationCheckDialog').close());
    $('calibrationVerifyForm')?.addEventListener('submit', verifyCalibration);
    $('closeCalibrationVerify')?.addEventListener('click', () => $('calibrationVerifyDialog').close());
    $('cancelCalibrationVerify')?.addEventListener('click', () => $('calibrationVerifyDialog').close());

    $('refreshTraining')?.addEventListener('click', loadTraining);
    $('trainingAssignmentList')?.addEventListener('click', e => { const b=e.target.closest('[data-start-training]'); if(b) startTrainingExam(b.dataset.startTraining); });
    $('newTrainingAssessmentBtn')?.addEventListener('click',()=>openTrainingAssessment());
    $('refreshTrainingSettings')?.addEventListener('click',loadTrainingSettings);
    $('trainingAssessmentList')?.addEventListener('click',e=>{const q=e.target.closest('[data-training-questions]'),ed=e.target.closest('[data-edit-training-assessment]'),pub=e.target.closest('[data-publish-training]'),as=e.target.closest('[data-assign-training]');if(q)selectTrainingAssessment(q.dataset.trainingQuestions);if(ed)openTrainingAssessment(ed.dataset.editTrainingAssessment);if(pub)publishTrainingAssessment(pub.dataset.publishTraining);if(as)openTrainingAssign(as.dataset.assignTraining);});
    $('trainingAssessmentForm')?.addEventListener('submit',saveTrainingAssessment); $('closeTrainingAssessment')?.addEventListener('click',()=>$('trainingAssessmentDialog').close()); $('cancelTrainingAssessment')?.addEventListener('click',()=>$('trainingAssessmentDialog').close());
    $('addTrainingQuestionBtn')?.addEventListener('click',()=>openTrainingQuestion()); $('trainingQuestionList')?.addEventListener('click',e=>{const ed=e.target.closest('[data-edit-training-question]'),del=e.target.closest('[data-delete-training-question]');if(ed)openTrainingQuestion(ed.dataset.editTrainingQuestion);if(del)deleteTrainingQuestion(del.dataset.deleteTrainingQuestion);});
    $('trainingQuestionForm')?.addEventListener('submit',saveTrainingQuestion); $('closeTrainingQuestion')?.addEventListener('click',()=>$('trainingQuestionDialog').close()); $('cancelTrainingQuestion')?.addEventListener('click',()=>$('trainingQuestionDialog').close());
    $('trainingAssignForm')?.addEventListener('submit',saveTrainingAssignment); $('closeTrainingAssign')?.addEventListener('click',()=>$('trainingAssignDialog').close()); $('cancelTrainingAssign')?.addEventListener('click',()=>$('trainingAssignDialog').close());
    $('trainingMatrixBody')?.addEventListener('click',e=>{const b=e.target.closest('[data-assess-competency]');if(b)openTrainingCompetency(b.dataset.assessCompetency);});
    $('trainingCompetencyForm')?.addEventListener('submit',saveTrainingCompetency); $('closeTrainingCompetency')?.addEventListener('click',()=>$('trainingCompetencyDialog').close()); $('cancelTrainingCompetency')?.addEventListener('click',()=>$('trainingCompetencyDialog').close());
    $('trainingExamPrevious')?.addEventListener('click',()=>moveTrainingExam(-1)); $('trainingExamNext')?.addEventListener('click',()=>moveTrainingExam(1)); $('trainingExamSubmit')?.addEventListener('click',()=>submitTrainingExam(false)); $('trainingExamExit')?.addEventListener('click',()=>{if(confirm(currentLanguage==='id'?'Keluar dari penilaian? Percobaan belum dikirim.':'Exit assessment? This attempt has not been submitted.')){if(state.trainingExam?.timer)clearInterval(state.trainingExam.timer);state.trainingExam=null;$('trainingExamDialog').close();}});

    $('printQrBtn').addEventListener('click', () => window.print());
  }

  boot().catch(error => { console.error(error); toast(error.message || 'Application failed to start.', 'error'); });
})();
