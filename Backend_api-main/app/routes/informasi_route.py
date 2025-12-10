"""
Informasi Routes
===============
API routes untuk manage informasi/pengumuman
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from datetime import datetime
from typing import Optional
import os
import uuid
from pathlib import Path

from app.core.database import get_db
from app.models.informasi_model import Informasi
from app.schemas.informasi_schema import (
    InformasiCreate,
    InformasiUpdate,
    InformasiResponse,
    InformasiListResponse,
    InformasiMobileResponse,
    TargetRoleEnum
)
from app.utils.token_utils import get_current_user, require_admin_or_super_admin

router = APIRouter(prefix="/api/informasi", tags=["Informasi"])

# Upload directory
UPLOAD_DIR = Path("uploads/informasi")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ==================== ADMIN ROUTES (Super Admin & Admin Only) ====================

@router.post("/", response_model=InformasiResponse, status_code=status.HTTP_201_CREATED)
async def create_informasi(
    informasi: InformasiCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Create informasi baru (Super Admin & Admin only)
    """
    try:
        new_informasi = Informasi(
            judul=informasi.judul,
            deskripsi=informasi.deskripsi,
            gambar_url=informasi.gambar_url,
            priority=informasi.priority,
            tanggal_mulai=informasi.tanggal_mulai,
            tanggal_selesai=informasi.tanggal_selesai,
            target_role=informasi.target_role,
            created_by=current_user.get("user_id")
        )
        
        db.add(new_informasi)
        db.commit()
        db.refresh(new_informasi)
        
        # Send Push Notification
        try:
            from app.services.notification_service import notification_service
            from app.models.user_device_model import UserDevice
            from app.models.user_model import User
            
            if not notification_service.active:
                print("⚠️ Notification service not active, skipping push notification")
            else:
                query = db.query(UserDevice).join(User, UserDevice.id_user == User.id_user)
                
                # Filter based on target_role
                if new_informasi.target_role == TargetRoleEnum.mahasiswa:
                    query = query.filter(User.role == 'mahasiswa')
                elif new_informasi.target_role == TargetRoleEnum.dosen:
                    query = query.filter(User.role == 'admin')
                # If 'all', no filter
                
                devices = query.all()
                target_tokens = [d.fcm_token for d in devices if d.fcm_token]
                
                if target_tokens:
                    print(f"📱 Sending notification to {len(target_tokens)} devices")
                    # Batch sending (FCM limit is 500 tokens per request)
                    batch_size = 500
                    for i in range(0, len(target_tokens), batch_size):
                        batch = target_tokens[i:i + batch_size]
                        result = notification_service.send_multicast(
                            tokens=batch,
                            title="📢 Informasi Baru",
                            body=new_informasi.judul,
                            data={
                                "type": "informasi",
                                "id_informasi": str(new_informasi.id),
                                "action": "open_informasi"
                            },
                            db_session=db
                        )
                        print(f"✅ Batch {i//batch_size + 1} sent: {result}")
                else:
                    print("ℹ️ No devices found for target role")
        except Exception as e:
            print(f"❌ Error sending notification: {e}")
            # Don't fail the whole request if notification fails

        return new_informasi
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating informasi: {str(e)}"
        )


@router.post("/upload-gambar")
async def upload_gambar(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Upload gambar untuk informasi (Super Admin & Admin only)
    Returns: URL gambar yang sudah diupload
    """
    try:
        # Validasi file type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        file_extension = Path(file.filename).suffix.lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Validasi file size (max 5MB)
        file_size = 0
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 5MB limit"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Return URL
        file_url = f"/uploads/informasi/{unique_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "filename": unique_filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/admin/list", response_model=InformasiListResponse)
async def get_all_informasi_admin(
    page: int = 1,
    per_page: int = 10,
    is_active: Optional[bool] = None,
    target_role: Optional[TargetRoleEnum] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Get all informasi dengan pagination dan filter (Super Admin & Admin only)
    """
    try:
        # Build query
        query = db.query(Informasi)
        
        # Filters
        if is_active is not None:
            query = query.filter(Informasi.is_active == is_active)
        
        if target_role:
            query = query.filter(Informasi.target_role == target_role)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Informasi.judul.ilike(search_pattern),
                    Informasi.deskripsi.ilike(search_pattern)
                )
            )
        
        # Count total
        total = query.count()
        
        # Order by priority (desc) then created_at (desc)
        query = query.order_by(desc(Informasi.priority), desc(Informasi.created_at))
        
        # Pagination
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page
        
        return {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "items": items
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching informasi: {str(e)}"
        )


