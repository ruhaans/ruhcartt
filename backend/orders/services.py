from decimal import Decimal
from django.db import transaction
from cart.models import Cart, CartItem
from store.models import Product
from .models import Order, OrderItem

def convert_cart_to_order(user, shipping_address: str = "") -> Order:
    with transaction.atomic():
        cart, _ = Cart.objects.select_for_update().get_or_create(user=user)
        items = list(CartItem.objects.select_for_update()
                     .filter(cart=cart).select_related("product"))
        if not items:
            raise ValueError("Cart is empty.")

        # lock products
        product_ids = [it.product_id for it in items]
        products = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)}

        # validate stock
        for it in items:
            p = products[it.product_id]
            if p.stock is not None and it.quantity > p.stock:
                raise ValueError(f"Not enough stock for {p.name}.")

        # create order (paid in this flow)
        order = Order.objects.create(user=user, shipping_address=shipping_address, status=Order.Status.PAID)

        total = Decimal("0.00")
        bulk_items = []
        for it in items:
            p = products[it.product_id]
            price = p.price
            total += Decimal(price) * it.quantity
            bulk_items.append(OrderItem(order=order, product=p, product_name=p.name, price=price, quantity=it.quantity))
            if p.stock is not None:
                p.stock -= it.quantity
                p.save(update_fields=["stock"])

        OrderItem.objects.bulk_create(bulk_items)
        order.total = total
        order.save(update_fields=["total"])

        # clear cart
        CartItem.objects.filter(cart=cart).delete()

    return order
