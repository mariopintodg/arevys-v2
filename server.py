from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, quote, urlencode, urlparse
from urllib.request import Request, urlopen
import hashlib
import json
import mimetypes
import os
import re
import time


ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
MEDIA_EXTENSIONS = {'.mp4', '.webm', '.mov', '.m4v', '.gif'}
CHUNK_SIZE = 1024 * 256


def find_library_root():
    configured = os.environ.get('AREVYS_EXERCISE_LIBRARY', '').strip()
    candidates = [Path(configured)] if configured else []
    candidates.extend(sorted(PROJECT_ROOT.glob('exercise (whitout watermark)*')))

    for candidate in candidates:
        candidate = candidate.expanduser().resolve()
        if not candidate.is_dir():
            continue
        avatar_folders = [
            folder for folder in candidate.rglob('*')
            if folder.is_dir() and folder.name.casefold() in {'girl', 'men'}
        ]
        if avatar_folders:
            return candidate
    return None


LIBRARY_ROOT = find_library_root()
CATALOG_CACHE = {'created': 0.0, 'payload': None}


def exercise_catalog(force=False):
    if not force and CATALOG_CACHE['payload'] and time.monotonic() - CATALOG_CACHE['created'] < 15:
        return CATALOG_CACHE['payload']
    if not LIBRARY_ROOT:
        payload = {
            'connected': False,
            'count': 0,
            'source': None,
            'exercises': [],
            'message': 'No se encontró una biblioteca local compatible.'
        }
        CATALOG_CACHE.update(created=time.monotonic(), payload=payload)
        return payload

    exercises = []
    for media in LIBRARY_ROOT.rglob('*'):
        if not media.is_file() or media.suffix.casefold() not in MEDIA_EXTENSIONS:
            continue
        relative = media.relative_to(LIBRARY_ROOT).as_posix()
        if '__MACOSX' in relative or any(part.startswith('.') for part in Path(relative).parts):
            continue

        parts = relative.split('/')
        avatar_index = next(
            (index for index, part in enumerate(parts) if part.casefold() in {'girl', 'men'}),
            None
        )
        if avatar_index is None or avatar_index + 1 >= len(parts):
            continue

        avatar = parts[avatar_index].casefold()
        group = parts[avatar_index + 1]
        clean_name = re.sub(r'[_\s]+', ' ', media.stem).strip()
        stable_id = hashlib.sha1(relative.casefold().encode('utf-8')).hexdigest()[:16]
        exercises.append({
            'id': f'local_{stable_id}',
            'name': clean_name,
            'group': group,
            'avatar': avatar,
            'extension': media.suffix.casefold(),
            'bytes': media.stat().st_size,
            'mediaUrl': f'/api/exercise-media?path={quote(relative, safe="")}',
            'relativePath': relative
        })

    exercises.sort(key=lambda item: (item['avatar'], item['group'].casefold(), item['name'].casefold()))
    payload = {
        'connected': True,
        'count': len(exercises),
        'source': LIBRARY_ROOT.name,
        'exercises': exercises
    }
    CATALOG_CACHE.update(created=time.monotonic(), payload=payload)
    return payload


def safe_media_path(raw_path):
    if not LIBRARY_ROOT or not raw_path:
        return None
    candidate = (LIBRARY_ROOT / raw_path).resolve()
    try:
        candidate.relative_to(LIBRARY_ROOT.resolve())
    except ValueError:
        return None
    if not candidate.is_file() or candidate.suffix.casefold() not in MEDIA_EXTENSIONS:
        return None
    return candidate


NUTRITION_TIMEOUT = 8


def external_json(url):
    request = Request(url, headers={'User-Agent': 'AREVYS/2.0 nutrition module'})
    with urlopen(request, timeout=NUTRITION_TIMEOUT) as response:
        return json.loads(response.read().decode('utf-8'))


def number(value):
    try:
        return round(float(value or 0))
    except (TypeError, ValueError):
        return 0


def nutrition_food_search(query):
    query = query.strip()
    if not query:
        return []

    results = []
    off_params = urlencode({
        'search_terms': query,
        'search_simple': '1',
        'action': 'process',
        'page_size': '6',
        'fields': 'code,product_name,brands,nutriments,image_front_small_url'
    })
    try:
        payload = external_json(f'https://world.openfoodfacts.org/cgi/search.pl?{off_params}')
        for product in payload.get('products', []):
            name = (product.get('product_name') or '').strip()
            if not name:
                continue
            nutrients = product.get('nutriments') or {}
            results.append({
                'id': f"off_{product.get('code') or hashlib.sha1(name.encode('utf-8')).hexdigest()[:10]}",
                'name': name,
                'brand': product.get('brands') or 'Open Food Facts',
                'calories': number(nutrients.get('energy-kcal_100g') or nutrients.get('energy-kcal')),
                'protein': number(nutrients.get('proteins_100g') or nutrients.get('proteins')),
                'carbs': number(nutrients.get('carbohydrates_100g') or nutrients.get('carbohydrates')),
                'fats': number(nutrients.get('fat_100g') or nutrients.get('fat')),
                'fiber': number(nutrients.get('fiber_100g') or nutrients.get('fiber')),
                'image': product.get('image_front_small_url') or '',
                'source': 'Open Food Facts'
            })
    except Exception:
        pass

    usda_key = os.environ.get('AREVYS_USDA_API_KEY', 'DEMO_KEY')
    usda_params = urlencode({'api_key': usda_key, 'query': query, 'pageSize': '6', 'dataType': 'Foundation,SR Legacy'})
    try:
        payload = external_json(f'https://api.nal.usda.gov/fdc/v1/foods/search?{usda_params}')
        nutrient_ids = {1008: 'calories', 1003: 'protein', 1005: 'carbs', 1004: 'fats', 1079: 'fiber'}
        for product in payload.get('foods', []):
            nutrients = {item.get('nutrientId'): item.get('value') for item in product.get('foodNutrients', [])}
            name = (product.get('description') or '').strip()
            if not name:
                continue
            results.append({
                'id': f"usda_{product.get('fdcId')}",
                'name': name.title(),
                'brand': 'USDA FoodData Central',
                'calories': number(nutrients.get(1008)),
                'protein': number(nutrients.get(1003)),
                'carbs': number(nutrients.get(1005)),
                'fats': number(nutrients.get(1004)),
                'fiber': number(nutrients.get(1079)),
                'image': '',
                'source': 'USDA FoodData Central'
            })
    except Exception:
        pass

    unique = []
    seen = set()
    for result in results:
        key = result['name'].casefold()
        if key in seen:
            continue
        seen.add(key)
        unique.append(result)
    return unique[:12]


