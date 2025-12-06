# Dokumentasi Program Pelatihan AI Naive Bayes Classifier

## 1. Pendahuluan dan Gambaran Umum

### 1.1 Definisi Program
Program `nb-model.py` adalah sistem pelatihan kecerdasan buatan (AI) berbasis algoritma Naive Bayes Classifier yang dikembangkan secara khusus untuk mendeteksi dan mengklasifikasi entitas dalam transaksi keuangan. Program ini mampu mengenali berbagai komponen penting dalam transaksi seperti nama item, kuantitas, harga, dan satuan dengan menggunakan pendekatan pemrosesan bahasa alami (Natural Language Processing/NLP).

### 1.2 Tujuan Pengembangan
Program ini dirancang untuk memenuhi beberapa tujuan strategis:
- **Mendeteksi entitas transaksi** secara otomatis dari teks input bahasa Indonesia
- **Mengklasifikasi komponen transaksi** ke dalam kategori yang telah ditentukan
- **Memberikan alternatif AI offline** yang dapat beroperasi tanpa koneksi internet
- **Mendukung proses pembelajaran berkelanjutan** melalui data training yang besar
- **Menyediakan model yang presisi tinggi** untuk implementasi dalam aplikasi Finance Ledger

### 1.3 Fitur Unggulan
Program ini memiliki beberapa keunggulan yang membedakannya dari sistem klasifikasi lainnya:

- **Skala Massive**: Mampu melatih model dengan data hingga 10 juta sampel
- **Incremental Learning**: Sistem pembelajaran bertahap yang hemat memory
- **Multi-format Detection**: Mendukung berbagai format penulisan harga dan kuantitas
- **Typo Resistance**: Ketahanan terhadap kesalahan pengetikan
- **Bahasa Indonesia Focus**: Dirancang khusus untuk memahami bahasa Indonesia alami

## 2. Arsitektur dan Struktur Program

### 2.1 Komponen Utama
Program ini terdiri dari beberapa komponen utama yang saling terintegrasi:

#### 2.1.1 Data Generator Engine
Mesin generator data yang mampu membuat dataset sintetik berkualitas tinggi dengan berbagai variasi pola kalimat, format harga, dan konteks transaksi.

#### 2.1.2 Feature Extraction Engine
Sistem ekstraksi fitur cerdas yang menganalisis setiap kata dari berbagai aspek: morfologi, sintaksis, konteks, dan pola penulisan.

#### 2.1.3 Training Engine
Mesin pelatihan berbasis Multinomial Naive Bayes dengan kemampuan partial_fit untuk pemrosesan data besar secara incremental.

#### 2.1.4 Evaluation Engine
Sistem evaluasi performa yang menyediakan metrik akurasi dan analisis kesalahan secara real-time.

### 2.2 Alur Kerja Program
Program mengikuti alur kerja yang sistematis dan terstruktur:

```
Input Konfigurasi → Generate Data → Extract Features → Vectorization → Training → Evaluation → Export Model
```

### 2.3 Struktur Kode yang Terorganisir
Program dibagi menjadi beberapa bagian fungsional yang jelas:

- **Bagian 1: Konfigurasi dan Setup** - Definisi parameter dan inisialisasi
- **Bagian 2: Feature Engineering** - Fungsi ekstraksi fitur
- **Bagian 3: Data Generation Logic** - Logika pembuatan data training
- **Bagian 4: Training Loop** - Proses pelatihan model
- **Bagian 5: Testing dan Evaluasi** - Pengujian dan validasi model
- **Bagian 6: Model Export** - Ekspor model yang telah dilatih

## 3. Analisis Teknologi dan Algoritma

### 3.1 Algoritma Naive Bayes Classifier

#### 3.1.1 Prinsip Dasar Algoritma
Naive Bayes Classifier bekerja berdasarkan teorema probabilitas Bayes dengan asumsi independensi antar fitur. Untuk kasus klasifikasi entitas transaksi, algoritma ini menghitung probabilitas suatu kata termasuk dalam kategori tertentu berdasarkan distribusi kata dalam data training.

