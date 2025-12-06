import random
import json
import numpy as np
import string
import re
import time
from sklearn.feature_extraction import DictVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score

try:
    from google.colab import files
except ImportError:
    files = None

# ================================================================
# 1. KONFIGURASI SKALA DAN DEFINISI DATASET GLOBAL
# ================================================================

# --- KONFIGURASI SKALA UTAMA ---
MAX_SAMPLES = 10_000_000   # Target total data (Token/Kata). (10 Juta)
CHUNK_SIZE = 1_000_000     # Ukuran data yang diproses di setiap iterasi (1 Juta)
# Semua kelas (Label) yang mungkin dihasilkan oleh model.
ALL_CLASSES = ['B-ITEM', 'I-ITEM', 'B-QTY', 'I-QTY', 'B-PRICE', 'I-PRICE', 'O']
# ===============================

categories = {
    "material_bangunan": [
        # Semen & Pasir
        "semen", "semen gresik", "semen tiga roda", "semen holcim", "semen padang", "semen instan", "mortar", "acian",
        "pasir", "pasir lumajang", "pasir beton", "pasir pasang", "pasir mundu", "pasir bangka", "pasir urug",
        "batu split", "koral", "batu kali", "batu pondasi", "abu batu", "sirtu", "makadam", "tanah urug",

        # Dinding & Lantai
        "bata", "bata merah", "bata ringan", "hebel", "batako", "paving block", "conblock", "grass block",
        "keramik", "keramik lantai", "keramik dinding", "granit", "tegel", "marmer", "plesteran",
        "lis keramik", "nat keramik",

        # Atap & Plafon
        "asbes", "seng", "seng gelombang", "spandek", "bondek", "genteng", "genteng metal", "genteng keramik",
        "nok genteng", "wuwung", "karpet talang", "talang air",
        "plafon", "plafon pvc", "gypsum", "papan gypsum", "lis profil", "lis gypsum", "hollow", "hollow 2x4", "hollow 4x4",
        "triplek", "triplek 8mm", "triplek 12mm", "multiplek", "plywood", "grc board", "kalsiboard",

        # Kayu
        "kasau", "kaso", "reng", "reng kayu", "reng baja ringan", "papan cor", "kayu balok", "kayu 5x7", "kayu 6x12", "dolken",

        # Besi & Logam
        "besi", "besi beton", "besi 8", "besi 10", "besi 12", "besi 16", "besi ulir", "besi polos", "wiremesh",
        "baja ringan", "kanal c", "reng baja",
        "kawat", "kawat bendrat", "kawat loket", "kawat harmonika", "kawat duri", "kawat nyamuk",

        # Paku & Baut
        "paku", "paku payung", "paku beton", "paku kayu", "paku 5cm", "paku 7cm", "paku 10cm", "paku usuk", "paku triplek",
        "baut", "baut roofing", "baut baja ringan", "sekrup", "skrup", "sekrup gypsum", "fisher", "dynabolt", "mur baut", "ring plat",

        # Pintu & Jendela
        "engsel", "engsel pintu", "engsel jendela", "gembok", "grendel", "hak angin", "handle pintu", "gagang pintu",
        "kunci pintu", "silinder kunci", "slot pintu",

        # Pipa & Plumbing
        "pipa", "pipa pvc", "paralon", "rucika", "wavin", "vinilon",
        "sambungan pipa", "keni", "knee", "elbo", "sok", "sok drat", "tee", "dop", "water mur",
        "kran", "kran air", "kran angsa", "shower", "stop kran", "ball valve",
        "lem pralon", "lem pipa", "seal tape", "siltip", "toren air", "pompa air", "sanyo", "shimizu",

        # Cat & Kimia
        "cat", "cat tembok", "cat kayu", "cat besi", "cat dasar", "plamir",
        "avian", "dulux", "jotun", "nippon paint", "nodrop", "aquaproof", "damdex",
        "thinner", "thinner a", "thinner b", "minyak cat", "terpentin",
        "lem", "lem kayu", "lem fox", "lem aibon", "lem rajawali", "lem korea", "lem besi", "dextone", "sealant", "silikon",
        "dempul", "dempul kayu", "dempul besi", "wood filler",

        # Alat Tukang
        "kuas", "kuas 3 inch", "rol cat", "bak cat", "amplas", "amplas kasar", "amplas halus",
        "cangkul", "sekop", "linggis", "palu", "martil", "bodem",
        "gergaji", "gergaji besi", "gergaji kayu", "obeng", "obeng plus", "obeng minus", "tang", "tang potong",
        "meteran", "waterpass", "benang tukang", "siku tukang", "jidar", "roskam",
        "ember", "ember cor", "timba", "gerobak", "gerobak sorong", "artco",
        "helm proyek", "sarung tangan", "sepatu boot"
    ],

    "makanan_minuman": [
        # Makanan Berat
        "nasi", "nasi goreng", "nasgor", "nasi uduk", "nasi kuning", "nasi rames", "nasi padang", "nasi campur", "nasi liwet",
        "mie", "mie ayam", "mie yamin", "mie goreng", "mie rebus", "mie aceh", "mie gomak", "kwetiau", "bihun",
        "bakso", "bakso urat", "bakso telur", "bakso mercon", "soto", "soto ayam", "soto betawi", "soto lamongan", "rawon",
        "sate", "sate ayam", "sate kambing", "sate padang", "sate madura", "gule", "tongseng",
        "ayam goreng", "ayam bakar", "ayam geprek", "ayam penyet", "bebek goreng", "lele goreng", "pecel lele",
        "gado-gado", "ketoprak", "karedok", "lotek", "lontong sayur", "lontong balap", "ketupat",
        "sayur asem", "sayur lodeh", "sayur sop", "capcay", "gudeg", "rendang",

        # Cemilan & Jajanan
        "martabak", "martabak manis", "martabak telor", "terang bulan",
        "gorengan", "bakwan", "tahu isi", "tempe mendoan", "pisang goreng", "ubi goreng", "molen",
        "risol", "lumpia", "pastel", "kroket", "cireng", "cilok", "cimol", "seblak", "batagor", "siomay", "pempek",
        "roti", "roti bakar", "roti tawar", "donat", "kue", "bolu", "brownies", "lapis legit", "bika ambon",
        "kerupuk", "kripik", "peyek", "snack", "chiki", "biskuit", "wafer",

        # Minuman
        "air mineral", "aqua", "le minerale", "vit", "club",
        "es teh", "teh manis", "teh botol", "teh pucuk", "teh kotak",
        "kopi", "kopi hitam", "kopi susu", "cappuccino", "kopi sachet", "good day", "kapal api", "starbucks",
        "susu", "susu murni", "susu kental manis", "indomilk", "ultramilk", "bear brand",
        "jus", "jus alpukat", "jus mangga", "jus jeruk", "es jeruk", "es campur", "es doger", "es teler",
        "boba", "thai tea", "matcha", "minuman dingin"
    ],

    "kelontong_sembako": [
        # Sembako
        "beras", "beras pandan wangi", "beras ramos", "beras rojolele", "beras 5kg", "beras 10kg", "karung beras",
        "minyak", "minyak goreng", "minyak curah", "bimoli", "filma", "sania", "sunco", "tropical",
        "gula", "gula pasir", "gulaku", "gula merah", "gula aren", "gula batu",
        "telur", "telur ayam", "telur puyuh", "telur bebek", "peti telur", "karpet telur",
        "tepung", "tepung terigu", "segitiga biru", "cakra kembar", "tepung beras", "rose brand", "tapioka", "sagu", "maizena",

        # Bumbu
        "garam", "garam dapur", "bawang merah", "bawang putih", "bawang bombay",
        "cabe", "cabe merah", "cabe rawit", "cabe keriting",
        "kecap", "kecap manis", "kecap asin", "bango", "abc", "sedap",
        "saus", "saus sambal", "saus tomat", "sambal terasi",
        "penyedap", "micin", "sasa", "ajinomoto", "royco", "masako", "kaldu jamur",
        "bumbu racik", "ladaku", "ketumbar", "kemiri", "kunyit", "jahe", "lengkuas", "santan", "kara",

        # Mie Instan
        "mie instan", "indomie", "indomie goreng", "indomie soto", "indomie kari",
        "mie sedaap", "mie burung dara", "supermi", "sarimi", "pop mie", "mie gelas",

        # Perlengkapan Mandi & Cuci
        "sabun", "sabun mandi", "lifebuoy", "lux", "nuvo", "shinzui", "giv", "detol",
        "shampoo", "sunsilk", "clear", "pantene", "rejoice", "head & shoulders",
        "pasta gigi", "odol", "pepsodent", "ciptadent", "close up", "sikat gigi",
        "sabun cuci", "deterjen", "rinso", "daia", "attack", "boom", "so klin",
        "pewangi", "molto", "downy", "rapika", "kispray",
        "sabun piring", "sunlight", "mama lemon", "spons cuci",
        "pembersih lantai", "wipol", "super pell", "vixal",
        "tisu", "tisu wajah", "tisu gulung", "pembalut", "popok", "pampers",

        # Rokok
        "rokok", "jarum super", "djarum", "gudang garam", "surya", "surya 12", "surya 16",
        "sampoerna", "sampoerna mild", "a mild", "dji sam soe", "magnum", "marlboro",
        "la lights", "class mild", "esse", "dunhill", "korek api", "tokai"
    ],

    "elektronik_digital": [
        "pulsa", "pulsa telkomsel", "pulsa indosat", "pulsa xl", "pulsa tri", "pulsa axis", "pulsa smartfren",
        "kuota", "paket data", "voucher data", "kartu perdana",
        "token", "token listrik", "token pln", "bayar listrik",
        "top up", "saldo dana", "saldo gopay", "saldo ovo", "shopeepay", "linkaja", "emoney",
        "lampu", "bohlam", "lampu led", "philips", "hannochs", "panasonic", "lampu 5 watt", "lampu 10 watt",
        "baterai", "batre", "abc", "alkaline", "baterai jam",
        "kabel", "kabel data", "kabel charger", "kabel type c", "kabel lightning",
        "charger", "kepala charger", "adaptor", "powerbank",
        "earphone", "headset", "headphone", "speaker", "flashdisk", "memory card"
    ],

    "kesehatan": [
        "obat", "paracetamol", "panadol", "bodrex", "oskadon", "mixagrip", "procold",
        "promag", "mylanta", "polysilane", "tolak angin", "antangin", "bejo",
        "minyak kayu putih", "minyak telon", "cap lang", "freshcare", "hot in cream", "koyo", "salonpas",
        "betadine", "hansaplast", "alkohol", "kapas", "masker", "hand sanitizer",
        "vitamin", "vitamin c", "enervon c", "suplemen"
    ],

    "umum_lainnya": [
        "baju", "kaos", "kemeja", "celana", "jaket", "daster", "jilbab", "kerudung",
        "sandal", "sepatu", "kaos kaki",
        "tas", "dompet", "topi", "ikat pinggang",
        "buku", "buku tulis", "pulpen", "pensil", "penghapus", "penggaris", "kertas", "amplop", "map",
        "bensin", "pertalite", "pertamax", "solar", "oli", "oli mesin", "oli samping",
        "gas", "gas elpiji", "gas 3kg", "gas melon", "galon air"
    ]
}