def nutrition_recipe_search(query='chicken'):
    query = query.strip() or 'chicken'
    try:
        payload = external_json(f"https://www.themealdb.com/api/json/v1/1/search.php?{urlencode({'s': query})}")
    except Exception:
        return []

    recipes = []
    for meal in payload.get('meals') or []:
        ingredients = [meal.get(f'strIngredient{index}') for index in range(1, 21)]
        ingredients = [item.strip() for item in ingredients if item and item.strip()]
        instructions = ' '.join((meal.get('strInstructions') or '').split())
        recipes.append({
            'id': f"meal_{meal.get('idMeal')}",
            'name': meal.get('strMeal') or 'Receta AREVYS',
            'category': meal.get('strCategory') or 'Receta',
            'calories': 520,
            'protein': 32,
            'carbs': 58,
            'fats': 18,
            'time': '25 min',
            'difficulty': 'Fácil',
            'tags': ['Receta', 'TheMealDB'],
            'description': instructions[:170] or 'Una receta para inspirar tu próxima comida.',
            'ingredients': ingredients[:8],
            'image': meal.get('strMealThumb') or '',
            'source': 'themealdb'
        })
    return recipes[:8]


class ArevysHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def send_media(self, media_path):
        size = media_path.stat().st_size
        mime = mimetypes.guess_type(media_path.name)[0] or 'application/octet-stream'
        start, end = 0, size - 1
        range_header = self.headers.get('Range', '')
        partial = False

        if range_header.startswith('bytes='):
            match = re.match(r'bytes=(\d*)-(\d*)', range_header)
            if match:
                first, last = match.groups()
                if first:
                    start = min(int(first), size - 1)
                    end = min(int(last), size - 1) if last else size - 1
                elif last:
                    length = min(int(last), size)
                    start, end = size - length, size - 1
                partial = start <= end

        length = end - start + 1
        self.send_response(206 if partial else 200)
        self.send_header('Content-Type', mime)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(length))
        self.send_header('Cache-Control', 'private, max-age=3600')
        if partial:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()

        if self.command == 'HEAD':
            return
        with media_path.open('rb') as source:
            source.seek(start)
            remaining = length
            while remaining > 0:
                chunk = source.read(min(CHUNK_SIZE, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)

    def route_api(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/exercise-library':
            refresh = parse_qs(parsed.query).get('refresh', ['0'])[0] == '1'
            self.send_json(exercise_catalog(force=refresh))
            return True
        if parsed.path == '/api/nutrition/search':
            query = parse_qs(parsed.query).get('query', [''])[0]
            results = nutrition_food_search(query)
            self.send_json({'query': query, 'results': results, 'count': len(results), 'sources': ['Open Food Facts', 'USDA FoodData Central', 'AREVYS local fallback']})
            return True
        if parsed.path == '/api/nutrition/recipes':
            query = parse_qs(parsed.query).get('query', ['chicken'])[0]
            recipes = nutrition_recipe_search(query)
            self.send_json({'query': query, 'recipes': recipes, 'count': len(recipes), 'source': 'TheMealDB + AREVYS recipe engine'})
            return True
        if parsed.path == '/api/exercise-media':
            raw_path = parse_qs(parsed.query).get('path', [''])[0]
            media_path = safe_media_path(raw_path)
            if not media_path:
                self.send_error(404, 'Exercise media not found')
            else:
                self.send_media(media_path)
            return True
        return False

    def do_GET(self):
        if not self.route_api():
            super().do_GET()

    def do_HEAD(self):
        if not self.route_api():
            super().do_HEAD()


if __name__ == '__main__':
    os.chdir(ROOT)
    status = f'{len(exercise_catalog()["exercises"])} ejercicios conectados' if LIBRARY_ROOT else 'biblioteca no encontrada'
    port = int(os.environ.get('PORT', '8081'))
    print(f'AREVYS V2 disponible en el puerto {port} · {status}')
    ThreadingHTTPServer(('0.0.0.0', port), ArevysHandler).serve_forever()
