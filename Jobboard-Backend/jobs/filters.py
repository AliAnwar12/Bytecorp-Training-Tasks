import django_filters

from jobs.models import Job


class JobFilter(django_filters.FilterSet):
    salary_min = django_filters.NumberFilter(field_name="salary_min", lookup_expr="gte")
    salary_max = django_filters.NumberFilter(field_name="salary_max", lookup_expr="lte")
    skill = django_filters.CharFilter(method="filter_skill")

    class Meta:
        model = Job
        fields = [
            "location",
            "status",
            "employment_type",
            "salary_min",
            "salary_max",
            "skill",
        ]

    def filter_skill(self, queryset, name, value):
        return queryset.filter(
            job_skills__skill__name__iexact=value,
            job_skills__deleted_at__isnull=True,
        ).distinct()