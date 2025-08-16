from rest_framework import permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .auth_serializers import RegisterCustomerSerializer, RegisterSellerSerializer

User = get_user_model()

class RegisterCustomerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterCustomerSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

class RegisterSellerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSellerSerializer
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({"id": u.id, "username": u.username, "email": u.email, "role": u.role})
