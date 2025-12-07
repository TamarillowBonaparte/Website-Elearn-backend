# Panduan Endpoint PDF Materi

## Endpoint yang Tersedia

### 1. Get All Materi dengan Filter

```
GET /materi/?kode_mk={kode}&id_kelas={id}&minggu={minggu}
```

**Response:**

```json
[
  {
    "id_materi": 1,
    "kode_mk": "BD001",
    "id_kelas": 1,
    "minggu": 1,
    "judul": "Pengenalan Basis Data",
    "deskripsi": "Materi pengenalan...",
    "file_pdf": "BD001_kelas1_minggu1_abc123.pdf",
    "uploaded_by": 1,
    "nama_dosen": "Dr. Ahmad Wijaya",
    "tanggal_upload": "2025-11-27T12:00:00",
    "pdf_url": "/uploads/materi/BD001_kelas1_minggu1_abc123.pdf",
    "pdf_file_url": "/materi/file/1",
    "pdf_view_url": "/materi/view/1",
    "pdf_download_url": "/materi/download/1"
  }
]
```

### 2. Get PDF URL Info

```
GET /materi/pdf/{id_materi}
```

**Response:**

```json
{
  "id_materi": 1,
  "judul": "Pengenalan Basis Data",
  "file_pdf": "BD001_kelas1_minggu1_abc123.pdf",
  "pdf_url": "/uploads/materi/BD001_kelas1_minggu1_abc123.pdf",
  "view_url": "/materi/view/1",
  "download_url": "/materi/download/1"
}
```

### 3. Stream PDF File (Untuk React Native)

```
GET /materi/file/{id_materi}
```

**Response:** Binary PDF file dengan header inline

### 4. View PDF (Browser Inline)

```
GET /materi/view/{id_materi}
```

**Response:** PDF file yang dibuka langsung di browser

### 5. Download PDF

```
GET /materi/download/{id_materi}
```

**Response:** PDF file dengan header attachment (trigger download)

### 6. Static File Access

```
GET /uploads/materi/{filename}
```

**Example:** `GET /uploads/materi/BD001_kelas1_minggu1_abc123.pdf`

## Cara Menggunakan di React Native

### Menggunakan react-native-pdf

```javascript
import Pdf from "react-native-pdf";
import { API_URL } from "../config/api";

// Opsi 1: Gunakan endpoint /materi/file/{id_materi}
const pdfUrl = `${API_URL}/materi/file/${id_materi}`;

// Opsi 2: Gunakan static file URL
const pdfUrl = `${API_URL}/uploads/materi/${file_pdf}`;

<Pdf
  source={{ uri: pdfUrl }}
  onLoadComplete={(numberOfPages) => {
    console.log(`PDF loaded with ${numberOfPages} pages`);
  }}
  onError={(error) => {
    console.error("PDF Error:", error);
  }}
  style={{ flex: 1 }}
/>;
```

### Menggunakan react-native-blob-util

```javascript
import ReactNativeBlobUtil from "react-native-blob-util";
import { API_URL } from "../config/api";

const downloadPDF = async (id_materi, filename) => {
  const { dirs } = ReactNativeBlobUtil.fs;
  const pdfUrl = `${API_URL}/materi/file/${id_materi}`;

  try {
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: `${dirs.DownloadDir}/${filename}.pdf`,
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        path: `${dirs.DownloadDir}/${filename}.pdf`,
        description: "Downloading PDF",
      },
    }).fetch("GET", pdfUrl);

    console.log("PDF downloaded:", res.path());
    return res.path();
  } catch (error) {
    console.error("Download error:", error);
  }
};
```

### Fetch dengan Token Authorization

```javascript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../config/api";

const getPDFWithAuth = async (id_materi) => {
  const token = await AsyncStorage.getItem("access_token");

  const response = await axios.get(`${API_URL}/materi/file/${id_materi}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    responseType: "blob", // Untuk browser
  });

  return response.data;
};
```

## Troubleshooting

### Error: "Gagal memuat PDF"

1. **Periksa URL:** Pastikan menggunakan IP server yang benar (bukan localhost)

   ```javascript
   // ❌ Salah (di device/emulator)
   const API_URL = "http://localhost:8000";

   // ✅ Benar (gunakan IP komputer)
   const API_URL = "http://192.168.1.100:8000";
   ```

2. **Periksa file exists:** Pastikan file PDF ada di folder `uploads/materi/`

3. **Periksa CORS:** Pastikan CORS sudah diaktifkan di backend (sudah ada di `main.py`)

4. **Periksa Response Header:** File harus memiliki `Content-Type: application/pdf`

### Error: "Network request failed"

1. Pastikan backend server berjalan
2. Pastikan device/emulator bisa akses IP server
3. Test endpoint dengan browser/Postman terlebih dahulu

### Error: "File not found"

1. Cek database: apakah `file_pdf` column terisi dengan benar
2. Cek folder uploads: apakah file fisik ada di `Backend_api/uploads/materi/`
3. Cek permission folder uploads (harus writable)

## Testing Endpoint

### Menggunakan cURL

```bash
# Get materi list
curl http://localhost:8000/materi/?kode_mk=BD001&id_kelas=1

# Get PDF info
curl http://localhost:8000/materi/pdf/1

# Download PDF
curl -O http://localhost:8000/materi/file/1

# Test static file
curl -O http://localhost:8000/uploads/materi/BD001_kelas1_minggu1_abc123.pdf
```

### Menggunakan Browser

```
http://localhost:8000/materi/view/1
http://localhost:8000/materi/file/1
http://localhost:8000/uploads/materi/BD001_kelas1_minggu1_abc123.pdf
```

## Database Schema

Tabel `materi`:

```sql
CREATE TABLE `materi` (
  `id_materi` int NOT NULL AUTO_INCREMENT,
  `kode_mk` varchar(20) NOT NULL,
  `id_kelas` int NOT NULL,
  `minggu` int NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text,
  `file_pdf` varchar(255) DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `tanggal_upload` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_materi`),
  KEY `kode_mk` (`kode_mk`),
  KEY `id_kelas` (`id_kelas`),
  KEY `uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
