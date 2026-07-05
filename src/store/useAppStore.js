import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { extraTranslations } from './extraTranslations';
// Data Mockup dihilangkan untuk production
const AVATAR_PRESETS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', label: 'Athlete Neon' },
  { id: '2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', label: 'Retro Pro' },
  { id: '3', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80', label: 'Court Star' },
];

const translations = {
  'English (US)': {
    welcome: 'Welcome back,',
    active_player: 'Active Player',
    elo_rating: 'ELO RATING',
    win_rate: 'WIN RATE',
    matches: 'MATCHES',
    wins: 'WINS',
    losses: 'LOSSES',
    ai_best_match: 'AI Best Match',
    ai_settings: 'AI SETTINGS',
    send_challenge: 'Send Challenge',
    upcoming_tournaments: 'Upcoming Tournaments',
    open_now: 'OPEN NOW',
    prize: 'Prize',
    register: 'Register',
    edit_profile: 'Edit Profile',
    app_preferences: 'App Preferences',
    logout: 'Logout',
    logout_confirm_title: 'Logout Confirmation',
    logout_confirm_desc: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    yes: 'Yes',
    nav_home: 'Home',
    nav_opponent: 'Opponent',
    nav_matches: 'Matches',
    nav_leaderboard: 'Rank',
    nav_profile: 'Profile',
    find_opponent_title: 'Find Opponent',
    search_placeholder: 'Search name or username...',
    sort_by: 'Sort by:',
    distance: 'Distance',
    level: 'Level',
    matches_played: 'Matches Played',
    opponent_profile: 'Opponent Profile',
    message: 'Message',
    sports_category: 'Sports Category',
    primary_sport: 'Primary Sport',
    secondary_sport: 'Secondary Sport',
    match_statistics: 'Match Statistics',
    trust_reputation: 'Trust & Reputation',
    trust_score: 'Trust Score',
    trust_desc: 'Verified schedule compliance & completion.',
    sportsmanship: 'Sportsmanship',
    sportsmanship_desc: 'Average opponent rating.',
    availability: 'Availability',
    days: 'Days',
    time: 'Time',
    create_challenge: 'Create Challenge',
    challenge_sent: 'Challenge Sent!',
    challenge_sent_desc: 'Your challenge has been successfully sent to ',
    awesome_btn: 'AWESOME!',
    sent_btn: 'SENT!',
    select_venue: 'Select Venue',
    location_denied: 'Location permission denied. Map will use your profile location.',
    location_failed: 'Failed to get current GPS location.',
    location_not_found: 'Location not found in the surrounding area.',
    location_search_error: 'Error searching for location.',
    custom_location_point: 'Selected Location Point',
    gps_coordinate: 'Based on GPS coordinates',
    searching_location: 'Searching for location...',
    drag_map: 'Drag map to pin location',
    loading_address: 'Loading address...',
    please_wait: 'Please wait a moment',
    pick_location_btn: 'PICK LOCATION',
    pick_location_toast: 'Please pick a location (Venue) first!',
    map_view: 'Map View',
    no_venue_selected: 'No Venue Selected',
    pick_location_desc: 'Tap to pick a location',
    custom_pin: 'Custom Pin',
    date_time: 'Date & Time',
    my_matches: 'My Matches',
    upcoming: 'Upcoming',
    pending: 'Pending',
    history: 'History',
    leaderboard: 'Leaderboard',
    global_rank: 'Global Rank',
    maximum_distance: 'Maximum Distance',
    skill_level: 'Skill Level',
    apply_best_match: 'Apply & Find Best Match',
    any: 'Any',
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
    accepted: 'Accepted',
    completed: 'Completed',
    action_required: 'ACTION REQUIRED',
    challenge_from: 'Challenge from',
    accept: 'Accept',
    reject: 'Reject',
    awaiting_verification: 'AWAITING VERIFICATION',
    input_score: 'Input Score',
    all_categories: 'All Categories',
    sport_badminton: 'Badminton',
    sport_futsal: 'Futsal',
    sport_basketball: 'Basketball',
    sport_volleyball: 'Volleyball',
    sport_tennis: 'Tennis',
    sport_billiards: 'Billiards',
    sport_ping_pong: 'Ping Pong',
    sport_mini_soccer: 'Mini Soccer',
    'sport_e-sports': 'E-Sports',
    sport_chess: 'Chess',
    sport_golf: 'Golf',
    sport_running: 'Running',
    sport_cycling: 'Cycling',
    sport_swimming: 'Swimming',
    sport_gym: 'Gym',
    filter_opponent: 'Filter Opponent',
    min_elo_rating: 'Minimum ELO Rating',
    sort_based_on: 'Sort Based On',
    rating_elo: 'ELO Rating',
    closest_distance: 'Closest Distance',
    reset: 'Reset',
    apply_filter: 'Apply Filter',
    sports_information: 'Sports Information',
    primary: 'Primary',
    secondary: 'Secondary',
    system_calculated: 'SYSTEM CALCULATED',
    language: 'Language',
    recommended: 'Recommended',
    available_nearby: 'AVAILABLE NEARBY',
    no_opponents: 'No opponents available',
    view_map: 'View Map',
    view_profile: 'View Profile',
    away: 'away',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    edit_profile_info: 'Edit Profile Info',
    full_name: 'Full Name',
    username: 'Username',
    location: 'Location',
    auto_detect: 'Auto Detect',
    primary_level: 'Primary Level',
    secondary_level: 'Secondary Level',
    available_days: 'Available Days',
    available_time: 'Available Time',
    save_changes: 'Save Changes',
    select_avatar: 'Select Avatar',
    select_sport: 'Select Sport',
    select_level: 'Select Level',
    select_days: 'Select Days',
    select_time_range: 'Select Time Range',
    update_profile_photo: 'Update Profile Photo',
    upload_from_device: 'Upload from Device',
    or_choose_preset: 'Or Choose Preset',
    select_language: 'Select Language',
    select_up_to_7_days: 'Select up to 7 available days.',
    save_days: 'Save Days',
    select_free_time: 'Select your free time range.',
    start_time: 'Start Time',
    end_time: 'End Time',
    save_time: 'Save Time',
    alert_limit_days_title: 'Day Limit',
    alert_limit_days_msg: 'You have already selected 7 days.',
    alert_empty_days_title: 'Empty Selection',
    alert_empty_days_msg: 'Please select at least one available day.',
    alert_permission_denied_title: 'Permission Denied',
    alert_permission_denied_msg: 'The application needs location (GPS) access for this feature.',
    alert_location_failed_title: 'Failed',
    alert_location_failed_msg: 'Unable to detect location. Make sure GPS is turned on.',
    alert_username_short_title: 'Username Too Short',
    alert_username_short_msg: 'Username must be at least 3 characters long.',
    alert_username_taken_title: 'Username Taken',
    alert_username_taken_msg: 'Sorry, this username is already taken. Please try another one.',
    match_stakes: 'Match Stakes',
    stakes_desc: 'Competitive matches affect ELO rating',
    friendly: 'Friendly',
    competitive: 'Competitive',
    map_view: 'MAP VIEW',
    no_venue_selected: 'No Venue Selected',
    pick_location_desc: 'Tap to pick a location',
    screenshot_restricted: 'Screenshots are restricted for privacy and copyright',
    feature_unavailable: 'Feature Unavailable',
    block_report_desc: 'Report/block feature',
    report_user: 'Report User',
    block_user: 'Block User',
    report_reason_title: 'Select a reason',
    reason_spam: 'Spam or Scam',
    reason_inappropriate: 'Inappropriate Content',
    reason_harassment: 'Harassment or Bullying',
    reason_fake: 'Fake Profile',
    cancel: 'Cancel',
    submit_report: 'Submit Report',
    report_success: 'Report submitted successfully. Thank you for keeping Sparo safe.',
    my_score: 'My Score',
    opponent_score: 'Opponent Score',
    submit_score: 'Submit Score',
    score_submitted_success: 'Score submitted! Awaiting opponent verification.',
    permission_denied: 'Permission Denied',
    camera_permission_required: 'Camera permission required',
    profile_photo: 'Profile Photo',
    camera: 'Camera',
    gallery: 'Gallery',
    start: 'Start',
    end: 'End',
    match_verification: 'Match Verification',
    gps_checkin: 'GPS Check-In',
    gps_checkin_desc: 'Anti-Fraud System: You must check in to prove you are at the venue.',
    checkin_now: 'Check-in Now',
    input_final_score: 'Input Final Score',
    submit_score_btn: 'Submit Score',
    opponent_confirmation: 'Opponent Confirmation',
    opponent_confirmation_desc: 'Do you agree with the score inputted by the opponent?',
    agree: 'Agree',
    disagree: 'Disagree',
    conflict_detected: 'Score Conflict Detected',
    conflict_desc: 'Your opponent did not agree with the score. Please upload a photo of the scoreboard for AI (OCR) verification.',
    upload_proof: 'Upload Proof (OCR)',
    change_photo: 'Change Photo',
    ocr_info: 'Our AI will use OCR (Optical Character Recognition) to validate the score from the uploaded photo.',
    official: 'OFFICIAL',
    sponsored: 'SPONSORED',
    community: 'COMMUNITY',
    by: 'By',
    ai_settings_desc: 'Fine-tune the matchmaking algorithm to find your perfect rival.'
  },
  'Bahasa Indonesia': {
    welcome: 'Selamat datang,',
    active_player: 'Pemain Aktif',
    elo_rating: 'RATING ELO',
    win_rate: 'RASIO MENANG',
    matches: 'PERTANDINGAN',
    wins: 'MENANG',
    losses: 'KALAH',
    ai_best_match: 'Rekomendasi Terbaik AI',
    ai_settings: 'PENGATURAN AI',
    send_challenge: 'Kirim Tantangan',
    upcoming_tournaments: 'Turnamen Mendatang',
    open_now: 'BUKA',
    prize: 'Hadiah',
    register: 'Daftar',
    edit_profile: 'Ubah Profil',
    app_preferences: 'Pengaturan Aplikasi',
    logout: 'Keluar',
    logout_confirm_title: 'Konfirmasi Keluar',
    logout_confirm_desc: 'Apakah Anda yakin ingin keluar?',
    cancel: 'Batal',
    yes: 'Ya',
    nav_home: 'Beranda',
    nav_opponent: 'Lawan',
    nav_matches: 'Tanding',
    nav_leaderboard: 'Peringkat',
    nav_profile: 'Profil',
    find_opponent_title: 'Cari Lawan',
    search_placeholder: 'Cari nama atau username...',
    sort_by: 'Urutkan:',
    distance: 'Jarak',
    level: 'Level',
    matches_played: 'Total Main',
    opponent_profile: 'Profil Lawan',
    message: 'Pesan',
    sports_category: 'Cabang Olahraga',
    primary_sport: 'Olahraga Utama',
    secondary_sport: 'Olahraga Sekunder',
    match_statistics: 'Statistik Pertandingan',
    trust_reputation: 'Kepercayaan & Reputasi',
    trust_score: 'Skor Kepercayaan',
    trust_desc: 'Kepatuhan jadwal & penyelesaian terverifikasi.',
    sportsmanship: 'Sportivitas',
    sportsmanship_desc: 'Rata-rata penilaian dari lawan.',
    availability: 'Ketersediaan',
    days: 'Hari',
    time: 'Waktu',
    create_challenge: 'Buat Tantangan',
    challenge_sent: 'Tantangan Terkirim!',
    challenge_sent_desc: 'Tantangan Anda telah berhasil dikirim ke ',
    awesome_btn: 'MANTAP!',
    sent_btn: 'TERKIRIM!',
    select_venue: 'Pilih Lokasi',
    location_denied: 'Izin lokasi ditolak. Peta akan tetap menggunakan lokasi profil Anda.',
    location_failed: 'Gagal mengambil lokasi GPS saat ini.',
    location_not_found: 'Lokasi tidak ditemukan di area sekitar.',
    location_search_error: 'Error mencari lokasi.',
    custom_location_point: 'Titik Lokasi Pilihan',
    gps_coordinate: 'Sesuai titik koordinat GPS',
    searching_location: 'Mencari lokasi...',
    drag_map: 'Geser peta untuk menentukan titik',
    loading_address: 'Memuat alamat...',
    please_wait: 'Mohon tunggu sebentar',
    pick_location_btn: 'PILIH LOKASI',
    pick_location_toast: 'Silakan pilih lokasi (Venue) terlebih dahulu!',
    map_view: 'Lihat Peta',
    no_venue_selected: 'Belum Ada Lokasi',
    pick_location_desc: 'Ketuk untuk memilih lokasi',
    custom_pin: 'Pin Kustom',
    date_time: 'Tanggal & Waktu',
    my_matches: 'Pertandingan Saya',
    upcoming: 'Mendatang',
    pending: 'Menunggu',
    history: 'Riwayat',
    leaderboard: 'Papan Peringkat',
    global_rank: 'Peringkat Global',
    maximum_distance: 'Jarak Maksimal',
    skill_level: 'Level Kemampuan',
    apply_best_match: 'Terapkan & Cari Lawan',
    any: 'Semua',
    beginner: 'Pemula',
    intermediate: 'Menengah',
    advanced: 'Mahir',
    expert: 'Pakar',
    accepted: 'Diterima',
    completed: 'Selesai',
    action_required: 'BUTUH TINDAKAN',
    challenge_from: 'Tantangan dari',
    accept: 'Terima',
    reject: 'Tolak',
    awaiting_verification: 'MENUNGGU VERIFIKASI',
    input_score: 'Masukkan Skor',
    all_categories: 'Semua Kategori',
    sport_badminton: 'Badminton',
    sport_futsal: 'Futsal',
    sport_basketball: 'Bola Basket',
    sport_volleyball: 'Bola Voli',
    sport_tennis: 'Tenis',
    sport_billiards: 'Biliar',
    sport_ping_pong: 'Ping Pong',
    sport_mini_soccer: 'Mini Soccer',
    'sport_e-sports': 'E-Sports',
    sport_chess: 'Catur',
    sport_golf: 'Golf',
    sport_running: 'Lari',
    sport_cycling: 'Bersepeda',
    sport_swimming: 'Renang',
    sport_gym: 'Gym',
    filter_opponent: 'Filter Lawan',
    min_elo_rating: 'Minimum ELO Rating',
    sort_based_on: 'Urutkan Berdasarkan',
    rating_elo: 'Rating ELO',
    closest_distance: 'Jarak Terdekat',
    reset: 'Reset',
    apply_filter: 'Terapkan Filter',
    sports_information: 'Informasi Olahraga',
    primary: 'Utama',
    secondary: 'Sekunder',
    system_calculated: 'DIHITUNG SISTEM',
    language: 'Bahasa',
    recommended: 'Rekomendasi',
    available_nearby: 'TERSEDIA DI SEKITAR',
    no_opponents: 'Tidak ada lawan yang tersedia',
    view_map: 'Lihat Peta',
    view_profile: 'Lihat Profil',
    away: 'dari Anda',
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
    saturday: 'Sabtu',
    sunday: 'Minggu',
    edit_profile_info: 'Edit Info Profil',
    full_name: 'Nama Lengkap',
    username: 'Nama Pengguna',
    location: 'Lokasi',
    auto_detect: 'Deteksi Otomatis',
    primary_level: 'Level Utama',
    secondary_level: 'Level Sekunder',
    available_days: 'Hari Tersedia',
    available_time: 'Waktu Tersedia',
    save_changes: 'Simpan Perubahan',
    select_avatar: 'Pilih Avatar',
    select_sport: 'Pilih Olahraga',
    select_level: 'Pilih Level',
    select_days: 'Pilih Hari',
    select_time_range: 'Pilih Waktu',
    update_profile_photo: 'Perbarui Foto Profil',
    upload_from_device: 'Unggah dari Perangkat',
    or_choose_preset: 'Atau Pilih Preset',
    select_language: 'Pilih Bahasa',
    select_up_to_7_days: 'Pilih maksimal 7 hari tersedia.',
    save_days: 'Simpan Hari',
    select_free_time: 'Pilih rentang waktu luang Anda.',
    start_time: 'Waktu Mulai',
    end_time: 'Waktu Selesai',
    save_time: 'Simpan Waktu',
    alert_limit_days_title: 'Batas Hari',
    alert_limit_days_msg: 'Anda sudah memilih 7 hari.',
    alert_empty_days_title: 'Pilihan Kosong',
    alert_empty_days_msg: 'Harap pilih setidaknya satu hari ketersediaan Anda.',
    alert_permission_denied_title: 'Izin Ditolak',
    alert_permission_denied_msg: 'Aplikasi membutuhkan akses lokasi (GPS) untuk fitur ini.',
    alert_location_failed_title: 'Gagal',
    alert_location_failed_msg: 'Tidak dapat mendeteksi lokasi. Pastikan GPS menyala.',
    alert_username_short_title: 'Username Terlalu Pendek',
    alert_username_short_msg: 'Username minimal terdiri dari 3 karakter.',
    alert_username_taken_title: 'Username Sudah Digunakan',
    alert_username_taken_msg: 'Maaf, username tersebut sudah dipakai orang lain. Silakan cari kombinasi lain.',
    match_stakes: 'Taruhan Pertandingan',
    stakes_desc: 'Pertandingan kompetitif memengaruhi rating ELO',
    friendly: 'Persahabatan',
    competitive: 'Kompetitif',
    map_view: 'LIHAT PETA',
    no_venue_selected: 'Belum Ada Lokasi',
    pick_location_desc: 'Ketuk untuk memilih lokasi',
    screenshot_restricted: 'Cuplikan layar dibatasi untuk privasi dan hak cipta',
    feature_unavailable: 'Fitur Belum Tersedia',
    block_report_desc: 'Fitur laporkan/blokir',
    report_user: 'Laporkan Pengguna',
    block_user: 'Blokir Pengguna',
    report_reason_title: 'Pilih alasan laporan',
    reason_spam: 'Spam atau Penipuan',
    reason_inappropriate: 'Konten Tidak Pantas',
    reason_harassment: 'Pelecehan atau Penindasan',
    reason_fake: 'Profil Palsu',
    cancel: 'Batal',
    submit_report: 'Kirim Laporan',
    report_success: 'Laporan berhasil dikirim. Terima kasih telah menjaga komunitas Sparo.',
    my_score: 'Skor Saya',
    opponent_score: 'Skor Lawan',
    submit_score: 'Kirim Skor',
    score_submitted_success: 'Skor terkirim! Menunggu verifikasi lawan.',
    permission_denied: 'Izin Ditolak',
    camera_permission_required: 'Izin kamera dibutuhkan',
    profile_photo: 'Foto Profil',
    camera: 'Kamera',
    gallery: 'Galeri',
    start: 'Mulai',
    end: 'Selesai',
    match_verification: 'Verifikasi Pertandingan',
    gps_checkin: 'GPS Check-In',
    gps_checkin_desc: 'Sistem Anti-Fraud: Anda wajib melakukan check-in lokasi untuk membuktikan bahwa Anda berada di venue.',
    checkin_now: 'Check-in Lokasi',
    input_final_score: 'Input Skor Akhir',
    submit_score_btn: 'Kirim Skor',
    opponent_confirmation: 'Konfirmasi Skor dari Lawan',
    opponent_confirmation_desc: 'Apakah Anda menyetujui skor yang dimasukkan lawan?',
    agree: 'Setuju (Agree)',
    disagree: 'Tidak (Disagree)',
    conflict_detected: 'Konflik Skor Terdeteksi',
    conflict_desc: 'Lawan Anda tidak menyetujui hasil skor. Silakan unggah foto scoreboard (papan skor) untuk diverifikasi oleh AI (OCR).',
    upload_proof: 'Upload Bukti (OCR)',
    change_photo: 'Ganti Foto',
    ocr_info: 'Sistem akan membaca teks angka di foto yang Anda upload menggunakan Tesseract OCR Python di Backend.',
    official: 'RESMI',
    sponsored: 'SPONSOR',
    community: 'KOMUNITAS',
    by: 'Oleh',
    ai_settings_desc: 'Sesuaikan algoritma matchmaking untuk menemukan lawan yang paling tepat.'
  }
};

