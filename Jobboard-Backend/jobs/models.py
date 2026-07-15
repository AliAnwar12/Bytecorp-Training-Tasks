from django.db import models
from django.db.models import F, Q

from common.models import AuditModel


class Job(AuditModel):
    class EmploymentTypes(models.TextChoices):
        FULL_TIME = "full-time", "Full-time"
        PART_TIME = "part-time", "Part-time"
        CONTRACT = "contract", "Contract"

    class Statuses(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"
        DRAFT = "draft", "Draft"

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.RESTRICT,
        related_name="jobs",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    location = models.CharField(max_length=255)
    salary_min = models.PositiveIntegerField()
    salary_max = models.PositiveIntegerField()
    employment_type = models.CharField(max_length=20, choices=EmploymentTypes.choices)
    status = models.CharField(
        max_length=20,
        choices=Statuses.choices,
        default=Statuses.DRAFT,
    )

    class Meta:
        db_table = "jobs"
        constraints = [
            models.CheckConstraint(
                condition=Q(salary_max__gte=F("salary_min")),
                name="chk_jobs_salary_max_greater_or_equal_min",
            )
        ]
        indexes = [
            models.Index(fields=["company"], name="idx_jobs_company_id"),
            models.Index(fields=["location"], name="idx_jobs_location"),
            models.Index(fields=["employment_type"], name="idx_jobs_employment_type"),
            models.Index(fields=["status"], name="idx_jobs_status"),
            models.Index(fields=["salary_min", "salary_max"], name="idx_jobs_salary_min_salary_max"),
            models.Index(fields=["status", "location", "employment_type"], name="idx_jobs_status_loc_emp"),
            models.Index(fields=["-created_at"], name="idx_jobs_created_at"),
            models.Index(fields=["deleted_at"], name="idx_jobs_deleted_at"),
        ]

    def __str__(self):
        return self.title