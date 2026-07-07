from database import engine
from sqlalchemy import text

def add_status_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tournaments ADD COLUMN status VARCHAR(50) DEFAULT 'UPCOMING';"))
            conn.commit()
            print("SUKSES: Kolom 'status' berhasil ditambahkan ke database MySQL/MariaDB!")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("INFO: Kolom 'status' sudah ada di database.")
        else:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    add_status_column()
