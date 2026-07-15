from rest_framework.routers import DefaultRouter

from companies.views import CompanyViewSet, CompanyMemberViewSet

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="companies")
router.register("company-members", CompanyMemberViewSet, basename="company-members")

urlpatterns = router.urls