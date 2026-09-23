"""Standard API response formats, pagination models, and envelope structures."""

from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    """Standard success API envelope."""
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[DataT] = None


class APIErrorResponse(BaseModel):
    """Standard error API envelope."""
    success: bool = False
    message: str
    error_code: str = "INTERNAL_SERVER_ERROR"
    errors: Optional[Any] = None


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total_records: int
    total_pages: int
    has_next: bool
    has_prev: bool


class PaginatedResponse(BaseModel, Generic[DataT]):
    """Standard paginated API envelope."""
    success: bool = True
    message: str = "Records retrieved successfully"
    data: List[DataT] = Field(default_factory=list)
    meta: PaginationMeta
