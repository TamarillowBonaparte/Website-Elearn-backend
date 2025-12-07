# Database Migrations

Folder ini berisi SQL migration scripts untuk database E-Learning.

## Available Migrations

### 1. create_informasi_table.sql

**Deskripsi:** Membuat tabel `informasi` untuk fitur pengumuman/informasi di mobile app.

**Cara Run:**

```bash
# Windows PowerShell
Get-Content "migrations\create_informasi_table.sql" | mysql -u root -p e-learn

# Or cmd
mysql -u root -p e-learn < migrations\create_informasi_table.sql
```

### 2. update_informasi_target_role.sql

**Deskripsi:** Update enum `target_role` dari 'dosen' menjadi 'admin' untuk konsistensi.

**Cara Run:**

```bash
mysql -u root -p e-learn < migrations\update_informasi_target_role.sql
```

### 3. fix_missing_columns_and_constraints.sql

**Deskripsi:** Menambahkan foreign key constraint yang hilang pada tabel informasi.

**Cara Run:**

```bash
mysql -u root -p e-learn < migrations\fix_missing_columns_and_constraints.sql
```

## Urutan Eksekusi

Jalankan migrations sesuai urutan berikut:

1. `create_informasi_table.sql` - Create tabel informasi
2. `fix_missing_columns_and_constraints.sql` - Fix foreign keys
3. `update_informasi_target_role.sql` - (Optional) Update target_role enum

## Notes

- Pastikan database `e-learn` sudah ada sebelum run migrations
- Backup database sebelum run migrations
- Migrations bersifat idempotent (aman dijalankan berulang kali)

## Rollback

Untuk rollback tabel informasi:

```sql
DROP TABLE IF EXISTS informasi;
```
