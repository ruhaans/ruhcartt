from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemWriteSerializer

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    # GET /api/cart/
    def list(self, request):
        cart = self.get_cart(request)
        data = CartSerializer(cart, context={"request": request}).data
        return Response(data)

    # POST /api/cart/add/
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def add(self, request):
        ser = CartItemWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = ser.validated_data["product"]
        qty = ser.validated_data["quantity"]

        # stock check
        if product.stock is not None and qty > product.stock:
            return Response({"detail": "Not enough stock."}, status=400)

        cart = self.get_cart(request)
        item, created = CartItem.objects.select_for_update().get_or_create(
            cart=cart, product=product, defaults={"quantity": qty}
        )
        if not created:
            new_qty = item.quantity + qty
            if product.stock is not None and new_qty > product.stock:
                return Response({"detail": "Not enough stock."}, status=400)
            item.quantity = new_qty
            item.save(update_fields=["quantity"])

        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)

    # PATCH /api/cart/update/
    @action(detail=False, methods=["patch"])
    @transaction.atomic
    def update_item(self, request):
        ser = CartItemWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = ser.validated_data["product"]
        qty = ser.validated_data["quantity"]

        cart = self.get_cart(request)
        try:
            item = CartItem.objects.select_for_update().get(cart=cart, product=product)
        except CartItem.DoesNotExist:
            return Response({"detail": "Item not in cart."}, status=404)

        if product.stock is not None and qty > product.stock:
            return Response({"detail": "Not enough stock."}, status=400)

        item.quantity = qty
        item.save(update_fields=["quantity"])
        return Response(CartSerializer(cart).data)

    # DELETE /api/cart/remove/?product_id=123
    @action(detail=False, methods=["delete"])
    @transaction.atomic
    def remove(self, request):
        product_id = request.query_params.get("product_id")
        if not product_id:
            return Response({"detail": "product_id query param required."}, status=400)
        cart = self.get_cart(request)
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        return Response(CartSerializer(cart).data)

    # DELETE /api/cart/clear/
    @action(detail=False, methods=["delete"])
    @transaction.atomic
    def clear(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)
