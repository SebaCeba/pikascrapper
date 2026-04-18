# 🎴 Pikascrapper

> Sistema automatizado de web scraping para TCGmatch.cl que extrae, transforma y almacena datos de cartas Pokémon en Supabase.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-orange)](https://supabase.com/)

---

## 📋 Descripción

Pikascrapper automatiza la recolección de información de cartas TCG desde TCGmatch.cl, transformándola y almacenándola en Supabase para análisis de mercado y seguimiento de precios.

### ✨ Features

- ✅ **Web Scraping** con Puppeteer (headless browser)
- ✅ **Extracción completa** (precio, vendedor, condición, stock, ubicación)
- ✅ **Pipeline automatizado** Scraper → CSV → Supabase
- ✅ **Transformación de datos** automática
- ✅ **API REST** para sincronización con Supabase
- 🔄 **GitHub Actions ready** (agendamiento automático próximamente)

---

## 🚀 Quick Start

### 1️⃣ Clonar repositorio

```bash
git clone https://github.com/SebaCeba/pikascrapper.git
cd pikascrapper
```

### 2️⃣ Instalar dependencias

**Node.js** (scraper):
```bash
npm install
```

**Python** (upload a Supabase):
```bash
pip install -r requirements.txt
```

### 3️⃣ Configurar credenciales

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-legacy-anon-key-aqui
SUPABASE_TABLE=LISTADO_CARTAS
```

> ⚠️ **Importante**: Usa la **Legacy anon key** (Settings → API → Legacy keys, empieza con `eyJ...`)

### 4️⃣ Crear tabla en Supabase

Ejecuta el SQL en Supabase → SQL Editor:

```sql
-- Ver docs/setup/create_supabase_table.sql
```

O sigue la [guía completa de configuración](docs/setup/SUPABASE_SETUP.md).

### 5️⃣ Ejecutar pipeline

```bash
python scripts/pipeline_complete.py pikachu
```

¡Listo! Los datos se extraen y suben automáticamente a Supabase.

---

## 📁 Estructura del Proyecto

```
pikascrapper/
├── 📂 scripts/                # Scripts principales
│   ├── scraper.js             # Web scraper (Puppeteer)
│   ├── pipeline_complete.py   # Pipeline: scrape + upload
│   └── upload_to_supabase_requests.py  # Upload standalone
│
├── 📂 docs/                   # Documentación
│   └── setup/
│       ├── SUPABASE_SETUP.md  # Guía de configuración
│       └── create_supabase_table.sql  # DDL tabla
│
├── 📂 tests/                  # Tests
│   ├── test.js
│   └── test_product.js
│
├── 📂 temp/                   # Archivos temporales
├── 📂 archived/               # Scripts obsoletos
│
├── 📂 .github/
│   ├── workflows/             # GitHub Actions (próximamente)
│   └── instructions/          # Copilot customization
│
├── .env.example               # Template configuración
├── .gitignore
├── package.json               # Dependencias Node.js
├── requirements.txt           # Dependencias Python
├── contexto.md                # Tracking de desarrollo
└── README.md                  # Este archivo
```

---

## 🎯 Uso

### Opción 1: Pipeline Completo ⭐ (Recomendado)

Un solo comando ejecuta todo el flujo:

```bash
python scripts/pipeline_complete.py <keyword>
```

**Ejemplos:**
```bash
python scripts/pipeline_complete.py pikachu
python scripts/pipeline_complete.py charizard
python scripts/pipeline_complete.py "pokemon ex"
```

**Salida esperada:**
```
==================================================
🚀 PIPELINE COMPLETO: SCRAPER → CSV → SUPABASE
==================================================

🔍 PASO 1: Ejecutando scraper...
   Buscando: pikachu
   ✅ CSV generado: 2026-04-18_pikachu_tcgmatch.csv

📖 PASO 2: Leyendo CSV...
📋 Columnas detectadas: Nombre, Edición, Rareza...
   ✅ 128 registros leídos

📤 PASO 3: Subiendo a Supabase...
   ✅ 128 registros insertados

==================================================
✅ PIPELINE COMPLETADO
==================================================
Keyword: pikachu
CSV: 2026-04-18_pikachu_tcgmatch.csv
Registros: 128
Tabla: LISTADO_CARTAS
```

### Opción 2: Ejecución Por Pasos

**Paso 1 - Ejecutar scraper:**
```bash
node scripts/scraper.js pikachu
```

**Paso 2 - Subir CSV:**
```bash
python scripts/upload_to_supabase_requests.py 2026-04-18_pikachu_tcgmatch.csv
```

---

## 📊 Datos Extraídos

Cada registro contiene:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `nombre` | Nombre carta | Pikachu |
| `edicion` | Set/Edición | SV05: Temporal Forces |
| `rareza` | Rareza | Common, Rare, Holo |
| `numero` | Número colección | 051/162 |
| `foto_url` | URL imagen | https://tcgplayer-cdn... |
| `vendedor` | Vendedor | Core TCG |
| `precio` | Precio | $100 CLP |
| `idioma` | Idioma | Inglés, Español |
| `ubicacion` | Ciudad | Santiago |
| `estado` | Condición | Excelente (NM) |
| `cantidad` | Stock | 5 |
| `url_producto` | Link producto | https://tcgmatch.cl/... |
| `fecha_extraccion` | Fecha scraping | 2026-04-18 |
| `imported_at` | Timestamp upload | 2026-04-18T10:00:00Z |
| `search_keyword` | Keyword usado | pikachu |

---

## 🔧 Configuración Avanzada

### Solucionar Error RLS (Row Level Security)

Si obtienes: `new row violates row-level security policy`

**Solución A - Deshabilitar RLS** (testing):
1. Supabase → Table Editor → LISTADO_CARTAS
2. Settings → Deshabilita "Enable Row Level Security"

**Solución B - Crear políticas** (producción):
```sql
ALTER TABLE "LISTADO_CARTAS" ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT público
CREATE POLICY "Enable insert for all users" 
ON "LISTADO_CARTAS" FOR INSERT TO public 
WITH CHECK (true);

-- Permitir SELECT público
CREATE POLICY "Enable read access for all users" 
ON "LISTADO_CARTAS" FOR SELECT TO public 
USING (true);
```

### Cambiar Tabla Destino

Edita `.env`:
```env
SUPABASE_TABLE=MI_TABLA_PERSONALIZADA
```

### Testing Local

```bash
# Test scraper individual
node tests/test.js

# Test extracción de producto
node tests/test_product.js
```

---

## 🛠️ Troubleshooting

### Error: Invalid API key

- ✅ Usa **Legacy anon key** (no Publishable key)
- ✅ La key debe empezar con `eyJ...`
- ✅ Cópiala desde Settings → API → Legacy anon, service_role API keys

### Error: relation does not exist

- ✅ Verifica que la tabla existe en Supabase
- ✅ Nombre exacto en `.env` (mayúsculas/minúsculas importan)

### Error: column does not exist

- ✅ Ejecuta el SQL de [create_supabase_table.sql](docs/setup/create_supabase_table.sql)
- ✅ Verifica que las columnas coincidan

---

## 📚 Documentación

- [📖 Guía Completa Supabase](docs/setup/SUPABASE_SETUP.md) - Setup, troubleshooting, ejemplos
- [🔧 Tutorial API Python](.github/instructions/api-tutorial.instructions.md) - Aprende consumo de APIs
- [💾 Script SQL](docs/setup/create_supabase_table.sql) - DDL completo de la tabla

---

## 🗺️ Roadmap

- [ ] GitHub Actions para scraping automático (diario/semanal)
- [ ] Dashboard web para visualizar precios
- [ ] Alertas de cambios de precio vía email/Discord
- [ ] Detección de duplicados antes de insertar
- [ ] Soporte para más sitios TCG (CardMarket, eBay)
- [ ] API pública para consultar datos

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork del proyecto
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles.

---

## 👤 Autor

**Sebastián Ceballos**

- GitHub: [@SebaCeba](https://github.com/SebaCeba)
- Proyecto: [pikascrapper](https://github.com/SebaCeba/pikascrapper)

---

## 🙏 Agradecimientos

- [TCGmatch.cl](https://tcgmatch.cl) - Fuente de datos
- [Puppeteer](https://pptr.dev/) - Web scraping
- [Supabase](https://supabase.com/) - Base de datos PostgreSQL

---

**¿Problemas?** Abre un [issue](https://github.com/SebaCeba/pikascrapper/issues) 🐛
# Pikascrapper

Proyecto de web scraping para extraer información de cartas Pikachu desde TCGmatch.cl.

## Características

- ✅ Extracción de información completa de productos (nombre, edición, rareza, número, foto)
- ✅ Scraping de ofertas de múltiples vendedores por producto
- ✅ Navegación automática por páginas de resultados
- ✅ Exportación a CSV con timestamp en el nombre del archivo
- ✅ Manejo de vendedores con datos completos: precio, idioma, ubicación, estado, cantidad

## Uso

```bash
# Instalar dependencias
npm install

# Ejecutar el scraper
node scraper.js
```

El script generará un archivo CSV con formato `YYYY-MM-DD_pikachu_tcgmatch.csv` conteniendo todas las ofertas encontradas.

## Estructura de Datos

Cada fila del CSV representa una oferta única de un vendedor:

- **Nombre del Producto**
- **Edición** (ej: SV05: Temporal Forces)
- **Rareza** (ej: Common)
- **Número** (ej: 051/162)
- **Foto** (URL de la imagen de referencia)
- **Vendedor** (nombre del usuario/tienda)
- **Precio** (en CLP)
- **Idioma** (Inglés, Español, etc.)
- **Ubicación** (comuna/ciudad del vendedor)
- **Estado** (Excelente (NM), Buen Estado (LP), etc.)
- **Cantidad** disponible

## Último cambio

**2026-04-18 16:20**: Reorganización profesional del proyecto - estructura de carpetas (scripts/, docs/, tests/, temp/, archived/), README completo, y STRUCTURE.md documentando la arquitectura

## Tecnologías

- Node.js
- Puppeteer (para scraping con navegador headless)
- CSV Writer

## Documentación Adicional

Ver [contexto.md](contexto.md) para el registro completo de avances del proyecto.
