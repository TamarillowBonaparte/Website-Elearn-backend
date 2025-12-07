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
                
                # Crop face
                face_crop = rgb_frame[y:y+h, x:x+w]
                
                try:
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
        cv2.rectangle(frame, (0, 0), (frame.shape[1], 100), (0, 0, 0), -1)
        cv2.putText(frame, f"Registered: {len(embeddings_db)} | Threshold: {THRESHOLD}", 
                   (10, info_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "Press 'q' to QUIT | 'r' to RELOAD database", 
                   (10, info_y + 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
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
        
        # Process each face
        for i, face in enumerate(faces, 1):
            x, y, w, h = face['box']
            face_crop = rgb_img[y:y+h, x:x+w]
            
            # Generate embedding
            face_embedding = embedder.embeddings([face_crop])[0]
            
            # Recognize
            username, distance, confidence = recognize_face(
                face_embedding, embeddings_db, THRESHOLD
            )
            
            print(f"Face #{i}:")
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
