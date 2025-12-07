"""
Face Recognition dengan Liveness Detection
==========================================

Menggabungkan liveness detection challenge dengan face recognition system.

Flow:
1. User diminta lakukan liveness challenge (random)
2. Jika berhasil, capture foto dan lakukan face recognition
3. Generate token dan save hasil presensi

Requirements:
pip install opencv-python mediapipe numpy keras-facenet mtcnn scipy

Author: E-Learn System
Date: November 2025
"""

import cv2
import numpy as np
import os
from datetime import datetime
from scipy.spatial.distance import cosine
from keras_facenet import FaceNet
from mtcnn import MTCNN

# Import liveness detector
from liveness_detection import LivenessDetector, generate_liveness_token

# ============================================
# CONFIGURATION
# ============================================

EMBEDDINGS_DIR = 'embeddings'
RECOGNITION_THRESHOLD = 0.4  # Cosine distance threshold
MIN_CONFIDENCE = 0.9  # Minimum confidence untuk face detection

# Colors
COLOR_GREEN = (0, 255, 0)
COLOR_RED = (0, 0, 255)
COLOR_BLUE = (255, 0, 0)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)

# ============================================
# FACE RECOGNITION
# ============================================

class FaceRecognitionSystem:
    """Face Recognition using FaceNet"""
    
    def __init__(self):
        print("🔄 Loading FaceNet model...")
        self.embedder = FaceNet()
        print("✅ FaceNet model loaded")
        
        print("🔄 Loading MTCNN detector...")
        self.detector = MTCNN()
        print("✅ MTCNN detector loaded")
        
        self.known_faces = {}
        self.load_embeddings()
    
    def load_embeddings(self):
        """Load known face embeddings from directory"""
        if not os.path.exists(EMBEDDINGS_DIR):
            print(f"⚠️  Directory {EMBEDDINGS_DIR} tidak ditemukan")
            return
        
        embedding_files = [f for f in os.listdir(EMBEDDINGS_DIR) if f.endswith('.npy')]
        
        if not embedding_files:
            print("⚠️  Tidak ada embedding yang tersimpan")
            return
        
        print(f"\n📂 Loading {len(embedding_files)} embeddings...")
        for filename in embedding_files:
            name = filename.replace('.npy', '')
            filepath = os.path.join(EMBEDDINGS_DIR, filename)
            embedding = np.load(filepath)
            self.known_faces[name] = embedding
            print(f"   ✓ {name}")
        
        print(f"✅ Total {len(self.known_faces)} wajah dikenali\n")
    
    def detect_face(self, frame):
        """Detect face in frame"""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        detections = self.detector.detect_faces(rgb_frame)
        
        if not detections:
            return None, None, 0.0
        
        # Get highest confidence detection
        best_detection = max(detections, key=lambda x: x['confidence'])
        
        if best_detection['confidence'] < MIN_CONFIDENCE:
            return None, None, best_detection['confidence']
        
        x, y, w, h = best_detection['box']
        x, y = max(0, x), max(0, y)
        
        face_region = frame[y:y+h, x:x+w]
        
        return face_region, (x, y, w, h), best_detection['confidence']
    
    def recognize_face(self, face_region):
        """Recognize face from detected region"""
        if face_region is None or face_region.size == 0:
            return None, 1.0
        
        # Resize face for embedding
        face_resized = cv2.resize(face_region, (160, 160))
        face_rgb = cv2.cvtColor(face_resized, cv2.COLOR_BGR2RGB)
        face_pixels = face_rgb.astype('float32')
        
        # Normalize
        mean, std = face_pixels.mean(), face_pixels.std()
        face_pixels = (face_pixels - mean) / std
        
        # Expand dimensions
        samples = np.expand_dims(face_pixels, axis=0)
        
        # Get embedding
        embedding = self.embedder.embeddings(samples)[0]
        
        # Compare dengan known faces
        best_match = None
        best_distance = float('inf')
        
        for name, known_embedding in self.known_faces.items():
            distance = cosine(embedding, known_embedding)
            
            if distance < best_distance:
                best_distance = distance
                best_match = name
        
        if best_distance < RECOGNITION_THRESHOLD:
            return best_match, best_distance
        else:
            return None, best_distance