# 1. Mengumpulkan semua item ke satu list
all_items = [item for k, v in categories.items() for item in v]

# 2. Menggabungkan semua kata kerja ke list 'verbs'
verbs = [v for k, vals in transaction_verbs.items() for v in vals]

# 3. Sinkronisasi Noise Words
noise_words = chatter_noise

# ==========================================
# 2. FEATURE ENGINEERING (FUNGSI UTAMA)
# ==========================================

def get_features(word, prev_word=None, next_word=None):
    """Mengekstrak fitur cerdas dari setiap kata, harus sinkron dengan model training."""
    word_lower = word.lower()

    # Regex Patterns (Fitur Logika)
    is_numeric = bool(re.match(r'^\d+([,\.]\d+)?$', word_lower))
    is_price_format = bool(re.match(r'^rp|^\d+(rb|k|ribu|rebu|ribee|jt|juta)|^\d{1,3}(\.\d{3})+$', word_lower))
    is_unit_format = word_lower in units

    features = {
        'word': word_lower,
        # Fitur Pintar
        'is_numeric': 1 if is_numeric else 0,
        'is_price_like': 1 if is_price_format else 0,
        'is_unit': 1 if is_unit_format else 0,

        # Fitur Sub-word
        'suffix_1': word_lower[-1:],
        'suffix_2': word_lower[-2:] if len(word_lower) > 1 else '',
        'suffix_3': word_lower[-3:] if len(word_lower) > 2 else '',
        'prefix_3': word_lower[:3] if len(word_lower) > 2 else '',
        'prefix_2': word_lower[:2] if len(word_lower) > 1 else '',
        'prefix_1': word_lower[:1] if len(word_lower) > 0 else '',

        # Fitur Bentuk (Shape)
        'is_capitalized': 1 if word[0].isupper() else 0,
        'has_digit': 1 if any(char.isdigit() for char in word) else 0,
        'length': len(word_lower)
    }

    # Context Features
    prev_lower = prev_word.lower() if prev_word else '__BOS__'
    next_lower = next_word.lower() if next_word else '__EOS__'

    features['prev_word'] = prev_lower
    features['next_word'] = next_lower

    features['prev_is_verb'] = 1 if prev_lower in verbs else 0
    features['prev_is_unit'] = 1 if prev_lower in units else 0
    features['next_is_unit'] = 1 if next_lower in units else 0
    features['next_is_price_suffix'] = 1 if next_lower in money_formats else 0

    return features

