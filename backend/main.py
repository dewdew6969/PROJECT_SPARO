from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List
from datetime import timedelta, datetime
import math
import os
import shutil
import smtplib
from email.mime.text import MIMEText
import random
import requests
import traceback
from pathlib import Path

import models, schemas, auth
from database import engine, get_db, SessionLocal
import asyncio

SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 465))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "sparoofficial2026@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "qlwbhcpzjcrwfrtu")

def send_otp_email(to_email: str, otp_code: str, intent: str = "register"):
    if intent == "forgot_password":
        subject = "Sparo - Permintaan Reset Password"
        body = f"Halo,\n\nKami menerima permintaan untuk mereset password akun Sparo Anda.\nBerikut adalah 6 digit kode keamanan (OTP) untuk mereset password Anda:\n\n{otp_code}\n\nKode ini hanya berlaku selama 15 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dan akun Anda akan tetap aman.\n\nSalam Olahraga,\nTim Sparo"
    else:
        subject = "Selamat Datang di Sparo! Verifikasi Email Anda"
        body = f"Halo,\n\nTerima kasih telah bergabung dengan Sparo!\nUntuk menyelesaikan pendaftaran Anda, silakan masukkan 6 digit kode keamanan (OTP) berikut:\n\n{otp_code}\n\nKode ini hanya berlaku selama 15 menit dan bersifat rahasia. Jangan berikan kode ini kepada siapapun, termasuk pihak Sparo.\n\nSalam Olahraga,\nTim Sparo"

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = SMTP_USERNAME
    msg['To'] = to_email
    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
            server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        return True, ""
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False, str(e)

app = FastAPI(title="Sparo API", description="API Backend untuk aplikasi Sparo menggunakan FastAPI", debug=True)

# Create absolute path for uploads directory to prevent issues on cPanel
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

