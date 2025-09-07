from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Document
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import qrcode
import json
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import base64
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for creating documents
# Model for creating documents (POST)
class DocumentCreate(BaseModel):
    title: str 
    description: str = None
    departement: str = None
    owner_name: str = None
    owner_contact: str = None
    shelf_code: str = None
    box_number: str = None
    folder_number: str = None

# Model for updating documents (PUT/PATCH)
class DocumentUpdate(BaseModel):
    title: Optional[str] = None             # All optional
    description: Optional[str] = None
    departement: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    shelf_code: Optional[str] = None
    box_number: Optional[str] = None
    folder_number: Optional[str] = None

# Model for response (GET)
class DocumentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    departement: Optional[str]
    owner_name: Optional[str]
    owner_contact: Optional[str]
    shelf_code: Optional[str]
    box_number: Optional[str]
    folder_number: Optional[str]
    date_registered: datetime

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy objects

@app.get("/")
def read_root():
    return {"message": "Archive system is running!"}

@app.get("/test-db")
def test_database(db: Session = Depends(get_db)):
    # Count documents in database
    count = db.query(Document).count()
    return {"message": f"Database connected! Documents count: {count}"}

# Helper function to generate QR code
def generate_qr_code(data: dict, size: int = 10, border: int = 4):
    """Generate QR code from document data"""
    # Convert document data to JSON string for QR code
    qr_data = json.dumps(data, default=str)
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=border,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_buffer = BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    
    return img_buffer

# Helper function to generate PDF receipt
def generate_pdf_receipt(document_data: dict, qr_image_buffer: BytesIO):
    """Generate PDF receipt with document info and QR code"""
    buffer = BytesIO()
    
    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=16,
        alignment=TA_LEFT,
        spaceBefore=20,
        spaceAfter=10
    )
    
    content_style = ParagraphStyle(
        'CustomContent',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_LEFT,
        spaceAfter=8
    )
    
    # Build PDF content
    story = []
    
    # Title
    story.append(Paragraph("DOCUMENT ARCHIVE RECEIPT", title_style))
    story.append(Spacer(1, 20))
    
    # Document Information
    story.append(Paragraph("Document Information", header_style))
    
    info_items = [
        ("Document ID", document_data.get('id', 'N/A')),
        ("Title", document_data.get('title', 'N/A')),
        ("Description", document_data.get('description', 'N/A')),
        ("Department", document_data.get('departement', 'N/A')),
        ("Owner Name", document_data.get('owner_name', 'N/A')),
        ("Owner Contact", document_data.get('owner_contact', 'N/A')),
        ("Date Registered", document_data.get('date_registered', 'N/A'))
    ]
    
    for label, value in info_items:
        if value and value != 'N/A':
            story.append(Paragraph(f"<b>{label}:</b> {value}", content_style))
    
    story.append(Spacer(1, 20))
    
    # Location Information
    story.append(Paragraph("Storage Location", header_style))
    
    location_items = [
        ("Shelf Code", document_data.get('shelf_code', 'N/A')),
        ("Box Number", document_data.get('box_number', 'N/A')),
        ("Folder Number", document_data.get('folder_number', 'N/A'))
    ]
    
    for label, value in location_items:
        if value and value != 'N/A':
            story.append(Paragraph(f"<b>{label}:</b> {value}", content_style))
    
    story.append(Spacer(1, 30))
    
    # QR Code
    story.append(Paragraph("QR Code", header_style))
    story.append(Paragraph("Scan this QR code to quickly access document information:", content_style))
    story.append(Spacer(1, 10))
    
    # Add QR code image
    qr_image_buffer.seek(0)
    qr_img = Image(qr_image_buffer, width=2*inch, height=2*inch)
    story.append(qr_img)
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("Generated on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"), content_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer

# POST END POINTS
@app.post("/documents", response_model=DocumentResponse)
def create_document(document: DocumentCreate, db: Session = Depends(get_db)):
    # Use exclude_unset=True here too
    db_document = Document(**document.dict(exclude_unset=True))
    db_document.date_registered = datetime.utcnow()  # Set timestamp manually
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@app.post("/documents/{document_id}/generate-receipt")
def generate_document_receipt(document_id: int, db: Session = Depends(get_db)):
    """Generate and download PDF receipt with QR code for a document"""
    # Get document from database
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Convert document to dict for QR code and PDF
    document_data = {
        "id": document.id,
        "title": document.title,
        "description": document.description,
        "departement": document.departement,
        "owner_name": document.owner_name,
        "owner_contact": document.owner_contact,
        "shelf_code": document.shelf_code,
        "box_number": document.box_number,
        "folder_number": document.folder_number,
        "date_registered": document.date_registered.isoformat()
    }
    
    # Generate QR code
    qr_buffer = generate_qr_code(document_data)
    
    # Generate PDF
    pdf_buffer = generate_pdf_receipt(document_data, qr_buffer)
    
    # Return PDF as downloadable file
    filename = f"document_receipt_{document_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    return StreamingResponse(
        BytesIO(pdf_buffer.read()),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# QR CODE ENDPOINTS
@app.get("/documents/{document_id}/qr-code")
def get_document_qr_code(document_id: int, db: Session = Depends(get_db)):
    """Generate QR code for a specific document"""
    # Get document from database
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Prepare document data for QR code
    document_data = {
        "id": document.id,
        "title": document.title,
        "description": document.description,
        "departement": document.departement,
        "owner_name": document.owner_name,
        "owner_contact": document.owner_contact,
        "shelf_code": document.shelf_code,
        "box_number": document.box_number,
        "folder_number": document.folder_number,
        "date_registered": document.date_registered.isoformat()
    }
    
    # Generate QR code
    qr_buffer = generate_qr_code(document_data)
    
    return StreamingResponse(qr_buffer, media_type="image/png")

# GET END POINTS
@app.get("/documents")
def get_all_docs(db: Session = Depends(get_db)):
    documents = db.query(Document).all()
    return {"documents": documents}

@app.get("/documents/search")
def search_documents(
    title: Optional[str] = None,
    departement: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Document)
        
        if title:
            query = query.filter(Document.title.ilike(f"%{title}%"))  # case-insensitive
        if departement:
            query = query.filter(Document.departement.ilike(f"%{departement}%"))  # case-insensitive
        
        documents = query.all()
        return {"documents": documents, "count": len(documents)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"document": document}

"""@app.get("/documents/search")
def search_documents(title: str = None, departement: str = None, db: Session = Depends(get_db)):
    query = db.query(Document)
    
    if title:
        query = query.filter(Document.title.contains(title))
    if departement:
        query = query.filter(Document.departement.contains(departement))
    
    documents = query.all()
    return {"documents": documents, "count": len(documents)}"""



# PUT END POINTS
@app.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(document_id: int, document: DocumentUpdate, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update only provided fields
    update_data = document.dict(exclude_unset=True)  # Only gets provided fields
    for field, value in update_data.items():
        setattr(db_document, field, value)
    
    db.commit()
    db.refresh(db_document)
    return db_document

# DELETE END POINTS
@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    # Find the document to delete
    db_document = db.query(Document).filter(Document.id == document_id).first()
    
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the document
    db.delete(db_document)
    db.commit()
    
    return {"message": f"Document with ID {document_id} deleted successfully!"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)