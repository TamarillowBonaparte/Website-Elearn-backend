"""
Face Recognition Script
=======================
Script untuk mengenali wajah yang sudah terdaftar secara real-time.
Menggunakan FaceNet embedding dan Cosine Similarity untuk matching.
"""

import cv2
import numpy as np
import pickle
import os
from keras_facenet import FaceNet
from mtcnn import MTCNN
from scipy.spatial.distance import cosine

# Inisialisasi
print("🔄 Loading models...")
embedder = FaceNet()
# MTCNN dengan parameter optimasi untuk performance
detector = MTCNN(
    min_face_size=40,  # Skip wajah terlalu kecil (lebih cepat)
    steps_threshold=[0.6, 0.7, 0.7]  # Threshold lebih tinggi = lebih cepat
)
print("✅ Models loaded successfully!")

# Configuration
EMBEDDINGS_DIR = "embeddings"
THRESHOLD = 0.4  # Cosine distance threshold (lower = more strict)

# Liveness Detection Configuration
LIVENESS_ENABLED = True  # Toggle liveness detection on/off
MOIRE_THRESHOLD = 0.4  # Threshold untuk deteksi pola moiré - REVERSED LOGIC: ratio < threshold = spoofing
COLOR_VAR_S_THRESHOLD = 400  # Saturation variance threshold
COLOR_VAR_V_THRESHOLD = 500  # Value variance threshold

def load_all_embeddings():
    """
    Load semua embedding yang sudah terdaftar
    """
    if not os.path.exists(EMBEDDINGS_DIR):
        print(f"❌ Folder {EMBEDDINGS_DIR} tidak ditemukan!")
        return {}
    
    embeddings_db = {}
    files = [f for f in os.listdir(EMBEDDINGS_DIR) if f.endswith('.pkl')]
    
    if len(files) == 0:
        print("⚠️  Belum ada wajah yang terdaftar!")
        print("   Jalankan face_register.py terlebih dahulu.")
        return {}
    
    print(f"\n📂 Loading {len(files)} registered face(s)...")
    for file in files:
        username = file.replace('.pkl', '')
        with open(os.path.join(EMBEDDINGS_DIR, file), 'rb') as f:
            embedding = pickle.load(f)
            embeddings_db[username] = embedding
            print(f"   ✓ {username}")
    
    print(f"✅ Loaded {len(embeddings_db)} embedding(s)\n")
    return embeddings_db


