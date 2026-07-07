from database import engine
from sqlalchemy import text

def add_prize_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE tournaments ADD COLUMN prize VARCHAR(255) DEFAULT 'Trophy & Cash';"))
            conn.commit()
            print("SUKSES: Kolom 'prize' berhasil ditambahkan ke database MySQL/MariaDB!")
    except Exception as e:
        if "Duplicate column name" in str(e):
            print("INFO: Kolom 'prize' sudah ada di database.")
        else:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    add_prize_column()