Object.assign(translations, extraTranslations);

const useAppStore = create((set, get) => ({
  // 1. STATE UNTUK PROFIL PENGGUNA
  profile: null,
  token: null,
  isAuthLoaded: false,
  
  initializeAuth: async () => {
    try {
      const storedToken = await AsyncStorage.getItem('sparo_token');
      const storedProfile = await AsyncStorage.getItem('sparo_profile');
      const storedLoginTime = await AsyncStorage.getItem('sparo_login_time');
      
      if (storedToken && storedProfile && storedLoginTime) {
        const loginTime = parseInt(storedLoginTime, 10);
        const currentTime = Date.now();
        const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
        
        // Cek apakah sesi sudah lebih dari 7 hari
        if (currentTime - loginTime > sevenDaysInMillis) {
          // Sesi kadaluarsa, hapus data
          await AsyncStorage.multiRemove(['sparo_token', 'sparo_profile', 'sparo_login_time']);
          set({ isAuthLoaded: true }); // Tetap bernilai null agar redirect ke Auth
        } else {
          // Sesi masih aktif, PERBARUI waktu login agar diperpanjang 7 hari ke depan
          await AsyncStorage.setItem('sparo_login_time', currentTime.toString());
          set({ token: storedToken, profile: JSON.parse(storedProfile), isAuthLoaded: true });
        }
      } else {
        set({ isAuthLoaded: true });
      }
    } catch (e) {
      console.log('Failed to load auth state', e);
      set({ isAuthLoaded: true });
    }
  },
  
  updateProfile: (newUpdates) => set((state) => {
    const updatedProfile = { ...state.profile, ...newUpdates };
    AsyncStorage.setItem('sparo_profile', JSON.stringify(updatedProfile)).catch(err => console.log('Save profile error', err));
    return { profile: updatedProfile };
  }),

  loginAsUser: (userData, tokenStr) => set(() => {
    // Memetakan data dari backend (snake_case) ke frontend (camelCase) dan memberi nilai default yang aman
    const mappedUser = {
      id: userData.id,
      username: userData.username,
      fullName: userData.full_name || userData.fullName || 'New User',
      email: userData.email,
      avatar: userData.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
      location: userData.location || 'Location Not Set',
      latitude: userData.latitude || null,
      longitude: userData.longitude || null,
      primarySport: userData.primary_sport || userData.primarySport || 'Badminton',
      primaryLevel: userData.primary_level || userData.primaryLevel || 'BEGINNER',
      secondarySport: userData.secondary_sport || userData.secondarySport || 'Futsal',
      secondaryLevel: userData.secondary_level || userData.secondaryLevel || 'BEGINNER',
      availableDays: userData.available_days || userData.availableDays || 'Saturday, Sunday',
      availableTime: userData.available_time || userData.availableTime || '08:00 - 10:00',
      trustScore: userData.trust_score !== undefined ? userData.trust_score : 100,
      sportsmanship: userData.sportsmanship !== undefined ? userData.sportsmanship : 5.0,
      elo: userData.elo !== undefined ? userData.elo : 1000,
      matches: userData.matches !== undefined ? userData.matches : 0,
      wins: userData.wins !== undefined ? userData.wins : 0,
      losses: userData.losses !== undefined ? userData.losses : 0,
    };
    
    // Save to AsyncStorage explicitly
    if (tokenStr) AsyncStorage.setItem('sparo_token', tokenStr).catch(err => console.log(err));
    AsyncStorage.setItem('sparo_profile', JSON.stringify(mappedUser)).catch(err => console.log(err));
    AsyncStorage.setItem('sparo_login_time', Date.now().toString()).catch(err => console.log(err));
    
    return { profile: mappedUser, token: tokenStr || null };
  }),

  // 2. STATE UNTUK BAHASA (LANGUAGE) & TRANSLATIONS
  language: 'English (US)',
  
  setLanguage: (newLanguage) => set({ language: newLanguage }),

  t: (key) => {
    const lang = get().language;
    
    // Combine local translations and extraTranslations
    const allTranslations = { ...translations, ...extraTranslations };

    // Fallback to English if the translation doesn't exist for the current language
    return (allTranslations[lang] && allTranslations[lang][key]) 
      || (allTranslations['English (US)'] && allTranslations['English (US)'][key]) 
      || key;
  },

  // 3. STATE UNTUK PERTANDINGAN (MATCHES)
  // Ini akan digunakan nanti untuk layar Chat atau Opponent
  activeMatches: [],
  pendingMatchesCount: 0,
  setPendingMatchesCount: (count) => set({ pendingMatchesCount: count }),
  
  addMatch: (match) => set((state) => ({
    activeMatches: [...state.activeMatches, match]
  })),

  // 4. STATE UNTUK CHATTING (CHAT ROOMS)
  // Format: { [opponentId]: [ { id, text, sender, timestamp, status } ] }
  // Status: 'sent', 'delivered', 'read'
  chatRooms: {},
  
  pushToken: null,
  
  registerForPushNotificationsAsync: async (userId) => {
    let token;
    
    // We import dynamically so it doesn't crash on web or unsupported platforms immediately
    try {
      const Constants = require('expo-constants').default || require('expo-constants');
      if (Constants.executionEnvironment === 'storeClient') {
        console.log('Push notifications are not supported in Expo Go SDK 53+. Skipping registration.');
        return;
      }

      const Notifications = require('expo-notifications');
      const Device = require('expo-device');
      
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: "sparo-app" // Use your real Expo Project ID if configured
        })).data;
        
        console.log("Expo Push Token:", token);
        set({ pushToken: token });
        
        // Send token to backend
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
        await fetch(`${apiUrl}/users/${userId}/push-token`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expo_push_token: token })
        });
      } else {
        console.log('Must use physical device for Push Notifications');
      }
    } catch (error) {
      console.log("Error registering push notification:", error);
    }
  },
  
  socket: null,

  connectWebSocket: (userId) => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000';
    let wsUrl = apiUrl.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/chat/${userId}`);
    
    ws.onerror = (error) => console.log('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed');
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { id, sender_id, receiver_id, text, timestamp, status } = message;
        // Determine room ID based on who we are chatting with
        const isFromMe = String(sender_id) === String(userId);
        const roomId = isFromMe ? String(receiver_id) : String(sender_id);
        
        let localTimestamp = timestamp;
        if (timestamp && timestamp.includes(':') && !timestamp.includes('T')) {
          const [hours, minutes] = timestamp.split(':');
          const date = new Date();
          date.setUTCHours(parseInt(hours, 10));
          date.setUTCMinutes(parseInt(minutes, 10));
          localTimestamp = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }

        const formattedMsg = {
          id: String(id),
          text,
          sender: isFromMe ? 'user' : 'opponent',
          timestamp: localTimestamp,
          status
        };
        
        get().addMessage(roomId, formattedMsg);
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };
    
    set({ socket: ws });
  },

  disconnectWebSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.close();
      set({ socket: null });
    }
  },
  
  setChatRoomMessages: (roomId, messages) => set((state) => ({
    chatRooms: {
      ...state.chatRooms,
      [roomId]: messages
    }
  })),
  
  addMessage: (roomId, message) => set((state) => {
    const roomMessages = state.chatRooms[roomId] || [];
    // Prevent duplicate messages by checking ID
    if (roomMessages.some(msg => String(msg.id) === String(message.id))) {
        return state;
    }
    return {
      chatRooms: {
        ...state.chatRooms,
        [roomId]: [...roomMessages, message]
      }
    };
  }),

  updateMessageStatus: (roomId, messageId, newStatus) => set((state) => {
    const roomMessages = state.chatRooms[roomId] || [];
    const updatedMessages = roomMessages.map(msg => 
      msg.id === messageId ? { ...msg, status: newStatus } : msg
    );
    return {
      chatRooms: {
        ...state.chatRooms,
        [roomId]: updatedMessages
      }
    };
  }),

  markRoomAsRead: (roomId) => set((state) => {
    const roomMessages = state.chatRooms[roomId] || [];
    const updatedMessages = roomMessages.map(msg => 
      msg.sender === 'opponent' ? { ...msg, status: 'read' } : msg
    );
    return {
      chatRooms: {
        ...state.chatRooms,
        [roomId]: updatedMessages
      }
    };
  }),

  // 5. STATE UNTUK LAWAN YANG SEDANG DIPILIH
  selectedOpponent: null,
  setSelectedOpponent: (opponent) => set({ selectedOpponent: opponent }),

  hasNewMatches: false,
  setHasNewMatches: (val) => set({ hasNewMatches: val }),

  tempVenue: null,
  setTempVenue: (venue) => set({ tempVenue: venue }),

  // 6. FUNGSI UNTUK MERESET SEMUA STATE SAAT LOGOUT
  logout: () => {
    AsyncStorage.multiRemove(['sparo_token', 'sparo_profile', 'sparo_login_time']).catch(err => console.log(err));
    set({
      profile: null,
      token: null,
      activeMatches: [],
      chatRooms: {},
      selectedOpponent: null
    });
  }
}));

export default useAppStore;
