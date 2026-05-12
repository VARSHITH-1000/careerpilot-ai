from app.db.database import engine, Base
from app.db import models

# Create tables
Base.metadata.create_all(bind=engine)
print("Database initialized successfully.")
