import logging
import time

from common.logging import current_user_var, get_request_id, new_request_id, request_id_var

logger = logging.getLogger("request")

REQUEST_ID_HEADER = "X-Request-ID"


class RequestLoggingMiddleware:
    """
    - Assigns a correlation ID to every request.
    - Echoes it back on the response.
    - Emits exactly one structured log line per request, and one on
      unhandled exceptions.
    - Clears current_user_var at the start of every request so a worker
      thread never attributes a request to the previous request's user.

    Registered first in MIDDLEWARE so the correlation ID is available to
    everything else that runs while handling the request.
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
        try:
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

            log_level = logging.WARNING if response.status_code >= 500 else logging.INFO
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

            return response
        finally:
            request_id_var.reset(request_id_token)
            current_user_var.reset(user_token)

    @staticmethod
    def _user_id(request):
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "is_authenticated", False):
            return user.id
        return None