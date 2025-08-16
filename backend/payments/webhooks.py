import json
import razorpay
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Payment
from orders.services import convert_cart_to_order
from django.contrib.auth import get_user_model

User = get_user_model()

@method_decorator(csrf_exempt, name="dispatch")  # webhooks are unauthenticated
class RazorpayWebhook(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        # 1) verify signature
        body = request.body
        sig = request.headers.get("X-Razorpay-Signature")
        secret = getattr(settings, "RAZORPAY_WEBHOOK_SECRET", None)
        if not (sig and secret):
            return Response({"detail": "Missing signature/secret"}, status=400)

        try:
            razorpay.Utility.verify_webhook_signature(body, sig, secret)
            sig_ok = True
        except razorpay.errors.SignatureVerificationError:
            sig_ok = False

        payload = json.loads(body.decode("utf-8") or "{}")
        event = payload.get("event", "")
        entity = payload.get("payload", {}).get("payment", {}).get("entity") or payload.get("payload", {}).get("order", {}).get("entity")

        # 2) normalize fields we care about
        rzp_payment_id = None
        rzp_order_id = None
        amount = None
        status_str = None

        if "payment." in event and entity:
            rzp_payment_id = entity.get("id")
            rzp_order_id = entity.get("order_id")
            amount = entity.get("amount")
            status_str = entity.get("status")
        elif "order." in event and entity:
            rzp_order_id = entity.get("id")
            amount = entity.get("amount_paid") or entity.get("amount")
            status_str = "captured" if entity.get("status") == "paid" else entity.get("status")

        if not (rzp_payment_id or rzp_order_id):
            return Response({"detail": "No ids in payload"}, status=400)

        # 3) upsert Payment row (idempotent on rzp_payment_id when present)
        obj = None
        if rzp_payment_id:
            obj, _ = Payment.objects.get_or_create(
                provider=Payment.Provider.RAZORPAY,
                rzp_payment_id=rzp_payment_id,
                defaults={"rzp_order_id": rzp_order_id or "", "amount_paise": int(amount or 0)},
            )
        else:
            obj = Payment.objects.create(
                provider=Payment.Provider.RAZORPAY,
                rzp_payment_id=f"order_only::{rzp_order_id}",
                rzp_order_id=rzp_order_id or "",
                amount_paise=int(amount or 0),
            )

        # status & signature
        obj.signature_valid = sig_ok
        if status_str in ("captured","authorized","failed","created"):
            # map to our enum
            mapping = {
                "created": Payment.Status.CREATED,
                "authorized": Payment.Status.AUTHORIZED,
                "captured": Payment.Status.CAPTURED,
                "failed": Payment.Status.FAILED,
            }
            obj.status = mapping.get(status_str, obj.status)
        obj.payload = payload
        obj.save()

        # 4) try to link user from order notes, then create internal Order if captured and not created yet
        try:
            notes = payload.get("payload", {}).get("order", {}).get("entity", {}).get("notes") \
                    or payload.get("payload", {}).get("payment", {}).get("entity", {}).get("notes") \
                    or {}
            user_id = notes.get("user_id")
            user = User.objects.filter(id=user_id).first() if user_id else None
            if user and obj.status == Payment.Status.CAPTURED and obj.order_id is None and obj.signature_valid:
                # create internal order; no shipping address here (frontend /verify path sets it)
                order = convert_cart_to_order(user, "")
                obj.user = user
                obj.order = order
                obj.save(update_fields=["user","order"])
        except Exception:
            # Don’t fail webhook; just acknowledge (you can log this)
            pass

        return Response({"ok": True})
