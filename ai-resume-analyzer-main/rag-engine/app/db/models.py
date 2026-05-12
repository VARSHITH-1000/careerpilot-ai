from sqlalchemy import Column, Integer, String, DateTime
from app.db.database import Base
import datetime
import uuid

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, index=True)
    filename = Column(String)
    file_type = Column(String)
    status = Column(String, default="processing")
    insights = Column(String, nullable=True) # JSON string
    analytics = Column(String, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, index=True)
    title = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String, index=True)
    role = Column(String) # 'user' or 'assistant'
    content = Column(String)
    citations = Column(String, nullable=True) # JSON array of citations
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
