from django.urls import path
from . import views

urlpatterns = [
    path('scan-ocr/', views.scan_ocr, name='scan_ocr'),
    path('check_allergies/', views.check_allergies),
    path('check-text/', views.check_text, name='check_text'),
    path('check-speech/', views.check_speech, name='check_speech'),
]
