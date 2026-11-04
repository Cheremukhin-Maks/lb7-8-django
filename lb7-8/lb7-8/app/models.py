from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    """Категорія товарів в інтернет-магазині."""
    name = models.CharField(max_length=100, unique=True, verbose_name="Назва категорії")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="URL-слаг")
    description = models.TextField(blank=True, null=True, verbose_name="Опис")

    class Meta:
        ordering = ['name']
        verbose_name = "Категорія"
        verbose_name_plural = "Категорії"

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        verbose_name="Категорія"
    )
    title = models.CharField(max_length=200, verbose_name="Назва товару")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Ціна (грн)")
    discount = models.IntegerField(default=0, verbose_name="Знижка (%)")  # Нове поле для Завдання 2
    is_available = models.BooleanField(default=True, verbose_name="В наявності")

    class Meta:
        ordering = ['-id']
        verbose_name = "Товар"
        verbose_name_plural = "Товари"

    def __str__(self):
        return f"{self.title} ({self.price} грн)"


class UserProfile(models.Model):
    """Розширений профіль користувача."""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,  # 1-to-1
        related_name='profile',
        verbose_name="Користувач"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="Номер телефону")
    bio = models.TextField(blank=True, null=True, verbose_name="Про себе")
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name="Аватар")

    class Meta:
        ordering = ['user__username']
        verbose_name = "Профіль користувача"
        verbose_name_plural = "Профілі користувачів"

    def __str__(self):
        return f"Профіль: {self.user.username}"


class Order(models.Model):
    """Замовлення покупця."""
    STATUS_CHOICES = [
        ('new', 'Нове'),
        ('processing', 'В обробці'),
        ('completed', 'Виконано'),
        ('cancelled', 'Скасовано'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,  # 1-to-Many
        null=True,
        blank=True,
        related_name='orders',
        verbose_name="Покупець"
    )
    products = models.ManyToManyField(
        Product,  # Many-to-Many
        related_name='orders',
        verbose_name="Товари"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата створення")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name="Статус")
    shipping_address = models.CharField(max_length=255, verbose_name="Адреса доставки")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Замовлення"
        verbose_name_plural = "Замовлення"

    def __str__(self):
        return f"Замовлення №{self.pk} від {self.created_at.strftime('%Y-%m-%d')}"
