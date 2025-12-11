from pydantic import BaseModel

class DeviceTokenCreate(BaseModel):
    fcm_token: str