# ==========================================
# 3. LOGIKA GENERATOR DATA
# ==========================================

def introduce_typo(word):
    """Memperkenalkan typo untuk ketahanan model."""
    if len(word) < 4 or random.random() > 0.15: return word
    chars = list(word)
    typo_type = random.choice(["swap", "replace", "delete"])
    idx = random.randint(0, len(chars) - 2)
    if typo_type == "swap": chars[idx], chars[idx+1] = chars[idx+1], chars[idx]
    elif typo_type == "delete": del chars[idx]
    elif typo_type == "replace": chars[idx] = random.choice('aeiou')
    return "".join(chars)

def generate_price():
    """Menghasilkan string harga dengan berbagai format."""
    val = random.choice([1, 2, 5, 10, 15, 20, 50, 100])
    fmt = random.choice(money_formats)
    if fmt in ["rb", "k", "ribu", "rebu", "ribee"]: return f"{val}{fmt}"
    elif fmt in ["000", ".000"]: return f"{val}{fmt}"
    elif fmt in ["jt", "juta"]: return f"{random.randint(1,5)} {fmt}"
    elif fmt in ["cepek", "gopek", "seceng", "goceng", "ceban", "goban"]: return fmt
    return f"{val}000"

def generate_data_chunk(chunk_size):
    """Fungsi generator yang menghasilkan data untuk training."""
    data = []

    for _ in range(chunk_size):
        # Komponen dasar
        verb = random.choice(verbs)
        item = introduce_typo(random.choice(all_items))
        unit = random.choice(units)
        qty = str(random.randint(1, 50))
        price = generate_price()
        noise = random.choice(noise_words)

        pola = random.randint(0, 9)
        tokens, tags = [], []

        def add(txt, tag):
            for p in txt.split():
                tokens.append(p)
                if tag == "O" or p in ['.', ',']: tags.append("O")
                else: tags.append(f"B-{tag}" if (not tags or not tags[-1].endswith(tag)) else f"I-{tag}")

        # Pola Kalimat (Grammar Randomizer - 10 Pola)
        if pola == 0: add(verb, "O"); add(qty, "QTY"); add(unit, "QTY"); add(item, "ITEM")
        elif pola == 1: add(item, "ITEM"); add(qty, "QTY"); add(unit, "QTY"); add(price, "PRICE")
        elif pola == 2: add(price, "PRICE"); add(item, "ITEM"); add(qty, "QTY"); add(unit, "QTY")
        elif pola == 3: add(noise, "O"); add(verb, "O"); add(item, "ITEM"); add(qty, "QTY"); add(random.choice(noise_words), "O")
        elif pola == 4: add(verb, "O"); add(item, "ITEM"); add(qty, "QTY"); add(price, "PRICE")
        elif pola == 5: add("satu", "QTY"); add(unit, "QTY"); add(item, "ITEM")
        elif pola == 6: add(verb, "O"); add(item, "ITEM"); add("seharga", "O"); add(price, "PRICE")
        elif pola == 7: add(verb, "O"); add(item, "ITEM"); add(price, "PRICE")
        elif pola == 8: add(noise, "O"); add(random.choice(verbs), "O"); add(random.choice(noise_words), "O")
        else: add(item, "ITEM")

        # Ekstraksi Fitur per token
        for i in range(len(tokens)):
            prev = tokens[i-1] if i > 0 else None
            nxt = tokens[i+1] if i < len(tokens)-1 else None
            feat = get_features(tokens[i], prev, nxt)
            data.append((feat, tags[i], tokens[i]))

    return data

