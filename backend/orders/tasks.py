from celery import shared_task
from django.core.mail import send_mail
from .models import Order

@shared_task
def send_order_confirmation(order_id: int):
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        return "missing"
    subject = f"RuhCart Order #{order.id} confirmed"
    body = f"Hi {order.user.username}, your order total is ₹{order.total}."
    send_mail(subject, body, "no-reply@ruhcart.local", [order.user.email or "demo@example.com"])
    return "ok"
