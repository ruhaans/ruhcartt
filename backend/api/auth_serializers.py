from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from sellers.models import SellerProfile  # make sure this import exists

User = get_user_model()

class BaseRegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    # ✅ pass validated_data in; don't touch self.validated_data
    def create_user(self, validated_data, role_value):
        data = validated_data.copy()
        data.pop("password2", None)
        password = data.pop("password")
        user = User(**data)
        user.role = role_value
        user.set_password(password)
        user.save()
        return user

class RegisterCustomerSerializer(BaseRegisterSerializer):
    def create(self, validated_data):
        return self.create_user(validated_data, User.Roles.CUSTOMER)

class RegisterSellerSerializer(BaseRegisterSerializer):
    shop_name = serializers.CharField(max_length=255, write_only=True)  # ⬅️ add write_only

    class Meta(BaseRegisterSerializer.Meta):
        fields = BaseRegisterSerializer.Meta.fields + ("shop_name",)

    def create(self, validated_data):
        shop_name = validated_data.pop("shop_name")
        user = self.create_user(validated_data, User.Roles.SELLER)
        SellerProfile.objects.create(user=user, shop_name=shop_name)
        return user