#### 3.1.2 Multinomial Naive Bayes
Program menggunakan varian Multinomial Naive Bayes yang cocok untuk data berbentuk frequensi (jumlah kemunculan kata). Algoritma ini bekerja sangat baik untuk tugas klasifikasi teks dan dapat menangani data dengan dimensi tinggi.

#### 3.1.3 Parameter Alpha (Laplace Smoothing)
Parameter alpha = 0.01 digunakan untuk mencegah zero-probability problem. Nilai ini memberikan smoothing yang cukup untuk kata-kata yang belum pernah dilihat sebelumnya tanpa mengganggu probabilitas kata yang sudah dikenal.

### 3.2 Feature Engineering dan Ekstraksi

#### 3.2.1 Fitur Dasar (Basic Features)
- **Word**: Kata itu sendiri dalam huruf kecil
- **Length**: Panjang karakter kata
- **Capitalization**: Apakah kata diawali huruf besar
- **Digit Presence**: Apakah kata mengandung angka

#### 3.2.2 Fitur Morfologi (Morphological Features)**
- **Prefix 1-3**: Tiga karakter awal kata
- **Suffix 1-3**: Tiga karakter akhir kata
- **Shape Pattern**: Pola penulisan (kapital, angka, simbol)

#### 3.2.3 Fitur Khusus Domain (Domain-Specific Features)**
- **is_numeric**: Apakah kata merupakan angka murni
- **is_price_like**: Apakah kata mengandung format harga
- **is_unit**: Apakah kata merupakan satuan ukuran
- **prev_is_verb**: Apakah kata sebelumnya adalah kata kerja
- **next_is_unit**: Apakah kata berikutnya adalah satuan
- **next_is_price_suffix**: Apakah kata berikutnya adalah suffix harga

#### 3.2.4 Fitur Kontekstual (Contextual Features)**
- **Previous word**: Kata sebelumnya dalam kalimat
- **Next word**: Kata berikutnya dalam kalimat
- **Position in sentence**: Posisi relatif dalam kalimat

### 3.3 Vectorization dengan DictVectorizer

#### 3.3.1 Sparse Matrix Representation
Program menggunakan sparse matrix untuk efisiensi memory. Dengan dimensi fitur yang sangat besar (puluhan ribu fitur), sparse matrix hanya menyimpan nilai yang tidak nol, menghemat memory secara signifikan.

#### 3.3.2 Feature Hashing dan Mapping
DictVectorizer mengkonversi dictionary fitur menjadi vektor numerik dengan memetakan setiap kombinasi fitur-nilai ke kolom tertentu dalam matrix.

## 4. Sistem Generasi Data Training

### 4.1 Kategori Data dan Korpus

#### 4.1.1 Material Bangunan
Kategori terbesar yang mencakup ratusan item material konstruksi mulai dari semen, pasir, bata, keramik, cat, hingga peralatan tukang. Setiap item memiliki variasi nama yang mungkin digunakan dalam praktek.

#### 4.1.2 Makanan dan Minuman
Mencakup berbagai jenis makanan berat, cemilan, minuman, dan bahan baku. Kategori ini mengikuti pola konsumsi masyarakat Indonesia dengan terminologi yang umum digunakan.

#### 4.1.3 Sembako dan Kelontong
Barang-barang kebutuhan pokok sehari-hari seperti beras, minyak, gula, telur, dan berbagai bumbu dapur. Termasuk juga produk perawatan diri dan kebersihan.

#### 4.1.4 Elektronik dan Digital
Produk-produk digital seperti pulsa, token listrik, kuota internet, serta barang elektronik kecil seperti lampu, baterai, dan aksesoris.

#### 4.1.5 Kesehatan
Obat-obatan umum, suplemen, dan produk kesehatan yang sering dibeli oleh konsumen Indonesia.

#### 4.1.6 Umum dan Lainnya
Kategori umum yang mencakup berbagai kebutuhan seperti pakaian, alat tulis, dan bahan bakar.

### 4.2 Pola Kalimat dan Grammar Randomizer

