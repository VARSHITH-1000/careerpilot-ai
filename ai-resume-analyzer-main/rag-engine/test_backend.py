import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

response = client.get("/api/rag/documents/discover?query=test")
print("Status Code:", response.status_code)
if response.status_code == 500:
    print(response.text)
else:
    print("Response JSON:", response.json())
