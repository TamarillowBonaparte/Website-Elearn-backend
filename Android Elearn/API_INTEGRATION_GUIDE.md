# API Endpoints untuk Mobile App - Sistem Presensi

## Base Configuration

```javascript
const API_URL = 'http://YOUR_SERVER_IP:8000';
```

## 🔐 Authentication Endpoints

### Login

```http
POST /auth/login
Content-Type: application/json

Body:
{
  "username": "E41253310",
  "password": "mahasiswa123"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id_user": 1,
    "username": "E41253310",
    "email": "mahasiswa@example.com",
    "role": "mahasiswa"
  }
}
```

## 👤 Mahasiswa Endpoints

### Get Mahasiswa by NIM

```http
GET /mahasiswa/nim/{nim}
Headers:
  Authorization: Bearer {token}

Response:
{
  "id_mahasiswa": 1,
  "nim": "E41253310",
  "nama_mahasiswa": "Mahasiswa TIF 1",
  "email": "mahasiswa1@polije.ac.id",
  "id_kelas": 1,
  "kelas": {
    "id_kelas": 1,
    "nama_kelas": "TIF-2023-A"
  }
}
```

## 📋 Presensi Endpoints

### Get Presensi Mahasiswa

```http
GET /presensi/mahasiswa/{id_mahasiswa}
Headers:
  Authorization: Bearer {token}

Response:
{
  "mahasiswa": {
    "id_mahasiswa": 1,
    "nim": "E41253310",
    "nama": "Mahasiswa TIF 1",
    "kelas": "TIF-2023-A"
  },
  "presensi": [
    {
      "id_presensi": 17,
      "kode_mk": "BD001",
      "nama_mk": "Basis Data",
      "kelas": "TIF-2023-A",
      "tanggal": "2025-11-25",
      "pertemuan_ke": 1,
      "status": "Hadir",
      "waktu_input": "2025-11-25T13:36:00",
      "waktu_mulai": "13:36",
      "waktu_selesai": "14:38"
    },
    {
      "id_presensi": 19,
      "kode_mk": "BD001",
      "nama_mk": "Basis Data",
      "kelas": "TIF-2023-A",
      "tanggal": "2025-11-25",
      "pertemuan_ke": 2,
      "status": "Belum Absen",
      "waktu_input": null,
      "waktu_mulai": "15:35",
      "waktu_selesai": "16:35"
    }
  ]
}
```

### Generate Presensi (Admin/Dosen Only)

```http
POST /presensi/generate
Headers:
  Authorization: Bearer {dosen_token}
Content-Type: application/json

Body:
{
  "id_kelas": 1,
  "kode_mk": "BD001",
  "pertemuan_ke": 1,
  "tanggal": "2025-11-25",
  "waktu_mulai": "08:00",
  "waktu_selesai": "09:40"
}

Response:
{
  "message": "Presensi berhasil digenerate",
  "data": {
    "kelas": "TIF-2023-A",
    "mata_kuliah": "Basis Data",
    "kode_mk": "BD001",
    "pertemuan_ke": 1,
    "tanggal": "2025-11-25",
    "waktu_mulai": "08:00",
    "waktu_selesai": "09:40",
    "total_mahasiswa": 30,
    "mahasiswa": [...]
  }
}
```

### Update Status Presensi (Face Recognition)

```http
POST /presensi/update-status-face-recognition
Headers:
  Authorization: Bearer {token}
Query Parameters:
  id_presensi: 17
  nim: E41253310

Response (Success):
{
  "message": "Presensi berhasil diupdate menjadi Hadir",
  "data": {
    "id_presensi": 17,
    "status": "Hadir",
    "waktu_input": "2025-11-25T13:36:00.123456",
    "mahasiswa": {
      "nim": "E41253310",
      "nama": "Mahasiswa TIF 1"
    },
    "mata_kuliah": "Basis Data",
    "pertemuan_ke": 1
  }
}

Response (Error - Waktu Belum Dibuka):
{
  "detail": "Presensi belum dibuka, tanggal presensi belum tiba"
}

Response (Error - Waktu Sudah Lewat):
{
  "detail": "Waktu presensi sudah berakhir pada pukul 09:40"
}

Response (Error - NIM Tidak Sesuai):
{
  "detail": "NIM tidak sesuai dengan data presensi"
}
```

## 👁️ Face Recognition Endpoint

### Recognize Face

```http
POST /recognize/
Content-Type: multipart/form-data

Body (FormData):
  file: [image file] (JPEG/PNG)

Response (Success):
{
  "status": "success",
  "message": "Face detected and recognized",
  "face_detected": true,
  "recognized": [
    {
      "username": "E41253310",
      "distance": 0.35,
      "embedding": [...]
    }
  ],
  "num_faces": 1
}

Response (No Face):
{
  "status": "success",
  "message": "No face detected",
  "face_detected": false,
  "recognized": [],
  "num_faces": 0
}

Response (Unknown Face):
{
  "status": "success",
  "message": "Face detected but not recognized",
  "face_detected": true,
  "recognized": [],
  "num_faces": 1
}
```

## 📱 Mobile App Implementation

