"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("accounts.urls")),
    path("api/v1/", include("companies.urls")),
    path("api/v1/", include("jobs.urls")),
    path("api/v1/", include("job_applications.urls")),
    path("api/v1/", include("skills.urls")),
    path("api/v1/", include("audit.urls")),
]