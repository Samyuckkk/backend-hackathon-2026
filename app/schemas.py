from pydantic import BaseModel
from typing import List

class LineItem(BaseModel):
    description: str
    amount: float

class InvoiceRequest(BaseModel):
    raw_text: str

class InvoiceResponse(BaseModel):
    id: int
    vendor: str
    amount: float
    due_date: str
    line_items: List[LineItem]