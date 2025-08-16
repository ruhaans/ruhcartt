from decimal import Decimal
from django.conf import settings
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
import razorpay

from cart.models import Cart
from orders.services import convert_cart_to_order
from orders.serializers import OrderSerializer
from orders.tasks import send_order_confirmation


def _amount_paise_for_user(user) -> int:
    cart, _ = Cart.objects.get_or_create(user=user)
    total = 0.0
    for it in cart.items.select_related("product").all():
        total += float(it.product.price) * int(it.quantity)
    return int(round(total * 100))  # paise


class RazorpayCreateOrder(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount_paise = _amount_paise_for_user(request.user)
        if amount_paise <= 0:
            return Response({"detail": "Cart is empty."}, status=400)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        rzp_order = client.order.create({
            "amount": amount_paise,
            "currency": getattr(settings, "RAZORPAY_CURRENCY", "INR"),
            "payment_capture": 1,  # auto-capture on success
            "notes": {"user_id": request.user.id},
        })

        return Response({
            "order_id": rzp_order["id"],
            "amount": amount_paise,
            "currency": rzp_order["currency"],
            "key": settings.RAZORPAY_KEY_ID,  # publishable key for Checkout
            "prefill": {
                "name": request.user.username,
                "email": request.user.email or "",
            },
            "description": "RuhCart Checkout",
        }, status=201)


class RazorpayVerify(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Body: {
          "razorpay_order_id": "...",
          "razorpay_payment_id": "...",
          "razorpay_signature": "...",
          "shipping_address": "..."
        }
        """
        required = ("razorpay_order_id", "razorpay_payment_id", "razorpay_signature")
        if not all(k in request.data for k in required):
            return Response({"detail": "Missing parameters."}, status=400)

        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        # 1) verify signature
        try:
            client.utility.verify_payment_signature({
                "razorpay_order_id": request.data["razorpay_order_id"],
                "razorpay_payment_id": request.data["razorpay_payment_id"],
                "razorpay_signature": request.data["razorpay_signature"],
            })
        except razorpay.errors.SignatureVerificationError:
            return Response({"detail": "Invalid signature."}, status=400)

        # 2) (optional) verify amount matches cart
        try:
            payment = client.payment.fetch(request.data["razorpay_payment_id"])
            paid_amount = int(payment.get("amount", 0))  # paise
        except Exception:
            paid_amount = None

        expected = _amount_paise_for_user(request.user)
        if paid_amount is not None and paid_amount != expected:
            return Response({"detail": "Amount mismatch."}, status=400)

        # 3) convert cart -> internal Order
        try:
            order = convert_cart_to_order(request.user, request.data.get("shipping_address", ""))
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        # 4) send confirmation email (async; eager in dev if CELERY_TASK_ALWAYS_EAGER=True)
        try:
            send_order_confirmation.delay(order.id)
        except Exception:
            # don't block the response if enqueue fails
            pass

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
