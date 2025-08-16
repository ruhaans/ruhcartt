from django.db import models
from django.conf import settings

class Payment(models.Model):
    class Provider(models.TextChoices):
        RAZORPAY = "razorpay", "Razorpay"

    class Status(models.TextChoices):
        CREATED = "created", "Created"
        AUTHORIZED = "authorized", "Authorized"
        CAPTURED = "captured", "Captured"
        FAILED = "failed", "Failed"

    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.RAZORPAY)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")

    # Razorpay ids
    rzp_order_id = models.CharField(max_length=64, db_index=True, blank=True)
    rzp_payment_id = models.CharField(max_length=64, unique=True)  # idempotency
    signature_valid = models.BooleanField(default=False)

    amount_paise = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)

    payload = models.JSONField(default=dict, blank=True)  # full webhook payload for audit

    # link to internal Order when created
    order = models.ForeignKey("orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="payments")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider}:{self.rzp_payment_id} ({self.status})"
