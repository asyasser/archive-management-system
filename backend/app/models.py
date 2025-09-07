from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    departement = Column(String(100))
    owner_name = Column(String(255))
    owner_contact = Column(String(255))
    shelf_code = Column(String(10))
    box_number = Column(String(10))
    folder_number = Column(String(10))
    date_registered = Column(DateTime, default=datetime.utcnow)