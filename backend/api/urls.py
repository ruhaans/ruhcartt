from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import health
from .auth_views import RegisterCustomerView, RegisterSellerView, MeView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from payments.views_api import RazorpayCreateOrder, RazorpayVerify
from payments.webhooks import RazorpayWebhook

# import store viewsets
from store.views_api import CategoryViewSet, ProductViewSet
from cart.views_api import CartViewSet
from orders.views_api import OrdersViewSet
from sellers.views_api import SellerProductViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products",   ProductViewSet,  basename="product")
router.register("cart",       CartViewSet,     basename="cart")
router.register("orders", OrdersViewSet, basename="orders")
router.register("seller/products", SellerProductViewSet, basename="seller-products")

urlpatterns = [
    path('health/', health, name='health'),

    # auth
    path('auth/register/customer/', RegisterCustomerView.as_view(), name='register-customer'),
    path('auth/register/seller/',   RegisterSellerView.as_view(),   name='register-seller'),
    path('auth/login/',             TokenObtainPairView.as_view(),  name='login'),
    path('auth/token/refresh/',     TokenRefreshView.as_view(),     name='token-refresh'),
    path('auth/me/',                MeView.as_view(),               name='me'),
    path('pay/razorpay/create_order/', RazorpayCreateOrder.as_view(), name='rzp-create-order'),
    path('pay/razorpay/verify/', RazorpayVerify.as_view(), name='rzp-verify'),
    path('pay/razorpay/webhook/', RazorpayWebhook.as_view(), name='rzp-webhook'),

    # store api
    path("", include(router.urls)),
]
