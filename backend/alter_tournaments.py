import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'sparo.db')
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE tournaments ADD COLUMN status VARCHAR(50) DEFAULT 'UPCOMING';")
    conn.commit()
    print("Column added successfully.")
except sqlite3.OperationalError as e:
    print(f"Error (maybe column exists?): {e}")
finally:
    conn.close()
