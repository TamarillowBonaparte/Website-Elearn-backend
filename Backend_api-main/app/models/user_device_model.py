from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class UserDevice(Base):
    __tablename__ = "user_devices"

    id_device = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id_user", ondelete="CASCADE"), nullable=False)
    fcm_token = Column(Text, nullable=False)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("app.models.user_model.User")
