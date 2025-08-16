from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from .services import convert_cart_to_order  # <-- use the service
from orders.tasks import send_order_confirmation  # <-- send email task


class OrdersViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related("items")
        )

    # GET /api/orders/
    def list(self, request):
        orders = self.get_queryset()
        return Response(OrderSerializer(orders, many=True).data)

    # GET /api/orders/<id>/
    def retrieve(self, request, pk=None):
        order = self.get_queryset().filter(pk=pk).first()
        if not order:
            return Response({"detail": "Not found."}, status=404)
        return Response(OrderSerializer(order).data)

    # POST /api/orders/  (convert cart -> order via service)
    def create(self, request):
        ser = OrderCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        shipping_address = ser.validated_data.get("shipping_address", "")

        try:
            order = convert_cart_to_order(request.user, shipping_address)
        except ValueError as e:
            return Response({"detail": str(e)}, status=400)

        # fire-and-forget email (CELERY_TASK_ALWAYS_EAGER=True runs inline in dev)
        try:
            send_order_confirmation.delay(order.id)
        except Exception:
            # don't block order creation if the task enqueue fails
            pass

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
