from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), index=True)
    code = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True)
    full_name = Column(String(255))
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    expo_push_token = Column(String(255), nullable=True)
    
    avatar = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    primary_sport = Column(String(255), nullable=True)
    primary_level = Column(String(255), nullable=True)
    secondary_sport = Column(String(255), nullable=True)
    secondary_level = Column(String(255), nullable=True)
    available_days = Column(String(255), nullable=True)
    available_time = Column(String(255), nullable=True)
    
    elo = Column(Integer, default=1000)
    matches = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    is_online = Column(Boolean, default=False)
    last_active = Column(DateTime, default=datetime.utcnow)
    trust_score = Column(Integer, default=100)
    sportsmanship = Column(Float, default=5.0)
    
    # Moderation
    is_suspended = Column(Boolean, default=False)
    is_banned = Column(Boolean, default=False)

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    reported_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(255), default="PENDING") # PENDING, REVIEWED, RESOLVED

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenger_id = Column(Integer, ForeignKey("users.id"))
    opponent_id = Column(Integer, ForeignKey("users.id"))
    sport = Column(String(255))
    match_date = Column(DateTime)
    match_end_date = Column(DateTime, nullable=True)
    venue_name = Column(String(255))
    venue_lat = Column(Float)
    venue_lon = Column(Float)
    is_competitive = Column(Boolean, default=True)
    status = Column(String(255), default="PENDING") # PENDING, ACCEPTED, REJECTED, COMPLETED
    
    # Match Verification Fields
    challenger_checked_in = Column(Boolean, default=False)
    opponent_checked_in = Column(Boolean, default=False)
    challenger_score = Column(Integer, nullable=True)
    opponent_score = Column(Integer, nullable=True)
    is_conflict = Column(Boolean, default=False)
    proof_image_url = Column(String(255), nullable=True)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))
    sport = Column(String(255))
    date = Column(DateTime)
    location = Column(String(255))
    max_participants = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class TournamentRegistration(Base):
    __tablename__ = "tournament_registrations"

    id = Column(Integer, primary_key=True, index=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"))
    username = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String(2000))
    created_at = Column(DateTime, default=datetime.utcnow)

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    comment = Column(String(1000))
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(255))
    body = Column(String(1000))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    text = Column(String(2000))
    status = Column(String(50), default="sent") # sent, delivered, read
    created_at = Column(DateTime, default=datetime.utcnow)
