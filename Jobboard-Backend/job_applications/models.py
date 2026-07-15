from django.conf import settings
from django.db import models
from django.db.models import Q

from common.models import AuditModel


class JobApplication(AuditModel):
    class Statuses(models.TextChoices):
        PENDING = "pending", "Pending"
        REVIEWED = "reviewed", "Reviewed"
        SHORTLISTED = "shortlisted", "Shortlisted"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="job_applications",
    )
    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.RESTRICT,
        related_name="applications",
    )
    cover_letter = models.TextField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Statuses.choices,
        default=Statuses.PENDING,
    )

    class Meta:
        db_table = "job_applications"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "job"],
                condition=Q(deleted_at__isnull=True),
                name="uq_job_applications_user_job_active",
            )
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_job_applications_user_id"),
            models.Index(fields=["job"], name="idx_job_applications_job_id"),
            models.Index(fields=["status"], name="idx_job_applications_status"),
            models.Index(fields=["deleted_at"], name="idx_job_apps_deleted_at"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.job.title}"