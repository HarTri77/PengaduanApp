# PengaduanApp - Sistem Pengaduan Masyarakat

Aplikasi web untuk sistem pengaduan masyarakat yang memungkinkan warga melaporkan masalah infrastruktur dan pelayanan publik kepada pemerintah daerah.

## 🚀 Fitur

- **Dashboard** - Ringkasan laporan dan statistik
- **Buat Pengaduan** - Form untuk membuat laporan baru dengan foto/video
- **Kelola Laporan** - Filter, cari, dan ubah status laporan
- **Sistem Rating** - Beri rating kepada pemerintah daerah
- **Profil Pengguna** - Kelola data profil dan avatar
- **Responsive Design** - Optimized untuk desktop dan mobile

## 📁 Struktur Project

```
pengaduan-app/
├── index.html              # Main HTML file
├── css/                    # Stylesheets
│   ├── base.css            # Reset & base styles
│   ├── components.css      # Component styles
│   ├── layout.css          # Layout & grid system
│   └── responsive.css      # Responsive breakpoints
├── js/                     # JavaScript modules
│   ├── config.js           # App configuration
│   ├── utils.js            # Utility functions
│   ├── storage.js          # Data management
│   ├── app.js              # Main application
│   └── components/         # UI components
│       ├── navigation.js   # Navigation & routing
│       ├── profile.js      # Profile management
│       ├── reports.js      # Reports CRUD
│       ├── rating.js       # Rating system
│       └── modal.js        # Modal dialogs
└── README.md               # Documentation
```

## 🛠️ Setup dan Installation

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (untuk development local)

### Menjalankan Aplikasi

1. Clone atau download project ini
2. Buka terminal di folder project
3. Jalankan local server:
   ```bash
   # Menggunakan Python
   python -m http.server 8000
   
   # Menggunakan Node.js
   npx serve .
   
   # Menggunakan PHP
   php -S localhost:8000
   ```
4. Buka browser dan akses `http://localhost:8000`

### Alternatif: Buka Langsung
Untuk testing cepat, bisa langsung membuka `index.html` di browser, tapi beberapa fitur mungkin terbatas karena CORS policy.

## 📱 Penggunaan

### 1. Dashboard
- Melihat ringkasan laporan terbaru
- Statistik pengaduan (total, pending, selesai)
- Quick access ke fitur utama

### 2. Membuat Pengaduan
- Klik tombol "+" floating action button
- Isi form dengan lengkap:
  - Nama pelapor
  - Lokasi kejadian
  - Judul pengaduan
  - Deskripsi detail
  - Upload foto/video bukti (opsional)
- Submit laporan

### 3. Kelola Laporan
- Filter berdasarkan status (Baru/Proses/Selesai)
- Sortir berdasarkan tanggal
- Pencarian berdasarkan judul/lokasi
- Ubah status laporan
- Lihat detail lengkap

### 4. Rating System
- Beri rating 1-5 bintang
- Tambahkan komentar (opsional)
- Lihat rating rata-rata dan semua review

### 5. Profil
- Edit nama dan email
- Upload foto profil
- Data tersimpan secara lokal

## 🏗️ Arsitektur Technical

### Frontend Architecture
- **Vanilla JavaScript** - No frameworks, pure JS modules
- **Component-based** - Modular dan reusable components
- **Event-driven** - Clean separation of concerns
- **LocalStorage** - Data persistence di browser

### Data Structure
```javascript
// Reports
{
  id: string,
  title: string,
  name: string,
  location: string,
  description: string,
  files: string[],      // Base64 data URLs
  status: 'baru'|'proses'|'selesai',
  createdAt: number     // timestamp
}

// Profile
{
  name: string,
  email: string,
  avatarData: string    // Base64 data URL
}

// Ratings
{
  id: string,
  score: number,        // 1-5
  comment: string,
  at: number           // timestamp
}
```

### Component Communication
- **Storage** - Central data management
- **Events** - Component interactions
- **Utils** - Shared utility functions
- **Global references** - Backward compatibility

## 🎨 Design System

### Colors
- **Primary**: `#b71c1c` (Deep red)
- **Secondary**: `#ff4d4d` (Bright red)  
- **Background**: `#0b0b0b` to `#121212` (Dark gradient)
- **Text**: `#eee` (Light gray)
- **Accent**: `#ffbcbc` (Light red)

### Typography
- **Font**: Poppins (Google Fonts)
- **Weights**: 300, 400, 600, 700

### Layout
- **Grid**: CSS Grid for main layout
- **Cards**: Glassmorphism style
- **Responsive**: Mobile-first approach

## 🔧 Development

### Menambah Fitur Baru

1. **Component baru:**
   ```javascript
   // js/components/new-component.js
   const NewComponent = {
     init() { /* initialization */ },
     // ... methods
   };
   ```

2. **Update app.js:**
   ```javascript
   // Tambahkan di componentInitializers
   { name: 'NewComponent', instance: NewComponent }
   ```

3. **Update HTML:** Tambahkan markup yang diperlukan

### Code Standards

- **ES6+ syntax** - Arrow functions, const/let, destructuring
- **Modular approach** - Each component in separate file
- **Error handling** - Try-catch blocks dan validation
- **Documentation** - JSDoc comments untuk functions
- **Naming conventions** - camelCase untuk variables/functions

### Performance Optimization

- **Image optimization** - Compress uploaded files
- **Lazy loading** - Load components when needed
- **Debouncing** - Search input dan frequent actions
- **Local storage** - Minimize data size
- **CSS optimization** - Use efficient selectors

## 📱 Browser Support

- **Chrome** 70+
- **Firefox** 65+
- **Safari** 12+
- **Edge** 79+

### Required Features
- ES6 Modules
- LocalStorage API
- FileReader API
- CSS Grid
- Flexbox

## 🐛 Troubleshooting

### Common Issues

1. **Data tidak tersimpan**
   - Check browser LocalStorage enabled
   - Clear browser cache
   - Check console for errors

2. **File upload tidak berfungsi**
   - Pastikan file size < 5MB
   - Format yang didukung: image/*, video/*
   - Check browser FileReader support

3. **Styling broken**
   - Pastikan CSS files ter-load
   - Check network tab untuk missing resources
   - Verify CSS path benar

### Debug Mode

Buka browser console dan akses:
```javascript
// Lihat state aplikasi
PengaduanApp.debug.getState()

// Clear semua data
PengaduanApp.debug.clearData()

// Tambah test data
PengaduanApp.debug.addTestData()
```

## 🚧 Roadmap

### Planned Features
- [ ] Export laporan ke PDF/Excel
- [ ] Push notifications
- [ ] Geolocation integration
- [ ] Multi-user support
- [ ] Admin dashboard
- [ ] API integration
- [ ] PWA support

### Known Limitations
- Data only stored locally (not synced)
- No real authentication
- File uploads stored as base64 (storage-heavy)
- No backend integration

## 📄 License

MIT License - silakan gunakan dan modifikasi sesuai kebutuhan.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes dengan descriptive messages
4. Submit pull request

## 📞 Support

Untuk pertanyaan atau issues:
- Create GitHub issue
- Email: developer@example.com
- Documentation: Lihat comments di source code

---

**Dibuat dengan ❤️ untuk transparansi dan pelayanan publik yang lebih baik**