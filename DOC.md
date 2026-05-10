# DOKUMENTASI TEKNIS SISTEM: TLP LEDGER (SMART FINANCIAL TRACKER)

## 1. Deskripsi Sistem
**TLP Ledger** adalah sebuah sistem aplikasi manajemen keuangan pribadi (Buku Besar/Ledger) berbasis web yang dirancang dengan integrasi Kecerdasan Buatan (Artificial Intelligence). Fungsi utama sistem ini adalah memungkinkan pengguna untuk mencatat transaksi keuangan secara intuitif menggunakan bahasa alami (Natural Language Processing), alih-alih mengisi formulir manual yang kaku. 

Sistem ini memiliki kapabilitas *Offline-First* dan dibekali dengan arsitektur pemrosesan ganda: menggunakan API pihak ketiga untuk akurasi tinggi saat daring (*online*), serta menggunakan model *Machine Learning* lokal yang tertanam di dalam peramban saat luring (*offline*).

## 2. Arsitektur dan Teknologi
Aplikasi ini dikembangkan menggunakan tumpukan teknologi modern berkinerja tinggi (*Modern Frontend Stack*):

▪ **Kerangka Kerja Utama (Framework):** Vue.js 3 dengan *Composition API*.
▪ **Bahasa Pemrograman:** TypeScript (memberikan keamanan tipe data statis yang kuat).
▪ **Build Tool:** Vite (menghasilkan proses kompilasi dan *Hot Module Replacement* yang sangat cepat).
▪ **Manajemen Keadaan (State Management):** Arsitektur reaktif kustom via *Composables* (`useAppStore.ts` / `useAI.ts`).
▪ **Antarmuka & Gaya (UI/UX):** Tailwind CSS dipadukan dengan komponen *headless* dari Shadcn-Vue (Radix UI).
▪ **Pusat Basis Data Klien:** Menggunakan pendekatan penyimpanan lokal pada peramban klien (IndexedDB / LocalStorage) dienkapsulasi pada modul `db/index.ts`.
▪ **Model Pembelajaran Mesin Lokal:** Naive Bayes Classifier yang dikonversi dari model Python (`nb-model.py`) ke format JSON statis (`nb_model_complex_new.json`) untuk dijalankan murni menggunakan JavaScript/TypeScript.

## 3. Fitur Utama yang Tersedia
Sistem TLP Ledger saat ini dilengkapi dengan spesifikasi fitur fungsional berikut:

* **Pencatatan Berbasis Bahasa Alami (Smart Entry):**
  Pengguna dapat mengetik kalimat seperti *"Beli makan siang 50 ribu"* dan sistem akan secara otomatis mengekstrak nominal (50.000), jenis transaksi (Pengeluaran), dan kategori (Makanan).
* **AI Fallback System (Sistem Redundansi Cerdas):**
  Memiliki modul ganda untuk memproses teks. Jika koneksi internet tersedia dan kunci API dikonfigurasi, sistem memanggil layanan Google Gemini AI (`GeminiAI.ts`). Jika koneksi terputus, sistem secara otomatis mengalihkan tugas analitik ke model klasifikasi Naive Bayes lokal (`OfflineNaiveBayes.ts`).
* **Dasbor & Analitik Keuangan (Financial Dashboard):**
  Modul `AnalyticsService.ts` dan `FinancialChart.vue` memvisualisasikan data arus kas, membandingkan pemasukan dan pengeluaran, serta menunjukkan tren keuangan harian/bulanan.
* **Manajemen Buku Besar Berpusat Pengguna (Ledger Management):**
  Operasi baca, tulis, ubah, dan hapus (CRUD) penuh pada entri transaksi melalui antarmuka `EntryView.vue`.
* **Sistem Pelaporan dan Ekspor (Reporting & Export):**
  Kemampuan menghasilkan rekapitulasi data keuangan dan mengekspornya ke dalam format dokumen *Microsoft Excel* (via modul `ExcelGenerator.ts`).
* **Konfigurasi Sistem Dinamis:**
  Menu pengaturan untuk mengelola kunci integrasi API AI, preferensi tampilan, dan profil pengguna pada `SettingsView.vue`.

## 4. Bagaimana Sistem Bekerja (Alur Eksekusi)

1. **Inisialisasi Sistem:**
   Sistem dimuat melalui `src/main.js` yang menginisiasi instansiasi Vue, memuat perutean (`vue-router`), dan komponen antarmuka. Status awal ditarik dari basis data lokal (`db/index.ts`).
2. **Alur Pemrosesan Teks Cerdas (Smart Parsing):**
   * Pengguna memasukkan deskripsi transaksi pada kolom input.
   * Input diteruskan ke modul `SmartParser.ts` dan kemudian didelegasikan ke `AIProcessor.ts`.
   * **Pengecekan Daring:** Jika kunci API Gemini dikonfigurasi dan peramban memiliki koneksi internet, permintaan dikirimkan ke model `GeminiAI.ts` untuk mengklasifikasikan kalimat dan mengekstrak entitas.
   * **Pengecekan Luring (Fallback):** Jika API gagal atau tidak ada internet, algoritma memuat kamus probabilitas dari `nb_model_complex_new.json` (dihasilkan oleh skrip Python). Algoritma menghitung bobot klasifikasi secara matematis murni menggunakan sumber daya perangkat klien melalui `OfflineNaiveBayes.ts` untuk menentukan kategori dan jenis pengeluaran.
