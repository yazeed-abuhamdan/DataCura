from pydantic import BaseModel
from typing import Optional, List

class MousePoint(BaseModel):
    x: float
    y: float
    timestamp: float

class ClickEvent(BaseModel):
    timestamp: float
    type: Optional[str] = "click"

class ScrollEvent(BaseModel):
    amount: float
    timestamp: float

class BehavioralData(BaseModel):
    mouse_points: List[MousePoint]
    clicks: List[ClickEvent]
    scrolls: List[ScrollEvent]
    time_elapsed: float

class UserCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    behavioral_data: BehavioralData

class UserLogin(BaseModel):
    username_or_email: str
    password: str
    behavioral_data: BehavioralData

class LoginResponse(BaseModel):
    status: str
    message: str
    token: Optional[str] = None
    score: Optional[float] = None
