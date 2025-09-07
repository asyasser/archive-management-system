from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os
from dotenv import load_dotenv

#load environment variables
load_dotenv()

#get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

#create database engine
engine = create_engine(DATABASE_URL)

#create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#create all tables
Base.metadata.create_all(bind=engine)

#dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()