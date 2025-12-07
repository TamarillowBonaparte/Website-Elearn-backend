# Liveness Detection - Testing & Setup Guide

## 📋 Requirements

Install dependencies terlebih dahulu:

```bash
pip install opencv-python mediapipe numpy
```

## 🚀 Quick Start

### 1. Test Liveness Detection (Standalone)

```bash
python liveness_detection.py
```

**Controls:**
- **SPACE** = Start challenge baru
- **Q** = Keluar

### 2. Test dengan Face Recognition

```bash
python face_recognize_with_liveness.py
```

Akan melakukan liveness check terlebih dahulu sebelum face recognition.

## 🎯 Challenge Types

System akan memberikan challenge secara random:

1. **Eye Blink** - Kedipkan mata 3 kali
   - Deteksi menggunakan Eye Aspect Ratio (EAR)
   - Threshold: EAR < 0.21

2. **Turn Left** - Toleh ke kiri
   - Deteksi rotasi kepala (yaw angle)
   - Threshold: > 15° ke kiri

3. **Turn Right** - Toleh ke kanan
   - Deteksi rotasi kepala (yaw angle)
   - Threshold: > 15° ke kanan

4. **Head Nod** - Angguk ke bawah
   - Deteksi pitch angle
   - Threshold: > 12° ke bawah

5. **Smile** - Senyum lebar
   - Deteksi mouth aspect ratio
   - Threshold: perubahan > 0.02 dari baseline

## 🔧 Tuning Thresholds

Edit di `liveness_detection.py`:

```python
# Line 29-32
EYE_AR_THRESHOLD = 0.21      # Makin kecil = makin sensitive untuk blink
HEAD_TURN_THRESHOLD = 15     # Makin kecil = toleransi turn makin kecil
HEAD_NOD_THRESHOLD = 12      # Makin kecil = toleransi nod makin kecil
SMILE_THRESHOLD = 0.02       # Makin kecil = deteksi smile makin sensitive
```

## 🔐 Liveness Token

Setelah challenge berhasil, system generate token SHA-256:

```json
{
  "challenge": "BLINK",
  "timestamp": "2025-11-30T10:30:45.123456",
  "details": {
    "blink_count": 3,
    "elapsed": 5.2,
    "ear": 0.187
  }
}
```

Token ini bisa dikirim ke backend untuk verification.

## 📊 How It Works

### MediaPipe Face Mesh

- Deteksi 468 facial landmarks
- Real-time tracking dengan high accuracy
- Mendukung 3D head pose estimation

### Detection Methods

1. **Eye Blink Detection**
   ```
   EAR = (A + B) / (2 * C)
   
   Where:
   A = Vertical distance 1
   B = Vertical distance 2
   C = Horizontal distance
   ```

2. **Head Pose Estimation**
   - Yaw (left-right): Calculated from nose and eye positions
   - Pitch (up-down): Calculated from nose, eyes, and chin
   - Calibration: First 10 frames untuk baseline

3. **Smile Detection**
   - Mouth width to height ratio
   - Compare dengan baseline (neutral expression)

## 🎨 Visual Feedback

- **Green Box** = Challenge aktif, progress baik
- **Red Box** = Wajah tidak terdeteksi
- **Yellow Text** = Instruksi challenge
- **White Text** = Status dan progress
- **Face Mesh** = 468 landmarks overlay

## ⚙️ Performance Tips

1. **Lighting**: Pastikan pencahayaan cukup
2. **Distance**: Jarak 30-50cm dari webcam optimal
3. **Resolution**: Default 1280x720, bisa disesuaikan
4. **CPU Usage**: ~15-30% untuk single core (MediaPipe optimized)

## 🐛 Troubleshooting

### Webcam tidak terbuka
```python
# Coba ganti camera index
cap = cv2.VideoCapture(1)  # atau 2, 3, dll
```

### False positives (terlalu mudah)
- Naikkan threshold values
- Tambahkan CALIBRATION_REQUIRED frames

### False negatives (terlalu sulit)
- Turunkan threshold values
- Kurangi MIN_FRAMES_CLOSED untuk blink

### Latency tinggi
- Turunkan resolution
- Set min_detection_confidence lebih rendah

## 📝 Integration dengan Backend

Untuk production, kirim token ke backend:

```python
import requests

def submit_presensi_with_liveness(image, token):
    response = requests.post(
        'http://localhost:8000/api/presensi/submit',
        files={'image': image},
        data={
            'liveness_token': token,
            'device_id': get_device_id(),
            'timestamp': datetime.now().isoformat()
        }
    )
    return response.json()
```

Backend harus verify:
1. Token format valid
2. Timestamp tidak expired (< 30 detik)
3. Challenge type sesuai
4. Nonce belum pernah digunakan (prevent replay attack)

## 🎓 Testing Scenarios

### Scenario 1: Normal User
✅ Challenge berhasil dalam 5-10 detik
✅ Token generated
✅ Proceed to face recognition

### Scenario 2: Photo Attack
❌ Tidak ada blink/movement
❌ Timeout setelah 15 detik
❌ Challenge gagal

### Scenario 3: Video Replay
❌ Movement patterns tidak natural
❌ Bisa tambahkan randomness detection
❌ Challenge gagal

## 🔒 Security Best Practices

1. **Random Challenge** - Unpredictable
2. **Short Timeout** - 15 detik max
3. **Token Expiry** - 30 detik validity
4. **One-Time Use** - Prevent replay
5. **Device Binding** - Combine dengan device ID
6. **GPS Check** - Validate location (optional)

## 📦 File Structure

```
face-recognition-test/
├── liveness_detection.py              # Standalone liveness testing
├── face_recognize_with_liveness.py    # Combined liveness + face recognition
├── face_recognize.py                  # Original face recognition (with Moiré)
├── face_register.py                   # Face registration
├── embeddings/                        # Saved face embeddings
└── LIVENESS_SETUP.md                  # This file
```

## 🚀 Next Steps

1. ✅ Test liveness detection standalone
2. ⏳ Integrate dengan face recognition
3. ⏳ Connect ke backend API
4. ⏳ Add device ID verification
5. ⏳ Implement di Android app
