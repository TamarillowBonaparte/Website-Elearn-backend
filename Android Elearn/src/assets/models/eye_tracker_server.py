from flask import Flask, jsonify
import threading
import time
import cv2
import mediapipe as mp
import numpy as np

app = Flask(__name__)

latest_gaze = {
    'timestamp': None,
    'gaze_text': None,
    'left_center': None,
    'right_center': None,
    'cx': None,
    'w': None,
}

_run_flag = True

LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]


def camera_loop():
    global latest_gaze, _run_flag

    mp_face_mesh = mp.solutions.face_mesh
    with mp_face_mesh.FaceMesh(
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as face_mesh:
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            print("[eye_tracker_server] WARNING: camera not opened. Is a webcam available?")

        while _run_flag:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.1)
                continue

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    left = np.array([
                        (
                            int(face_landmarks.landmark[i].x * w),
                            int(face_landmarks.landmark[i].y * h),
                        )
                        for i in LEFT_IRIS
                    ])
                    right = np.array([
                        (
                            int(face_landmarks.landmark[i].x * w),
                            int(face_landmarks.landmark[i].y * h),
                        )
                        for i in RIGHT_IRIS
                    ])

                    left_center = left.mean(axis=0).astype(int).tolist()
                    right_center = right.mean(axis=0).astype(int).tolist()

                    cx = (left_center[0] + right_center[0]) // 2

                    if cx < w * 0.4:
                        gaze_text = "LEFT"
                    elif cx > w * 0.6:
                        gaze_text = "RIGHT"
                    else:
                        gaze_text = "CENTER"

                    latest_gaze = {
                        'timestamp': time.time(),
                        'gaze_text': gaze_text,
                        'left_center': left_center,
                        'right_center': right_center,
                        'cx': int(cx),
                        'w': int(w),
                    }

            # small sleep to yield
            time.sleep(0.01)

        cap.release()


camera_thread = threading.Thread(target=camera_loop, daemon=True)
camera_thread.start()


@app.route('/gaze', methods=['GET'])
def get_gaze():
    # Jika belum pernah mendeteksi wajah, kembalikan 204 No Content
    if latest_gaze['timestamp'] is None:
        return jsonify({'status': 'no_data', 'detected': False, 'message': 'mata tidak terdeteksi'}), 204

    # Jika data terlalu lama (stale), anggap tidak ada deteksi saat ini.
    # Ini mencegah server mengirimkan "last known gaze" terus-menerus
    # ketika wajah tidak lagi terdeteksi.
    max_age_seconds = 2.0
    age = time.time() - latest_gaze['timestamp']
    if age > max_age_seconds:
        return jsonify({'status': 'no_data', 'age': age, 'detected': False, 'message': 'mata tidak terdeteksi'}), 204

    # Kembalikan data gaze yang masih fresh
    out = dict(latest_gaze)
    out['age'] = age
    out['detected'] = True
    out['message'] = 'mata terdeteksi'
    return jsonify(out)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/stop', methods=['POST'])
def stop_server():
    global _run_flag
    _run_flag = False
    return jsonify({'status': 'stopping'})


if __name__ == '__main__':
    print('[eye_tracker_server] Starting Flask server on http://0.0.0.0:5000')
    app.run(host='0.0.0.0', port=5000)