#### 4.2.1 10 Pola Kalimat Utama
Program menggunakan 10 pola kalimat berbeda untuk memastikan variasi dalam struktur bahasa:

1. **Pola 0**: [VERB] [QTY] [UNIT] [ITEM] - "beli 50 sak semen"
2. **Pola 1**: [ITEM] [QTY] [UNIT] [PRICE] - "semen 50 sak 50rb"
3. **Pola 2**: [PRICE] [ITEM] [QTY] [UNIT] - "50rb semen 50 sak"
4. **Pola 3**: [NOISE] [VERB] [ITEM] [QTY] [NOISE] - "hari ini beli semen 50"
5. **Pola 4**: [VERB] [ITEM] [QTY] [PRICE] - "beli semen 50 50rb"
6. **Pola 5**: ["satu"] [UNIT] [ITEM] - "satu sak semen"
7. **Pola 6**: [VERB] [ITEM] ["seharga"] [PRICE] - "beli semen seharga 50rb"
8. **Pola 7**: [VERB] [ITEM] [PRICE] - "beli semen 50rb"
9. **Pola 8**: [NOISE] [VERB] [NOISE] - "ya sudah dibeli"
10. **Pola 9**: [ITEM] saja - "semen"

#### 4.2.2 Format Harga yang Beragam
Program menghasilkan berbagai format penulisan harga yang umum di Indonesia:
- Format ribuan: "50rb", "50k", "50 ribu", "50 rebu"
- Format ribuan dengan titik: "50.000"
- Format jutaan: "1.5jt", "2 juta"
- Format informal: "cepek", "goceng", "ceban", "goban"

#### 4.2.3 Variasi Satuan Ukuran
Sistem satuan yang digunakan mencakup:
- Satuan berat: "kg", "gram", "ons", "kuintal", "ton"
- Satuan volume: "liter", "ml", "cc", "galon"
- Satuan jumlah: "pcs", "buah", "unit", "pack", "lusin", "kodi"
- Satuan khusus: "sak", "karung", "kaleng", "bungkus", "batang", "butir"

### 4.3 Noise Injection dan Robustness Training

#### 4.3.1 Chatter Words
Kata-kata noise yang menambah realisme seperti "ya", "nih", "dong", "sih", "lah", "kah", "deh", "kok", "mah", "tuh".

#### 4.3.2 Typo Generation
Sistem memperkenalkan kesalahan pengetikan dengan probabilitas 15%:
- **Swap**: Menukar posisi karakter ("semen" → "seemn")
- **Replace**: Mengganti karakter ("semen" → "simen")
- **Delete**: Menghapus karakter ("semen" → "semn")

#### 4.3.3 Verb Variations
Kata kerja yang mengindikasikan transaksi:
- Pembelian: "beli", "borong", "tuku", "membeli", "belikan"
- Penjualan: "jual", "jualan", "menjual", "jualin"
- Permintaan: "minta", "pesan", "order", "pesen"

## 5. Proses Pelatihan Model

### 5.1 Incremental Learning Strategy

#### 5.1.1 Chunk-based Processing
Data diproses dalam chunk berukuran 1 juta sampel untuk mengatasi keterbatasan memory. Pendekatan ini memungkinkan pelatihan model dengan dataset yang sangat besar tanpa membutuhkan memory yang besar.

#### 5.1.2 Partial Fit Implementation
Menggunakan metode `partial_fit` dari scikit-learn yang memungkinkan:
- Pembelajaran bertahap tanpa harus menyimpan seluruh data di memory
- Update model dengan data baru tanpa retraining dari awal
- Monitoring performa selama proses training

#### 5.1.3 Memory Management
- **Garbage Collection**: Pembersihan memory otomatis setelah setiap chunk
- **Variable Scoping**: Penggunaan variable lokal untuk efisiensi memory
- **Batch Processing**: Pemrosesan data dalam batch untuk efisiensi

### 5.2 Monitoring dan Evaluasi Performa

#### 5.2.1 Real-time Accuracy Tracking
Setiap 1 juta sampel, model diuji dengan 100.000 data baru untuk menghitung akurasi. Hal ini memberikan gambaran performa model seiring dengan bertambahnya data training.

