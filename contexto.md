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

## Almacenamiento
Los resultados se guardan en archivos CSV con la fecha actual en el nombre de archivo (ej. `2026-04-18_pikachu_tcgmatch.csv`). Cada fila representa una oferta única de un vendedor para una carta específica.

## Futuras Implementaciones
- Integrar información de múltiples sitios (ej. TCGPlayer).
- Crear una página web para visualizar la información unificada de cartas Pikachu.
