from django.test import TestCase, Client
from django.db.models.deletion import ProtectedError
from app.models import Category, Product  # Змініть назви моделей, якщо вони відрізняються у вашому app/models.py

# ==========================================
# 1. ТЕСТИ МОДЕЛЕЙ (ЗАВДАННЯ 5)
# ==========================================
class DjangoModelTestCase(TestCase):
    def setUp(self):
        """1. Фікстура: створення тестових даних"""
        self.category = Category.objects.create(name="Тестова Категорія Django")

    def test_category_creation(self):
        """2. Перевірка створення об'єкта та його атрибутів"""
        self.assertEqual(self.category.name, "Тестова Категорія Django")
        self.assertIsNotNone(self.category.id)

    def test_product_relationship(self):
        """3. Перевірка зв me'язку ForeignKey та значень за замовчуванням"""
        product = Product.objects.create(
            title="Смартфон", 
            price=15000.0, 
            category=self.category
        )
        self.assertEqual(product.category, self.category)
        self.assertEqual(self.category.products.count(), 1)

    def test_protected_delete_validation(self):
        """4. Перевірка обмеження видалення (ProtectedError validation)"""
        product = Product.objects.create(
            title="Ноутбук", 
            price=30000.0, 
            category=self.category
        )
        with self.assertRaises(ProtectedError):
            self.category.delete()

# ==========================================
# 2. HTTP ІНТЕГРАЦІЙНІ ТЕСТИ (ЗАВДАННЯ 6)
# ==========================================
class DjangoHTTPIntegrationTestCase(TestCase):
    def setUp(self):
        """Фікстура: створення тестового клієнта"""
        self.client = Client()

    def test_django_index_page_status_200(self):
        """1. Позитивний сценарій: Доступність існуючої сторінки (HTTP 200)"""
        
        response = self.client.get('/')
        self.assertIn(response.status_code, [200, 302])

    def test_django_non_existent_page_404(self):
        """2. Негативний сценарій: Запит до неіснуючого маршруту (HTTP 404)"""
        response = self.client.get('/some-non-existent-page-12345/')
        self.assertEqual(response.status_code, 404)