def detect_moire_pattern(face_region):
    """
    Deteksi pola moiré yang muncul saat kamera menangkap layar HP/laptop.
    Pola moiré adalah interferensi antara pixel grid kamera dan pixel grid layar.
    
    Args:
        face_region: Area wajah yang terdeteksi (numpy array)
    
    Returns:
        tuple: (is_screen, moire_score)
    """
    try:
        # Convert ke grayscale
        if len(face_region.shape) == 3:
            gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        else:
            gray = face_region
        
        # Resize untuk konsistensi (kalau terlalu kecil/besar)
        if gray.shape[0] < 50 or gray.shape[1] < 50:
            return False, 0.0
        
        # FFT (Fast Fourier Transform) untuk analisa frekuensi
        f_transform = np.fft.fft2(gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = np.abs(f_shift)
        
        # Hitung energy di high frequency region
        # Layar HP punya pola grid yang muncul sebagai high frequency
        h, w = magnitude_spectrum.shape
        center_mask = np.zeros((h, w))
        center_radius = min(h, w) // 6
        cv2.circle(center_mask, (w//2, h//2), center_radius, 1, -1)
        
        # High frequency energy (tepi spectrum)
        high_freq_energy = np.sum(magnitude_spectrum * (1 - center_mask))
        total_energy = np.sum(magnitude_spectrum)
        
        # Ratio high freq / total
        ratio = high_freq_energy / (total_energy + 1e-6)
        
        # DEBUG: Print actual values
        print(f"  [DEBUG] Moiré score: {ratio:.4f} | Threshold: {MOIRE_THRESHOLD}")
        
        # BALIK LOGIKA: 
        # - Wajah ASLI: banyak texture/detail → HIGH frequency → ratio TINGGI ✅
        # - Foto LAYAR: smooth/blur → LOW frequency → ratio RENDAH ❌
        # Jadi deteksi spoofing kalau ratio TERLALU RENDAH
        is_screen = ratio < MOIRE_THRESHOLD
        
        print(f"  [DEBUG] Is spoofing: {is_screen} (ratio {'<' if is_screen else '>='} threshold)")
        
        return is_screen, ratio
    
    except Exception as e:
        print(f"⚠️  Error in moiré detection: {e}")
        return False, 0.0


def detect_artificial_light(face_region):
    """
    Deteksi backlight artificial dari layar (HP/laptop/tablet).
    Layar memiliki karakteristik warna yang lebih uniform dibanding wajah asli.
    
    Args:
        face_region: Area wajah yang terdeteksi (numpy array)
    
    Returns:
        tuple: (is_artificial, color_stats)
    """
    try:
        # Convert ke HSV
        if face_region.shape[2] == 3:
            hsv = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
        else:
            return False, (0, 0)
        
        # Hitung variance untuk Saturation dan Value channel
        saturation = hsv[:, :, 1]
        value = hsv[:, :, 2]
        
        s_var = np.var(saturation)
        v_var = np.var(value)
        
        # Layar HP: warna flat (variance rendah)
        # Wajah asli: variasi kulit, bayangan (variance tinggi)
        is_artificial = (s_var < COLOR_VAR_S_THRESHOLD) and (v_var < COLOR_VAR_V_THRESHOLD)
        
        return is_artificial, (s_var, v_var)
    
    except Exception as e:
        print(f"⚠️  Error in color analysis: {e}")
        return False, (0, 0)


def check_liveness(face_region):
    """
    Liveness detection: HANYA Moiré Pattern Detection.
    Mendeteksi apakah wajah adalah asli atau foto di layar HP/laptop.
    
    Args:
        face_region: Area wajah yang terdeteksi (numpy array)
    
    Returns:
        tuple: (is_live, confidence, details)
    """
    if not LIVENESS_ENABLED:
        return True, 1.0, {'method': 'disabled'}
    
    # Method 1: Moiré Pattern Detection
    is_screen_moire, moire_score = detect_moire_pattern(face_region)
    
    # Method 2: Color Variance Analysis (Artificial Light)
    is_artificial, (s_var, v_var) = detect_artificial_light(face_region)
    
    print(f"  [DEBUG] Artificial Light: {is_artificial} | S_var: {s_var:.1f} | V_var: {v_var:.1f}")
    
    # Decision: Gabungan kedua metode (OR voting)
    # Jika SALAH SATU mendeteksi spoofing = REJECT
    is_spoofing = is_screen_moire or is_artificial
    
    # Calculate confidence score
    if is_spoofing:
        if is_screen_moire:
            # Spoofing dari Moiré: ratio rendah (< threshold)
            confidence = 1.0 - (moire_score / MOIRE_THRESHOLD)
            confidence = max(0.0, min(confidence, 1.0))
            method = "Moiré Pattern (Screen - Low Frequency)"
        else:
            # Spoofing dari artificial light: variance rendah
            confidence = 1.0 - min(s_var / COLOR_VAR_S_THRESHOLD, 1.0)
            method = "Artificial Light (Backlight Detected)"
    else:
        # Live: kedua metode pass
        confidence = moire_score / MOIRE_THRESHOLD
        confidence = min(confidence, 1.0)
        method = "Live (Real Face)"
    
    details = {
        'is_live': not is_spoofing,
        'moire_detected': is_screen_moire,
        'moire_score': moire_score,
        'artificial_light': is_artificial,
        'saturation_var': s_var,
        'value_var': v_var,
        'method': method
    }
    
    return not is_spoofing, confidence, details


def recognize_face(face_embedding, embeddings_db, threshold=THRESHOLD):
    """
    Mengenali wajah berdasarkan embedding
    
    Returns:
        tuple: (username, distance, confidence) or (None, None, None) if not recognized
    """
    best_match = None
    min_distance = float('inf')
    
    for username, registered_embedding in embeddings_db.items():
        distance = cosine(registered_embedding, face_embedding)
        
        if distance < min_distance:
            min_distance = distance
            best_match = username
    
    # Check threshold
    if min_distance < threshold:
        confidence = 1 - min_distance  # Convert to confidence score
        return best_match, min_distance, confidence
    else:
        return None, None, None


def recognize_from_camera(embeddings_db):
    """
    Face recognition dari webcam real-time
    """
    global LIVENESS_ENABLED
    
    print("📹 Starting camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Tidak dapat membuka kamera!")
        return
    
    print("\n" + "="*60)
    print("🔍 FACE RECOGNITION MODE")
    print("="*60)
    print("Instruksi:")
    print("  - Posisikan wajah di depan kamera")
    print("  - Wajah yang terdaftar akan dikenali otomatis")
    print("  - Tekan 'q' untuk QUIT")
    print("="*60 + "\n")
    
    # Statistics
    frame_count = 0
    recognition_stats = {}
    faces = []  # Cache hasil deteksi
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Tidak dapat membaca frame!")
            break
        
        frame_count += 1
        
        # Flip horizontal untuk mirror effect
        frame = cv2.flip(frame, 1)
        
        # Convert to RGB (diperlukan untuk processing)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Deteksi wajah (setiap 5 frame untuk performa optimal)
        if frame_count % 5 == 0:
            faces = detector.detect_faces(rgb_frame)
            
        # Process detected faces (menggunakan hasil cache jika tidak ada deteksi baru)
        if faces:
            for face in faces:
                x, y, w, h = face['box']
                confidence = face['confidence']
                
                # Pastikan bounding box dalam frame
                x, y = max(0, x), max(0, y)
                w, h = min(w, frame.shape[1] - x), min(h, frame.shape[0] - y)
                
                if w <= 0 or h <= 0:
                    continue
                
                # Crop face untuk face recognition (tight crop)
                face_crop = rgb_frame[y:y+h, x:x+w]
                
                try:
                    # ========================================
                    # LIVENESS DETECTION (Anti-Spoofing)
                    # Menggunakan FULL FRAME untuk deteksi spoofing
                    # ========================================
                    is_live, liveness_conf, liveness_details = check_liveness(rgb_frame)
                    
                    if not is_live:
                        # ❌ SPOOFING DETECTED - Ini foto di layar HP!
                        color = (0, 165, 255)  # Orange
                        label = "⚠️ SPOOFING DETECTED"
                        
                        if liveness_details['moire_detected']:
                            detail = "Screen/Display Detected (HP/Laptop)"
                            icon = "📱"
                        else:
                            detail = "Artificial Light Detected"
                            icon = "💡"
                        
                        # Draw thick warning border
                        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 4)
                        
                        # Background for warning text
                        cv2.rectangle(frame, (x, y-80), (x+w, y), (0, 0, 0), -1)
                        cv2.putText(frame, f"{icon} {label}", (x+5, y-55), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                        cv2.putText(frame, detail, (x+5, y-30), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
                        cv2.putText(frame, f"Confidence: {liveness_conf:.1%}", (x+5, y-10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
                        
                        # Log ke console
                        print(f"\n🚫 Spoofing attempt detected!")
                        print(f"   Method: {liveness_details['method']}")
                        print(f"   Confidence: {liveness_conf:.1%}")
                        if liveness_details['moire_detected']:
                            print(f"   📱 Layar HP/Laptop terdeteksi (Moiré score: {liveness_details['moire_score']:.3f})")
                        if liveness_details['artificial_light']:
                            print(f"   💡 Backlight artificial terdeteksi")
                        
                        continue  # Skip face recognition untuk wajah palsu
                    
                    # ========================================
                    # FACE RECOGNITION (hanya jika liveness pass)
                    # ========================================
                    # Generate embedding
                    face_embedding = embedder.embeddings([face_crop])[0]
                    
                    # Recognize
                    username, distance, match_confidence = recognize_face(
                        face_embedding, embeddings_db, THRESHOLD
                    )
                    
                    if username:
                        # Recognized
                        color = (0, 255, 0)  # Green
                        label = f"{username}"
                        detail = f"Match: {match_confidence:.2%} | Dist: {distance:.3f}"
                        
                        # Update stats
                        recognition_stats[username] = recognition_stats.get(username, 0) + 1
                        
                        # Draw thicker rectangle for recognized face
                        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
                        
                        # Background for text
                        cv2.rectangle(frame, (x, y-60), (x+w, y), color, -1)
                        cv2.putText(frame, label, (x+5, y-35), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                        cv2.putText(frame, detail, (x+5, y-10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                    else:
                        # Unknown
                        color = (0, 0, 255)  # Red
                        label = "Unknown"
                        detail = "Not registered"
                        
                        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                        cv2.rectangle(frame, (x, y-50), (x+w, y), color, -1)
                        cv2.putText(frame, label, (x+5, y-25), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                        cv2.putText(frame, detail, (x+5, y-5), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
                
                except Exception as e:
                    print(f"⚠️  Error processing face: {str(e)}")
                    continue
        
        # Draw info panel
        info_y = 30
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 120), (0, 0, 0), -1)
        cv2.putText(frame, f"Registered: {len(embeddings_db)} | Threshold: {THRESHOLD}", 
                   (10, info_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Liveness status indicator
        liveness_status = "🛡️ ON" if LIVENESS_ENABLED else "⚠️ OFF"
        liveness_color = (0, 255, 0) if LIVENESS_ENABLED else (0, 165, 255)
        cv2.putText(frame, f"Anti-Spoofing: {liveness_status}", 
                   (10, info_y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, liveness_color, 1)
        
        cv2.putText(frame, "Press 'q' to QUIT | 'r' to RELOAD | 'l' to TOGGLE liveness", 
                   (10, info_y + 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        cv2.putText(frame, "📱 Detects: Phone/Laptop screens | Photo attacks", 
                   (10, info_y + 80), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (150, 150, 150), 1)
        
        # Show frame
        cv2.imshow('Face Recognition', frame)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n👋 Exiting...")
            break
        elif key == ord('r'):
            print("\n🔄 Reloading database...")
            embeddings_db = load_all_embeddings()
            if len(embeddings_db) == 0:
                print("⚠️  No embeddings loaded. Exiting...")
                break
        elif key == ord('l'):
            LIVENESS_ENABLED = not LIVENESS_ENABLED
            status = "ENABLED" if LIVENESS_ENABLED else "DISABLED"
            print(f"\n🛡️  Liveness Detection: {status}")
    
    # Print statistics
    if recognition_stats:
        print("\n" + "="*60)
        print("📊 RECOGNITION STATISTICS")
        print("="*60)
        for username, count in sorted(recognition_stats.items(), key=lambda x: x[1], reverse=True):
            print(f"  {username}: {count} detections")
        print("="*60)
    
    cap.release()
    cv2.destroyAllWindows()


def recognize_from_image(embeddings_db):
    """
    Face recognition dari file gambar
    """
    print("\n📁 RECOGNIZE FROM IMAGE FILE")
    print("-"*60)
    
    image_path = input("Enter path to image file: ").strip()
    
    if not os.path.exists(image_path):
        print(f"❌ File tidak ditemukan: {image_path}")
        return
    
    try:
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            print("❌ Error: Tidak dapat membaca gambar!")
            return
        
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces
        print("🔄 Detecting faces...")
        faces = detector.detect_faces(rgb_img)
        
        if len(faces) == 0:
            print("❌ Tidak ada wajah yang terdeteksi di gambar!")
            return
        
        print(f"✅ Terdeteksi {len(faces)} wajah\n")
        
        # ========================================
        # LIVENESS DETECTION (Anti-Spoofing)
        # Check FULL IMAGE untuk deteksi spoofing
        # ========================================
        print(f"\n🔍 Checking liveness on full image...")
        is_live, liveness_conf, liveness_details = check_liveness(rgb_img)
        
        if not is_live:
        
            # ❌ SPOOFING DETECTED
            print(f"\n  🚫 SPOOFING DETECTED!")
            print(f"     Method: {liveness_details['method']}")
            print(f"     Confidence: {liveness_conf:.1%}")
            
            if liveness_details['moire_detected']:
                print(f"     📱 Screen/Display detected (Moiré: {liveness_details['moire_score']:.3f})")
                detail_text = "Screen/Display (HP/Laptop)"
            else:
                print(f"     💡 Artificial light detected")
                detail_text = "Artificial Light"
            
            # Draw warning di semua wajah
            for face in faces:
                x, y, w, h = face['box']
                x, y = max(0, x), max(0, y)
                cv2.rectangle(img, (x, y), (x+w, y+h), (0, 165, 255), 4)  # Orange
            
            # Draw warning text di tengah atas
            cv2.rectangle(img, (50, 50), (img.shape[1] - 50, 200), (0, 0, 0), -1)
            cv2.rectangle(img, (50, 50), (img.shape[1] - 50, 200), (0, 165, 255), 3)
            cv2.putText(img, "SPOOFING DETECTED", (80, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 165, 255), 3)
            cv2.putText(img, detail_text, (80, 160),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
            
            print(f"  ⏭️  Skipping face recognition (spoofing detected)\n")
            
            # Show result
            cv2.imshow('Recognition Result - SPOOFING DETECTED', img)
            print("Press any key to close...")
            cv2.waitKey(0)
            cv2.destroyAllWindows()
            return
        
        print(f"  ✅ Liveness check PASSED\n")
        
        # Process each face
        for i, face in enumerate(faces, 1):
            x, y, w, h = face['box']
            
            # Pastikan bounding box dalam frame
            x, y = max(0, x), max(0, y)
            w, h = min(w, rgb_img.shape[1] - x), min(h, rgb_img.shape[0] - y)
            
            if w <= 0 or h <= 0:
                continue
            
            # Crop face untuk face recognition (tight crop)
            face_crop = rgb_img[y:y+h, x:x+w]
            
            # ========================================
            # FACE RECOGNITION
            # ========================================
            print(f"  Processing face {i}...")
            # Generate embedding
            face_embedding = embedder.embeddings([face_crop])[0]
            
            # Recognize
            username, distance, confidence = recognize_face(
                face_embedding, embeddings_db, THRESHOLD
            )
            
            if username:
                print(f"  ✅ Recognized: {username}")
                print(f"  📊 Confidence: {confidence:.2%}")
                print(f"  📏 Distance: {distance:.4f}")
                
                # Draw on image
                cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 3)
                cv2.putText(img, username, (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            else:
                print(f"  ❌ Unknown (not registered)")
                
                # Draw on image
                cv2.rectangle(img, (x, y), (x+w, y+h), (0, 0, 255), 2)
                cv2.putText(img, "Unknown", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2)
            print()
        
        # Show result
        cv2.imshow('Recognition Result', img)
        print("Press any key to close...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def batch_test_all_registered(embeddings_db):
    """
    Test recognition untuk semua wajah yang terdaftar
    """
    print("\n🧪 BATCH TEST MODE")
    print("="*60)
    print("Testing recognition untuk semua wajah terdaftar...")
    print("="*60 + "\n")
    
    results = []
    
    for username, embedding in embeddings_db.items():
        print(f"Testing: {username}")
        
        # Test against all others
        distances = {}
        for other_username, other_embedding in embeddings_db.items():
            distance = cosine(embedding, other_embedding)
            distances[other_username] = distance
        
        # Sort by distance
        sorted_matches = sorted(distances.items(), key=lambda x: x[1])
        
        # Best match should be itself (distance ≈ 0)
        best_match = sorted_matches[0]
        second_match = sorted_matches[1] if len(sorted_matches) > 1 else None
        
        print(f"  Best match: {best_match[0]} (distance: {best_match[1]:.4f})")
        if second_match:
            print(f"  2nd match: {second_match[0]} (distance: {second_match[1]:.4f})")
        
        # Check if correctly identified
        if best_match[0] == username and best_match[1] < THRESHOLD:
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        print(f"  Status: {status}\n")
        
        results.append({
            'username': username,
            'best_match': best_match[0],
            'distance': best_match[1],
            'pass': status == "✅ PASS"
        })
    
    # Summary
    print("="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    passed = sum(1 for r in results if r['pass'])
    total = len(results)
    print(f"Passed: {passed}/{total} ({passed/total*100:.1f}%)")
    print("="*60 + "\n")


def main():
    """
    Main menu
    """
    print("\n" + "="*60)
    print("🔍 FACE RECOGNITION SYSTEM")
    print("="*60)
    
    # Load embeddings
    embeddings_db = load_all_embeddings()
    
    if len(embeddings_db) == 0:
        print("\n⚠️  Belum ada wajah yang terdaftar!")
        print("   Jalankan face_register.py terlebih dahulu untuk registrasi.\n")
        return
    
    while True:
        print("\nMenu:")
        print("1. Recognize from Camera (Real-time)")
        print("2. Recognize from Image File")
        print("3. Batch Test All Registered Faces")
        print("4. Change Threshold")
        print("5. Reload Database")
        print("6. Exit")
        print("-"*60)
        
        choice = input("Pilih menu (1-6): ").strip()
        
        if choice == '1':
            recognize_from_camera(embeddings_db)
        elif choice == '2':
            recognize_from_image(embeddings_db)
        elif choice == '3':
            batch_test_all_registered(embeddings_db)
        elif choice == '4':
            try:
                global THRESHOLD
                new_threshold = float(input(f"Enter new threshold (current: {THRESHOLD}): "))
                THRESHOLD = new_threshold
                print(f"✅ Threshold updated to {THRESHOLD}")
            except ValueError:
                print("❌ Invalid input!")
        elif choice == '5':
            embeddings_db = load_all_embeddings()
            if len(embeddings_db) == 0:
                print("\n⚠️  No embeddings loaded. Exiting...")
                break
        elif choice == '6':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Pilihan tidak valid!")


if __name__ == "__main__":
    main()
