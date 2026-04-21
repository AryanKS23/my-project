import jwt
import bcrypt
import random
import os
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Header
from typing import Optional

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = 'HS256'

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Not authenticated')
    token = authorization.split(' ')[1]
    return verify_token(token)

def require_admin(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin access required')
    return user

async def send_otp_email(email: str, otp: str, name: str):
    # Mock email sending - in production, use SendGrid/SMTP
    print(f'\n=== EMAIL SENT ====')
    print(f'To: {email}')
    print(f'Subject: HealthAdvisor - Email Verification')
    print(f'Dear {name},')
    print(f'Your OTP code is: {otp}')
    print(f'Valid for 5 minutes.')
    print(f'==================\n')
    # In production: integrate with SendGrid or SMTP
    return True