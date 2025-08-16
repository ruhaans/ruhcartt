from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "price", "quantity", "subtotal"]

    def get_subtotal(self, obj):
        return float(obj.price) * int(obj.quantity)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ["id", "status", "shipping_address", "total", "created_at", "items"]

class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(allow_blank=True, required=False)

    # create() is handled in the view (we need request.user + cart), so we just validate shape here