#### 5.2.2 Error Analysis
Analisis kesalahan dilakukan dengan menampilkan:
- Kata yang salah diklasifikasi
- Prediksi yang diberikan model
- Label yang seharusnya
- Pola kesalahan yang mungkin terjadi

#### 5.2.3 Convergence Monitoring
Pemantauan konvergensi model untuk menentukan kapan training cukup:
- Stabilisasi akurasi
- Penurunan laju peningkatan performa
- Kondisi optimal model

### 5.3 Konfigurasi Parameter Training

#### 5.3.1 Target Dataset Size
- **MAX_SAMPLES**: 10.000.000 sampel (10 juta)
- **CHUNK_SIZE**: 1.000.000 sampel per iterasi (1 juta)
- **Test Size**: 100.000 sampel untuk evaluasi

#### 5.3.2 Model Hyperparameters
- **Alpha**: 0.01 (Laplace smoothing parameter)
- **Classes**: 7 kelas (B-ITEM, I-ITEM, B-QTY, I-QTY, B-PRICE, I-PRICE, O)
- **Fit Prior**: True (menggunakan prior probability)

#### 5.3.3 Feature Configuration
- **Vectorizer**: DictVectorizer dengan sparse matrix
- **Feature Types**: Kombinasi fitur dasar, morfologi, dan domain-specific
- **Context Window**: 1 kata sebelum dan sesudah

## 6. Sistem Evaluasi dan Testing

### 6.1 Metrik Evaluasi

#### 6.1.1 Accuracy Score
Menggunakan accuracy_score dari scikit-learn untuk menghitung persentase prediksi yang benar secara keseluruhan.

#### 6.1.2 Confusion Matrix Analysis
Walaupun tidak ditampilkan secara eksplisit, analisis confusion matrix dapat dilakukan untuk memahami pola kesalahan klasifikasi.

#### 6.1.3 Per-class Performance
Evaluasi performa untuk setiap kelas individu untuk mengidentifikasi kelas mana yang paling sulit diprediksi.

### 6.2 Test Cases dan Skenario

#### 6.2.1 Manual Test Cases
6 contoh kalimat uji yang merepresentasikan berbagai skenario nyata:
1. **Transaksi lengkap**: "beli 50 sak semen gresik harganya 50rb"
2. **Multiple items**: "minta paku 2 kilo sama cat 1 kaleng"
3. **Penjualan**: "jual pasir 1 rit 1.5jt"
4. **Produk digital**: "token listrik 20rb"
5. **Multiple quantity**: "beliin rokok surya 12 2 bungkus"
6. **Makanan**: "nasi goreng 15k pedes banget"

#### 6.2.2 Edge Cases Testing
- **Input minimal**: Satu kata saja
- **Format tidak biasa**: Penulisan harga dengan format aneh
- **Kata tidak dikenal**: Kata yang tidak ada dalam vocabulary
- **Kalimat panjang**: Kalimat dengan banyak komponen

### 6.3 Performance Benchmarking

#### 6.3.1 Training Speed
- **Data Generation**: Kecepatan generate 1 juta sampel
- **Training Time**: Waktu yang dibutuhkan untuk training per chunk
- **Vectorization Speed**: Kecepatan konversi fitur ke vektor

#### 6.3.2 Prediction Speed
- **Single Prediction**: Waktu prediksi satu kata
- **Batch Prediction**: Waktu prediksi batch kata
- **Memory Usage**: Penggunaan memory selama prediksi

## 7. Export Model dan Integrasi

### 7.1 Model Serialization

#### 7.1.1 JSON Export Format
Model diekspor dalam format JSON yang mencakup:
- **classes**: Daftar kelas yang dapat diprediksi
- **class_log_prior**: Log prior probability untuk setiap kelas
- **feature_log_prob**: Log probability fitur untuk setiap kelas
- **vocabulary**: Pemetaan fitur ke indeks
- **metadata**: Informasi tambahan tentang model

