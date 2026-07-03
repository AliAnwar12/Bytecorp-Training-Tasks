from django.urls import path

from job_applications.views import (
    ApplyToJobView,
    MyApplicationsView,
    JobApplicationsForJobView,
    JobApplicationStatusUpdateView,
    JobApplicationDeleteView,
)

urlpatterns = [
    path("jobs/<int:job_id>/applications/", ApplyToJobView.as_view(), name="apply-to-job"),
    path("applications/me/", MyApplicationsView.as_view(), name="my-applications"),
    path("jobs/<int:job_id>/applications/list/", JobApplicationsForJobView.as_view(), name="job-applications-list"),
    path("job-applications/<int:pk>/status/", JobApplicationStatusUpdateView.as_view(), name="job-application-status"),
    path("job-applications/<int:pk>/", JobApplicationDeleteView.as_view(), name="job-application-delete"),
]