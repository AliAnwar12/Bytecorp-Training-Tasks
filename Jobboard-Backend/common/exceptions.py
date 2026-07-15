from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class ConflictError(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "The request conflicts with an existing resource."
    default_code = "conflict"


def custom_exception_handler(exc, context):
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