3. **Perekaman Data:**
   Data terstruktur yang dihasilkan (Tanggal, Nominal, Kategori, Jenis, Deskripsi) diserahkan ke antarmuka untuk dikonfirmasi pengguna, lalu dieksekusi oleh `TransactionLogic.ts` yang menyimpannya secara permanen ke dalam basis data peramban klien.
4. **Analitik Dinamis:**
   Sistem reaktif secara otomatis memanggil `AnalyticsService.ts` guna menghitung ulang total saldo, persentase pengeluaran, dan mengirimkan metrik terbaru ke komponen bagan (Chart).

## 5. Struktur Direktori Utama

* `public/` : Aset statis, termasuk fail `nb_model_complex_new.json` (model probabilitas *Machine Learning* luring).
* `src/components/` : Modul antarmuka yang dapat digunakan kembali (*reusable components*), terbagi atas tata letak (layouts), komponen kompleks (modules), dan unit antarmuka dasar (ui - Shadcn).
* `src/composables/` : Kait komputasi reaktif Vue (misalnya logika integrasi AI).
* `src/db/` : Abstraksi basis data lokal.
* `src/models/` : Definisi entitas dan jembatan logika inti (terutama orkestrasi kecerdasan buatan pada `AIProcessor.ts`).
* `src/router/` : Manajemen navigasi URL sisi klien.
* `src/services/` : Logika bisnis utama (Pembuatan Laporan, Pemrosesan AI Offline, Parsing Cerdas, Perhitungan Analitik).
* `src/stores/` : Pusat penyimpanan keadaan global.
* `src/types/` : Berkas definisi antarmuka TypeScript untuk keamanan tipe data yang solid.
* `src/views/` : Komponen tingkat halaman utama aplikasi.
* `nb-model.py` : Berkas sumber algoritma eksternal untuk melakukan pelatihan (*training*) *Dataset* awal ke dalam probabilitas Naive Bayes dan merubahnya menjadi JSON.

## 6. Panduan Instalasi Lokal

**Prasyarat:**
* Node.js v18.x atau lebih baru.
* NPM atau Yarn atau PNPM.
* Kunci API Google Gemini (Opsional, untuk fungsionalitas pengurai teks daring).

**Langkah Instalasi:**
1. Kloning repositori ini.
2. Buka terminal pada direktori proyek.
3. Jalankan perintah instalasi dependensi:
   `npm install`
4. Jalankan peladen pengembangan lokal:
   `npm run dev`
5. Aplikasi akan dapat diakses melalui `http://localhost:5173`.
6. Akses menu Pengaturan (Settings) di dalam aplikasi untuk memasukkan kunci API Gemini Anda.

**Untuk Pembaruan Model Klasifikasi Luring (Opsional):**
Jika Anda ingin menambah kecerdasan luring, modifikasi skrip Python `nb-model.py`, lalu jalankan menggunakan `python nb-model.py`. Skrip tersebut akan menghasilkan pembaruan terhadap fail `public/models/nb_model_complex_new.json`.

## 7. Rencana Pengembangan Berikutnya (Future Roadmap)

Untuk memperluas kapabilitas TLP Ledger sebagai asisten finansial paripurna, beberapa inisiatif pengembangan di masa mendatang disarankan:

1. **Sinkronisasi Awan (Cloud Sync):**
   Implementasi arsitektur perutean *backend* menggunakan Supabase, Firebase, atau basis data kustom untuk sinkronisasi data *cross-device* antar perangkat seluler dan desktop secara aman.
2. **Pengenalan Karakter Optik (Optical Character Recognition / OCR):**
   Membangun kapabilitas untuk memindai bukti struk atau nota fisik menggunakan kamera gawai, mengubahnya menjadi teks, lalu mengumpankannya ke fungsi `SmartParser.ts` yang sudah ada untuk pencatatan tanpa mengetik.
3. **Penyempurnaan Model Luring Lanjutan:**
   Memigrasikan logika `OfflineNaiveBayes` statis ke perpustakaan yang lebih mahir seperti TensorFlow.js (WASM) untuk deteksi kategori secara lokal (luring) dengan presisi yang ekuivalen terhadap Google Gemini AI.
4. **Modul Penganggaran (Budgeting Module):**
   Memberikan fungsionalitas penetapan limit pengeluaran bulanan per kategori dan menyisipkan peringatan peringatan (alert) otomatis apabila pengeluaran mendekati batas kuota tersebut.
5. **Dukungan Multi-Mata Uang (Multi-Currency Support):**
   Fasilitas konversi nilai tukar secara *real-time* bagi pengguna yang sering bertransaksi melintasi zona ekonomi konvensional.
