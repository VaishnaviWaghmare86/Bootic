"""Custom application domain exceptions."""

from typing import Any, Dict, Optional


class AppException(Exception):
    """Base exception for application domain errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = 500,
        errors: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.errors = errors


class AuthenticationException(AppException):
    def __init__(self, message: str = "Invalid credentials or authentication token expired", errors: Optional[Any] = None):
        super().__init__(message=message, error_code="AUTHENTICATION_FAILED", status_code=401, errors=errors)


class AuthorizationException(AppException):
    def __init__(self, message: str = "You do not have permission to access this resource", errors: Optional[Any] = None):
        super().__init__(message=message, error_code="FORBIDDEN_ACCESS", status_code=403, errors=errors)


class EntityNotFoundException(AppException):
    def __init__(self, entity_name: str, entity_id: Any = None):
        msg = f"{entity_name} not found" if not entity_id else f"{entity_name} with identifier '{entity_id}' was not found"
        super().__init__(message=msg, error_code=f"{entity_name.upper().replace(' ', '_')}_NOT_FOUND", status_code=404)


class DuplicateEntityException(AppException):
    def __init__(self, entity_name: str, field_name: str, field_value: Any):
        msg = f"{entity_name} with {field_name} '{field_value}' already exists"
        super().__init__(message=msg, error_code=f"DUPLICATE_{field_name.upper()}", status_code=409)


class InsufficientStockException(AppException):
    def __init__(self, product_name: str, requested: int, available: int):
        msg = f"Insufficient stock for '{product_name}'. Requested: {requested}, Available: {available}"
        super().__init__(message=msg, error_code="INSUFFICIENT_STOCK", status_code=400)


class ValidationException(AppException):
    def __init__(self, message: str, errors: Optional[Any] = None):
        super().__init__(message=message, error_code="VALIDATION_ERROR", status_code=422, errors=errors)


class BusinessRuleException(AppException):
    def __init__(self, message: str, error_code: str = "BUSINESS_RULE_VIOLATION"):
        super().__init__(message=message, error_code=error_code, status_code=400)
