from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal

from store.models import Category, Product
from sellers.models import SellerProfile

User = get_user_model()

CATS = ["Electronics", "Fashion", "Home", "Books"]

PRODUCTS = [
    dict(
        cat="Electronics",
        name="Wireless Headphones",
        desc="Over-ear Bluetooth headphones with noise cancellation",
        price="2999.00",
        stock=12,
        img="https://picsum.photos/seed/headphones/600/400",
    ),
    dict(
        cat="Electronics",
        name="Gaming Mouse",
        desc="Lightweight mouse with 6 programmable buttons",
        price="1499.00",
        stock=30,
        img="https://picsum.photos/seed/mouse/600/400",
    ),
    dict(
        cat="Fashion",
        name="Classic T-Shirt",
        desc="100% cotton, relaxed fit",
        price="799.00",
        stock=50,
        img="https://picsum.photos/seed/tshirt/600/400",
    ),
    dict(
        cat="Home",
        name="Ceramic Mug",
        desc="350ml matte finish mug",
        price="399.00",
        stock=60,
        img="https://picsum.photos/seed/mug/600/400",
    ),
    dict(
        cat="Books",
        name="Clean Code",
        desc="A Handbook of Agile Software Craftsmanship",
        price="2499.00",
        stock=15,
        img="https://picsum.photos/seed/cleancode/600/400",
    ),
]


class Command(BaseCommand):
    help = "Seed demo data: categories, products, and demo users (customer + seller). Idempotent."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-products",
            dest="reset_products",
            action="store_true",
            help="Delete all products before seeding",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(">> Seeding demo data"))

        reset = options.get("reset_products", False)

        # --- Users ---
        cust, _ = User.objects.get_or_create(
            username="demo_cust",
            defaults={
                "email": "demo_cust@example.com",
                "role": getattr(User.Roles, "CUSTOMER", "CUSTOMER"),
            },
        )
        if not cust.has_usable_password():
            cust.set_password("DemoPass123!")
            cust.save()

        seller, _ = User.objects.get_or_create(
            username="demo_seller",
            defaults={
                "email": "demo_seller@example.com",
                "role": getattr(User.Roles, "SELLER", "SELLER"),
            },
        )
        if not seller.has_usable_password():
            seller.set_password("DemoPass123!")
            seller.save()

        SellerProfile.objects.get_or_create(
            user=seller, defaults={"shop_name": "Demo Shop"}
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Users ready: demo_cust / demo_seller (password: DemoPass123!)"
            )
        )

        # --- Categories ---
        cats = {}
        for name in CATS:
            c, _ = Category.objects.get_or_create(name=name)
            cats[name] = c
        self.stdout.write(
            self.style.SUCCESS(f"Categories seeded: {', '.join(cats.keys())}")
        )

        # --- Products ---
        if reset:
            Product.objects.all().delete()
            self.stdout.write(self.style.WARNING("All products cleared."))

        created = 0
        for p in PRODUCTS:
            _, was_created = Product.objects.get_or_create(
                name=p["name"],
                defaults=dict(
                    category=cats[p["cat"]],
                    description=p["desc"],
                    price=Decimal(p["price"]),
                    stock=p["stock"],
                    image_url=p["img"],
                    is_active=True,
                    owner=None,  # public products (not tied to seller)
                ),
            )
            if was_created:
                created += 1

        # One product owned by demo_seller
        _, was_created = Product.objects.get_or_create(
            name="Seller Phone Case",
            defaults=dict(
                category=cats["Electronics"],
                description="TPU protective case",
                price=Decimal("499.00"),
                stock=40,
                image_url="https://picsum.photos/seed/case/600/400",
                is_active=True,
                owner=seller,
            ),
        )
        if was_created:
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Products ready (new: {created})."))
        self.stdout.write(self.style.MIGRATE_HEADING(">> Done."))
