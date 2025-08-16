from django.db import models
from django.conf import settings

class SellerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="seller_profile"
    )
    shop_name = models.CharField(max_length=255)
    gst_number = models.CharField(max_length=30, blank=True)

    def __str__(self):
        return self.shop_name
