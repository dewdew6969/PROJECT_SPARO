from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: str
    email: str
    
class UserCreate(UserBase):
    password: str

class OTPSend(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str

class PushTokenUpdate(BaseModel):
    expo_push_token: str

class UserCreateWithOTP(UserCreate):
    otp_code: str

class PasswordReset(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    primary_sport: Optional[str] = None
    primary_level: Optional[str] = None
    secondary_sport: Optional[str] = None
    secondary_level: Optional[str] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    avatar: Optional[str] = None

class User(UserBase):
    id: int
    avatar: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance: Optional[float] = None
    primary_sport: Optional[str] = None
    primary_level: Optional[str] = None
    secondary_sport: Optional[str] = None
    secondary_level: Optional[str] = None
    available_days: Optional[str] = None
    available_time: Optional[str] = None
    elo: int
    matches: int = 0
    wins: int = 0
    losses: int = 0
    trust_score: int
    sportsmanship: float
    is_online: bool = False
    last_active: Optional[datetime] = None

    class Config:
        from_attributes = True

class ChallengeCreate(BaseModel):
    opponent_id: int
    sport: str
    match_date: datetime
    match_end_date: Optional[datetime] = None
    venue_name: str
    venue_lat: float
    venue_lon: float
    is_competitive: bool

class Challenge(ChallengeCreate):
    id: int
    challenger_id: int
    status: str
    challenger_checked_in: bool = False
    opponent_checked_in: bool = False
    challenger_score: Optional[int] = None
    opponent_score: Optional[int] = None
    is_conflict: bool = False
    proof_image_url: Optional[str] = None
    winner_id: Optional[int] = None
    
    challenger: Optional['User'] = None
    opponent: Optional['User'] = None
    class Config:
        from_attributes = True

class LeaderboardUser(BaseModel):
    id: int
    rank: int
    username: str
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    elo: int
    win_rate: str

class ReportCreate(BaseModel):
    reported_id: int
    category: str

class Report(ReportCreate):
    id: int
    reporter_id: int
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class TournamentCreate(BaseModel):
    name: str
    sport: str
    date: datetime
    location: str
    max_participants: int

class Tournament(TournamentCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str

class Post(PostCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    comment: str

class Comment(CommentCreate):
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCreate(BaseModel):
    title: str
    body: str

class Notification(NotificationCreate):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    receiver_id: int
    text: str

class Message(MessageCreate):
    id: int
    sender_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DeleteMessagesRequest(BaseModel):
    message_ids: list[int]
