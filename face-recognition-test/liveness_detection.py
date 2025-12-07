"""
Liveness Detection for PC/Laptop using Webcam
==============================================

Features:
- Eye Blink Detection (kedip mata)
- Head Movement Detection (toleh kiri/kanan, angguk)
- Smile Detection (senyum)
- Random Challenge System
- Visual Feedback

Requirements:
pip install opencv-python mediapipe numpy

Author: E-Learn System
Date: November 2025
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import random
from datetime import datetime
from typing import Tuple, Optional, Dict
import json
import hashlib

# ============================================
# CONFIGURATION
# ============================================

# MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

# Challenge Types
CHALLENGES = {
    'BLINK': 'Kedipkan mata 3 kali',
    'TURN_LEFT': 'Toleh ke kiri',
    'TURN_RIGHT': 'Toleh ke kanan',
    'NOD': 'Anggukkan kepala ke bawah',
    'SMILE': 'Tersenyum lebar'
}

# Thresholds
EYE_AR_THRESHOLD = 0.21  # Eye Aspect Ratio untuk deteksi kedipan
HEAD_TURN_THRESHOLD = 15  # Derajat untuk head turn
HEAD_NOD_THRESHOLD = 12   # Derajat untuk head nod
SMILE_THRESHOLD = 0.02    # Mouth aspect ratio untuk smile

# Colors (BGR)
COLOR_GREEN = (0, 255, 0)
COLOR_RED = (0, 0, 255)
COLOR_BLUE = (255, 0, 0)
COLOR_YELLOW = (0, 255, 255)
COLOR_WHITE = (255, 255, 255)
COLOR_ORANGE = (0, 165, 255)

# ============================================
# HELPER FUNCTIONS
# ============================================

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def get_landmark_coords(landmarks, idx, frame_width, frame_height):
    """Get normalized landmark coordinates"""
    landmark = landmarks.landmark[idx]
    x = int(landmark.x * frame_width)
    y = int(landmark.y * frame_height)
    z = landmark.z
    return x, y, z

def generate_liveness_token(challenge_type: str, details: dict) -> str:
    """Generate unique token untuk membuktikan liveness check berhasil"""
    data = {
        'challenge': challenge_type,
        'timestamp': datetime.now().isoformat(),
        'details': details
    }
    
    # Create hash from data
    data_string = json.dumps(data, sort_keys=True)
    token = hashlib.sha256(data_string.encode()).hexdigest()
    
    return token

# ============================================
# EYE BLINK DETECTOR
# ============================================

class BlinkDetector:
    """Detect eye blinks using Eye Aspect Ratio (EAR)"""
    
    # MediaPipe Face Mesh indices untuk mata
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    
    def __init__(self):
        self.blink_count = 0
        self.eye_closed = False
        self.consecutive_frames_closed = 0
        self.MIN_FRAMES_CLOSED = 2  # Minimum frames untuk dianggap blink
        
    def calculate_ear(self, eye_landmarks):
        """Calculate Eye Aspect Ratio"""
        # Vertical distances
        A = calculate_distance(eye_landmarks[1], eye_landmarks[5])
        B = calculate_distance(eye_landmarks[2], eye_landmarks[4])
        
        # Horizontal distance
        C = calculate_distance(eye_landmarks[0], eye_landmarks[3])
        
        # EAR formula
        ear = (A + B) / (2.0 * C)
        return ear
    
    def detect(self, landmarks, frame_width, frame_height) -> Tuple[bool, int, float]:
        """
        Detect eye blink
        Returns: (is_blinking, blink_count, ear_value)
        """
        # Get eye landmarks
        left_eye = [get_landmark_coords(landmarks, idx, frame_width, frame_height)[:2] 
                    for idx in self.LEFT_EYE_INDICES]
        right_eye = [get_landmark_coords(landmarks, idx, frame_width, frame_height)[:2] 
                     for idx in self.RIGHT_EYE_INDICES]
        
        # Calculate EAR for both eyes
        left_ear = self.calculate_ear(left_eye)
        right_ear = self.calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Check if eyes are closed
        if avg_ear < EYE_AR_THRESHOLD:
            self.consecutive_frames_closed += 1
        else:
            # Eyes opened after being closed
            if self.consecutive_frames_closed >= self.MIN_FRAMES_CLOSED:
                self.blink_count += 1
            self.consecutive_frames_closed = 0
        
        is_blinking = self.consecutive_frames_closed > 0
        
        return is_blinking, self.blink_count, avg_ear
    
    def reset(self):
        """Reset blink counter"""
        self.blink_count = 0
        self.eye_closed = False
        self.consecutive_frames_closed = 0

# ============================================
# HEAD MOVEMENT DETECTOR
# ============================================

class HeadMovementDetector:
    """Detect head movements (turn left/right, nod up/down)"""
    
    def __init__(self):
        self.initial_yaw = None
        self.initial_pitch = None
        self.calibration_frames = 0
        self.CALIBRATION_REQUIRED = 10  # Frames untuk kalibrasi
        
    def calculate_head_pose(self, landmarks, frame_width, frame_height):
        """Calculate head rotation angles (yaw, pitch, roll)"""
        # Key facial landmarks untuk pose estimation
        nose_tip = get_landmark_coords(landmarks, 1, frame_width, frame_height)
        chin = get_landmark_coords(landmarks, 152, frame_width, frame_height)
        left_eye = get_landmark_coords(landmarks, 33, frame_width, frame_height)
        right_eye = get_landmark_coords(landmarks, 263, frame_width, frame_height)
        left_mouth = get_landmark_coords(landmarks, 61, frame_width, frame_height)
        right_mouth = get_landmark_coords(landmarks, 291, frame_width, frame_height)
        
        # Calculate yaw (left-right rotation)
        eye_center_x = (left_eye[0] + right_eye[0]) / 2
        nose_x = nose_tip[0]
        yaw = (nose_x - eye_center_x) / frame_width * 180
        
        # Calculate pitch (up-down rotation)
        eye_center_y = (left_eye[1] + right_eye[1]) / 2
        nose_y = nose_tip[1]
        chin_y = chin[1]
        pitch = (nose_y - eye_center_y) / (chin_y - eye_center_y) * 90
        
        return yaw, pitch
    
    def calibrate(self, landmarks, frame_width, frame_height):
        """Calibrate initial head position"""
        if self.calibration_frames < self.CALIBRATION_REQUIRED:
            yaw, pitch = self.calculate_head_pose(landmarks, frame_width, frame_height)
            
            if self.initial_yaw is None:
                self.initial_yaw = yaw
                self.initial_pitch = pitch
            else:
                # Average over calibration frames
                alpha = 0.7
                self.initial_yaw = alpha * self.initial_yaw + (1 - alpha) * yaw
                self.initial_pitch = alpha * self.initial_pitch + (1 - alpha) * pitch
            
            self.calibration_frames += 1
            return False  # Not ready
        
        return True  # Calibration complete
    
    def detect_turn(self, landmarks, frame_width, frame_height, direction: str) -> Tuple[bool, float]:
        """
        Detect head turn (left or right)
        direction: 'left' or 'right'
        Returns: (success, angle_delta)
        """
        if not self.calibrate(landmarks, frame_width, frame_height):
            return False, 0.0
        
        yaw, _ = self.calculate_head_pose(landmarks, frame_width, frame_height)
        delta_yaw = yaw - self.initial_yaw
        
        if direction == 'left':
            success = delta_yaw < -HEAD_TURN_THRESHOLD
            return success, abs(delta_yaw)
        else:  # right
            success = delta_yaw > HEAD_TURN_THRESHOLD
            return success, abs(delta_yaw)
    
    def detect_nod(self, landmarks, frame_width, frame_height) -> Tuple[bool, float]:
        """
        Detect head nod (down movement)
        Returns: (success, angle_delta)
        """
        if not self.calibrate(landmarks, frame_width, frame_height):
            return False, 0.0
        
        _, pitch = self.calculate_head_pose(landmarks, frame_width, frame_height)
        delta_pitch = pitch - self.initial_pitch
        
        # Nod down = positive pitch change
        success = delta_pitch > HEAD_NOD_THRESHOLD
        return success, abs(delta_pitch)
    
    def reset(self):
        """Reset calibration"""
        self.initial_yaw = None
        self.initial_pitch = None
        self.calibration_frames = 0

# ============================================
# SMILE DETECTOR
# ============================================

class SmileDetector:
    """Detect smile using mouth aspect ratio"""
    
    # Mouth landmarks
    MOUTH_INDICES = [61, 291, 0, 17]  # Left, Right, Top, Bottom
    
    def __init__(self):
        self.baseline_ratio = None
        self.calibration_frames = 0
        self.CALIBRATION_REQUIRED = 10
        
    def calculate_mouth_ratio(self, landmarks, frame_width, frame_height):
        """Calculate mouth width to height ratio"""
        left = get_landmark_coords(landmarks, 61, frame_width, frame_height)[:2]
        right = get_landmark_coords(landmarks, 291, frame_width, frame_height)[:2]
        top = get_landmark_coords(landmarks, 0, frame_width, frame_height)[:2]
        bottom = get_landmark_coords(landmarks, 17, frame_width, frame_height)[:2]
        
        width = calculate_distance(left, right)
        height = calculate_distance(top, bottom)
        
        if height == 0:
            return 0
        
        ratio = width / height
        return ratio
    
    def detect(self, landmarks, frame_width, frame_height) -> Tuple[bool, float]:
        """
        Detect smile
        Returns: (is_smiling, smile_intensity)
        """
        ratio = self.calculate_mouth_ratio(landmarks, frame_width, frame_height)
        
        # Calibrate baseline
        if self.calibration_frames < self.CALIBRATION_REQUIRED:
            if self.baseline_ratio is None:
                self.baseline_ratio = ratio
            else:
                alpha = 0.7
                self.baseline_ratio = alpha * self.baseline_ratio + (1 - alpha) * ratio
            
            self.calibration_frames += 1
            return False, 0.0
        
        # Detect smile (mouth wider than baseline)
        delta_ratio = ratio - self.baseline_ratio
        is_smiling = delta_ratio > SMILE_THRESHOLD
        
        return is_smiling, delta_ratio
    
    def reset(self):
        """Reset baseline"""
        self.baseline_ratio = None
        self.calibration_frames = 0

# ============================================
# MAIN LIVENESS DETECTOR
# ============================================

class LivenessDetector:
    """Main liveness detection system with random challenges"""
    
    def __init__(self):
        self.face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.blink_detector = BlinkDetector()
        self.head_detector = HeadMovementDetector()
        self.smile_detector = SmileDetector()
        
        self.current_challenge = None
        self.challenge_instruction = ""
        self.challenge_start_time = None
        self.challenge_timeout = 15  # seconds
        self.challenge_completed = False
        self.liveness_token = None
        
    def start_random_challenge(self):
        """Start a random liveness challenge"""
        challenge_type = random.choice(list(CHALLENGES.keys()))
        self.current_challenge = challenge_type
        self.challenge_instruction = CHALLENGES[challenge_type]
        self.challenge_start_time = time.time()
        self.challenge_completed = False
        self.liveness_token = None
        
        # Reset detectors
        self.blink_detector.reset()
        self.head_detector.reset()
        self.smile_detector.reset()
        
        print(f"\n{'='*50}")
        print(f"🎯 CHALLENGE: {challenge_type}")
        print(f"📝 INSTRUKSI: {self.challenge_instruction}")
        print(f"⏱️  WAKTU: {self.challenge_timeout} detik")
        print(f"{'='*50}\n")
    
    def check_challenge(self, landmarks, frame_width, frame_height) -> Tuple[bool, str, Dict]:
        """
        Check if current challenge is completed
        Returns: (completed, status_message, details)
        """
        if self.current_challenge is None:
            return False, "No active challenge", {}
        
        # Check timeout
        elapsed = time.time() - self.challenge_start_time
        if elapsed > self.challenge_timeout:
            return False, f"⏰ TIMEOUT! ({self.challenge_timeout}s)", {}
        
        remaining = self.challenge_timeout - elapsed
        
        details = {'elapsed': elapsed, 'remaining': remaining}
        
        # Check based on challenge type
        if self.current_challenge == 'BLINK':
            is_blinking, blink_count, ear = self.blink_detector.detect(landmarks, frame_width, frame_height)
            details['blink_count'] = blink_count
            details['ear'] = round(ear, 3)
            
            status = f"Kedipan: {blink_count}/3 | EAR: {ear:.3f} | ⏱️ {remaining:.1f}s"
            
            if blink_count >= 3:
                return True, "✅ BERHASIL! 3 Kedipan terdeteksi", details
            
        elif self.current_challenge == 'TURN_LEFT':
            success, angle = self.head_detector.detect_turn(landmarks, frame_width, frame_height, 'left')
            details['angle'] = round(angle, 1)
            
            if self.head_detector.calibration_frames < self.head_detector.CALIBRATION_REQUIRED:
                status = "📸 Kalibrasi... Lihat lurus ke depan"
            else:
                status = f"Sudut: {angle:.1f}° (perlu {HEAD_TURN_THRESHOLD}°) | ⏱️ {remaining:.1f}s"
            
            if success:
                return True, f"✅ BERHASIL! Toleh kiri {angle:.1f}°", details
            
        elif self.current_challenge == 'TURN_RIGHT':
            success, angle = self.head_detector.detect_turn(landmarks, frame_width, frame_height, 'right')
            details['angle'] = round(angle, 1)
            
            if self.head_detector.calibration_frames < self.head_detector.CALIBRATION_REQUIRED:
                status = "📸 Kalibrasi... Lihat lurus ke depan"
            else:
                status = f"Sudut: {angle:.1f}° (perlu {HEAD_TURN_THRESHOLD}°) | ⏱️ {remaining:.1f}s"
            
            if success:
                return True, f"✅ BERHASIL! Toleh kanan {angle:.1f}°", details
            
        elif self.current_challenge == 'NOD':
            success, angle = self.head_detector.detect_nod(landmarks, frame_width, frame_height)
            details['angle'] = round(angle, 1)
            
            if self.head_detector.calibration_frames < self.head_detector.CALIBRATION_REQUIRED:
                status = "📸 Kalibrasi... Lihat lurus ke depan"
            else:
                status = f"Sudut: {angle:.1f}° (perlu {HEAD_NOD_THRESHOLD}°) | ⏱️ {remaining:.1f}s"
            
            if success:
                return True, f"✅ BERHASIL! Angguk {angle:.1f}°", details
            
        elif self.current_challenge == 'SMILE':
            is_smiling, intensity = self.smile_detector.detect(landmarks, frame_width, frame_height)
            details['intensity'] = round(intensity, 3)
            
            if self.smile_detector.calibration_frames < self.smile_detector.CALIBRATION_REQUIRED:
                status = "📸 Kalibrasi... Ekspresi netral"
            else:
                status = f"Senyum: {'Ya 😊' if is_smiling else 'Tidak'} | Intensitas: {intensity:.3f} | ⏱️ {remaining:.1f}s"
            
            if is_smiling:
                return True, f"✅ BERHASIL! Senyum terdeteksi", details
        
        return False, status, details
    
    def process_frame(self, frame):
        """
        Process video frame untuk liveness detection
        Returns: annotated_frame, status_text, challenge_completed
        """
        if frame is None:
            return None, "No frame", False
        
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.face_mesh.process(rgb_frame)
        
        frame_height, frame_width = frame.shape[:2]
        annotated_frame = frame.copy()
        
        # Draw face mesh
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    image=annotated_frame,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
                )
                
                # Check challenge
                if self.current_challenge and not self.challenge_completed:
                    completed, status_msg, details = self.check_challenge(
                        face_landmarks, frame_width, frame_height
                    )
                    
                    if completed:
                        self.challenge_completed = True
                        self.liveness_token = generate_liveness_token(
                            self.current_challenge, details
                        )
                        print(f"\n{'='*50}")
                        print(f"✅ CHALLENGE COMPLETED!")
                        print(f"🎯 Type: {self.current_challenge}")
                        print(f"📊 Details: {json.dumps(details, indent=2)}")
                        print(f"🔑 Token: {self.liveness_token[:32]}...")
                        print(f"{'='*50}\n")
                        return annotated_frame, status_msg, True
                    
                    # Draw status
                    self._draw_status(annotated_frame, status_msg)
                    
                    return annotated_frame, status_msg, False
        else:
            status_msg = "❌ Wajah tidak terdeteksi"
            self._draw_status(annotated_frame, status_msg, color=COLOR_RED)
            return annotated_frame, status_msg, False
        
        return annotated_frame, "", False
    
    def _draw_status(self, frame, text, color=COLOR_GREEN):
        """Draw status text on frame"""
        # Background rectangle
        cv2.rectangle(frame, (10, 10), (frame.shape[1] - 10, 100), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (frame.shape[1] - 10, 100), color, 2)
        
        # Challenge instruction
        cv2.putText(frame, self.challenge_instruction, (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, COLOR_YELLOW, 2)
        
        # Status text
        cv2.putText(frame, text, (20, 75),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, COLOR_WHITE, 2)
    
    def get_token(self) -> Optional[str]:
        """Get liveness token if challenge completed"""
        return self.liveness_token
    
    def release(self):
        """Release resources"""
        self.face_mesh.close()

# ============================================
# MAIN APPLICATION
# ============================================

def main():
    """Main application loop"""
    print("="*60)
    print("🔒 LIVENESS DETECTION SYSTEM")
    print("="*60)
    print("Tekan 'SPACE' untuk mulai challenge baru")
    print("Tekan 'Q' untuk keluar")
    print("="*60)
    
    # Initialize detector
    detector = LivenessDetector()
    
    # Open webcam
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    if not cap.isOpened():
        print("❌ Error: Tidak dapat membuka webcam")
        return
    
    print("✅ Webcam berhasil dibuka")
    print("⏳ Menunggu input...\n")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Tidak dapat membaca frame")
            break
        
        # Mirror frame
        frame = cv2.flip(frame, 1)
        
        # Process frame
        annotated_frame, status_text, completed = detector.process_frame(frame)
        
        if annotated_frame is not None:
            # Draw instructions
            if detector.current_challenge is None:
                cv2.rectangle(annotated_frame, (10, 10), (annotated_frame.shape[1] - 10, 60), 
                            (0, 0, 0), -1)
                cv2.putText(annotated_frame, "Tekan SPACE untuk mulai challenge", 
                           (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, COLOR_YELLOW, 2)
            
            # Show frame
            cv2.imshow('Liveness Detection', annotated_frame)
        
        # Handle keyboard input
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("\n👋 Keluar dari aplikasi...")
            break
        elif key == ord(' '):  # Space bar
            if detector.current_challenge is None or detector.challenge_completed:
                detector.start_random_challenge()
        
        # Auto restart after completion
        if completed:
            time.sleep(2)  # Show result for 2 seconds
            detector.current_challenge = None
            detector.challenge_completed = False
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    detector.release()
    
    print("\n✅ Aplikasi selesai")

if __name__ == "__main__":
    main()
