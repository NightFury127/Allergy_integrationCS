from django.urls import path
from . import views

urlpatterns = [
    path('check_allergies/', views.check_allergies),
]
