from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from auth import hash_password, verify_password, generate_otp, create_access_token, get_current_user, require_admin, send_otp_email
from models import UserSignup, UserLogin, VerifyOTP, ResendOTP, UserInDB, AdminStats

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    age: Optional[int] = None
    medical_conditions: Optional[List[str]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    age: Optional[int] = None
    medical_conditions: Optional[List[str]] = []

class SymptomAnalysisRequest(BaseModel):
    symptoms: str
    user_id: Optional[str] = None

class SymptomAnalysisResponse(BaseModel):
    possible_conditions: List[str]
    severity: str
    recommendations: List[str]
    suggested_specialists: List[str]

class Doctor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialization: str
    rating: float
    contact: str
    location: str
    lat: float
    lng: float
    operating_hours: str
    hospital: str

class Hospital(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    lat: float
    lng: float
    contact: str
    operating_hours: str
    emergency: bool
    rating: float

class Medicine(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    dosage: str
    price: float
    description: str

class HealthRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    symptoms: str
    conditions: List[str]
    medicines: List[str]
    doctor_visit: Optional[str] = None
    notes: Optional[str] = None
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HealthRecordCreate(BaseModel):
    user_id: str
    symptoms: str
    conditions: List[str]
    medicines: List[str]
    doctor_visit: Optional[str] = None
    notes: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class HealthTip(BaseModel):
    category: str
    tips: List[str]

class PatientDocument(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: str
    file_name: str
    file_data: str
    allergies: Optional[List[str]] = []
    notes: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PatientDocumentCreate(BaseModel):
    user_id: str
    document_type: str
    file_name: str
    allergies: Optional[List[str]] = []
    notes: Optional[str] = None

@api_router.get("/")
async def root():
    return {"message": "HealthAdvisor API"}

# AUTH ROUTES
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    user = UserInDB(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        otp=otp,
        otp_expiry=otp_expiry,
        last_otp_sent=datetime.utcnow()
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['otp_expiry'] = doc['otp_expiry'].isoformat()
    doc['last_otp_sent'] = doc['last_otp_sent'].isoformat()
    
    await db.users.insert_one(doc)
    await send_otp_email(user.email, otp, user.name)
    
    return {"message": "Signup successful. OTP sent to email", "email": user.email}

@api_router.post("/auth/verify-otp")
async def verify_otp(data: VerifyOTP):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user['is_verified']:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if not user.get('otp') or not user.get('otp_expiry'):
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one")
    
    otp_expiry = datetime.fromisoformat(user['otp_expiry'])
    if datetime.utcnow() > otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one")
    
    if user['otp'] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {"is_verified": True, "otp": None, "otp_expiry": None}}
    )
    
    return {"message": "Email verified successfully"}

@api_router.post("/auth/resend-otp")
async def resend_otp(data: ResendOTP):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user['is_verified']:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    if user.get('last_otp_sent'):
        last_sent = datetime.fromisoformat(user['last_otp_sent'])
        if datetime.utcnow() - last_sent < timedelta(seconds=60):
            raise HTTPException(status_code=429, detail="Please wait 60 seconds before requesting a new OTP")
    
    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    
    await db.users.update_one(
        {"email": data.email},
        {"$set": {
            "otp": otp,
            "otp_expiry": otp_expiry.isoformat(),
            "last_otp_sent": datetime.utcnow().isoformat()
        }}
    )
    
    await send_otp_email(data.email, otp, user['name'])
    return {"message": "OTP resent successfully"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user['is_verified']:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify your email first")
    
    if user.get('is_blocked', False):
        raise HTTPException(status_code=403, detail="Account blocked. Contact admin")
    
    token = create_access_token({
        "user_id": user['id'],
        "email": user['email'],
        "role": user.get('role', 'user')
    })
    
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "role": user.get('role', 'user')
        }
    }

@api_router.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    current_user = get_current_user(authorization)
    user = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password_hash": 0, "otp": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ADMIN ROUTES
@api_router.get("/admin/stats")
async def admin_stats(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    
    total_users = await db.users.count_documents({})
    verified_users = await db.users.count_documents({"is_verified": True})
    total_analyses = await db.health_records.count_documents({})
    total_doctors = await db.doctors.count_documents({})
    total_hospitals = await db.hospitals.count_documents({})
    
    return AdminStats(
        total_users=total_users,
        verified_users=verified_users,
        total_symptom_analyses=total_analyses,
        total_doctors=total_doctors,
        total_hospitals=total_hospitals
    ).model_dump()

@api_router.get("/admin/users")
async def get_all_users(authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0, "otp": 0}).to_list(1000)
    return users

@api_router.post("/admin/users/{user_id}/block")
async def block_user(user_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": True}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User blocked successfully"}

@api_router.post("/admin/users/{user_id}/unblock")
async def unblock_user(user_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_blocked": False}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User unblocked successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    require_admin(authorization)
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Create default admin
@api_router.post("/seed-admin")
async def seed_admin():
    existing = await db.users.find_one({"email": "admin@healthadvisor.com"}, {"_id": 0})
    if existing:
        return {"message": "Admin already exists"}
    
    admin = UserInDB(
        name="Admin",
        email="admin@healthadvisor.com",
        password_hash=hash_password("admin123"),
        is_verified=True,
        role="admin"
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('otp_expiry'):
        doc['otp_expiry'] = doc['otp_expiry'].isoformat()
    if doc.get('last_otp_sent'):
        doc['last_otp_sent'] = doc['last_otp_sent'].isoformat()
    
    await db.users.insert_one(doc)
    return {"message": "Admin created", "email": "admin@healthadvisor.com", "password": "admin123"}

@api_router.post("/users", response_model=User)
async def create_user(user_input: UserCreate):
    user_dict = user_input.model_dump()
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return user

@api_router.post("/symptom-analysis", response_model=SymptomAnalysisResponse)
async def analyze_symptoms(request: SymptomAnalysisRequest):
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"symptom_{uuid.uuid4()}",
            system_message="You are a medical assistant. Analyze symptoms and provide possible conditions, severity level, recommendations, and suggested specialists. Format your response as: CONDITIONS: [list], SEVERITY: [low/medium/high], RECOMMENDATIONS: [list], SPECIALISTS: [list]"
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        
        user_msg = UserMessage(text=f"Patient symptoms: {request.symptoms}. Provide detailed analysis.")
        response = await chat.send_message(user_msg)
        
        conditions = []
        severity = "medium"
        recommendations = []
        specialists = []
        
        if "CONDITIONS:" in response:
            conditions_text = response.split("CONDITIONS:")[1].split("SEVERITY:")[0].strip()
            conditions = [c.strip() for c in conditions_text.split(",") if c.strip()]
        
        if "SEVERITY:" in response:
            severity_text = response.split("SEVERITY:")[1].split("RECOMMENDATIONS:")[0].strip().lower()
            if "high" in severity_text:
                severity = "high"
            elif "low" in severity_text:
                severity = "low"
        
        if "RECOMMENDATIONS:" in response:
            rec_text = response.split("RECOMMENDATIONS:")[1].split("SPECIALISTS:")[0].strip()
            recommendations = [r.strip() for r in rec_text.split(",") if r.strip()]
        
        if "SPECIALISTS:" in response:
            spec_text = response.split("SPECIALISTS:")[1].strip()
            specialists = [s.strip() for s in spec_text.split(",") if s.strip()]
        
        if request.user_id:
            health_record = HealthRecord(
                user_id=request.user_id,
                symptoms=request.symptoms,
                conditions=conditions,
                medicines=[],
                notes="AI Analysis"
            )
            doc = health_record.model_dump()
            doc['date'] = doc['date'].isoformat()
            await db.health_records.insert_one(doc)
        
        return SymptomAnalysisResponse(
            possible_conditions=conditions if conditions else ["Common cold", "Viral infection"],
            severity=severity,
            recommendations=recommendations if recommendations else ["Rest well", "Stay hydrated", "Monitor symptoms"],
            suggested_specialists=specialists if specialists else ["General Physician"]
        )
    except Exception as e:
        logging.error(f"Symptom analysis error: {str(e)}")
        return SymptomAnalysisResponse(
            possible_conditions=["Unable to analyze - please consult a doctor"],
            severity="medium",
            recommendations=["Consult a healthcare professional"],
            suggested_specialists=["General Physician"]
        )

@api_router.post("/symptom-image-analysis")
async def analyze_symptom_image(file: UploadFile = File(...), user_id: Optional[str] = None):
    try:
        contents = await file.read()
        
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Maximum size is 10MB")
        
        image_base64 = base64.b64encode(contents).decode('utf-8')
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"image_{uuid.uuid4()}",
            system_message="You are a medical image analyst. Analyze the image and describe what you see, possible conditions, and recommendations."
        )
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        msg = UserMessage(
            text="Analyze this medical image and provide: 1) Description of what you see, 2) Possible conditions, 3) Severity, 4) Recommendations",
            file_contents=[ImageContent(image_base64)]
        )
        
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        return {
            "analysis": text_response if text_response else "Image analyzed. Please consult a healthcare professional for proper diagnosis.",
            "message": "Image analyzed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Image analysis error: {str(e)}", exc_info=True)
        return {
            "analysis": "We're experiencing technical difficulties with image analysis. Please describe your symptoms in text form, or try again later. For urgent concerns, please consult a healthcare professional directly.",
            "message": "Image analysis temporarily unavailable"
        }

@api_router.get("/doctors")
async def get_doctors(specialization: Optional[str] = None, min_rating: Optional[float] = None):
    query = {}
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    doctors = await db.doctors.find(query, {"_id": 0}).to_list(100)
    return doctors

@api_router.get("/hospitals")
async def get_hospitals(emergency_only: Optional[bool] = None, min_rating: Optional[float] = None):
    query = {}
    if emergency_only:
        query["emergency"] = True
    if min_rating:
        query["rating"] = {"$gte": min_rating}
    
    hospitals = await db.hospitals.find(query, {"_id": 0}).to_list(100)
    return hospitals

@api_router.get("/medicines")
async def get_medicines(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = {"$regex": category, "$options": "i"}
    
    medicines = await db.medicines.find(query, {"_id": 0}).to_list(100)
    return medicines

@api_router.post("/health-records", response_model=HealthRecord)
async def create_health_record(record_input: HealthRecordCreate):
    record_obj = HealthRecord(**record_input.model_dump())
    doc = record_obj.model_dump()
    doc['date'] = doc['date'].isoformat()
    await db.health_records.insert_one(doc)
    return record_obj

@api_router.get("/health-records/{user_id}")
async def get_health_records(user_id: str):
    records = await db.health_records.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    for record in records:
        if isinstance(record['date'], str):
            record['date'] = datetime.fromisoformat(record['date'])
    return records

@api_router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        previous_messages = await db.chat_messages.find(
            {"session_id": request.session_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(50)
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=request.session_id,
            system_message="You are a friendly health advisor chatbot. Answer health-related questions, provide general wellness tips, and guide users. Always remind users to consult healthcare professionals for serious concerns."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        
        context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in previous_messages[-10:]])
        full_message = f"Previous conversation:\n{context}\n\nUser: {request.message}"
        
        user_msg = UserMessage(text=full_message if context else request.message)
        response = await chat.send_message(user_msg)
        
        user_message = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        bot_message = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response
        )
        
        user_doc = user_message.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        bot_doc = bot_message.model_dump()
        bot_doc['timestamp'] = bot_doc['timestamp'].isoformat()
        
        await db.chat_messages.insert_one(user_doc)
        await db.chat_messages.insert_one(bot_doc)
        
        return {"response": response, "session_id": request.session_id}
    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@api_router.get("/health-tips")
async def get_health_tips(category: Optional[str] = "general"):
    tips_map = {
        "general": [
            "Drink at least 8 glasses of water daily",
            "Get 7-9 hours of sleep each night",
            "Exercise for at least 30 minutes daily",
            "Eat a balanced diet with fruits and vegetables",
            "Practice stress management techniques"
        ],
        "nutrition": [
            "Include colorful vegetables in every meal",
            "Choose whole grains over refined grains",
            "Limit processed foods and added sugars",
            "Include lean protein sources",
            "Don't skip breakfast"
        ],
        "exercise": [
            "Start with light exercises and gradually increase intensity",
            "Mix cardio with strength training",
            "Take breaks and stretch during work",
            "Walk for at least 10,000 steps daily",
            "Stay consistent with your routine"
        ],
        "mental_health": [
            "Practice mindfulness and meditation",
            "Stay connected with friends and family",
            "Take breaks from screens",
            "Engage in hobbies you enjoy",
            "Seek professional help when needed"
        ]
    }
    
    return HealthTip(
        category=category,
        tips=tips_map.get(category, tips_map["general"])
    )

@api_router.post("/seed-data")
async def seed_data():
    await db.doctors.delete_many({})
    await db.hospitals.delete_many({})
    await db.medicines.delete_many({})
    
    # Indian doctors with exact hospital coordinates
    doctors = [
        {"id": str(uuid.uuid4()), "name": "Dr. Amit Sharma", "specialization": "Cardiologist", "rating": 4.8, "contact": "+91-98765-43210", "location": "Apollo Hospital, Sarita Vihar, Delhi", "lat": 28.5355, "lng": 77.2910, "operating_hours": "9 AM - 5 PM", "hospital": "Apollo Hospital, Sarita Vihar"},
        {"id": str(uuid.uuid4()), "name": "Dr. Priya Mehta", "specialization": "General Physician (MBBS, MD)", "rating": 4.6, "contact": "+91-98765-43211", "location": "Fortis Hospital, Mulund West, Mumbai", "lat": 19.1722, "lng": 72.9565, "operating_hours": "8 AM - 6 PM", "hospital": "Fortis Hospital, Mulund"},
        {"id": str(uuid.uuid4()), "name": "Dr. Rajesh Kumar", "specialization": "Dermatologist (MBBS, MD)", "rating": 4.9, "contact": "+91-98765-43212", "location": "Max Super Speciality Hospital, Saket, Delhi", "lat": 28.5244, "lng": 77.2066, "operating_hours": "10 AM - 7 PM", "hospital": "Max Hospital, Saket"},
        {"id": str(uuid.uuid4()), "name": "Dr. Anjali Verma", "specialization": "Pediatrician (MBBS, MD)", "rating": 4.7, "contact": "+91-98765-43213", "location": "Medanta - The Medicity, Sector 38, Gurgaon", "lat": 28.4423, "lng": 77.0532, "operating_hours": "8 AM - 4 PM", "hospital": "Medanta Hospital"},
        {"id": str(uuid.uuid4()), "name": "Dr. Vikram Singh", "specialization": "Neurologist (MBBS, DM)", "rating": 4.8, "contact": "+91-98765-43214", "location": "AIIMS, Ansari Nagar, New Delhi", "lat": 28.5672, "lng": 77.2100, "operating_hours": "9 AM - 5 PM", "hospital": "AIIMS Delhi"},
        {"id": str(uuid.uuid4()), "name": "Dr. Sneha Patel", "specialization": "Gynecologist (MBBS, MS)", "rating": 4.9, "contact": "+91-98765-43215", "location": "Manipal Hospital, HAL Airport Road, Bangalore", "lat": 12.9579, "lng": 77.6413, "operating_hours": "10 AM - 6 PM", "hospital": "Manipal Hospital"}
    ]
    await db.doctors.insert_many(doctors)
    
    # Indian hospitals with precise GPS coordinates of actual hospital buildings
    hospitals = [
        {
            "id": str(uuid.uuid4()), 
            "name": "Apollo Hospital", 
            "location": "Mathura Road, Sarita Vihar, New Delhi, 110076", 
            "lat": 28.5355, 
            "lng": 77.2910, 
            "contact": "+91-11-2692-5858", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.7,
            "place_name": "Indraprastha Apollo Hospitals, Sarita Vihar"
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Fortis Hospital", 
            "location": "Mulund Goregaon Link Road, Mulund West, Mumbai, 400078", 
            "lat": 19.1722, 
            "lng": 72.9565, 
            "contact": "+91-22-6754-7000", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.6,
            "place_name": "Fortis Hospital Mulund"
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Max Super Speciality Hospital", 
            "location": "1, Press Enclave Road, Saket, New Delhi, 110017", 
            "lat": 28.5244, 
            "lng": 77.2066, 
            "contact": "+91-11-2651-5050", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.8,
            "place_name": "Max Super Speciality Hospital, Saket"
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "AIIMS Delhi", 
            "location": "Sri Aurobindo Marg, Ansari Nagar, New Delhi, 110029", 
            "lat": 28.5672, 
            "lng": 77.2100, 
            "contact": "+91-11-2658-8500", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.9,
            "place_name": "All India Institute of Medical Sciences"
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Manipal Hospital", 
            "location": "98, HAL Airport Road, Kodihalli, Bangalore, 560017", 
            "lat": 12.9579, 
            "lng": 77.6413, 
            "contact": "+91-80-2502-4444", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.7,
            "place_name": "Manipal Hospital HAL Airport Road"
        },
        {
            "id": str(uuid.uuid4()), 
            "name": "Medanta - The Medicity", 
            "location": "CH Baktawar Singh Road, Sector 38, Gurugram, 122001", 
            "lat": 28.4423, 
            "lng": 77.0532, 
            "contact": "+91-124-4141-414", 
            "operating_hours": "24/7", 
            "emergency": True, 
            "rating": 4.8,
            "place_name": "Medanta The Medicity Hospital"
        }
    ]
    await db.hospitals.insert_many(hospitals)
    
    medicines = [
        {"id": str(uuid.uuid4()), "name": "Paracetamol", "category": "Pain Relief", "dosage": "500mg", "price": 5.99, "description": "For fever and mild to moderate pain"},
        {"id": str(uuid.uuid4()), "name": "Ibuprofen", "category": "Pain Relief", "dosage": "200mg", "price": 7.99, "description": "Anti-inflammatory pain reliever"},
        {"id": str(uuid.uuid4()), "name": "Cetirizine", "category": "Allergy", "dosage": "10mg", "price": 8.99, "description": "Antihistamine for allergies"},
        {"id": str(uuid.uuid4()), "name": "Omeprazole", "category": "Digestive", "dosage": "20mg", "price": 12.99, "description": "For acid reflux and heartburn"},
        {"id": str(uuid.uuid4()), "name": "Vitamin C", "category": "Supplement", "dosage": "1000mg", "price": 9.99, "description": "Immune system support"},
        {"id": str(uuid.uuid4()), "name": "Cough Syrup", "category": "Cold & Flu", "dosage": "10ml", "price": 6.99, "description": "Relieves cough and throat irritation"}
    ]
    await db.medicines.insert_many(medicines)
    
    return {"message": "Sample data seeded successfully with Indian locations"}

@api_router.post("/patient-documents")
async def upload_patient_document(file: UploadFile = File(...), user_id: str = '', document_type: str = '', allergies: str = '', notes: str = ''):
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        contents = await file.read()
        
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        file_data = base64.b64encode(contents).decode('utf-8')
        
        allergy_list = [a.strip() for a in allergies.split(',') if a.strip()] if allergies else []
        
        document = PatientDocument(
            user_id=user_id,
            document_type=document_type or "Medical Report",
            file_name=file.filename,
            file_data=file_data,
            allergies=allergy_list,
            notes=notes
        )
        
        doc = document.model_dump()
        doc['uploaded_at'] = doc['uploaded_at'].isoformat()
        await db.patient_documents.insert_one(doc)
        
        return {"message": "Document uploaded successfully", "document_id": document.id}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Document upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload document")

@api_router.get("/patient-documents/{user_id}")
async def get_patient_documents(user_id: str):
    try:
        documents = await db.patient_documents.find({"user_id": user_id}, {"_id": 0, "file_data": 0}).to_list(1000)
        for doc in documents:
            if isinstance(doc['uploaded_at'], str):
                doc['uploaded_at'] = datetime.fromisoformat(doc['uploaded_at'])
        return documents
    except Exception as e:
        logging.error(f"Fetch documents error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")
    
    medicines = [
        {"id": str(uuid.uuid4()), "name": "Paracetamol", "category": "Pain Relief", "dosage": "500mg", "price": 5.99, "description": "For fever and mild to moderate pain"},
        {"id": str(uuid.uuid4()), "name": "Ibuprofen", "category": "Pain Relief", "dosage": "200mg", "price": 7.99, "description": "Anti-inflammatory pain reliever"},
        {"id": str(uuid.uuid4()), "name": "Cetirizine", "category": "Allergy", "dosage": "10mg", "price": 8.99, "description": "Antihistamine for allergies"},
        {"id": str(uuid.uuid4()), "name": "Omeprazole", "category": "Digestive", "dosage": "20mg", "price": 12.99, "description": "For acid reflux and heartburn"},
        {"id": str(uuid.uuid4()), "name": "Vitamin C", "category": "Supplement", "dosage": "1000mg", "price": 9.99, "description": "Immune system support"},
        {"id": str(uuid.uuid4()), "name": "Cough Syrup", "category": "Cold & Flu", "dosage": "10ml", "price": 6.99, "description": "Relieves cough and throat irritation"}
    ]
    await db.medicines.insert_many(medicines)
    
    return {"message": "Sample data seeded successfully"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()