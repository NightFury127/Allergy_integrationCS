from django.urls import path
from . import views

app_name = 'api'  # Added for namespacing

urlpatterns = [
    path('', views.api_root, name='api_root'),  # Added for API discovery
    path('scan-ocr/', views.scan_ocr, name='scan_ocr'),
    path('check-allergies/', views.check_allergies, name='check_allergies'),  # Added name
    path('check-text/', views.check_text, name='check_text'),
    path('check-speech/', views.check_speech, name='check_speech'),
    path('check-medicine/', views.check_medicine, name='check_medicine'),
    path('chat/gemini/', views.gemini_chat, name='gemini_chat'),
    path('journal/', views.journal_entries, name='journal_entries'),
]