def send_push_notification(token: str, title: str, body: str, data: dict = None):
    try:
        if not token or not token.startswith("ExponentPushToken"):
            return False
            
        payload = {
            "to": token,
            "title": title,
            "body": body,
            "data": data or {}
        }
        response = requests.post("https://exp.host/--/api/v2/push/send", json=payload, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send push notification: {e}")
        return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def calculate_elo(rating_a, rating_b, score_a):
    K = 32
    expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    expected_b = 1 - expected_a
    new_rating_a = round(rating_a + K * (score_a - expected_a))
    new_rating_b = round(rating_b + K * ((1 - score_a) - expected_b))
    return new_rating_a, new_rating_b

def send_push_notification(expo_push_token: str, title: str, body: str, data: dict = None):
    if not expo_push_token:
        return
    try:
        requests.post(
            "https://exp.host/--/api/v2/push/send",
            json={
                "to": expo_push_token,
                "title": title,
                "body": body,
                "data": data or {}
            },
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            timeout=5
        )
    except Exception as e:
        print(f"Failed to send push notification: {e}")

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance * 1000

@app.get("/")
def read_root():
    return {"message": "Selamat datang di Sparo API Backend!"}

@app.get("/ping")
async def ping():
    return {"status": "ok", "pesan": "Berhasil tanpa muter!"}

@app.get("/setup-db")
async def setup_db():
    try:
        models.Base.metadata.create_all(bind=engine)
        return {"message": "Database tables created successfully!"}
    except Exception as e:
        import traceback
        return {"error_bocor": str(e), "laporan_lengkap": traceback.format_exc()}

@app.get("/api/fix-db")
def fix_database(db: Session = Depends(get_db)):
    try:
        models.Base.metadata.create_all(bind=engine)
        return {"message": "Database tables synchronized successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/auth/send-otp")
def send_otp(data: schemas.OTPSend, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    db_otp = models.OTPCode(email=data.email, code=otp_code, expires_at=expires_at)
    db.add(db_otp)
    db.commit()
    success, error_msg = send_otp_email(data.email, otp_code)
    if not success:
        raise HTTPException(status_code=500, detail=f"Gagal mengirim email: {error_msg}")
    return {"message": "OTP terkirim", "success": True}

@app.post("/api/auth/forgot-password/send-otp")
def forgot_password_send_otp(data: schemas.OTPSend, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar")
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    db_otp = models.OTPCode(email=data.email, code=otp_code, expires_at=expires_at)
    db.add(db_otp)
    db.commit()
    success, error_msg = send_otp_email(data.email, otp_code, "forgot_password")
    if not success:
        raise HTTPException(status_code=500, detail=f"Gagal mengirim email: {error_msg}")
    return {"message": "OTP terkirim", "success": True}

@app.post("/api/auth/verify-otp")
def verify_otp(data: schemas.OTPVerify, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email == data.email, models.OTPCode.code == data.otp_code, models.OTPCode.expires_at >= datetime.utcnow()).order_by(models.OTPCode.id.desc()).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="Kode OTP tidak valid atau sudah kadaluarsa")
    return {"message": "OTP valid", "success": True}

@app.post("/api/auth/reset-password")
def reset_password(data: schemas.PasswordReset, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email == data.email, models.OTPCode.code == data.otp_code, models.OTPCode.expires_at >= datetime.utcnow()).order_by(models.OTPCode.id.desc()).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="Kode OTP tidak valid atau sudah kadaluarsa")
    
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email tidak terdaftar")
        
    hashed_password = auth.get_password_hash(data.new_password)
    user.hashed_password = hashed_password
    
    # Delete OTP to prevent reuse
    db.delete(db_otp)
    db.commit()
    
    return {"message": "Password berhasil diubah", "success": True}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter((models.User.username == form_data.username) | (models.User.email == form_data.username)).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email/Username atau password salah")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreateWithOTP, db: Session = Depends(get_db)):
    db_otp = db.query(models.OTPCode).filter(models.OTPCode.email == user.email, models.OTPCode.code == user.otp_code, models.OTPCode.expires_at >= datetime.utcnow()).order_by(models.OTPCode.id.desc()).first()
    if not db_otp:
        raise HTTPException(status_code=400, detail="Kode OTP tidak valid atau sudah kadaluarsa")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, full_name=user.full_name, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return user

@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    update_data = user_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/users/{user_id}/avatar")
def upload_avatar(user_id: int, request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Gunakan timestamp untuk menghindari cache dari browser/aplikasi
    import time
    
    avatars_dir = UPLOADS_DIR / "avatars"
    os.makedirs(avatars_dir, exist_ok=True)
    
    file_path = f"uploads/avatars/{user_id}_{int(time.time())}_{file.filename}"
    absolute_file_path = str(UPLOADS_DIR / "avatars" / f"{user_id}_{int(time.time())}_{file.filename}")
    
    with open(absolute_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Save relative path to avoid locking to localhost or specific domains
    # The frontend getAvatarUrl function will automatically prepend the API_URL
    relative_url = f"/{file_path}"
    
    db_user.avatar = relative_url
    db.commit()
    
    # We still return the full_url to the frontend for immediate use in optimistic UI
    base_url = str(request.base_url).rstrip("/")
    full_url = f"{base_url}/{file_path}"
    return {"message": "Avatar berhasil diunggah", "avatar_url": full_url}

@app.put("/users/{user_id}/status")
def update_user_status(user_id: int, is_online: bool, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    db_user.is_online = is_online
    db_user.last_active = datetime.utcnow()
    db.commit()
    return {"message": "Status updated", "is_online": is_online}

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return db_user

@app.get("/opponents/", response_model=List[schemas.User])
def get_opponents(skip: int = 0, limit: int = 100, lat: float = None, lon: float = None, max_distance: float = None, level: str = None, db: Session = Depends(get_db)):
    query = db.query(models.User)
    
    if level and level.lower() != 'all' and level.lower() != 'any':
        query = query.filter(models.User.primary_level == level.upper())
        
    users = query.offset(skip).limit(limit).all()
    result = []
    for user in users:
        user_dict = {c.name: getattr(user, c.name) for c in user.__table__.columns}
        if lat is not None and lon is not None and user.latitude and user.longitude:
            dist_meters = calculate_distance(lat, lon, user.latitude, user.longitude)
            dist_km = dist_meters / 1000.0
            user_dict['distance'] = round(dist_km, 2)
            if max_distance is not None and dist_km > max_distance:
                continue
        else:
            user_dict['distance'] = None
        result.append(user_dict)
    
    # Sort result by distance if available, otherwise by elo
    result.sort(key=lambda x: (x['distance'] is None, x['distance'], -x.get('elo', 0)))
    return result

@app.get("/leaderboard/", response_model=List[schemas.LeaderboardUser])
def get_leaderboard(lat: float = None, lon: float = None, scope: str = 'national', db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    
    leaderboard = []
    for user in users:
        # Filter based on scope
        if scope in ['city', 'province'] and lat is not None and lon is not None and user.latitude and user.longitude:
            dist_meters = calculate_distance(lat, lon, user.latitude, user.longitude)
            dist_km = dist_meters / 1000.0
            
            if scope == 'city' and dist_km > 50:
                continue
            if scope == 'province' and dist_km > 150:
                continue
        elif scope != 'national':
            # If scope is city/province but no lat/lon provided (or user has no lat/lon), 
            # we might want to skip or include them. Let's skip them if they don't have location and we filter.
            if scope in ['city', 'province']:
                continue
                
        # Calculate win_rate
        if user.matches > 0:
            win_rate_val = round((user.wins / user.matches) * 100)
            win_rate = f"{win_rate_val}%"
        else:
            win_rate = "0%"
            
        leaderboard.append({
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "avatar": user.avatar,
            "elo": user.elo,
            "win_rate": win_rate
        })
        
    # Sort by elo descending
    leaderboard.sort(key=lambda x: x['elo'], reverse=True)
    
    # Assign ranks
    for i, user_dict in enumerate(leaderboard):
        user_dict['rank'] = i + 1
        
    return leaderboard

@app.post("/challenges/", response_model=schemas.Challenge)
def create_challenge(challenge: schemas.ChallengeCreate, challenger_id: int, db: Session = Depends(get_db)):
    db_challenge = models.Challenge(**challenge.dict(), challenger_id=challenger_id)
    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)
    
    # Send push notification to opponent
    opponent = db.query(models.User).filter(models.User.id == challenge.opponent_id).first()
    challenger = db.query(models.User).filter(models.User.id == challenger_id).first()
    if opponent and challenger:
        title = "Tantangan Baru! 🥊"
        body = f"{challenger.full_name} menantang Anda bertanding {challenge.sport}!"
        
        # Simpan in-app notification
        new_notif = models.Notification(user_id=opponent.id, title=title, body=body)
        db.add(new_notif)
        db.commit()
        
        if opponent.expo_push_token:
            send_push_notification(
                opponent.expo_push_token, 
                title, 
                body,
                {"type": "new_challenge", "challenge_id": db_challenge.id}
            )
        
    return db_challenge

@app.get("/challenges/{user_id}", response_model=List[schemas.Challenge])
def get_user_challenges(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Challenge).filter((models.Challenge.challenger_id == user_id) | (models.Challenge.opponent_id == user_id)).all()

@app.put("/challenges/{challenge_id}/status", response_model=schemas.Challenge)
def update_challenge_status(challenge_id: int, status: str, db: Session = Depends(get_db)):
    db_challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not db_challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    db_challenge.status = status
    db.commit()
    db.refresh(db_challenge)
    return db_challenge

@app.post("/api/reports/", response_model=schemas.Report)
def create_report(report: schemas.ReportCreate, current_user_id: int, db: Session = Depends(get_db)):
    db_report = models.Report(reporter_id=current_user_id, reported_id=report.reported_id, category=report.category)
    db.add(db_report)
    reported_user = db.query(models.User).filter(models.User.id == report.reported_id).first()
    if not reported_user:
        raise HTTPException(status_code=404, detail="User not found")
    reported_user.trust_score = max(0, reported_user.trust_score - 15)
    yesterday = datetime.utcnow() - timedelta(days=1)
    unique_reporters_count = db.query(models.Report.reporter_id).filter(models.Report.reported_id == report.reported_id, models.Report.created_at >= yesterday).distinct().count()
    if unique_reporters_count >= 5:
        reported_user.is_suspended = True
    db.commit()
    db.refresh(db_report)
    return db_report

@app.post("/challenges/{challenge_id}/respond")
def respond_challenge(challenge_id: int, user_id: int, is_accepted: bool, db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.opponent_id != user_id:
        raise HTTPException(status_code=403, detail="Hanya lawan yang diundang yang bisa merespon")
    if is_accepted:
        challenge.status = "ACCEPTED"
    else:
        challenge.status = "REJECTED"
    db.commit()
    db.refresh(challenge)
    
    # Send push notification to challenger
    challenger = db.query(models.User).filter(models.User.id == challenge.challenger_id).first()
    opponent = db.query(models.User).filter(models.User.id == user_id).first()
    if challenger and opponent:
        status_text = "menerima" if is_accepted else "menolak"
        title = "Respon Tantangan"
        body = f"{opponent.full_name} {status_text} tantangan Anda."
        
        # Simpan in-app notification
        new_notif = models.Notification(user_id=challenger.id, title=title, body=body)
        db.add(new_notif)
        db.commit()
        
        if challenger.expo_push_token:
            send_push_notification(
                challenger.expo_push_token, 
                title, 
                body,
                {"type": "challenge_response", "challenge_id": challenge.id, "status": challenge.status}
            )
        
    return {"message": "Respon berhasil disimpan", "challenge": challenge}

@app.post("/challenges/{challenge_id}/checkin")
def checkin_match(challenge_id: int, user_id: int, lat: float, lon: float, db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.venue_lat and challenge.venue_lon:
        distance = calculate_distance(lat, lon, challenge.venue_lat, challenge.venue_lon)
        if distance > 500:
            raise HTTPException(status_code=400, detail=f"Terlalu jauh dari lokasi. Jarak: {distance:.2f} m")
    if challenge.challenger_id == user_id:
        challenge.challenger_checked_in = True
    elif challenge.opponent_id == user_id:
        challenge.opponent_checked_in = True
    else:
        raise HTTPException(status_code=403, detail="Akses ditolak")
    db.commit()
    db.refresh(challenge)
    return {"message": "Check-in berhasil", "challenge": challenge}

@app.post("/challenges/{challenge_id}/submit-score")
def submit_score(challenge_id: int, user_id: int, my_score: int, opponent_score: int, db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if challenge.challenger_id == user_id:
        challenge.challenger_score = my_score
        challenge.opponent_score = opponent_score
    elif challenge.opponent_id == user_id:
        challenge.opponent_score = my_score
        challenge.challenger_score = opponent_score
    else:
        raise HTTPException(status_code=403, detail="Akses ditolak")
        
    if challenge.is_competitive:
        challenge.status = "awaiting_verification"
    else:
        challenge.status = "COMPLETED"
        challenger = db.query(models.User).filter(models.User.id == challenge.challenger_id).first()
        opponent = db.query(models.User).filter(models.User.id == challenge.opponent_id).first()
        if challenger and opponent:
            if challenge.challenger_score > challenge.opponent_score:
                challenge.winner_id = challenge.challenger_id
                score_a = 1
            elif challenge.opponent_score > challenge.challenger_score:
                challenge.winner_id = challenge.opponent_id
                score_a = 0
            else:
                challenge.winner_id = None
                score_a = 0.5
                
            challenger.matches += 1
            opponent.matches += 1
            if score_a == 1:
                challenger.wins += 1
                opponent.losses += 1
            elif score_a == 0:
                opponent.wins += 1
                challenger.losses += 1

    db.commit()
    db.refresh(challenge)
    return {"message": "Skor disubmit", "challenge": challenge}

@app.post("/challenges/{challenge_id}/confirm-score")
def confirm_score(challenge_id: int, user_id: int, is_agreed: bool, db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if is_agreed:
        challenge.status = "COMPLETED"
        if challenge.challenger_score is not None and challenge.opponent_score is not None:
            challenger = db.query(models.User).filter(models.User.id == challenge.challenger_id).first()
            opponent = db.query(models.User).filter(models.User.id == challenge.opponent_id).first()
            if challenger and opponent:
                if challenge.challenger_score > challenge.opponent_score:
                    challenge.winner_id = challenge.challenger_id
                    score_a = 1
                elif challenge.opponent_score > challenge.challenger_score:
                    challenge.winner_id = challenge.opponent_id
                    score_a = 0
                else:
                    challenge.winner_id = None
                    score_a = 0.5
                new_c_elo, new_o_elo = calculate_elo(challenger.elo, opponent.elo, score_a)
                challenger.elo = max(0, new_c_elo)
                opponent.elo = max(0, new_o_elo)
                
                # Update matches, wins, losses
                challenger.matches += 1
                opponent.matches += 1
                if score_a == 1:
                    challenger.wins += 1
                    opponent.losses += 1
                elif score_a == 0:
                    opponent.wins += 1
                    challenger.losses += 1
    else:
        challenge.is_conflict = True
        challenge.status = "CONFLICT"
    db.commit()
    db.refresh(challenge)
    return {"message": "Konfirmasi berhasil", "challenge": challenge}

@app.post("/challenges/{challenge_id}/upload-proof")
def upload_proof(challenge_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    upload_dir = "uploads/proofs"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{challenge_id}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    challenge.proof_image_url = file_path
    db.commit()
    return {"message": "Bukti berhasil diunggah", "file_path": file_path}

@app.post("/tournaments/", response_model=schemas.Tournament)
def create_tournament(tournament: schemas.TournamentCreate, db: Session = Depends(get_db)):
    db_tournament = models.Tournament(**tournament.dict())
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@app.get("/tournaments/", response_model=List[schemas.Tournament])
def get_tournaments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Tournament).order_by(models.Tournament.created_at.desc()).offset(skip).limit(limit).all()

@app.delete("/tournaments/{tournament_id}")
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    db_tournament = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    db.delete(db_tournament)
    db.commit()
    return {"message": "Tournament deleted successfully"}

@app.post("/posts/", response_model=schemas.Post)
def create_post(post: schemas.PostCreate, user_id: int, db: Session = Depends(get_db)):
    db_post = models.Post(**post.dict(), user_id=user_id)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.get("/posts/", response_model=List[schemas.Post])
def get_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Post).order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()

@app.post("/posts/{post_id}/comments/", response_model=schemas.Comment)
def create_comment(post_id: int, comment: schemas.CommentCreate, user_id: int, db: Session = Depends(get_db)):
    db_comment = models.Comment(**comment.dict(), post_id=post_id, user_id=user_id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@app.get("/posts/{post_id}/comments/", response_model=List[schemas.Comment])
def get_comments(post_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Comment).filter(models.Comment.post_id == post_id).offset(skip).limit(limit).all()

@app.get("/notifications/{user_id}", response_model=List[schemas.Notification])
def get_notifications(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).all()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            text = data.get("text")
            if receiver_id and text:
                db = SessionLocal()
                new_msg = models.Message(sender_id=user_id, receiver_id=receiver_id, text=text, status="sent")
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                msg_dict = {"id": str(new_msg.id), "sender_id": new_msg.sender_id, "receiver_id": new_msg.receiver_id, "text": new_msg.text, "timestamp": new_msg.created_at.strftime("%H:%M"), "status": new_msg.status}
                db.close()
                await manager.send_personal_message(msg_dict, user_id)
                if receiver_id in manager.active_connections:
                    await manager.send_personal_message(msg_dict, receiver_id)
                else:
                    db_sync = SessionLocal()
                    receiver = db_sync.query(models.User).filter(models.User.id == receiver_id).first()
                    sender = db_sync.query(models.User).filter(models.User.id == user_id).first()
                    if receiver and receiver.expo_push_token and sender:
                        send_push_notification(
                            receiver.expo_push_token,
                            f"Pesan dari {sender.full_name}",
                            text,
                            {"type": "chat_message", "sender_id": sender.id}
                        )
                    db_sync.close()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        
class MessageCreate(schemas.BaseModel):
    sender_id: int
    receiver_id: int
    text: str

@app.post("/messages")
def send_message_http(msg: MessageCreate, db: Session = Depends(get_db)):
    receiver = db.query(models.User).filter(models.User.id == msg.receiver_id).first()
    sender = db.query(models.User).filter(models.User.id == msg.sender_id).first()
    
    # Check if receiver is online to determine status
    initial_status = "delivered" if (receiver and receiver.is_online) else "sent"
    
    new_msg = models.Message(sender_id=msg.sender_id, receiver_id=msg.receiver_id, text=msg.text, status=initial_status)
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    # Optional: Send push notification if user offline
    if receiver and not receiver.is_online and receiver.expo_push_token and sender:
        send_push_notification(
            receiver.expo_push_token,
            f"Pesan dari {sender.full_name}",
            msg.text,
            {"type": "chat_message", "sender_id": sender.id}
        )
        
    return {"id": str(new_msg.id), "sender_id": new_msg.sender_id, "receiver_id": new_msg.receiver_id, "text": new_msg.text, "timestamp": new_msg.created_at.strftime("%H:%M"), "status": new_msg.status}

@app.get("/messages/{user_id}/{opponent_id}", response_model=List[schemas.Message])
def get_messages(user_id: int, opponent_id: int, db: Session = Depends(get_db)):
    # 1. Update any unread messages sent BY the opponent TO the user as "read"
    unread_messages = db.query(models.Message).filter(
        models.Message.sender_id == opponent_id,
        models.Message.receiver_id == user_id,
        models.Message.status != "read"
    ).all()
    
    if unread_messages:
        for msg in unread_messages:
            msg.status = "read"
        db.commit()
        
    # 2. Return all messages
    messages = db.query(models.Message).filter(((models.Message.sender_id == user_id) & (models.Message.receiver_id == opponent_id)) | ((models.Message.sender_id == opponent_id) & (models.Message.receiver_id == user_id))).order_by(models.Message.created_at.asc()).all()
    return messages

@app.put("/messages/{user_id}/delivered")
def mark_messages_delivered(user_id: int, db: Session = Depends(get_db)):
    unread_messages = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.status == "sent"
    ).all()
    if unread_messages:
        for msg in unread_messages:
            msg.status = "delivered"
        db.commit()
    return {"success": True}

@app.delete("/messages")
def delete_messages(req: schemas.DeleteMessagesRequest, db: Session = Depends(get_db)):
    db.query(models.Message).filter(models.Message.id.in_(req.message_ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": len(req.message_ids)}

@app.delete("/chats/{user_id}/{opponent_id}")
def delete_chat(user_id: int, opponent_id: int, db: Session = Depends(get_db)):
    db.query(models.Message).filter(
        ((models.Message.sender_id == user_id) & (models.Message.receiver_id == opponent_id)) |
        ((models.Message.sender_id == opponent_id) & (models.Message.receiver_id == user_id))
    ).delete(synchronize_session=False)
    db.commit()
    return {"success": True}

@app.get("/chats/{user_id}")
def get_chat_list(user_id: int, db: Session = Depends(get_db)):
    # Get all messages where user is sender or receiver
    all_msgs = db.query(models.Message).filter(
        (models.Message.sender_id == user_id) | (models.Message.receiver_id == user_id)
    ).order_by(models.Message.created_at.desc()).all()
    
    chat_list = []
    processed_opponents = set()
    
    for msg in all_msgs:
        opponent_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
        if opponent_id not in processed_opponents:
            processed_opponents.add(opponent_id)
            
            opponent = db.query(models.User).filter(models.User.id == opponent_id).first()
            if opponent:
                # Count unread messages (sent by opponent, received by user, status != 'read')
                unread_count = db.query(models.Message).filter(
                    models.Message.sender_id == opponent_id,
                    models.Message.receiver_id == user_id,
                    models.Message.status != "read"
                ).count()
                
                chat_list.append({
                    "opponent": {
                        "id": str(opponent.id),
                        "name": opponent.full_name or opponent.username,
                        "avatar": opponent.avatar,
                        "is_online": opponent.is_online
                    },
                    "last_message": {
                        "text": msg.text,
                        "timestamp": msg.created_at.strftime("%H:%M"),
                        "status": msg.status,
                        "is_mine": msg.sender_id == user_id
                    },
                    "unread_count": unread_count
                })
    return chat_list

@app.put("/users/{user_id}/push-token")
def update_push_token(user_id: int, token_data: schemas.PushTokenUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.expo_push_token = token_data.expo_push_token
    db.commit()
    return {"message": "Push token updated successfully"}

# --- TOURNAMENTS ---

@app.get("/tournaments/", response_model=List[schemas.Tournament])
def read_tournaments(db: Session = Depends(get_db)):
    return db.query(models.Tournament).filter(models.Tournament.status == "UPCOMING").order_by(models.Tournament.date.asc()).all()

@app.post("/tournaments/", response_model=schemas.Tournament)
def create_tournament(tournament: schemas.TournamentCreate, db: Session = Depends(get_db)):
    db_tournament = models.Tournament(**tournament.dict())
    db.add(db_tournament)
    db.commit()
    db.refresh(db_tournament)
    return db_tournament

@app.post("/tournaments/{tournament_id}/upload-poster")
def upload_tournament_poster(tournament_id: int, request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    db_tournament = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    upload_dir = UPLOADS_DIR / "tournaments"
    os.makedirs(upload_dir, exist_ok=True)
    
    import time, shutil
    file_path = f"{tournament_id}_{int(time.time())}_{file.filename}"
    absolute_file_path = str(upload_dir / file_path)
    
    with open(absolute_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_tournament.image = f"uploads/tournaments/{file_path}"
    db.commit()
    db.refresh(db_tournament)
    
    return {"message": "Poster uploaded successfully", "image": db_tournament.image}


@app.delete("/tournaments/{tournament_id}")
def delete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    db_tournament = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    # Cascade delete: hapus semua pendaftar turnamen ini terlebih dahulu
    db.query(models.TournamentRegistration).filter(models.TournamentRegistration.tournament_id == tournament_id).delete()
    
    db.delete(db_tournament)
    db.commit()
    return {"message": "Tournament deleted successfully"}

@app.put("/tournaments/{tournament_id}/complete")
def complete_tournament(tournament_id: int, db: Session = Depends(get_db)):
    db_tournament = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
    if not db_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
        
    db_tournament.status = "COMPLETED"
    db.commit()
    return {"message": "Tournament marked as completed"}

@app.post("/tournaments/{tournament_id}/register")
def register_tournament(tournament_id: int, username: str, db: Session = Depends(get_db)):
    try:
        # Panggil otomatis create_all agar tabel terbuat jika belum ada
        models.Base.metadata.create_all(bind=engine)
        
        db_tournament = db.query(models.Tournament).filter(models.Tournament.id == tournament_id).first()
        if not db_tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")
        
        # Check if already registered
        existing_reg = db.query(models.TournamentRegistration).filter(
            models.TournamentRegistration.tournament_id == tournament_id,
            models.TournamentRegistration.username == username
        ).first()
        
        if existing_reg:
            raise HTTPException(status_code=400, detail="User already registered")

        if db_tournament.max_participants > 0:
            db_tournament.max_participants -= 1
            
            new_reg = models.TournamentRegistration(
                tournament_id=tournament_id,
                username=username
            )
            db.add(new_reg)
            db.commit()
            db.refresh(db_tournament)
        else:
            raise HTTPException(status_code=400, detail="Tournament is full")
            
        return db_tournament
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tournaments/registered/{username}")
def get_registered_tournaments(username: str, db: Session = Depends(get_db)):
    try:
        models.Base.metadata.create_all(bind=engine)
        registrations = db.query(models.TournamentRegistration).filter(
            models.TournamentRegistration.username == username
        ).all()
        return [reg.tournament_id for reg in registrations]
    except Exception as e:
        return [] # Return empty if table doesn't exist yet

@app.get("/recalculate-stats")
def recalculate_stats(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    # Reset all stats to 0
    for user in users:
        user.matches = 0
        user.wins = 0
        user.losses = 0
    db.commit()

    # Recalculate based on COMPLETED challenges
    challenges = db.query(models.Challenge).filter(models.Challenge.status == "COMPLETED").all()
    for challenge in challenges:
        challenger = db.query(models.User).filter(models.User.id == challenge.challenger_id).first()
        opponent = db.query(models.User).filter(models.User.id == challenge.opponent_id).first()
        
        if challenger and opponent:
            challenger.matches += 1
            opponent.matches += 1
            if challenge.winner_id == challenger.id:
                challenger.wins += 1
                opponent.losses += 1
            elif challenge.winner_id == opponent.id:
                opponent.wins += 1
                challenger.losses += 1

    db.commit()
    return {"message": "Statistik pertandingan (matches, wins, losses) semua pengguna telah berhasil dikalkulasi ulang berdasarkan riwayat."}

@app.get("/migrate-prize")
def migrate_prize(db: Session = Depends(get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("ALTER TABLE tournaments ADD COLUMN prize VARCHAR(255) DEFAULT 'Trophy & Cash';"))
        db.commit()
        return {"message": "SUKSES: Kolom 'prize' berhasil ditambahkan ke database!"}
    except Exception as e:
        db.rollback()
        if "Duplicate column name" in str(e):
            return {"message": "INFO: Kolom 'prize' sudah ada di database. Aman!"}
        return {"error": str(e)}
