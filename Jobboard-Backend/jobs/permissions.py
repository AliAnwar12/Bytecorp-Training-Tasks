from rest_framework.permissions import BasePermission

from accounts.models import User
from companies.models import CompanyMember


class IsJobCompanyMemberOrAdmin(BasePermission):
    message = "You are not a member of this company."

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.role == User.Roles.ADMIN:
            return True

        if request.user.role != User.Roles.COMPANY_REPRESENTATIVE:
            return False

        return CompanyMember.objects.filter(
            company=obj.company,
            user=request.user,
            deleted_at__isnull=True,
        ).exists()