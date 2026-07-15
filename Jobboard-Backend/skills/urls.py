from rest_framework.routers import DefaultRouter

from skills.views import SkillViewSet, MyUserSkillViewSet, JobSkillViewSet

router = DefaultRouter()
router.register("skills", SkillViewSet, basename="skills")
router.register("my-skills", MyUserSkillViewSet, basename="my-skills")
router.register("job-skills", JobSkillViewSet, basename="job-skills")

urlpatterns = router.urls