import json
import logging
import time

from audit.models import AuditLog
from common.logging import (
    current_user_var,
    get_request_id,
    new_request_id,
    redact_sensitive_data,
    request_id_var,
)

logger = logging.getLogger("request")

REQUEST_ID_HEADER = "X-Request-ID"


class RequestLoggingMiddleware:
    """
    Adds request_id to every request/response and creates a request-level
    audit log for API calls, including successful responses and error responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming_id = request.headers.get(REQUEST_ID_HEADER)
        request_id = incoming_id or new_request_id()

        request_id_token = request_id_var.set(request_id)
        user_token = current_user_var.set(None)

        request.request_id = request_id
        start = time.monotonic()

        request_body = self._get_request_body(request)

        try:
            response = self.get_response(request)
        except Exception:
            duration_ms = round((time.monotonic() - start) * 1000, 2)

            logger.exception(
                "request failed",
                extra={
                    "http_method": request.method,
                    "path": request.path,
                    "duration_ms": duration_ms,
                    "user_id": self._user_id(request),
                },
            )

            raise

        duration_ms = round((time.monotonic() - start) * 1000, 2)
        response[REQUEST_ID_HEADER] = request_id

        response_body = self._get_response_body(response)

        self._create_request_audit_log(
            request=request,
            request_body=request_body,
            response=response,
            response_body=response_body,
        )

        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            log_level,
            "request completed",
            extra={
                "http_method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": duration_ms,
                "user_id": self._user_id(request),
            },
        )

        request_id_var.reset(request_id_token)
        current_user_var.reset(user_token)

        return response

    def _get_request_body(self, request):
        if request.method not in ["POST", "PUT", "PATCH"]:
            return {}

        try:
            if not request.body:
                return {}

            return redact_sensitive_data(
                json.loads(request.body.decode("utf-8"))
            )
        except Exception:
            return {"raw": "[UNREADABLE_REQUEST_BODY]"}

    def _get_response_body(self, response):
        try:
            content_type = response.get("Content-Type", "")

            if "application/json" not in content_type:
                return None

            if not hasattr(response, "content") or not response.content:
                return None

            return redact_sensitive_data(
                json.loads(response.content.decode("utf-8"))
            )
        except Exception:
            return {"raw": "[UNREADABLE_RESPONSE_BODY]"}

    def _create_request_audit_log(self, request, request_body, response, response_body):
        path = request.get_full_path()

        if not path.startswith("/api/v1/"):
            return

        if path.startswith("/api/v1/audit-logs/"):
            return

        user = current_user_var.get()
        is_authenticated = bool(user and getattr(user, "is_authenticated", False))

        AuditLog.objects.create(
            action=AuditLog.Actions.REQUEST,
            model_name="api.request",
            object_id="",
            object_repr=f"{request.method} {path}",
            changes={},
            actor=user if is_authenticated else None,
            actor_email=getattr(user, "email", None) if is_authenticated else None,
            request_id=get_request_id(),
            request_method=request.method,
            request_path=path,
            request_body=request_body,
            response_status_code=response.status_code,
            response_body=response_body,
        )

    @staticmethod
    def _user_id(request):
        user = getattr(request, "user", None)

        if user is not None and getattr(user, "is_authenticated", False):
            return user.id

        return None