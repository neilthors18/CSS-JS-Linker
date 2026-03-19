# CSS/JS Linker

Una extensión de VS Code que conecta clases e IDs en HTML con sus definiciones en CSS y referencias en JavaScript.

## Características

- **Hover (Ctrl + Hover):** Muestra cuántas ocurrencias de una clase o ID existen en los archivos CSS y JS enlazados desde el archivo HTML activo.
- **Go to Definition (Ctrl + Clic):** Navega directamente a la primera ocurrencia del selector en los archivos CSS o JS referenciados.
- **Soporte para Django:** Resuelve rutas `{% static '...' %}` buscando el archivo en los directorios `static/`, `staticfiles/`, y `assets/` del workspace.

## Lenguajes soportados

- `html`
- `django-html`
- `php`
- `jinja` / `jinja2`

## Cómo funciona

1. **Extracción de archivos enlazados:** Al activar el hover o la definición, el documento HTML activo se analiza con RegEx para encontrar las rutas en `<link rel="stylesheet">` y `<script src="">`.
2. **Resolución de rutas:**
   - Rutas relativas (`./css/main.css`) → relativas al directorio del documento.
   - Rutas absolutas desde raíz (`/static/main.css`) → relativas a la raíz del workspace.
   - Rutas Django (`{% static 'css/main.css' %}`) → búsqueda recursiva en `static/`, `staticfiles/`, `assets/`.
3. **Búsqueda de tokens:** Se aplican patrones RegEx para detectar `.className` / `#id` en CSS, y `getElementById`, `querySelector`, `classList.*` en JS.
4. **Resultado:**
   - Hover: muestra el total de ocurrencias por tipo de archivo.
   - Definition: retorna `vscode.Location[]` con la primera ocurrencia en cada archivo.
