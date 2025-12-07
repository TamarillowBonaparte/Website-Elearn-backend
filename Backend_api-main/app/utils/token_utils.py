from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY = "secretjwtkey123"  # ganti jadi environment variable nanti
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 jam

security = HTTPBearer()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Extract and verify current user from JWT token
    Returns user data including user_id, username, email, role
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

def require_super_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to check if current user is super_admin
    Raises 403 if not super_admin
    """
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya Super Admin yang dapat melakukan operasi ini."
        )
    return current_user

def require_admin_or_super_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to check if current user is admin or super_admin
    Raises 403 if not admin or super_admin
    """
    user_role = current_user.get("role")
    if user_role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Hanya Admin atau Super Admin yang dapat melakukan operasi ini."
        )
    return current_user
