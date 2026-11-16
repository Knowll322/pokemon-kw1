# Pocket Beasts: Forest Journey

Mini RPG pixel-art 2D yang seluruh karakter, nama, item, peta, dan ceritanya orisinal, digambar langsung di dalam canvas.

> **Jenis proyek:** Praktikum / Tugas Kuliah

## Ringkasan

Pocket Beasts: Forest Journey adalah mini RPG 2D bergaya pixel-art yang terinspirasi petualangan tangkap makhluk khas konsol genggam. Seluruh dunia digambar secara prosedural di dalam canvas tanpa satu pun aset gambar, dan seluruh makhluk, nama, item, serta alur ceritanya dibuat orisinal. Pemain memilih satu makhluk awal, menyusuri desa, hutan, padang rumput, gua, dan arena, lalu menangkap makhluk dan melawan trainer. Progres disimpan di `localStorage` sehingga permainan bisa dilanjutkan.

## Fitur

- Peta tile 44 x 34 selebar 16 piksel yang dibangun secara prosedural: desa, hutan, padang rumput, gua, dan arena.
- Enam makhluk orisinal: Flameling, Aquabbit, Leafawn, Sparkit, Rockub, dan Shadewisp.
- Tujuh tipe elemen: Fire, Water, Leaf, Electric, Rock, Shadow, dan Neutral, dengan tabel keunggulan (Fire mengalah Leaf, Leaf mengalah Water, Water mengalah Fire, Electric mengalah Water, dan Electric dikurangi 0,55 kali oleh Rock).
- Pertemuan dengan makhluk liar secara acak di padang rumput, dengan peluang spawn yang ditentukan oleh pola tiles dan noise peta.
- Battle turn-based dengan EXP, level up, statistik turunan per makhluk, dan kondisi pingsan saat HP habis.
- Sistem tangkap "Beast Capsule" dengan peluang yang meningkat seiring debilidad target, dikurangi 0,12 untuk bos.
- Tiga trainer yang dapat ditantang (Mira, Orin, dan Bram) serta bos Shadewisp di Moonlit Arena yang mengakhiri cerita.
- Dua item: Beast Capsule untuk menangkap dan Berry Tonic yang memulihkan 24 HP, beserta inventori, party, simpan dan muat ke `localStorage` dengan kunci `pocket-beasts-forest-journey-v1`.

## Teknologi

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript)
![HTML](https://img.shields.io/badge/HTML-E34F26?style=for-the-badge&logo=html5)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css)

## Cara Menjalankan

Repo ini tidak memerlukan proses build. Unduh atau clone repo ini, lalu buka `index.html` langsung di browser. Seluruh logika game berada di `src/game.js` yang dimuat sebagai skrip biasa, sehingga halaman dapat dibuka dari berkas lokal tanpa server.

## Kontrol

- Panah atau WASD: bergerak dan navigasi menu.
- Z, Spasi, atau Enter: konfirmasi dan berinteraksi.
- X, Escape, atau Backspace: kembali atau membuka menu di overworld.
- Tombol sentuh tersedia untuk layar kecil.

## Struktur Proyek

```
pokemon-kw1/
├── index.html
├── styles.css
├── src/
│   └── game.js
├── README.md
├── LICENSE
└── .gitignore
```

## Catatan

- Seluruh visual digambar langsung di canvas berukuran 320 x 288 piksel, termasuk bentuk makhluk, peta, dan efek battle, sehingga repo tidak memuat aset gambar sama sekali.
- `index.html` juga memuat tombol sentuh D-pad dan tombol A, B, serta M untuk perangkat mobile.
- Data makhluk, item, dan trainer tersusun sebagai objek di bagian atas `src/game.js`, dan peta dibangun saat halaman dimuat oleh fungsi `buildMap()`.
- Ukuran repo sekitar 80 KB dan seluruhnya berupa teks.

## Lisensi

MIT License — lihat [LICENSE](LICENSE)