# ==========================================
# 4. TRAINING LOOP: ITERATIVE MNB
# ==========================================

print(f"MEMULAI PELATIHAN {MAX_SAMPLES/1000000:.0f} JUTA DATA (CHUNK SIZE: {CHUNK_SIZE/1000000:.0f} Juta)")
print("==================================================")

clf = MultinomialNB(alpha=0.01)
vec = DictVectorizer(sparse=True)
accumulated_samples = 0
chunk_number = 0

while accumulated_samples < MAX_SAMPLES:
    chunk_number += 1
    start_time = time.time()

    current_chunk_size = min(CHUNK_SIZE, MAX_SAMPLES - accumulated_samples)

    print(f"\n[Chunk {chunk_number}] Menggenerasi {current_chunk_size/1000000:.1f} Juta data baru...")

    # 1. Generasi Data
    batch_data_tuples = generate_data_chunk(current_chunk_size)

    # 2. Pisahkan Fitur, Label, dan Token
    X_feats = [d[0] for d in batch_data_tuples]
    y_labels = [d[1] for d in batch_data_tuples]

    # 3. Vektorisasi & Partial Fit
    if accumulated_samples == 0:
        print("   -> Membangun Vocabulary & Training Awal...")
        X_vec = vec.fit_transform(X_feats)
        clf.partial_fit(X_vec, y_labels, classes=ALL_CLASSES)
    else:
        print("   -> Transformasi Data & Training Lanjutan (partial_fit)...")
        X_vec = vec.transform(X_feats)
        clf.partial_fit(X_vec, y_labels)

    accumulated_samples += current_chunk_size
    duration = time.time() - start_time

    print(f"Selesai dalam {duration:.1f} detik.")
    print(f"   Total Data Terlatih: {accumulated_samples/1000000:.1f} Juta / {MAX_SAMPLES/1000000:.0f} Juta")

    # 4. Evaluasi Diri Berkala
    if accumulated_samples % (CHUNK_SIZE) == 0:
        print("\n=== UJI COBA AKURASI (100K SOAL) ===")
        test_chunk = generate_data_chunk(100000)
        X_test_feats = [d[0] for d in test_chunk]
        y_test_true = [d[1] for d in test_chunk]
        raw_test_tokens = [d[2] for d in test_chunk]

        X_test_vec = vec.transform(X_test_feats)
        y_pred = clf.predict(X_test_vec)

        acc = accuracy_score(y_test_true, y_pred)
        print(f"   AKURASI Saat Ini: {acc*100:.2f}%")

        # Analisis Kesalahan
        error_count = 0
        print("   -> Cek Kesalahan (Sampel Salah Prediksi):")
        for i in range(len(y_pred)):
            if y_pred[i] != y_test_true[i] and error_count < 3:
                print(f"      Kata: '{raw_test_tokens[i]}' | Prediksi AI: {y_pred[i]} | Seharusnya: {y_test_true[i]}")
                error_count += 1
        if error_count == 0: print("      (Sempurna! Tidak ada kesalahan di sampel awal)")
        print("==================================\n")


