"""
Face Registration Script
========================
Script untuk meregistrasi wajah baru ke dalam sistem.
Menggunakan FaceNet untuk ekstraksi embedding dan MTCNN untuk deteksi wajah.
"""

import cv2
import numpy as np
import pickle
import os
from keras_facenet import FaceNet
from mtcnn import MTCNN

# Inisialisasi
print("🔄 Loading models...")
embedder = FaceNet()
# MTCNN dengan parameter optimasi untuk performance
detector = MTCNN(
    min_face_size=40,  # Skip wajah terlalu kecil (lebih cepat)
    steps_threshold=[0.6, 0.7, 0.7]  # Threshold lebih tinggi = lebih cepat
)
print("✅ Models loaded successfully!")

# Folder untuk menyimpan embedding
EMBEDDINGS_DIR = "embeddings"
os.makedirs(EMBEDDINGS_DIR, exist_ok=True)

def register_face_from_camera():
    """
    Registrasi wajah menggunakan webcam
    """
    print("\n📹 Starting camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Error: Tidak dapat membuka kamera!")
        return
    
    print("\n" + "="*60)
    print("📸 FACE REGISTRATION MODE")
    print("="*60)
    print("Instruksi:")
    print("  - Posisikan wajah Anda di depan kamera")
    print("  - Pastikan pencahayaan cukup")
    print("  - Tekan 'c' untuk CAPTURE dan registrasi")
    print("  - Tekan 'q' untuk QUIT")
    print("="*60 + "\n")
    
    frame_skip = 0
    faces = []  # Cache hasil deteksi
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Tidak dapat membaca frame!")
            break
        
        # Flip horizontal untuk mirror effect
        frame = cv2.flip(frame, 1)
        
        # Deteksi wajah hanya setiap 5 frame (optimasi performance)
        frame_skip += 1
        if frame_skip % 5 == 0:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            faces = detector.detect_faces(rgb_frame)
        
        # Draw bounding box dan confidence
        for face in faces:
            x, y, w, h = face['box']
            confidence = face['confidence']
            
            # Draw rectangle
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            
            # Draw confidence
            text = f"Confidence: {confidence:.2f}"
            cv2.putText(frame, text, (x, y-10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Draw status
            if confidence > 0.95:
                status = "READY - Press 'c' to capture"
                color = (0, 255, 0)
            else:
                status = "Adjusting... Move closer"
                color = (0, 165, 255)
            
            cv2.putText(frame, status, (x, y+h+25), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        # Draw instructions
        cv2.putText(frame, "Press 'c' to CAPTURE | Press 'q' to QUIT", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Draw face count
        face_count_text = f"Faces detected: {len(faces)}"
        cv2.putText(frame, face_count_text, (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # Show frame
        cv2.imshow('Face Registration', frame)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n👋 Exiting...")
            break
        elif key == ord('c'):
            if len(faces) == 0:
                print("❌ Tidak ada wajah yang terdeteksi! Coba lagi.")
                continue
            elif len(faces) > 1:
                print("⚠️  Terdeteksi lebih dari 1 wajah! Pastikan hanya ada 1 orang di frame.")
                continue
            
            # Process registration
            print("\n📸 Capturing...")
            face = faces[0]
            x, y, w, h = face['box']
            
            # Crop face
            face_crop = rgb_frame[y:y+h, x:x+w]
            
            # Input username
            print("\n" + "-"*60)
            username = input("Enter username/NIM untuk registrasi: ").strip()
            
            if not username:
                print("❌ Username tidak boleh kosong!")
                continue
            
            # Check if already exists
            embedding_path = os.path.join(EMBEDDINGS_DIR, f"{username}.pkl")
            if os.path.exists(embedding_path):
                overwrite = input(f"⚠️  {username} sudah terdaftar. Overwrite? (y/n): ").strip().lower()
                if overwrite != 'y':
                    print("❌ Registrasi dibatalkan.")
                    continue
            
            try:
                # Generate embedding
                print("🔄 Generating face embedding...")
                embedding = embedder.embeddings([face_crop])[0]
                
                # Save embedding
                with open(embedding_path, "wb") as f:
                    pickle.dump(embedding, f)
                
                print("✅ Registrasi berhasil!")
                print(f"   Username: {username}")
                print(f"   File: {embedding_path}")
                print(f"   Confidence: {face['confidence']:.2%}")
                print("-"*60)
                
                # Ask to continue or exit
                continue_reg = input("\nRegistrasi lagi? (y/n): ").strip().lower()
                if continue_reg != 'y':
                    print("👋 Selesai!")
                    break
                    
            except Exception as e:
                print(f"❌ Error saat registrasi: {str(e)}")
                continue
    
    cap.release()
    cv2.destroyAllWindows()


def register_face_from_image():
    """
    Registrasi wajah dari file gambar
    """
    print("\n📁 REGISTER FROM IMAGE FILE")
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
        elif len(faces) > 1:
            print(f"⚠️  Terdeteksi {len(faces)} wajah! Gunakan gambar dengan 1 wajah saja.")
            return
        
        face = faces[0]
        x, y, w, h = face['box']
        face_crop = rgb_img[y:y+h, x:x+w]
        
        # Input username
        username = input("Enter username/NIM untuk registrasi: ").strip()
        
        if not username:
            print("❌ Username tidak boleh kosong!")
            return
        
        # Generate embedding
        print("🔄 Generating face embedding...")
        embedding = embedder.embeddings([face_crop])[0]
        
        # Save embedding
        embedding_path = os.path.join(EMBEDDINGS_DIR, f"{username}.pkl")
        with open(embedding_path, "wb") as f:
            pickle.dump(embedding, f)
        
        print("✅ Registrasi berhasil!")
        print(f"   Username: {username}")
        print(f"   File: {embedding_path}")
        print(f"   Confidence: {face['confidence']:.2%}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def list_registered_faces():
    """
    Tampilkan daftar wajah yang sudah terdaftar
    """
    if not os.path.exists(EMBEDDINGS_DIR):
        print("❌ Folder embeddings belum ada.")
        return
    
    files = [f for f in os.listdir(EMBEDDINGS_DIR) if f.endswith('.pkl')]
    
    if len(files) == 0:
        print("ℹ️  Belum ada wajah yang terdaftar.")
        return
    
    print("\n" + "="*60)
    print("📋 REGISTERED FACES")
    print("="*60)
    for i, file in enumerate(files, 1):
        username = file.replace('.pkl', '')
        print(f"{i}. {username}")
    print("="*60)
    print(f"Total: {len(files)} face(s) registered\n")


def main():
    """
    Main menu
    """
    print("\n" + "="*60)
    print("🎭 FACE REGISTRATION SYSTEM")
    print("="*60)
    
    while True:
        print("\nMenu:")
        print("1. Register from Camera (Webcam)")
        print("2. Register from Image File")
        print("3. List Registered Faces")
        print("4. Exit")
        print("-"*60)
        
        choice = input("Pilih menu (1-4): ").strip()
        
        if choice == '1':
            register_face_from_camera()
        elif choice == '2':
            register_face_from_image()
        elif choice == '3':
            list_registered_faces()
        elif choice == '4':
            print("👋 Goodbye!")
            break
        else:
            print("❌ Pilihan tidak valid!")


if __name__ == "__main__":
    main()
