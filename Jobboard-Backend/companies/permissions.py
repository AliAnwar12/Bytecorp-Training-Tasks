from rest_framework.permissions import BasePermission

from accounts.models import User
from companies.models import CompanyMember


class IsCompanyMemberOrAdmin(BasePermission):
    message = "You are not a member of this company."

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.role == User.Roles.ADMIN:
            return True

        return CompanyMember.objects.filter(
            company=obj,
            user=request.user,
            deleted_at__isnull=True,
        ).exists()