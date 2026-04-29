from fastapi import Request, status
from fastapi.responses import JSONResponse

class AppError(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    message: str = "Error interno."
    def __init__(self, message: str | None = None):
        self.message = message or self.message
        super().__init__(self.message)

class NotFoundError(AppError):
    status_code = 404
    message = "Recurso no encontrado."

class ConflictError(AppError):
    status_code = 409
    message = "Conflicto."

class UnauthorizedError(AppError):
    status_code = 401
    message = "No autorizado."

class ForbiddenError(AppError):
    status_code = 403
    message = "Sin permisos."

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})

async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    import logging
    logging.getLogger(__name__).exception(f"Unhandled: {exc}")
    return JSONResponse(status_code=500, content={"error": "Error interno del servidor."})
