from django.db import transaction
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from accounts.models import User
from accounts.permissions import IsAdmin, IsAdminOrCompanyRepresentative
from companies.models import Company, CompanyMember
from companies.permissions import IsCompanyMemberOrAdmin
from companies.serializers import CompanySerializer, CompanyMemberSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer

    def get_queryset(self):
        qs = Company.objects.filter(deleted_at__isnull=True)
        user = self.request.user
        if self.request.query_params.get("mine") == "true" and user.is_authenticated:
            if user.role != User.Roles.ADMIN:
                qs = qs.filter(
                    members__user=user,
                    members__deleted_at__isnull=True,
                ).distinct()
        return qs

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]

        if self.action == "create":
            return [IsAuthenticated(), IsAdminOrCompanyRepresentative()]

        return [IsAuthenticated(), IsCompanyMemberOrAdmin()]

    def perform_create(self, serializer):
        # Creating a company writes to two tables: `companies` and, for a
        # company representative, `company_members` (they're auto-enrolled
        # as the owner). Both writes must succeed or neither should.
        with transaction.atomic():
            company = serializer.save(created_by=self.request.user)

            if self.request.user.role == User.Roles.COMPANY_REPRESENTATIVE:
                CompanyMember.objects.create(
                    company=company,
                    user=self.request.user,
                    role=CompanyMember.MemberRoles.OWNER,
                    created_by=self.request.user,
                )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)


class CompanyMemberViewSet(viewsets.ModelViewSet):
    serializer_class = CompanyMemberSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return CompanyMember.objects.filter(deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(user=self.request.user)