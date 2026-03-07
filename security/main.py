import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Dict, Any

from security import schemas, biometrics

app = FastAPI(title="Data Cura Security API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "mysecretkey_change_in_production_grad_project"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# In-Memory Storage
users_db: Dict[str, Dict[str, Any]] = {}  # username -> dict of user info
profiles_db: Dict[str, Dict[str, float]] = {}  # username -> behavioral features

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/api/auth/register", response_model=schemas.LoginResponse)
def register(user: schemas.UserCreate):
    # Check existing users (by username or email)
    if user.username in users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    for u in users_db.values():
        if u["email"] == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.password)
    
    # Process behavioral data
    features = biometrics.extract_features(user.behavioral_data)
    
    # Check if this profile looks like a bot
    if biometrics.is_bot(user.behavioral_data, features):
        raise HTTPException(status_code=403, detail="Automated behavior detected. Registration blocked.")
        
    # Store User in memory
    users_db[user.username] = {
        "name": user.name,
        "email": user.email,
        "username": user.username,
        "password_hash": hashed_password
    }
    
    # Store Behavioral Profile in memory
    profiles_db[user.username] = {
        "avg_speed": features["avg_speed"],
        "avg_acceleration": features["avg_acceleration"],
        "jitter_variance": features["jitter_variance"],
        "click_interval_avg": features["click_interval_avg"],
        "scroll_speed_avg": features["scroll_speed_avg"]
    }
    
    access_token = create_access_token(data={"sub": user.username})
    return {"status": "SUCCESS", "message": "Registered successfully", "token": access_token, "score": 100.0}

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(user: schemas.UserLogin):
    # Find user by username or email
    db_user = None
    if user.username_or_email in users_db:
        db_user = users_db[user.username_or_email]
    else:
        for u in users_db.values():
            if u["email"] == user.username_or_email:
                db_user = u
                break
                
    if not db_user or not pwd_context.verify(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    features = biometrics.extract_features(user.behavioral_data)
    
    if biometrics.is_bot(user.behavioral_data, features):
        raise HTTPException(status_code=403, detail="Automated behavior detected.")
        
    baseline = profiles_db.get(db_user["username"])
    
    if not baseline:
        score = 100.0 # No baseline found, temp allow
    else:
        score = biometrics.compare_profiles(features, baseline)
        
    status_str = "SUCCESS"
    token = None
    msg = "Login successful"
    
    if score > 80:
        access_token = create_access_token(data={"sub": db_user["username"]})
        token = access_token
    elif score >= 50:
        status_str = "MFA_REQUIRED"
        msg = "Behavior matched moderately. MFA required."
    else:
        status_str = "BLOCKED"
        msg = "Behavior mismatch. Access blocked."
        
    if status_str == "BLOCKED":
        raise HTTPException(status_code=403, detail=msg)
    
    return {"status": status_str, "message": msg, "token": token, "score": score}

@app.post("/api/auth/verify-mfa")
def verify_mfa(data: dict):
    """Mock MFA verification"""
    username = data.get("username")
    code = data.get("code")
    score = data.get("score")
    
    if username not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    if code != "123456": # Mock static code for the demo
        raise HTTPException(status_code=400, detail="Invalid MFA code")
        
    access_token = create_access_token(data={"sub": username})
    return {"status": "SUCCESS", "message": "MFA successful", "token": access_token, "score": score}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
