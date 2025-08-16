from rest_framework import serializers
from store.models import Product, Category

class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Product
        fields = ["id","name","description","price","stock","image_url","is_active","category_id"]

    def validate_category_id(self, value):
        if not Category.objects.filter(id=value).exists():
            raise serializers.ValidationError("Invalid category_id")
        return value

    def create(self, validated_data):
        category = Category.objects.get(id=validated_data.pop("category_id"))
        user = self.context["request"].user
        return Product.objects.create(owner=user, category=category, **validated_data)

    def update(self, instance, validated_data):
        cat_id = validated_data.pop("category_id", None)
        if cat_id:
            instance.category = Category.objects.get(id=cat_id)
        for f, v in validated_data.items():
            setattr(instance, f, v)
        instance.save()
        return instance
