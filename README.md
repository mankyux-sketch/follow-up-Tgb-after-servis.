# FOLLOW UP TGB AFTER SERVIS

Aplikasi web statis untuk follow up customer after service berbasis Excel.

## Fitur
- Upload Excel mingguan (.xlsx/.xls) sebagai batch.
- Hapus batch upload tanpa menghapus batch lain.
- Daftar follow up dengan pencarian dan filter SA/status.
- Link WhatsApp dengan template pesan yang dapat diedit/ditambah/dihapus.
- Reason / catatan hasil follow up.
- Penandaan booking + tanggal dan jam booking.
- Dashboard KPI: total data, sudah follow up, keberhasilan, booking, pending.
- Grafik status follow up, hasil follow up, dan performa Service Advisor.
- **Download Semua Data Excel**: semua customer yang sudah maupun belum follow up ikut ter-download, lengkap dengan status follow up, hasil, reason, tanggal follow up, dan data booking.
- Pada upload baru, seluruh kolom asli dari Excel ikut disimpan agar dapat dikembalikan saat download.
- Responsive untuk laptop, tablet, dan HP.

## Kolom tambahan pada hasil download
`STATUS_FOLLOW_UP`, `HASIL_FOLLOW_UP`, `REASON_FOLLOW_UP`, `TANGGAL_FOLLOW_UP`, `BOOKING`, `TANGGAL_BOOKING`, `JAM_BOOKING`.

## Catatan kompatibilitas
Data yang sudah tersimpan dari versi lama tetap bisa di-download. Karena versi lama hanya menyimpan kolom yang dipetakan aplikasi, data lama akan diekspor memakai kolom utama yang tersedia. Untuk mendapatkan seluruh kolom asli Excel, upload file sumber lagi setelah versi ini dipasang.

## Menjalankan
Cukup buka `index.html` melalui web server. Untuk GitHub Pages, upload seluruh file ke repository lalu aktifkan **Settings > Pages > Deploy from a branch**.

## Penyimpanan
Data disimpan di `localStorage` browser/perangkat yang digunakan. Jangan commit file Excel customer atau data nomor HP/VIN ke repository publik.