### 1. Fetch Presensi di HomeScreen

```javascript
const fetchPresensiData = async id_mahasiswa => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const response = await axios.get(
      `${API_URL}/presensi/mahasiswa/${id_mahasiswa}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.data && response.data.presensi) {
      // Filter presensi yang masih aktif
      const currentDateTime = new Date();
      const filteredPresensi = response.data.presensi.filter(p => {
        const presensiDate = new Date(p.tanggal);
        const [hours, minutes] = p.waktu_selesai.split(':');
        const deadlineTime = new Date(presensiDate);
        deadlineTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Tampilkan jika: belum lewat deadline ATAU sudah hadir
        return deadlineTime >= currentDateTime || p.status === 'Hadir';
      });
      setPresensiList(filteredPresensi);
    }
  } catch (error) {
    console.error('Error fetching presensi:', error);
  }
};
```

### 2. Navigate to Camera dengan Data Presensi

```javascript
const handlePresensiClick = presensi => {
  // Validasi waktu
  const currentDateTime = new Date();
  const presensiDate = new Date(presensi.tanggal);
  const [startHours, startMinutes] = presensi.waktu_mulai.split(':');
  const [endHours, endMinutes] = presensi.waktu_selesai.split(':');

  const startTime = new Date(presensiDate);
  startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);

  const endTime = new Date(presensiDate);
  endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

  if (currentDateTime < startTime) {
    Alert.alert(
      'Presensi Belum Dibuka',
      `Presensi akan dibuka pada pukul ${presensi.waktu_mulai}`,
    );
    return;
  }

  if (currentDateTime > endTime) {
    Alert.alert(
      'Waktu Berakhir',
      `Waktu presensi sudah berakhir pada pukul ${presensi.waktu_selesai}`,
    );
    return;
  }

  // Navigate ke CameraScreen
  navigation.navigate('Camera', {
    id_presensi: presensi.id_presensi,
    mata_kuliah: presensi.nama_mk,
    pertemuan_ke: presensi.pertemuan_ke,
    kode_mk: presensi.kode_mk,
    nim: mahasiswaData.nim,
    id_mahasiswa: mahasiswaData.id_mahasiswa,
  });
};
```

### 3. Face Recognition dan Update Status

```javascript
// Di CameraScreen.js
const captureAndDetect = async () => {
  // 1. Ambil foto
  const photo = await cameraRef.current.takePhoto({
    qualityPrioritization: 'speed',
  });

  // 2. Kirim ke API untuk face recognition
  const formData = new FormData();
  formData.append('file', {
    uri: 'file://' + photo.path,
    type: 'image/jpeg',
    name: 'face.jpg',
  });

  const recognitionResponse = await axios.post(
    `${API_URL}/recognize/`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );

  if (recognitionResponse.data.recognized.length > 0) {
    const recognizedNim = recognitionResponse.data.recognized[0].username;

    // 3. Validasi NIM
    if (recognizedNim !== nim) {
      Alert.alert(
        'Validasi Gagal',
        'Wajah yang ter-scan tidak sesuai dengan akun Anda',
      );
      return;
    }

    // 4. Update status presensi
    const token = await AsyncStorage.getItem('access_token');
    const updateResponse = await axios.post(
      `${API_URL}/presensi/update-status-face-recognition`,
      null,
      {
        params: { id_presensi, nim: recognizedNim },
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    Alert.alert('Presensi Berhasil!', updateResponse.data.message);
    navigation.goBack(); // Kembali ke HomeScreen
  }
};
```

## 🔄 Auto-Update Status

Backend secara otomatis akan mengupdate status "Belum Absen" menjadi "Alfa" ketika:

- Endpoint `/presensi/detail/{kode_mk}/{tanggal}/{pertemuan_ke}` dipanggil
- Endpoint `/presensi/mahasiswa/{id_mahasiswa}` dipanggil
- Waktu sekarang > `waktu_selesai`

## ⚠️ Error Handling

### Common Errors

```javascript
// 1. Token expired
if (error.response?.status === 401) {
  // Redirect to login
  await AsyncStorage.clear();
  navigation.navigate('Login');
}

// 2. Network error
if (error.message === 'Network Error') {
  Alert.alert('Error', 'Tidak dapat terhubung ke server');
}

// 3. Validation error
if (error.response?.status === 400) {
  Alert.alert('Error', error.response.data.detail);
}
```

## 📊 Status Flow

```
┌─────────────────┐
│  Belum Absen    │  ← Default saat generate
└────────┬────────┘
         │
         ├──→ Face Recognition Success ──→ Hadir
         │
         └──→ Waktu Lewat ──→ Alfa (Auto-update)
```

## 🎯 Best Practices

1. **Always check token validity** sebelum API call
2. **Handle network errors** dengan graceful fallback
3. **Validate data** sebelum mengirim ke API
4. **Cache user data** di AsyncStorage untuk mengurangi API calls
5. **Implement pull-to-refresh** untuk update data terbaru
6. **Show loading indicators** saat fetch data
7. **Log errors** untuk debugging

---

**Documentation Version**: 1.0.0
**Last Updated**: 27 November 2025
