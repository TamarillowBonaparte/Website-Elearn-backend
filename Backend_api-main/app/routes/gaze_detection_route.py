# app/routes/gaze_detection_route.py
import time
import numpy as np
import cv2
import os

# Suppress MediaPipe logs
os.environ["GLOG_minloglevel"] = "2"

import mediapipe as mp
from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Tuple

router = APIRouter(prefix="/gaze", tags=["Gaze Detection"])

# MediaPipe init (Lazy)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = None

def get_face_mesh():
    global face_mesh
    if face_mesh is None:
        face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3
        )
    return face_mesh

# iris indices (MediaPipe face_mesh)
LEFT_IRIS = [474, 475, 476, 477]
RIGHT_IRIS = [469, 470, 471, 472]
# choose a nose landmark index for reference (common index)
NOSE_INDEX = 1

class GazeResult(BaseModel):
    left_center: Tuple[int, int] | None
    right_center: Tuple[int, int] | None
    cx: int | None
    cy: int | None
    nose_x: int | None
    gaze: str | None
    processing_time_ms: float

def read_image_bytes(b: bytes):
    arr = np.frombuffer(b, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode image")
    return img

def process_frame(frame):
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    
    mesh = get_face_mesh()
    results = mesh.process(rgb)
    if not results.multi_face_landmarks:
        return None

    face_landmarks = results.multi_face_landmarks[0]
    try:
        left = np.array([(int(face_landmarks.landmark[i].x * w),
                          int(face_landmarks.landmark[i].y * h)) for i in LEFT_IRIS])
        right = np.array([(int(face_landmarks.landmark[i].x * w),
                           int(face_landmarks.landmark[i].y * h)) for i in RIGHT_IRIS])
        left_center = left.mean(axis=0).astype(int)
        right_center = right.mean(axis=0).astype(int)
        cx = int((left_center[0] + right_center[0]) // 2)
        cy = int((left_center[1] + right_center[1]) // 2)

        nose = face_landmarks.landmark[NOSE_INDEX]
        nose_x = int(nose.x * w)
    except Exception:
        return None

    # basic default gaze (fallback) using simple fractions
    if cx < w * 0.4:
        gaze_text = "LEFT"
    elif cx > w * 0.6:
        gaze_text = "RIGHT"
    else:
        gaze_text = "CENTER"

    return {
        "left_center": (int(left_center[0]), int(left_center[1])),
        "right_center": (int(right_center[0]), int(right_center[1])),
        "cx": int(cx),
        "cy": int(cy),
        "nose_x": int(nose_x),
        "gaze": gaze_text
    }

@router.post("/predict", response_model=GazeResult)
async def predict_gaze(file: UploadFile = File(...)):
    """
    Endpoint untuk deteksi arah pandangan (gaze) dari gambar wajah.
    Digunakan oleh React Native MateriEyeTracking untuk real-time eye tracking.
    """
    if file.content_type.split("/")[0] != "image":
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
    
    data = await file.read()
    start = time.time()
    
    try:
        frame = read_image_bytes(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    res = process_frame(frame)
    elapsed = (time.time() - start) * 1000.0
    
    if res is None:
        return GazeResult(
            left_center=None, 
            right_center=None, 
            cx=None, 
            cy=None, 
            nose_x=None,
            gaze=None, 
            processing_time_ms=round(elapsed, 2)
        )
    
    return GazeResult(
        left_center=res["left_center"],
        right_center=res["right_center"],
        cx=res["cx"],
        cy=res["cy"],
        nose_x=res["nose_x"],
        gaze=res["gaze"],
        processing_time_ms=round(elapsed, 2)
    )

@router.get("/health")
def gaze_health_check():
    """
    Health check untuk gaze detection service.
    Mengembalikan status MediaPipe dan model info.
    """
    return {
        "status": "ok",
        "service": "gaze_detection",
        "model": "MediaPipe FaceMesh",
        "detection_confidence": 0.3,
        "tracking_confidence": 0.3
    }
