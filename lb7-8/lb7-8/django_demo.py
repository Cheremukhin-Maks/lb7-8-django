import os
import django
from django.conf import settings

# 1. Сначала конфигурируем Django (без обращения к settings.CONFIGURED)
if not settings.configured:
    settings.configure(
        DATABASES={
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': 'django_shop.db',
            }
        },
        INSTALLED_APPS=['__main__'],
    )
    django.setup()

from django.db import models
from django.db.models import Q, Avg, Count

# 2. Модели Django
class Category(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        app_label = '__main__'

class Product(models.Model):
    title = models.CharField(max_length=100)
    price = models.FloatField()
    discount = models.IntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')

    class Meta:
        app_label = '__main__'

# Спрячем сервисный вывод генерации схем
with django.db.connection.schema_editor() as schema_editor:
    try:
        schema_editor.create_model(Category)
        schema_editor.create_model(Product)
    except Exception:
        pass

def run_django_orm_tests():
    print("\n=== ДЕМОНСТРАЦИЯ DJANGO ORM ===")

    # 1. CREATE (Создание)
    cat = Category.objects.create(name="Электроника")
    p1 = Product.objects.create(title="Смартфон", price=15000, discount=10, category=cat)
    p2 = Product.objects.create(title="Ноутбук", price=35000, discount=0, category=cat)
    p3 = Product.objects.create(title="Наушники", price=2000, discount=5, category=cat)
    print(f"[CREATE] Создана категория '{cat.name}' и 3 товара.")

    # 2. READ (Выборки)
    # а) filter()
    expensive = Product.objects.filter(price__gt=10000)
    print(f"[READ filter] Товары дороже 10000: {[p.title for p in expensive]}")

    # б) exclude()
    no_discount = Product.objects.exclude(discount=0)
    print(f"[READ exclude] Товары со скидкой: {[p.title for p in no_discount]}")

    # в) Q-объекты (OR + NOT)
    q_search = Product.objects.filter((Q(price__lt=3000) | Q(discount__gt=5)) & ~Q(title__icontains="Ноутбук"))
    print(f"[READ Q-objects] Результат Q-запроса: {[p.title for p in q_search]}")

    # 3. Агрегация и Аннотация
    avg_price = Product.objects.aggregate(Avg('price'))
    print(f"[AGGREGATE] Средняя цена товаров: {avg_price['price__avg']} грн")

    cat_counts = Category.objects.annotate(total_products=Count('products'))
    for c in cat_counts:
        print(f"[ANNOTATE] Категория '{c.name}' содержит товаров: {c.total_products}")

    # 4. Оптимизация уникновения N+1 (select_related)
    products_with_cat = Product.objects.select_related('category').all()
    print(f"[OPTIMIZATION select_related] Загружен товар с категорией: {products_with_cat[0].title} -> {products_with_cat[0].category.name}")

    # 5. UPDATE (Обновление)
    p1.price = 14000
    p1.save()
    print(f"[UPDATE] Обновленная цена для {p1.title}: {p1.price}")

    # 6. DELETE (Удаление)
    p3.delete()
    print(f"[DELETE] Товар {p3.title} удален.")

if __name__ == '__main__':
    run_django_orm_tests()
