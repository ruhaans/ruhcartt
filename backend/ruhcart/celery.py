import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ruhcart.settings.dev")
app = Celery("ruhcart")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
