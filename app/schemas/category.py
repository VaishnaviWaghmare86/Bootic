"""Category schemas for classification and hierarchy."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: str
    slug: str
    created_at: datetime
    updated_at: datetime
