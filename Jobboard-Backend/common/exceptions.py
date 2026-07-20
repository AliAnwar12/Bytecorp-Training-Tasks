import logging

from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The request conflicts with an existing resource."
    default_code = "conflict"


def custom_exception_handler(exc, context):
    # Safety net: if a write ever slips past application-level validation and
    # hits a database constraint (unique/check constraint, FK violation, a
    # race between a "check" and a "create", etc.), don't let it surface as
    # an opaque 500. Translate it into a 409 the client can act on, and log
    # it so we can see how often the app-level checks are being bypassed.
    if isinstance(exc, IntegrityError):
        request = context.get("request")
        logger.warning(
            "Unhandled IntegrityError converted to 409 Conflict",
            extra={
                "path": getattr(request, "path", None),
                "method": getattr(request, "method", None),
            },
            exc_info=True,
        )
        exc = ConflictError("The request conflicts with an existing resource.")

    response = exception_handler(exc, context)

    if response is None:
        return response

    error_code = getattr(exc, "default_code", "error")
    message = "An error occurred."
    details = {}

    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = str(response.data["detail"])
        else:
            message = "Invalid input."
            error_code = "validation_error"
            details = response.data

    elif isinstance(response.data, list):
        message = "Invalid input."
        error_code = "validation_error"
        details = response.data

    response.data = {
        "error": {
            "code": str(error_code),
            "message": message,
            "details": details,
        }
    }

    return response