import json
import os
import logging
from PIL import Image
import pytesseract
import speech_recognition as sr
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import JournalEntry
from .serializers import JournalEntrySerializer
from django.utils import timezone

# Configure logging
logger = logging.getLogger(__name__)

# Sample list of common allergens
COMMON_ALLERGENS = ['peanut', 'milk', 'egg', 'soy', 'wheat', 'fish', 'shellfish', 'tree nut']


# API root view for discovery
@api_view(['GET'])
def api_root(request):
    return Response({
        'scan_ocr': request.build_absolute_uri('scan-ocr/'),
        'check_allergies': request.build_absolute_uri('check-allergies/'),
        'check_text': request.build_absolute_uri('check-text/'),
        'check_speech': request.build_absolute_uri('check-speech/'),
        'check_medicine': request.build_absolute_uri('check-medicine/'),
        'gemini_chat': request.build_absolute_uri('chat/gemini/'),
        'journal': request.build_absolute_uri('journal/'),
    })


# Text-based allergen checker
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def check_allergies(request):
    try:
        data = request.data
        ingredients = data.get('ingredients', '').lower()
        if not ingredients:
            return Response({'error': 'Ingredients field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        found_allergens = [a for a in COMMON_ALLERGENS if a in ingredients]
        logger.info(f"Checked allergies for ingredients: {ingredients}, found: {found_allergens}")

        return Response({
            'status': 'danger' if found_allergens else 'safe',
            'message': 'Allergens found!' if found_allergens else 'No allergens detected!',
            'allergens': found_allergens
        })
    except Exception as e:
        logger.error(f"Error in check_allergies: {str(e)}")
        return Response({'error': 'Invalid request data.'}, status=status.HTTP_400_BAD_REQUEST)


# OCR image allergen checker
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def scan_ocr(request):
    try:
        if 'image' not in request.FILES:
            return Response({'error': 'Image file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        image_file = request.FILES['image']
        image = Image.open(image_file)
        extracted_text = pytesseract.image_to_string(image)
        found_allergens = [a for a in COMMON_ALLERGENS if a in extracted_text.lower()]
        logger.info(f"OCR scan extracted text: {extracted_text[:100]}..., found allergens: {found_allergens}")

        return Response({
            'status': 'danger' if found_allergens else 'safe',
            'message': 'Allergens found in image!' if found_allergens else 'No allergens detected in image.',
            'allergens': found_allergens,
            'extracted_text': extracted_text
        })
    except Exception as e:
        logger.error(f"Error in scan_ocr: {str(e)}")
        return Response({'error': 'Failed to process image.'}, status=status.HTTP_400_BAD_REQUEST)


# Simple text endpoint
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def check_text(request):
    try:
        data = request.data
        text = data.get('text', '').lower()
        if not text:
            return Response({'error': 'Text field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        found_allergens = [a for a in COMMON_ALLERGENS if a in text]
        logger.info(f"Checked text: {text[:100]}..., found allergens: {found_allergens}")

        return Response({
            'input': text,
            'allergens': found_allergens,
        })
    except Exception as e:
        logger.error(f"Error in check_text: {str(e)}")
        return Response({'error': 'Invalid request data.'}, status=status.HTTP_400_BAD_REQUEST)


# Speech-to-text allergen checker
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def check_speech(request):
    try:
        if 'audio' not in request.FILES:
            return Response({'error': 'Audio file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        audio_file = request.FILES['audio']
        recognizer = sr.Recognizer()

        with sr.AudioFile(audio_file) as source:
            audio = recognizer.record(source)

        try:
            text = recognizer.recognize_google(audio)
        except sr.UnknownValueError:
            return Response({'error': 'Could not understand audio.'}, status=status.HTTP_400_BAD_REQUEST)
        except sr.RequestError as e:
            logger.error(f"Speech recognition error: {str(e)}")
            return Response({'error': 'Speech recognition service unavailable.'},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        found_allergens = [a for a in COMMON_ALLERGENS if a in text.lower()]
        logger.info(f"Speech transcribed: {text}, found allergens: {found_allergens}")

        return Response({
            'status': 'danger' if found_allergens else 'safe',
            'transcribed_text': text,
            'allergens': found_allergens
        })
    except Exception as e:
        logger.error(f"Error in check_speech: {str(e)}")
        return Response({'error': 'Failed to process audio.'}, status=status.HTTP_400_BAD_REQUEST)


# Placeholder for check_medicine
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def check_medicine(request):
    logger.warning("check_medicine endpoint not implemented.")
    return Response({'error': 'Not implemented.'}, status=status.HTTP_501_NOT_IMPLEMENTED)


# Gemini chatbot integration
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def gemini_chat(request):
    try:
        data = request.data
        user_input = data.get('message', '')
        if not user_input:
            return Response({'error': 'Message field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
        if not GEMINI_API_KEY:
            logger.error("Gemini API key not configured.")
            return Response({'error': 'API configuration error.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            params={'key': GEMINI_API_KEY},
            headers={'Content-Type': 'application/json'},
            json={"contents": [{"parts": [{"text": user_input}]}]},
            timeout=10
        )
        response.raise_for_status()

        gemini_data = response.json()
        try:
            reply = gemini_data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError):
            logger.error(f"Invalid Gemini API response: {gemini_data}")
            return Response({'error': 'Invalid response from Gemini API.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        logger.info(f"Gemini chat processed input: {user_input[:50]}..., reply: {reply[:50]}...")
        return Response({'reply': reply})
    except requests.RequestException as e:
        logger.error(f"Gemini API request failed: {str(e)}")
        return Response({'error': 'Failed to connect to Gemini API.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    except Exception as e:
        logger.error(f"Error in gemini_chat: {str(e)}")
        return Response({'error': 'Failed to process request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Journal entries (GET/POST)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def journal_entries(request):
    if request.method == 'GET':
        entries = JournalEntry.objects.filter(user=request.user).order_by('-timestamp')
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['user'] = request.user.id  # Automatically set user
        serializer = JournalEntrySerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Journal entry created by {request.user.username}: {data.get('title')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Journal entry validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """Test endpoint to verify frontend-backend integration"""
    return Response({
        'status': 'success',
        'message': 'Backend is connected and responding',
        'timestamp': timezone.now().isoformat()
    })