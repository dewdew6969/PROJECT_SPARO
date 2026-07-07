import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, username, matches, wins, losses FROM users WHERE matches > 0"))
    rows = result.fetchall()
    print("Users with matches > 0:", rows)
    
    result2 = conn.execute(text("SELECT id, status, challenger_score, opponent_score, winner_id FROM challenges WHERE status = 'COMPLETED'"))
    rows2 = result2.fetchall()
    print("Completed Challenges:", rows2)
