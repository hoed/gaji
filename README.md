# Gaji - Sistem Payroll Terintegrasi

**Gaji** adalah sistem payroll open-source yang dirancang untuk memudahkan perusahaan dalam mengelola penggajian karyawan secara otomatis dan efisien. Sistem ini mendukung integrasi dengan mesin absensi, Google Calendar, dan fitur manajemen karyawan lengkap, termasuk pemotongan pajak dan BPJS.

## Fitur Utama

- **Integrasi Mesin Absensi**
  - Sinkronisasi otomatis data kehadiran karyawan dari mesin absensi fingerprint atau RFID.
  - Mendukung format umum (CSV, API, atau lokal).

- **Integrasi Google Calendar**
  - Sinkronisasi hari libur nasional dan cuti karyawan langsung dari Google Calendar.
  - Menyediakan tampilan kalender kerja yang interaktif.

- **Manajemen Karyawan**
  - Tambah, ubah, dan arsipkan data karyawan.
  - Pengaturan jabatan, departemen, dan kontrak kerja.
  - Riwayat kehadiran, cuti, dan status aktif/non-aktif.

- **Pemotongan Pajak dan BPJS**
  - Perhitungan otomatis PPh 21 sesuai regulasi pajak Indonesia.
  - Integrasi BPJS Kesehatan dan Ketenagakerjaan.
  - Slip gaji lengkap dengan rincian potongan dan tunjangan.

## Teknologi

- Backend: Python / Go (TBD)
- Frontend: React.js, Vite, TailwindCSS
- Database: PostgreSQL / MySQL
- Autentikasi: JWT / OAuth2
- Integrasi Eksternal: Google Calendar API, API mesin absensi (jika tersedia)

## Instalasi

```bash
git clone https://github.com/hoed/gaji.git
cd gaji
# Ikuti petunjuk instalasi backend dan frontend di folder masing-masing
```

## Konfigurasi

1. Atur koneksi database pada `.env`
2. Konfigurasikan API key Google Calendar
3. Integrasikan dengan mesin absensi (jika ada)
4. Jalankan backend dan frontend

## Dokumentasi

Lihat dokumentasi lengkap di folder `docs/` atau akses [Wiki GitHub](https://github.com/hoed/gaji/wiki) (jika tersedia).

## Kontribusi

Pull request sangat diterima! Untuk perubahan besar, mohon buka issue terlebih dahulu agar bisa didiskusikan.

## Lisensi

MIT License. Lihat `LICENSE` untuk detail.
