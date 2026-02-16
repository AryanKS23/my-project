from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

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

@api_router.get("/")
async def root():
    return {"message": "HealthAdvisor API"}

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
        
        text_response, _ = await chat.send_message_multimodal_response(msg)
        
        return {
            "analysis": text_response,
            "message": "Image analyzed successfully"
        }
    except Exception as e:
        logging.error(f"Image analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

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
    existing_doctors = await db.doctors.count_documents({})
    if existing_doctors > 0:
        return {"message": "Data already seeded"}
    
    doctors = [
        {"id": str(uuid.uuid4()), "name": "Dr. Sarah Johnson", "specialization": "Cardiologist", "rating": 4.8, "contact": "+1-555-0101", "location": "City Hospital", "lat": 40.7128, "lng": -74.0060, "operating_hours": "9 AM - 5 PM", "hospital": "City Hospital"},
        {"id": str(uuid.uuid4()), "name": "Dr. Michael Chen", "specialization": "General Physician", "rating": 4.5, "contact": "+1-555-0102", "location": "Community Clinic", "lat": 40.7580, "lng": -73.9855, "operating_hours": "8 AM - 6 PM", "hospital": "Community Clinic"},
        {"id": str(uuid.uuid4()), "name": "Dr. Emily Rodriguez", "specialization": "Dermatologist", "rating": 4.9, "contact": "+1-555-0103", "location": "Skin Care Center", "lat": 40.7489, "lng": -73.9680, "operating_hours": "10 AM - 7 PM", "hospital": "Skin Care Center"},
        {"id": str(uuid.uuid4()), "name": "Dr. James Wilson", "specialization": "Pediatrician", "rating": 4.7, "contact": "+1-555-0104", "location": "Children's Hospital", "lat": 40.7829, "lng": -73.9654, "operating_hours": "8 AM - 4 PM", "hospital": "Children's Hospital"},
        {"id": str(uuid.uuid4()), "name": "Dr. Lisa Anderson", "specialization": "Neurologist", "rating": 4.6, "contact": "+1-555-0105", "location": "Neuro Clinic", "lat": 40.7614, "lng": -73.9776, "operating_hours": "9 AM - 5 PM", "hospital": "Neuro Clinic"}
    ]
    await db.doctors.insert_many(doctors)
    
    hospitals = [
        {"id": str(uuid.uuid4()), "name": "City Hospital", "location": "123 Main St", "lat": 40.7128, "lng": -74.0060, "contact": "+1-555-1001", "operating_hours": "24/7", "emergency": True, "rating": 4.5},
        {"id": str(uuid.uuid4()), "name": "Community Clinic", "location": "456 Oak Ave", "lat": 40.7580, "lng": -73.9855, "contact": "+1-555-1002", "operating_hours": "8 AM - 8 PM", "emergency": False, "rating": 4.2},
        {"id": str(uuid.uuid4()), "name": "Emergency Medical Center", "location": "789 Pine Rd", "lat": 40.7489, "lng": -73.9680, "contact": "+1-555-1003", "operating_hours": "24/7", "emergency": True, "rating": 4.7},
        {"id": str(uuid.uuid4()), "name": "Children's Hospital", "location": "321 Elm St", "lat": 40.7829, "lng": -73.9654, "contact": "+1-555-1004", "operating_hours": "24/7", "emergency": True, "rating": 4.8}
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