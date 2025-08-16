from django.contrib import admin
from .models import SellerProfile

@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "shop_name", "gst_number")
    search_fields = ("user__username", "shop_name")
