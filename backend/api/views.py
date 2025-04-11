from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# Sample list of common allergens
COMMON_ALLERGENS = ['peanut', 'milk', 'egg', 'soy', 'wheat', 'fish', 'shellfish', 'tree nut']


@csrf_exempt
def check_allergies(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ingredients = data.get('ingredients', '').lower()

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
