from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

class ResendOTP(BaseModel):
    email: EmailStr

class UserInDB(BaseModel):
    model_config = ConfigDict(extra='ignore')
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    is_verified: bool = False
    otp: Optional[str] = None
    otp_expiry: Optional[datetime] = None
    role: str = 'user'
    is_blocked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    last_otp_sent: Optional[datetime] = None

class AdminStats(BaseModel):
    total_users: int
    verified_users: int
    total_symptom_analyses: int
    total_doctors: int
    total_hospitals: int