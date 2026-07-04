from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

import os

# Format: mysql+pymysql://<user_database>:<password_database>@localhost/<nama_database>
# Contoh: mysql+pymysql://sparo_admin:Rahasia123!@localhost/sparo_maindb
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "SPARO_DB_URL", 
    "mysql+pymysql://spar7655_sparo_usr:uzumakinarutocahyapurnomo@localhost/spar7655_sparo_db"
)

# Jika masih pakai SQLite, gunakan connect_args={"check_same_thread": False}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        pool_pre_ping=True, 
        connect_args={'connect_timeout': 5}
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
