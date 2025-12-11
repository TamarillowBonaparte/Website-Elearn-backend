from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.utils.token_utils import get_current_user
from app.models.user_model import User
from app.models.user_device_model import UserDevice
from app.schemas.notification_schema import DeviceTokenCreate
from app.services.notification_service import notification_service
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def ensure_user_devices_table(db: Session):
    """Guard rail: create user_devices table if missing (MySQL)."""
    try:
        # Create table
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS user_devices (
                id_device INT AUTO_INCREMENT PRIMARY KEY,
                id_user INT NOT NULL,
                fcm_token TEXT NOT NULL,
                last_active DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_devices_user FOREIGN KEY (id_user) REFERENCES users(id_user) ON DELETE CASCADE
            )
        """))
        
        # Create index separately (MySQL doesn't support IF NOT EXISTS for indexes in all versions)
        try:
            db.execute(text("""
                CREATE UNIQUE INDEX ux_user_devices_token ON user_devices(fcm_token(191))
            """))
        except:
            pass  # Index might already exist
        
        db.commit()
    except Exception as e:
        db.rollback()
        # Table might already exist, that's OK
        print(f"Note: {e}")

@router.post("/token")
def register_token(
    token_data: DeviceTokenCreate, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        ensure_user_devices_table(db)
        
        if not token_data.fcm_token:
            raise HTTPException(status_code=400, detail="Token cannot be empty")

        # Check if token exists
        device = db.query(UserDevice).filter(UserDevice.fcm_token == token_data.fcm_token).first()
        
        if device:
            # Update user and timestamp
            device.id_user = current_user["user_id"]
            device.last_active = datetime.utcnow()
        else:
            # Create new
            device = UserDevice(
                id_user=current_user["user_id"],
                fcm_token=token_data.fcm_token
            )
            db.add(device)
        
        db.commit()
        db.refresh(device)
        
        return {
            "message": "Device token registered successfully", 
            "firebase_active": notification_service.active,
            "id_device": device.id_device
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error registering token: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to register token: {str(e)}")

@router.post("/test")
def test_notification(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test sending notification to current user"""
    if not notification_service.active:
        raise HTTPException(status_code=503, detail="Notification service is disabled (missing credentials)")

    devices = db.query(UserDevice).filter(UserDevice.id_user == current_user["user_id"]).all()
    tokens = [d.fcm_token for d in devices]
    
    if not tokens:
        return {"message": "No devices found for this user"}
    
    result = notification_service.send_multicast(
        tokens=tokens,
        title="Test Notification",
        body=f"Hello {current_user['username']}, this is a test!",
        data={"type": "test", "action": "open_app"},
        db_session=db
    )
    
    return {
        "message": f"Sent test notification to {len(tokens)} devices",
        "result": result
    }
