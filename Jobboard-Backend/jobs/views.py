from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.models import User
from accounts.permissions import IsAdminOrCompanyRepresentative
from companies.models import CompanyMember
from jobs.filters import JobFilter
from jobs.models import Job
from jobs.permissions import IsJobCompanyMemberOrAdmin
from jobs.serializers import JobSerializer


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = JobFilter
    ordering_fields = ["created_at", "salary_min", "salary_max"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Job.objects.select_related("company").filter(deleted_at__isnull=True)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action == "create":
            return [IsAuthenticated(), IsAdminOrCompanyRepresentative()]

        return [IsAuthenticated(), IsJobCompanyMemberOrAdmin()]

    def perform_create(self, serializer):
        company = serializer.validated_data["company"]
        user = self.request.user

        if user.role != User.Roles.ADMIN:
            is_member = CompanyMember.objects.filter(
                company=company,
                user=user,
                deleted_at__isnull=True,
            ).exists()

            if not is_member:
                raise PermissionDenied("You can create jobs only for your own company.")

        serializer.save(created_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)