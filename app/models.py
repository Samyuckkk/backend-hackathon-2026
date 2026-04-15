from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from app.db import Base

class Invoice(Base):
    __tablename__ = "invoices"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    vendor = Column(String)
    amount = Column(Float)
    due_date = Column(String)
    line_items = Column(Text)
    raw_text = Column(Text)
    created_at = Column(DateTime)  