#### 7.1.2 Model Metadata
Informasi metadata yang disimpan:
- **version**: Versi model untuk tracking
- **total_samples**: Jumlah sampel yang digunakan untuk training
- **total_features**: Jumlah fitur unik dalam model
- **training_timestamp**: Waktu pelatihan model

### 7.2 Model Integration Strategy

#### 7.2.1 Loading dan Initialization
Model dapat dimuat kembali dengan:
- Membaca file JSON model
- Merestruktur data ke format yang dibutuhkan
- Inisialisasi classifier dengan parameter yang tersimpan

#### 7.2.2 Prediction Pipeline
Pipeline prediksi meliputi:
- Preprocessing input teks
- Ekstraksi fitur menggunakan fungsi yang sama
- Transformasi vektor menggunakan vocabulary yang sama
- Prediksi menggunakan model yang telah dilatih

### 7.3 Version Control dan Model Management

#### 7.3.1 Model Versioning
Setiap model yang dilatih diberi versi unik untuk tracking:
- Format versi: "X.Y_DESCRIPTION"
- Contoh: "4.0_MASSIVE_SCALE_FIXED"

#### 7.3.2 Model Compatibility
Pastikan kompatibilitas antara:
- Versi training code dengan inference code
- Format fitur yang digunakan
- Vocabulary yang digunakan

## 8. Optimasi dan Performance Tuning

### 8.1 Training Optimization

#### 8.1.1 Memory Optimization
- **Sparse Matrix**: Menggunakan sparse matrix untuk efisiensi memory
- **Chunk Processing**: Memproses data dalam chunk untuk menghindari memory overflow
- **Garbage Collection**: Pembersihan memory yang teratur

#### 8.1.2 Speed Optimization
- **Vectorized Operations**: Menggunakan operasi vektor untuk kecepatan
- **Efficient Data Structures**: Memilih struktur data yang optimal
- **Algorithm Optimization**: Optimasi algoritma untuk kecepatan

### 8.2 Model Performance

#### 8.2.1 Accuracy Improvement
- **Feature Engineering**: Penambahan fitur yang informatif
- **Data Quality**: Peningkatan kualitas data training
- **Hyperparameter Tuning**: Penyetelan parameter optimal

#### 8.2.2 Speed vs Accuracy Trade-off
- **Model Size**: Kompromi antara ukuran model dan akurasi
- **Prediction Speed**: Optimasi kecepatan prediksi
- **Memory Usage**: Balance antara akurasi dan penggunaan memory

### 8.3 Scalability Considerations

#### 8.3.1 Horizontal Scaling
- **Distributed Training**: Pelatihan terdistribusi untuk data sangat besar
- **Parallel Processing**: Pemrosesan paralel untuk kecepatan
- **Load Balancing**: Pembagian beban yang optimal

#### 8.3.2 Vertical Scaling
- **Resource Optimization**: Optimalisasi penggunaan CPU dan memory
- **Algorithm Selection**: Pemilihan algoritma yang scalable
- **Architecture Design**: Desain arsitektur yang mendukung scaling

## 9. Troubleshooting dan Common Issues

### 9.1 Memory Issues

#### 9.1.1 Out of Memory Error
**Masalah**: Program berhenti karena kehabisan memory
**Solusi**: Kurangi CHUNK_SIZE, optimasi garbage collection, gunakan sparse matrix

#### 9.1.2 Slow Performance
**Masalah**: Training berjalan sangat lambat
**Solusi**: Gunakan machine dengan CPU lebih cepat, optimasi kode, kurangi kompleksitas fitur

### 9.2 Model Quality Issues

#### 9.2.1 Low Accuracy
**Masalah**: Akurasi model rendah (< 90%)
**Solusi**: Tambah lebih banyak data training, perbaiki kualitas data, tambahkan fitur baru

#### 9.2.2 Overfitting
**Masalah**: Model terlalu cocok dengan data training
**Solusi**: Gunakan validasi silang, tambahkan regularization, kurangi kompleksitas fitur

### 9.3 Data Quality Issues

#### 9.3.1 Imbalanced Classes
**Masalah**: Jumlah sampel per kelas tidak seimbang
**Solusi**: Balance dataset, gunakan sampling techniques, adjust class weights

