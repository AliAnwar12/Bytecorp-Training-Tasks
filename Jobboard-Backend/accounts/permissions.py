from rest_framework.permissions import BasePermission

from accounts.models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Roles.ADMIN
        )


class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Roles.JOB_SEEKER
        )


class IsCompanyRepresentative(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == User.Roles.COMPANY_REPRESENTATIVE
        )


class IsAdminOrCompanyRepresentative(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [
                User.Roles.ADMIN,
                User.Roles.COMPANY_REPRESENTATIVE,
            ]
        )