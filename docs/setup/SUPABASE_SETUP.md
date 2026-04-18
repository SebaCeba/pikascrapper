# 📤 Subir CSV a Supabase

Guía completa para subir archivos CSV generados por el scraper a Supabase.

---

## 📋 Flujo del Proceso

```
1. Configurar Supabase (crear proyecto + tabla)
   ↓
2. Instalar dependencias Python
   ↓
3. Configurar credenciales (.env)
   ↓
4. Ejecutar script de subida
   ↓
5. Verificar datos en Supabase
```

---

## 🔧 Configuración Inicial

### Paso 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Clic en "New Project"
3. Completa:
   - **Name**: `pikascrapper` (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña
   - **Region**: Elige el más cercano

### Paso 2: Crear Tabla

Ve al **SQL Editor** en Supabase y ejecuta el script completo:

**Opción A**: Copia el contenido de [create_supabase_table.sql](create_supabase_table.sql)

**Opción B**: Ejecuta directamente:

```sql
-- Ver archivo create_supabase_table.sql para el script completo
-- Incluye tabla con todas las columnas del CSV actual + índices
```

**Columnas de la tabla** (basadas en tu CSV actual):
- `nombre` - Nombre de la carta
- `edicion` - Set/Edición
- `rareza` - Rareza (Common, Rare, etc.)
- `numero` - Número de colección
- `foto_url` - URL de imagen
- `vendedor` - Nombre del vendedor
- `precio` - Precio (formato texto)
- `idioma` - Idioma de la carta
- `ubicacion` - Ubicación del vendedor
- `estado` - Condición de la carta
- `cantidad` - Cantidad disponible
- `url_producto` - Link al producto
- `fecha_extraccion` - Fecha del scraping
- `imported_at` - Timestamp de subida
- `search_keyword` - Keyword usado en búsqueda

### Paso 3: Obtener Credenciales

En Supabase, ve a **Settings** → **API**:

- **URL**: Copia "Project URL" → `https://xxxxx.supabase.co`
- **API Key**: Copia "anon public" key

---

## 📦 Instalación de Dependencias

```bash
pip install -r requirements.txt
```

Esto instala:
- `supabase`: Cliente oficial de Supabase
- `python-dotenv`: Para cargar variables de entorno

---

## 🔑 Configuración de Credenciales

### Crear archivo `.env`

Copia el ejemplo y edita con tus valores:

```bash
cp .env.example .env
```

Edita `.env`:

```env
SUPABASE_URL=https://tu-proyecto-real.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_TABLE=tcg_cards
```

⚠️ **IMPORTANTE**: Nunca subas el archivo `.env` a GitHub (ya está en `.gitignore`)

---

## 🚀 Uso

### Versión Básica (para aprender el flujo)

```bash
python upload_to_supabase_basic.py
```

**Qué hace**:
- Lee el CSV hardcodeado en el script
- Se conecta a Supabase
- Sube los datos
- Muestra resultado

### Versión Avanzada (recomendada)

```bash
python upload_to_supabase_advanced.py TEST_2026-04-18_pikachu_tcgmatch.csv
```

**Qué hace**:
- ✅ Lee credenciales desde `.env`
- ✅ Acepta cualquier archivo CSV como argumento
- ✅ Valida configuración antes de ejecutar
- ✅ Agrega timestamp de importación
- ✅ Manejo de errores completo
- ✅ Reporte detallado del proceso

---

## 📊 Explicación de Componentes Clave

### **Autenticación**

```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
```

- **URL**: Endpoint de tu proyecto
- **API Key**: Llave pública (anon) para autenticación
- No necesitas username/password, la key maneja todo

### **Endpoint (Tabla)**

```python
supabase.table("tcg_cards").insert(data).execute()
```

- **Método**: `.table()` selecciona la tabla
- **Acción**: `.insert()` inserta datos
- **Ejecución**: `.execute()` envía la petición

### **Parámetros**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `data` | list[dict] | Lista de registros a insertar |
| Cada dict debe tener las mismas keys que las columnas de la tabla

### **Respuesta**

```python
response = supabase.table("tcg_cards").insert(data).execute()

# response.data contiene los registros insertados
print(f"Insertados: {len(response.data)}")
```

---

## 🔍 Verificar Datos en Supabase

### Opción 1: Table Editor (UI)

1. Ve a Supabase Dashboard
2. Clic en **Table Editor**
3. Selecciona tabla `tcg_cards`
4. Verás todos los registros insertados

### Opción 2: SQL Query

```sql
-- Ver todos los registros
SELECT * FROM tcg_cards;

-- Contar registros
SELECT COUNT(*) FROM tcg_cards;

-- Ver últimas importaciones
SELECT * FROM tcg_cards 
ORDER BY imported_at DESC 
LIMIT 10;
```

---

## 🎯 Resultado Esperado

Al ejecutar el script avanzado, verás:

```
==================================================
📤 SUPABASE CSV UPLOADER
==================================================

✅ Configuración cargada
   URL: https://xxxxx.supabase.co
   Tabla: tcg_cards

📖 Paso 1/3: Leyendo CSV...
📋 Columnas detectadas: title, price, set_name, card_number...
   ✅ 50 registros leídos

🔄 Paso 2/3: Transformando datos...
   ✅ Datos transformados

📤 Paso 3/3: Subiendo a Supabase...
   ✅ 50 registros insertados

==================================================
✅ PROCESO COMPLETADO
==================================================
Archivo: TEST_2026-04-18_pikachu_tcgmatch.csv
Registros procesados: 50
Registros insertados: 50
Tabla: tcg_cards
```

---

## 🔄 Próximos Pasos

### 1. Automatizar el flujo completo

```bash
# Scraper → CSV → Supabase (Pipeline completo)
python scripts/pipeline_complete.py pikachu

# O por pasos separados:
node scripts/scraper.js pikachu
python scripts/upload_to_supabase_requests.py 2026-04-18_pikachu_tcgmatch.csv
```

### 2. Crear API para consultar datos

Supabase genera automáticamente una API REST para tu tabla:

```javascript
// Ejemplo de consulta desde frontend
const { data } = await supabase
  .from('tcg_cards')
  .select('*')
  .eq('condition', 'Mint')
  .order('price', { ascending: true })
```

### 3. Agregar actualización incremental

Modificar script para:
- Detectar duplicados antes de insertar
- Actualizar precios si cambiaron
- Usar `upsert()` en lugar de `insert()`

---

## ❓ Troubleshooting

### Error: "relation does not exist"
- Verifica que la tabla existe en Supabase
- Revisa que el nombre en `.env` coincida exactamente

### Error: "Invalid API key"
- Copia nuevamente la key desde Supabase
- Asegúrate de usar la "anon public" key, NO la "service_role"

### Error: "column does not exist"
- Las columnas del CSV deben coincidir con la tabla
- Modifica la función `transform_data()` para mapear nombres

### Datos no aparecen en Supabase
- Verifica que `.execute()` esté presente
- Chequea la respuesta: `print(response.data)`
- Revisa logs en Supabase Dashboard → Logs

---

## 📚 Recursos Adicionales

- [Documentación Python de Supabase](https://supabase.com/docs/reference/python/introduction)
- [SQL Reference](https://supabase.com/docs/guides/database/overview)
- [API REST auto-generada](https://supabase.com/docs/guides/api)
