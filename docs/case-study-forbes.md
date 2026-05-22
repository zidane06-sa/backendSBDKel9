# Studi Kasus: Forbes × MongoDB (Document Store)

## 1. Company Overview
Forbes adalah perusahaan media bisnis global yang berdiri sejak 1917 dan dikenal luas melalui jurnalisme bisnis serta daftar orang terkaya di dunia. Dengan jangkauan lebih dari 140 juta pembaca per bulan di berbagai platform digital, Forbes menjadi salah satu contoh paling terdokumentasi dari penggunaan Document Store di industri media skala enterprise. Penggunaan MongoDB oleh Forbes telah dikonfirmasi langsung oleh eksekutif senior perusahaan dan dianalisis dalam paper akademik IEEE.

## 2. Masalah yang Dihadapi Forbes
Sebelum beralih ke MongoDB, Forbes mengandalkan relational database yang menimbulkan tiga masalah utama:

- **Masalah performa dan outage**
  Kecepatan pengiriman konten menjadi hambatan signifikan yang menyebabkan banyak gangguan layanan dan pengalaman buruk bagi pembaca.

- **Kompleksitas data tidak terstruktur**
  Forbes menyimpan berbagai jenis konten mulai dari artikel teks, galeri foto, data statistik, hingga video embed. Struktur relational dengan skema kaku tidak mampu mengakomodasi keberagaman ini secara efisien.

- **Biaya dan skalabilitas**
  Biaya untuk melakukan scale-up pada relational database sangat tinggi dan proses pengembangan fitur baru memerlukan ALTER TABLE yang berisiko downtime.

## 3. Alasan Forbes Memilih Document Store
Forbes memilih Document Store (MongoDB) karena konten media secara natural berbentuk dokumen dengan struktur yang bervariasi per entitas. Keunggulan utama:

- Skema fleksibel — setiap dokumen bisa memiliki struktur berbeda tanpa migrasi.
- Menyimpan data tersambung dalam satu dokumen tanpa JOIN kompleks.
- Biaya infrastruktur dan pengembangan lebih rendah untuk CMS skala besar.
- Performa lebih cepat untuk tipe query konten yang beragam.

Perbandingan singkat dengan paradigma lain:
- **Key-Value Store** (Redis, DynamoDB): terlalu sederhana untuk nested document dan atribut kompleks.
- **Wide-Column Store** (Cassandra): dioptimalkan untuk time-series / write-heavy, bukan query fleksibel per atribut konten.
- **Graph DB** (Neo4j): kuat untuk traversal relasi, bukan untuk menyimpan dokumen konten variatif.

## 4. High-Level Data Model dan Contoh Dokumen
Di MongoDB, setiap konten disimpan sebagai dokumen JSON/BSON dalam satu collection. Beberapa contoh:

**Artikel Breaking News**
```json
{
  "_id": {"$oid": "..."},
  "type": "breaking_news",
  "title": "...",
  "author": { "name": "...", "profile_url": "..." },
  "published_at": {"$date": "2024-01-01T00:00:00Z"},
  "tags": ["business","tech"],
  "content": "...",
  "urgency_level": "high"
}
```

**Artikel Listicle**
```json
{
  "_id": {"$oid": "..."},
  "type": "listicle",
  "title": "Top 10 Richest People 2024",
  "items": [
    {"rank": 1, "name": "Elon Musk", "net_worth": "$200B"},
    {"rank": 2, "name": "Jeff Bezos", "net_worth": "$180B"}
  ],
  "sponsored": false
}
```

**Artikel Video**
```json
{
  "_id": {"$oid": "..."},
  "type": "video_article",
  "title": "...",
  "video_url": "https://...",
  "duration_seconds": 320,
  "transcript": "...",
  "thumbnail": "https://..."
}
```

## 5. Hasil Setelah Implementasi
Setelah migrasi ke MongoDB Atlas, Forbes melaporkan hasil signifikan: build speed meningkat 58% (25 → 9 menit rata-rata), release cycle 4× lebih cepat, subscriber growth +28%, dan kemampuan melayani traffic puncak besar tanpa outage.

## 6. Relevansi untuk Proyek Group 9
Studi Forbes relevan karena proyek Group 9 (Tech News Aggregator Indonesia) menghadapi kebutuhan serupa: tipe konten variatif (opini, breaking news, tutorial, listicle). MongoDB sebagai Document Store cocok karena fleksibilitas skema, kemampuan menyimpan nested data, dan efisiensi query untuk konten.

---

