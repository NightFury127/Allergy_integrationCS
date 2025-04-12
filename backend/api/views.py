from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import pytesseract
from PIL import Image
import speech_recognition as sr
import io

# Set path for Tesseract OCR
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Sample list of common allergens
COMMON_ALLERGENS = ['peanut', 'milk', 'egg', 'soy', 'wheat', 'fish', 'shellfish', 'tree nut']

@csrf_exempt
def check_allergies(request):
    if request.method == 'POST':
        try:
            # Check if it's text input
            data = json.loads(request.body)
            ingredients = data.get('ingredients', '').lower()

            # Check for allergens in the text ingredients
            found_allergens = [allergen for allergen in COMMON_ALLERGENS if allergen in ingredients]

            if found_allergens:
                return JsonResponse({
                    'status': 'danger',
                    'message': 'Allergens found!',
                    'allergens': found_allergens
                })
            else:
                return JsonResponse({
                    'status': 'safe',
                    'message': 'No allergens detected!'
                })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request required.'}, status=400)

# Add OCR scanning for images
@csrf_exempt
def scan_ocr(request):
    if request.method == 'POST':
        try:
            # Get image from POST request
            image_file = request.FILES['image']  # 'image' is the key for the uploaded file
            image = Image.open(image_file)

            # Use Tesseract OCR to extract text
            extracted_text = pytesseract.image_to_string(image)

            # Find allergens in extracted text
            found_allergens = [allergen for allergen in COMMON_ALLERGENS if allergen in extracted_text.lower()]

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

    return JsonResponse({'error': 'POST request required with image.'}, status=400)

@csrf_exempt
def check_text(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '').lower()

            found_allergens = [a for a in COMMON_ALLERGENS if a in text]

            if found_allergens:
                return JsonResponse({
                    'input': text,
                    'allergens': found_allergens,
                    'safe': False
                })
            else:
                return JsonResponse({
                    'input': text,
                    'allergens': [],
                    'safe': True
                })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request required.'}, status=400)

# Add Speech-to-Text input for allergens
@csrf_exempt
def check_speech(request):
    if request.method == 'POST':
        try:
            audio_file = request.FILES['audio']
            audio_data = audio_file.read()

            recognizer = sr.Recognizer()
            with sr.AudioFile(io.BytesIO(audio_data)) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio)

            found_allergens = [a for a in COMMON_ALLERGENS if a in text.lower()]

            if found_allergens:
                return JsonResponse({
                    'input': text,
                    'allergens': found_allergens,
                    'safe': False
                })
            else:
                return JsonResponse({
                    'input': text,
                    'allergens': [],
                    'safe': True
                })

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    return JsonResponse({'error': 'POST request with audio required.'}, status=400)
