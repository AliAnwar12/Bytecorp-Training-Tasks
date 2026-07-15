from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        if not name:
            raise ValueError("Name is required")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            name=name,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        JOB_SEEKER = "job_seeker", "Job Seeker"
        COMPANY_REPRESENTATIVE = "company_representative", "Company Representative"
        ADMIN = "admin", "Admin"

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=50,
        choices=Roles.choices,
        default=Roles.JOB_SEEKER,
    )

    # Django uses the field name "password" internally.
    # db_column keeps the actual database column name as "password_hash".
    password = models.CharField(max_length=255, db_column="password_hash")

    bio = models.TextField(null=True, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_users",
    )
    updated_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="updated_users",
    )
    deleted_by = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_users",
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["created_by"], name="idx_users_created_by"),
            models.Index(fields=["updated_by"], name="idx_users_updated_by"),
            models.Index(fields=["deleted_by"], name="idx_users_deleted_by"),
        ]

    def __str__(self):
        return self.email