# ============================================
# MAIN APPLICATION
# ============================================

class LivenessAndRecognitionApp:
    """Combined Liveness Detection and Face Recognition"""
    
    def __init__(self):
        print("="*60)
        print("🔒 LIVENESS DETECTION + FACE RECOGNITION")
        print("="*60)
        
        self.liveness_detector = LivenessDetector()
        self.face_recognition = FaceRecognitionSystem()
        
        self.state = "WAITING"  # WAITING, LIVENESS_CHECK, RECOGNITION, COMPLETED
        self.liveness_token = None
        self.recognized_name = None
        self.recognition_confidence = None
        
    def run(self):
        """Main application loop"""
        print("\n🎯 INSTRUKSI:")
        print("1. Tekan SPACE untuk mulai liveness check")
        print("2. Ikuti instruksi challenge yang muncul")
        print("3. Setelah liveness berhasil, face recognition otomatis")
        print("4. Tekan Q untuk keluar\n")
        
        # Open webcam
        cap = cv2.VideoCapture(0)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        if not cap.isOpened():
            print("❌ Error: Tidak dapat membuka webcam")
            return
        
        print("✅ Webcam aktif\n")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("❌ Error: Tidak dapat membaca frame")
                break
            
            frame = cv2.flip(frame, 1)
            display_frame = frame.copy()
            
            # State machine
            if self.state == "WAITING":
                self._draw_waiting_screen(display_frame)
            
            elif self.state == "LIVENESS_CHECK":
                # Process liveness detection
                annotated_frame, status_text, completed = self.liveness_detector.process_frame(frame)
                
                if annotated_frame is not None:
                    display_frame = annotated_frame
                
                if completed:
                    self.liveness_token = self.liveness_detector.get_token()
                    print(f"✅ Liveness check PASSED!")
                    print(f"🔑 Token: {self.liveness_token[:32]}...")
                    print(f"\n🔍 Memulai face recognition...\n")
                    self.state = "RECOGNITION"
            
            elif self.state == "RECOGNITION":
                # Perform face recognition
                face_region, bbox, detection_conf = self.face_recognition.detect_face(frame)
                
                if face_region is not None:
                    # Draw bounding box
                    x, y, w, h = bbox
                    cv2.rectangle(display_frame, (x, y), (x+w, y+h), COLOR_GREEN, 2)
                    
                    # Recognize
                    name, distance = self.face_recognition.recognize_face(face_region)
                    
                    if name:
                        # RECOGNIZED!
                        self.recognized_name = name
                        self.recognition_confidence = 1 - distance
                        
                        # Draw result
                        cv2.putText(display_frame, f"RECOGNIZED: {name}", (x, y - 40),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_GREEN, 2)
                        cv2.putText(display_frame, f"Confidence: {self.recognition_confidence:.2%}", (x, y - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_GREEN, 2)
                        
                        print(f"✅ WAJAH DIKENALI!")
                        print(f"👤 Nama: {name}")
                        print(f"📊 Confidence: {self.recognition_confidence:.2%}")
                        print(f"📏 Distance: {distance:.4f}")
                        
                        # Save hasil
                        self._save_presensi_result(name, self.recognition_confidence, self.liveness_token)
                        
                        self.state = "COMPLETED"
                    else:
                        # NOT RECOGNIZED
                        cv2.putText(display_frame, "UNKNOWN", (x, y - 10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_RED, 2)
                        
                        print(f"❌ Wajah tidak dikenali")
                        print(f"📏 Best distance: {distance:.4f} (threshold: {RECOGNITION_THRESHOLD})")
                        
                        # Draw message
                        self._draw_message(display_frame, "Wajah tidak dikenali dalam database", COLOR_RED)
                        
                        self.state = "COMPLETED"
                else:
                    # No face detected
                    cv2.putText(display_frame, "Mencari wajah...", (50, 50),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_YELLOW, 2)
            
            elif self.state == "COMPLETED":
                # Show final result
                self._draw_completed_screen(display_frame)
            
            # Display
            cv2.imshow('Liveness + Face Recognition', display_frame)
            
            # Keyboard input
            key = cv2.waitKey(1) & 0xFF
            
            if key == ord('q'):
                print("\n👋 Keluar...")
                break
            elif key == ord(' '):
                if self.state == "WAITING" or self.state == "COMPLETED":
                    self._reset()
                    self.liveness_detector.start_random_challenge()
                    self.state = "LIVENESS_CHECK"
        
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        self.liveness_detector.release()
        print("\n✅ Aplikasi selesai")
    
    def _draw_waiting_screen(self, frame):
        """Draw waiting screen"""
        h, w = frame.shape[:2]
        
        # Background
        cv2.rectangle(frame, (50, 50), (w - 50, 200), (0, 0, 0), -1)
        cv2.rectangle(frame, (50, 50), (w - 50, 200), COLOR_BLUE, 3)
        
        # Text
        cv2.putText(frame, "Tekan SPACE untuk mulai", (80, 110),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0, COLOR_YELLOW, 2)
        cv2.putText(frame, "Liveness Check + Face Recognition", (80, 160),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLOR_WHITE, 2)
    
    def _draw_completed_screen(self, frame):
        """Draw completion screen"""
        h, w = frame.shape[:2]
        
        # Background
        cv2.rectangle(frame, (50, 50), (w - 50, 350), (0, 0, 0), -1)
        
        if self.recognized_name:
            # Success
            cv2.rectangle(frame, (50, 50), (w - 50, 350), COLOR_GREEN, 3)
            
            cv2.putText(frame, "PRESENSI BERHASIL!", (80, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, COLOR_GREEN, 3)
            
            cv2.putText(frame, f"Nama: {self.recognized_name}", (80, 170),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, COLOR_WHITE, 2)
            
            cv2.putText(frame, f"Confidence: {self.recognition_confidence:.2%}", (80, 220),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_WHITE, 2)
            
            cv2.putText(frame, f"Token: {self.liveness_token[:32]}...", (80, 270),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, COLOR_YELLOW, 1)
        else:
            # Failed
            cv2.rectangle(frame, (50, 50), (w - 50, 350), COLOR_RED, 3)
            
            cv2.putText(frame, "PRESENSI GAGAL", (80, 110),
                       cv2.FONT_HERSHEY_SIMPLEX, 1.2, COLOR_RED, 3)
            
            cv2.putText(frame, "Wajah tidak dikenali", (80, 170),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.9, COLOR_WHITE, 2)
        
        cv2.putText(frame, "Tekan SPACE untuk ulangi | Q untuk keluar", (80, 320),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_YELLOW, 2)
    
    def _draw_message(self, frame, message, color):
        """Draw message box"""
        h, w = frame.shape[:2]
        cv2.rectangle(frame, (50, h - 100), (w - 50, h - 30), (0, 0, 0), -1)
        cv2.rectangle(frame, (50, h - 100), (w - 50, h - 30), color, 2)
        cv2.putText(frame, message, (70, h - 60),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    def _save_presensi_result(self, name, confidence, token):
        """Save presensi result to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        result = {
            'timestamp': datetime.now().isoformat(),
            'name': name,
            'confidence': confidence,
            'liveness_token': token,
            'recognition_threshold': RECOGNITION_THRESHOLD
        }
        
        # Save to file
        results_dir = 'presensi_results'
        os.makedirs(results_dir, exist_ok=True)
        
        filename = os.path.join(results_dir, f'presensi_{name}_{timestamp}.txt')
        
        with open(filename, 'w') as f:
            f.write("="*60 + "\n")
            f.write("HASIL PRESENSI\n")
            f.write("="*60 + "\n")
            f.write(f"Waktu       : {result['timestamp']}\n")
            f.write(f"Nama        : {result['name']}\n")
            f.write(f"Confidence  : {result['confidence']:.2%}\n")
            f.write(f"Token       : {result['liveness_token']}\n")
            f.write(f"Threshold   : {result['recognition_threshold']}\n")
            f.write("="*60 + "\n")
        
        print(f"💾 Hasil disimpan: {filename}")
    
    def _reset(self):
        """Reset state"""
        self.state = "WAITING"
        self.liveness_token = None
        self.recognized_name = None
        self.recognition_confidence = None

# ============================================
# ENTRY POINT
# ============================================

def main():
    try:
        app = LivenessAndRecognitionApp()
        app.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Program dihentikan oleh user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
