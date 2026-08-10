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
- Responsive untuk laptop, tablet, dan HP.

## Sumber kolom Excel
Aplikasi mendukung kolom seperti: `POLICE_NO`, `CUSTOMER`, `MODEL`, `VIN`/`RANGKA`, `SERVICE_ORDER`, `SERVICE_ADVISOR`, `HANDPHONE`/`wa_cp`, `Tgl_Invoice`, dan `BATTERY_CHECK`.

## Menjalankan
Cukup buka `index.html` melalui web server. Untuk GitHub Pages, upload seluruh file ke repository lalu aktifkan **Settings > Pages > Deploy from a branch**.

## Penyimpanan
Versi MVP menyimpan data di `localStorage` browser. Artinya data hanya ada pada browser/perangkat yang digunakan. Jangan commit file Excel customer atau data nomor HP/VIN ke repository publik.

## Upgrade yang direkomendasikan
Untuk pemakaian multi-user/multi-device dan backup terpusat, tambahkan backend (misalnya Supabase/Firebase) dengan autentikasi dan database.
