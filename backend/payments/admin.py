from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("provider","rzp_payment_id","status","amount_paise","user","order","created_at")
    search_fields = ("rzp_payment_id","rzp_order_id","user__username")
    list_filter = ("provider","status","created_at")
    readonly_fields = ("payload",)
