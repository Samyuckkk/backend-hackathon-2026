import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models import Invoice
from app.schemas import InvoiceRequest
from app.services.llm_service import extract_invoice_data
from app.utils.file_utils import extract_text_from_image, extract_text_from_pdf
from app.utils.parser import safe_parse_llm_output

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/invoices")
def create_invoice(request: InvoiceRequest, db: Session = Depends(get_db)):
    llm_response = extract_invoice_data(request.raw_text)
    data = safe_parse_llm_output(llm_response)

    invoice = Invoice(
        vendor=data["vendor"],
        amount=data["amount"],
        due_date=data["due_date"],
        raw_text=request.raw_text,
        line_items=json.dumps(data["line_items"]),
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    return {
        "invoice_id": invoice.id,
        **data,
    }


@router.get("/invoices")
def get_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).all()

    result = []
    for inv in invoices:
        result.append(
            {
                "id": inv.id,
                "vendor": inv.vendor,
                "amount": inv.amount,
                "due_date": inv.due_date,
                "line_items": json.loads(inv.line_items),
            }
        )

    return result


@router.post("/upload-invoice")
async def upload_invoice(
    file: UploadFile = File(None),
    raw_text: str = Form(None),
):
    if raw_text:
        return {
            "source_type": "text",
            "file_name": None,
            "raw_text": raw_text,
        }

    if not file:
        raise HTTPException(status_code=400, detail="No input provided")

    content = await file.read()

    if file.content_type and file.content_type.startswith("image"):
        extracted_text = extract_text_from_image(content)
        source_type = "image"
    elif file.content_type == "application/pdf":
        extracted_text = extract_text_from_pdf(content)
        source_type = "pdf"
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    return {
        "source_type": source_type,
        "file_name": file.filename,
        "raw_text": extracted_text,
    }
