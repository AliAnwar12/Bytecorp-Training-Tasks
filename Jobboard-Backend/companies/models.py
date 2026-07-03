from django.conf import settings
from django.db import models
from django.db.models import Q

from common.models import AuditModel


class Company(AuditModel):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    website = models.URLField(max_length=2048, null=True, blank=True)
    location = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = "companies"
        indexes = [
            models.Index(fields=["location"], name="idx_companies_location"),
            models.Index(fields=["is_verified"], name="idx_companies_is_verified"),
            models.Index(fields=["deleted_at"], name="idx_companies_deleted_at"),
        ]

    def __str__(self):
        return self.name


class CompanyMember(AuditModel):
    class MemberRoles(models.TextChoices):
        OWNER = "owner", "Owner"
        RECRUITER = "recruiter", "Recruiter"

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_memberships",
    )
    role = models.CharField(
        max_length=50,
        choices=MemberRoles.choices,
        default=MemberRoles.RECRUITER,
    )

    class Meta:
        db_table = "company_members"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "user"],
                condition=Q(deleted_at__isnull=True),
                name="uq_company_members_company_user_active",
            )
        ]
        indexes = [
            models.Index(fields=["company"], name="idx_company_members_company_id"),
            models.Index(fields=["user"], name="idx_company_members_user_id"),
            models.Index(fields=["deleted_at"], name="idx_company_members_deleted_at"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.company.name}"