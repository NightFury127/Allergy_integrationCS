import json
import os
import requests
import pytesseract
import speech_recognition as sr
from PIL import Image
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import JournalEntry
from .serializers import JournalEntrySerializer

# Set path for Tesseract OCR
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Sample list of common allergens
COMMON_ALLERGENS = ['peanut', 'milk', 'egg', 'soy', 'wheat', 'fish', 'shellfish', 'tree nut']

# ✅ Text-based allergen checker
@csrf_exempt
def check_allergies(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ingredients = data.get('ingredients', '').lower()
            found_allergens = [a for a in COMMON_ALLERGENS if a in ingredients]

            if found_allergens:
                return JsonResponse({'status': 'danger', 'message': 'Allergens found!', 'allergens': found_allergens})
            else:
                return JsonResponse({'status': 'safe', 'message': 'No allergens detected!'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request required.'}, status=400)

# ✅ OCR image allergen checker
@csrf_exempt
def scan_ocr(request):
    if request.method == 'POST':
        try:
            image_file = request.FILES['image']
            image = Image.open(image_file)
            extracted_text = pytesseract.image_to_string(image)
            found_allergens = [a for a in COMMON_ALLERGENS if a in extracted_text.lower()]

            if found_allergens:
                return JsonResponse({
                    'status': 'danger',
                    'message': 'Allergens found in image!',
                    'allergens': found_allergens,
                    'extracted_text': extracted_text
                })
            else:
                return JsonResponse({
                    'status': 'safe',
                    'message': 'No allergens detected in image.',
                    'extracted_text': extracted_text
                })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request with image required.'}, status=400)

# ✅ Simple text endpoint (same as check_allergies but more generic)
@csrf_exempt
def check_text(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '').lower()
            found_allergens = [a for a in COMMON_ALLERGENS if a in text]

            return JsonResponse({
                'input': text,
                'allergens': found_allergens,
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request required.'}, status=400)

# ✅ Speech-to-text allergen checker (🎙️ This is what was missing!)
@csrf_exempt
def check_speech(request):
    if request.method == 'POST':
        try:
            audio_file = request.FILES['audio']  # Send as 'audio' key
            recognizer = sr.Recognizer()

            with sr.AudioFile(audio_file) as source:
                audio = recognizer.record(source)

            text = recognizer.recognize_google(audio)
            found_allergens = [a for a in COMMON_ALLERGENS if a in text.lower()]

            return JsonResponse({
                'status': 'danger' if found_allergens else 'safe',
                'transcribed_text': text,
                'allergens': found_allergens
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request with audio required.'}, status=400)

# ✅ Gemini chatbot integration
GEMINI_API_KEY = "YOUR_API_KEY"  # Replace with your Gemini API Key

@csrf_exempt
def gemini_chat(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_input = data.get('message', '')

            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                params={'key': GEMINI_API_KEY},
                headers={'Content-Type': 'application/json'},
                json={"contents": [{"parts": [{"text": user_input}]}]}
            )

            gemini_data = response.json()
            reply = gemini_data['candidates'][0]['content']['parts'][0]['text']
            return JsonResponse({'reply': reply})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'POST request required.'}, status=400)

# ✅ Journal entries (GET/POST)
@api_view(['GET', 'POST'])
def journal_entries(request):
    if request.method == 'GET':
        entries = JournalEntry.objects.all().order_by('-timestamp')
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = JournalEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