@router.get("/admin/{informasi_id}", response_model=InformasiResponse)
async def get_informasi_by_id_admin(
    informasi_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Get informasi by ID (Super Admin & Admin only)
    """
    informasi = db.query(Informasi).filter(Informasi.id == informasi_id).first()
    
    if not informasi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Informasi with ID {informasi_id} not found"
        )
    
    return informasi


@router.put("/{informasi_id}", response_model=InformasiResponse)
async def update_informasi(
    informasi_id: int,
    informasi_update: InformasiUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Update informasi (Super Admin & Admin only)
    """
    try:
        informasi = db.query(Informasi).filter(Informasi.id == informasi_id).first()
        
        if not informasi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Informasi with ID {informasi_id} not found"
            )
        
        # Update fields yang dikirim
        update_data = informasi_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(informasi, field, value)
        
        # Update timestamp
        informasi.updated_at = datetime.now()
        
        db.commit()
        db.refresh(informasi)
        
        return informasi
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating informasi: {str(e)}"
        )


@router.delete("/{informasi_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_informasi(
    informasi_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin_or_super_admin)
):
    """
    Delete informasi (Super Admin & Admin only)
    """
    try:
        informasi = db.query(Informasi).filter(Informasi.id == informasi_id).first()
        
        if not informasi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Informasi with ID {informasi_id} not found"
            )
        
        # Delete associated image if exists
        if informasi.gambar_url:
            try:
                # Extract filename from URL
                filename = Path(informasi.gambar_url).name
                file_path = UPLOAD_DIR / filename
                
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                # Log error but don't fail the delete operation
                print(f"Warning: Could not delete image file: {str(e)}")
        
        db.delete(informasi)
        db.commit()
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting informasi: {str(e)}"
        )


# ==================== MOBILE APP ROUTES (All Authenticated Users) ====================

@router.get("/mobile/list", response_model=list[InformasiMobileResponse])
async def get_informasi_mobile(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get active informasi untuk mobile app
    - Hanya yang is_active = True
    - Hanya yang dalam periode tampil (tanggal_mulai <= now <= tanggal_selesai)
    - Sorted by priority (desc) then created_at (desc)
    """
    try:
        now = datetime.now()
        
        # Build query
        query = db.query(Informasi).filter(Informasi.is_active == True)
        
        # Filter by date range
        query = query.filter(
            or_(
                Informasi.tanggal_mulai == None,
                Informasi.tanggal_mulai <= now
            )
        ).filter(
            or_(
                Informasi.tanggal_selesai == None,
                Informasi.tanggal_selesai >= now
            )
        )
        
        # Order by priority (desc) then created_at (desc)
        query = query.order_by(desc(Informasi.priority), desc(Informasi.created_at))
        
        # Limit
        items = query.limit(limit).all()
        
        return items
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching informasi: {str(e)}"
        )


@router.get("/mobile/{informasi_id}", response_model=InformasiResponse)
async def get_informasi_detail_mobile(
    informasi_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get detail informasi by ID untuk mobile app
    """
    informasi = db.query(Informasi).filter(
        Informasi.id == informasi_id,
        Informasi.is_active == True
    ).first()
    
    if not informasi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Informasi with ID {informasi_id} not found or not active"
        )
    
    return informasi
