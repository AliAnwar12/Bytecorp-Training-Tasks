from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "audit"

    def ready(self):
        from django.apps import apps as django_apps

        from audit.signals import register_audit_signals
        from common.models import AuditModel

        # Any model that extends common.models.AuditModel gets a full audit
        # trail automatically. accounts.User does NOT extend AuditModel, so
        # it's never audited by this mechanism (password stays out of scope).
        for model in django_apps.get_models():
            if issubclass(model, AuditModel) and model._meta.abstract is False:
                register_audit_signals(model)