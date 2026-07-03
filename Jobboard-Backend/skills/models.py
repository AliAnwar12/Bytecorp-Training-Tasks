from django.conf import settings
from django.db import models
from django.db.models import Q

from common.models import AuditModel


class Skill(AuditModel):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = "skills"
        indexes = [
            models.Index(fields=["deleted_at"], name="idx_skills_deleted_at"),
        ]

    def __str__(self):
        return self.name


class UserSkill(AuditModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="user_skills",
    )

    class Meta:
        db_table = "user_skills"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "skill"],
                condition=Q(deleted_at__isnull=True),
                name="uq_user_skills_user_skill_active",
            )
        ]
        indexes = [
            models.Index(fields=["user"], name="idx_user_skills_user_id"),
            models.Index(fields=["skill"], name="idx_user_skills_skill_id"),
            models.Index(fields=["deleted_at"], name="idx_user_skills_deleted_at"),
        ]


class JobSkill(AuditModel):
    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.CASCADE,
        related_name="job_skills",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="job_skills",
    )

    class Meta:
        db_table = "job_skills"
        constraints = [
            models.UniqueConstraint(
                fields=["job", "skill"],
                condition=Q(deleted_at__isnull=True),
                name="uq_job_skills_job_skill_active",
            )
        ]
        indexes = [
            models.Index(fields=["job"], name="idx_job_skills_job_id"),
            models.Index(fields=["skill"], name="idx_job_skills_skill_id"),
            models.Index(fields=["deleted_at"], name="idx_job_skills_deleted_at"),
        ]