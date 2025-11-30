import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

cap = cv2.VideoCapture(0)

LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            left = np.array([(int(face_landmarks.landmark[i].x * w),
                              int(face_landmarks.landmark[i].y * h)) for i in LEFT_IRIS])
            right = np.array([(int(face_landmarks.landmark[i].x * w),
                               int(face_landmarks.landmark[i].y * h)) for i in RIGHT_IRIS])

            left_center = left.mean(axis=0).astype(int)
            right_center = right.mean(axis=0).astype(int)

            # Warna berubah sesuai arah pandangan (x position)
            cx = (left_center[0] + right_center[0]) // 2
            if cx < w * 0.4:
                color = (0, 255, 255)  # kuning = kiri
                gaze_text = "LEFT"
            elif cx > w * 0.6:
                color = (255, 0, 0)    # biru = kanan
                gaze_text = "RIGHT"
            else:
                color = (0, 255, 0)    # hijau = tengah
                gaze_text = "CENTER"

            # Gambar lingkaran pupil (1padat)
            cv2.circle(frame, tuple(left_center), 3, color, -1)
            cv2.circle(frame, tuple(right_center), 3, color, -1)

            # Gambar area pandang (transparan)
            overlay = frame.copy()
            cv2.circle(overlay, tuple(left_center), 30, color, 2)
            cv2.circle(overlay, tuple(right_center), 30, color, 2)
            alpha = 0.3
            frame = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)

            # Tulis arah pandangan
            cv2.putText(frame, f"Gaze: {gaze_text}", (30, 40),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("Eye Tracker (Visual)", frame)
    if cv2.waitKey(5) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

