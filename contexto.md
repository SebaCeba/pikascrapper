# Proyecto: Scrapper de Cartas Pikachu

## Objetivo
Realizar scraping de la web [TCGmatch.cl](https://tcgmatch.cl/) para obtener una lista de productos de cartas "Pikachu". El script accede a cada producto individual para extraer detalles exhaustivos tanto de la carta como de las ofertas disponibles.

### Estructura de Datos Extraídos
**Información General del Producto:**
- Nombre del Producto
- Edición (ej: SV05: Temporal Forces)
- Rareza (ej: Common)
- Número (ej: 051/162)
- Foto de referencia (URL de la imagen)

**Información Específica por Vendedor:**
- Vendedor (nombre del usuario/tienda)
- Precio (en CLP)
- Idioma (Inglés, Español, etc.)
- Ubicación (comuna/ciudad del vendedor)
- Estado (Excelente (NM), Buen Estado (LP), etc.)
- Cantidad disponible

## Registro de Avances
- **2026-04-18**: Inicialización del proyecto. Se define el sitio objetivo como TCGmatch.cl.
- **2026-04-18**: Se inicia la investigación de la estructura del sitio para el scraping. Node.js y package.json inicializados.
- **2026-04-18**: Se refina el plan para navegar individualmente a cada página de producto.
- **2026-04-18**: Se descubre que la URL directa `/search?q=pikachu` da 404. Se usa en su lugar `/cartas/busqueda/q=Pikachu&page=N`.
- **2026-04-18**: Se identifican los selectores CSS exactos analizando el HTML renderizado:
  - Nombre: `p.text-2xl.font-semibold`
  - Edición: `span.font-medium` con texto "Edición:" → el `<a>` sibling
  - Rareza: `span.font-medium` con texto "Rareza:" → texto sibling
  - Número: `span.font-medium` con texto "Número:" → texto sibling
  - Vendedores: `div.overflow-hidden.bg-white.shadow-sm` (cada bloque)
- **2026-04-18**: Test exitoso con 3 productos: Nombre ✅, Foto ✅, Edición ✅, Rareza ✅, Número ✅, Vendedores ✅ (33, 34, 27 vendedores respectivamente). 94 filas de CSV generadas correctamente.
- **2026-04-18**: Se genera el script final `scraper.js` listo para scraping completo.
- **2026-04-18 14:30**: Se crea instrucción para actualización automática de documentación (contexto.md + README.md) y se inicializa README.md del proyecto.
- **2026-04-18 15:45**: Se implementa integración completa con Supabase - pipeline de scraper → CSV → PostgreSQL funcionando con 128 registros de prueba.
- **2026-04-18 16:20**: Reorganización profesional del proyecto - estructura de carpetas (scripts/, docs/, tests/, temp/, archived/), README completo, y STRUCTURE.md documentando la arquitectura.
- **2026-04-18 16:45**: GitHub Actions implementado - workflow diario automático configurado (8:00 AM), documentación completa en docs/setup/GITHUB_ACTIONS_SETUP.md.
- **2026-04-18 17:00**: Corrección de rutas en pipeline_complete.py y scraper.js para soportar estructura reorganizada (scripts/) y keyword dinámico.
- **2026-04-18 17:15**: Corrección completa de rutas - agregar cwd=BASE_DIR en subprocess, cargar .env explícitamente, actualizar package.json y documentación.
- **2026-04-18 17:30**: Corrección de manejo de valores vacíos en CSV - convertir strings vacíos a null antes de insertar en Supabase, evitando error HTTP 400 bigint.
- **2026-04-18 17:45**: Implementación sistema anti-duplicados - header "resolution=ignore-duplicates" en pipeline, script SQL de limpieza, documentación completa en FIX_DUPLICATES.md.
- **2026-04-18 18:00**: Corrección permisos GitHub Actions - agregar permissions: issues: write para permitir creación automática de issues en caso de fallo.
- **2026-04-18 18:10**: Mejora debugging pipeline - mostrar stdout del scraper, mejor manejo de encoding, mensajes de error más descriptivos.
- **2026-04-18 18:30**: Instalación de Chrome para Puppeteer - agregado paso en GitHub Actions workflow y documentación, pipeline completo funcional local y en CI.
- **2026-04-19 10:00**: Implementación modo Supabase directo en scraper.js - scraper ahora detecta variables de entorno y sube directo a Supabase sin CSV intermedio, resolviendo problemas de GitHub Actions y optimizando pipeline.
- **2026-04-19 10:15**: Actualización GitHub Actions workflow - simplificado para ejecutar scraper.js directo sin Python, eliminando dependencia de pipeline_complete.py y artifacts CSV innecesarios.
- **2026-04-19 10:30**: Push a GitHub con implementación completa - workflow optimizado, scraper con modo dual (Supabase/CSV), pipeline_complete.py actualizado como wrapper, listo para ejecución automática en GitHub Actions.

## Almacenamiento
Los resultados se guardan en archivos CSV con la fecha actual en el nombre de archivo (ej. `2026-04-18_pikachu_tcgmatch.csv`). Cada fila representa una oferta única de un vendedor para una carta específica.

## Futuras Implementaciones
- Integrar información de múltiples sitios (ej. TCGPlayer).
- Crear una página web para visualizar la información unificada de cartas Pikachu.
