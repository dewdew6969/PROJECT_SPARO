import urllib.request
import json
import urllib.error

data = {
    "name": "Test",
    "sport": "Badminton",
    "date": "2026-07-07T00:00:00Z",
    "location": "Test Venue",
    "max_participants": 10
}
req = urllib.request.Request(
    'https://sparo.my.id/tournaments/',
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    print("Success:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTPError:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
