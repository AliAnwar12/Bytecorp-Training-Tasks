from rest_framework_simplejwt.authentication import JWTAuthentication

from common.logging import current_user_var


class AuditingJWTAuthentication(JWTAuthentication):
    """
    Identical to the stock JWT authentication, but also records the
    authenticated user in current_user_var the moment the token is
    verified - before any view code runs, and therefore before any
    .save() a signal might fire on.
    """

    def authenticate(self, request):
        result = super().authenticate(request)

        if result is not None:
            user, _token = result
            current_user_var.set(user)

        return result