print("\n==================================================")
print("PELATIHAN MASSIVE SCALE SELESAI.")
print("==================================================")

# ==========================================
# 5. UJI COBA MANUAL FINAL
# ==========================================
manual_tests = [
    "beli 50 sak semen gresik harganya 50rb",
    "minta paku 2 kilo sama cat 1 kaleng",
    "jual pasir 1 rit 1.5jt",
    "token listrik 20rb",
    "beliin rokok surya 12 2 bungkus",
    "nasi goreng 15k pedes banget"
]

print("\nUJI COBA MANUAL TERAKHIR:")
for sent in manual_tests:
    toks = sent.split()
    print(f"\nInput: '{sent}'")
    for i, t in enumerate(toks):
        p = toks[i-1] if i > 0 else None
        n = toks[i+1] if i < len(toks)-1 else None
        f = get_features(t, p, n)
        v = vec.transform(f)
        pred = clf.predict(v)[0]
        print(f"  {t.ljust(15)} -> {pred}")

# ==========================================
# 6. EKSPOR MODEL JSON
# ==========================================
print("\nExporting Model to JSON...")
export_data = {
    "classes": clf.classes_.tolist(),
    "class_log_prior": clf.class_log_prior_.tolist(),
    "feature_log_prob": clf.feature_log_prob_.tolist(),
    "vocabulary": {k: int(v) for k, v in vec.vocabulary_.items()},
    "meta": {
        "version": "4.0_MASSIVE_SCALE_FIXED",
        "total_samples": accumulated_samples,
        "total_features": len(vec.vocabulary_)
    }
}

filename = 'nb_model_complex_new.json'
with open(filename, 'w') as f:
    json.dump(export_data, f)

if files:
    files.download(filename)
print(f"File {filename} siap digunakan!")