# 📁 Estructura del Proyecto Pikascrapper

Documentación de la organización de archivos y carpetas.

---

## 🗂️ Estructura Completa

```
pikascrapper/
│
├── 📂 scripts/                          # Scripts principales de ejecución
│   ├── scraper.js                       # 🕷️ Web scraper con Puppeteer
│   ├── pipeline_complete.py             # 🔄 Pipeline completo automatizado
│   └── upload_to_supabase_requests.py   # ⬆️ Subir CSV a Supabase (standalone)
│
├── 📂 docs/                             # Documentación del proyecto
│   └── setup/
│       ├── SUPABASE_SETUP.md            # 📖 Guía completa de Supabase
│       ├── GITHUB_ACTIONS_SETUP.md      # ⚙️ Guía de automatización
│       └── create_supabase_table.sql    # 💾 Script DDL de tabla
│
├── 📂 tests/                            # Scripts de prueba y validación
│   ├── test.js                          # Test general del scraper
│   └── test_product.js                  # Test extracción de producto individual
│
├── 📂 temp/                             # Archivos temporales (git ignored)
│   ├── product_page.html                # HTML guardado para debugging
│   ├── search_page.html                 # HTML de página de búsqueda
│   └── *.png                            # Screenshots de debugging
│
├── 📂 archived/                         # Scripts obsoletos/antiguos
│   ├── upload_to_supabase_basic.py      # Primera versión básica
│   ├── upload_to_supabase_advanced.py   # Versión con librería supabase
│   └── README_old.md                    # README anterior
│
├── 📂 .github/                          # Configuración GitHub
│   ├── workflows/
│   │   └── scraper-daily.yml            # ⏰ GitHub Action diario (8:00 AM)
│   └── instructions/
│       ├── api-tutorial.instructions.md # Instrucciones para Copilot
│       └── auto-update-docs.instructions.md
│
├── 📂 db/                               # Base de datos local (opcional)
│   └── ...
│
├── 📂 frontend/                         # Frontend futuro (opcional)
│   └── ...
│
├── 📄 .env.example                      # Template de variables entorno
├── 📄 .env                              # Credenciales (git ignored)
├── 📄 .gitignore                        # Archivos ignorados por git
│
├── 📄 package.json                      # Dependencias Node.js
├── 📄 package-lock.json                 # Lock file Node.js
├── 📄 requirements.txt                  # Dependencias Python
│
├── 📄 supabase_table_template.csv       # Template CSV de ejemplo
├── 📄 contexto.md                       # Tracking desarrollo
├── 📄 README.md                         # Documentación principal
└── 📄 STRUCTURE.md                      # Este archivo
```

---

## 🎯 Propósito de Cada Carpeta

### `/scripts/` - Scripts Ejecutables

Contiene los scripts principales del proyecto:

- **`scraper.js`**: Web scraper que extrae datos de TCGmatch.cl usando Puppeteer
- **`pipeline_complete.py`**: Orquesta todo el flujo (scraper → CSV → Supabase)
- **`upload_to_supabase_requests.py`**: Sube CSV existente a Supabase usando requests

### `/docs/` - Documentación

Documentación técnica y guías de setup:

- **`setup/SUPABASE_SETUP.md`**: Guía paso a paso para configurar Supabase
- **`setup/create_supabase_table.sql`**: DDL completo de la tabla con índices

### `/tests/` - Testing

Scripts para validar funcionalidad:

- **`test.js`**: Prueba básica del scraper
- **`test_product.js`**: Test de extracción de un producto específico

### `/temp/` - Temporales

Archivos generados durante debugging (git ignored):

- HTMLs guardados de páginas
- Screenshots de navegador
- CSVs temporales

### `/archived/` - Histórico

Scripts antiguos que ya no se usan pero se mantienen por referencia:

- Versiones anteriores de uploaders
- Documentación obsoleta

### `/.github/` - Configuración GitHub

- **`workflows/`**: GitHub Actions (próximamente para scraping automático)
- **`instructions/`**: Archivos de customización de GitHub Copilot

---

## 🔑 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `.env` | Credenciales Supabase (NO committed) |
| `.env.example` | Template de configuración |
| `package.json` | Dependencias Node.js (Puppeteer) |
| `requirements.txt` | Dependencias Python (requests) |
| `contexto.md` | Registro de cambios y decisiones |
| `README.md` | Documentación principal |

---

## 🚀 Flujo de Ejecución

```
1. Usuario ejecuta: python scripts/pipeline_complete.py pikachu
           ↓
2. pipeline_complete.py → Ejecuta scraper.js
           ↓
3. scraper.js → Extrae datos de TCGmatch.cl
           ↓
4. Genera CSV en raíz: 2026-04-18_pikachu_tcgmatch.csv
           ↓
5. pipeline_complete.py → Lee CSV
           ↓
6. Transforma columnas (Nombre → nombre, etc.)
           ↓
7. POST a Supabase REST API
           ↓
8. Datos insertados en tabla LISTADO_CARTAS ✅
```

---

## 📝 Convenciones

### Nombrado de Archivos

- **Scripts Python**: `snake_case.py`
- **Scripts Node.js**: `camelCase.js` o `kebab-case.js`
- **Documentación**: `UPPERCASE.md` para docs importantes
- **CSV outputs**: `YYYY-MM-DD_keyword_source.csv`

### Organización

- Scripts ejecutables → `/scripts/`
- Tests/debugging → `/tests/`
- Docs/guías → `/docs/`
- Archivos temporales → `/temp/` (ignored)
- Código obsoleto → `/archived/` (ignored)

---

## 🔄 Próximas Adiciones

Carpetas/archivos que se agregarán:

```
.github/workflows/
└── scrape-weekly.yml         # GitHub Action semanal (alternativa)

scripts/
├── alert_price_changes.py    # Detectar cambios de precio
└── generate_report.py        # Generar reportes de mercado

frontend/                     # Dashboard web (futuro)
├── public/
├── src/
└── package.json
```

---

**Última actualización**: 2026-04-18