#### 9.3.2 Poor Data Quality
**Masalah**: Data training mengandung noise atau error
**Solusi**: Bersihkan data, validasi data input, gunakan data cleaning techniques

## 10. Best Practices dan Rekomendasi

### 10.1 Development Best Practices

#### 10.1.1 Code Organization
- Pisahkan logika ke dalam fungsi yang terfokus
- Gunakan naming convention yang konsisten
- Tambahkan komentar untuk logika kompleks
- Dokumentasikan parameter dan return values

#### 10.1.2 Testing Strategy
- Test dengan data yang representative
- Include edge cases dalam testing
- Monitor performance metrics secara teratur
- Lakukan regression testing untuk setiap perubahan

### 10.2 Model Deployment Best Practices

#### 10.2.1 Model Validation
- Validasi model dengan data yang belum pernah dilihat
- Test dengan berbagai skenario input
- Monitor model performance di production
- Siapkan rollback plan jika diperlukan

#### 10.2.2 Monitoring dan Maintenance
- Monitor model drift secara teratur
- Update model dengan data baru secara periodik
- Track prediction accuracy di production
- Maintain model versioning dan documentation

### 10.3 Performance Optimization

#### 10.3.1 Training Optimization
- Gunakan incremental learning untuk data besar
- Optimasi hyperparameters secara sistematis
- Monitor resource usage selama training
- Implementasi early stopping jika sesuai

#### 10.3.2 Inference Optimization
- Optimasi model untuk inference speed
- Gunakan model pruning jika diperlukan
- Implementasi caching untuk prediksi yang sering
- Gunakan batch processing untuk multiple predictions

## 11. Kesimpulan dan Prospek Masa Depan

### 11.1 Ringkasan Pencapaian

Program `nb-model.py` telah berhasil mengimplementasikan sistem pelatihan AI yang robust dan scalable untuk klasifikasi entitas transaksi. Dengan kemampuan untuk melatih model menggunakan 10 juta sampel data, program ini menghasilkan model yang akurat dan tahan terhadap berbagai variasi input bahasa Indonesia.

### 11.2 Keunggulan Kompetitif

Beberapa keunggulan yang dimiliki program ini:
- **Skalabilitas**: Mampu menangani data training dalam jumlah sangat besar
- **Efisiensi**: Menggunakan incremental learning untuk efisiensi memory
- **Akurasi**: Mencapai akurasi tinggi dengan fitur engineering yang komprehensif
- **Robustness**: Tahan terhadap typo dan variasi format input
- **Spesialisasi**: Dirancang khusus untuk domain transaksi keuangan

### 11.3 Prospek Pengembangan Masa Depan

#### 11.3.1 Enhancement Algorithms
- Implementasi deep learning approaches (LSTM, BERT)
- Ensemble methods untuk meningkatkan akurasi
- Active learning untuk efisiensi labeling
- Transfer learning dari model yang sudah ada

#### 11.3.2 Feature Expansion
- Word embeddings (Word2Vec, GloVe, FastText)
- Character-level features
- Syntactic parsing features
- Semantic relationship features

#### 11.3.3 Domain Expansion
- Support untuk bahasa daerah di Indonesia
- Support untuk bahasa Inggris dan bilingual
- Domain-specific models untuk industri berbeda
- Multi-modal input (text + voice + image)

### 11.4 Dampak dan Aplikasi

Program ini memiliki dampak signifikan dalam:
- **Digitalisasi Usaha**: Membantu UMKM dalam digitalisasi pencatatan transaksi
- **Financial Inclusion**: Meningkatkan akses terhadap teknologi keuangan
- **AI Democratization**: Menyediakan AI yang dapat diakses oleh usaha kecil
- **Language Preservation**: Mendukung penggunaan bahasa Indonesia dalam teknologi

Program `nb-model.py` merupakan fondasi yang kuat untuk pengembangan sistem AI yang lebih canggih di masa depan, sambil tetap menjaga prinsip-prinsip efisiensi, akurasi, dan ketergunaan yang menjadi inti dari pengembangan ini.