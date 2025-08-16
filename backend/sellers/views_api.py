from rest_framework import viewsets, mixins, permissions
from django.shortcuts import get_object_or_404

from .permissions import IsSeller
from .serializers import ProductWriteSerializer
from store.models import Product
from store.serializers import ProductSerializer  # reuse read serializer

class SellerProductViewSet(mixins.ListModelMixin,
                           mixins.CreateModelMixin,
                           mixins.RetrieveModelMixin,
                           mixins.UpdateModelMixin,
                           viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(owner=self.request.user).select_related("category").order_by("-created_at")

    def get_serializer_class(self):
        # use write serializer for create/update; read serializer otherwise
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        return ProductSerializer

    def get_object(self):
        # ensure seller can only access own product by slug
        return get_object_or_404(self.get_queryset(), slug=self.kwargs[self.lookup_field])
