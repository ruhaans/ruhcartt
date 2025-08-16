from rest_framework import serializers
from store.models import Product
from .models import Cart, CartItem

class ProductInlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "slug", "price", "image_url"]

class CartItemReadSerializer(serializers.ModelSerializer):
    product = ProductInlineSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "quantity", "subtotal"]

    def get_subtotal(self, obj):
        return float(obj.product.price) * int(obj.quantity)

class CartItemWriteSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate(self, attrs):
        try:
            product = Product.objects.get(pk=attrs["product_id"], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "Invalid product."})
        attrs["product"] = product
        return attrs

class CartSerializer(serializers.ModelSerializer):
    items = CartItemReadSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "created_at", "items", "total"]

    def get_total(self, obj):
        total = 0.0
        for it in obj.items.select_related("product").all():
            total += float(it.product.price) * int(it.quantity)
        return total
