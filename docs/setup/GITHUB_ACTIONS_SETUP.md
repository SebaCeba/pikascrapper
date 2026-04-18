# ⚙️ Configuración de GitHub Actions

Guía para configurar la automatización del scraper con GitHub Actions.

---

## 📋 Requisitos Previos

- Cuenta de GitHub
- Repositorio pikascrapper
- Credenciales de Supabase configuradas

---

## 🔐 Configurar Secrets en GitHub

Los secrets son variables de entorno seguras que GitHub Actions usa para acceder a Supabase sin exponer credenciales en el código.

### Paso 1: Ir a Settings del Repositorio

1. Ve a tu repositorio: `https://github.com/SebaCeba/pikascrapper`
2. Click en **Settings** (⚙️)
3. En el menú lateral, expande **Secrets and variables**
4. Click en **Actions**

### Paso 2: Crear Secrets

Click en **New repository secret** para cada uno:

| Name | Value | Dónde Obtenerlo |
|------|-------|-----------------|
| `SUPABASE_URL` | `https://ghofbhsevrgfglcgblxs.supabase.co` | Supabase → Settings → API → URL |
| `SUPABASE_KEY` | `eyJ...` (tu Legacy anon key) | Supabase → Settings → API → Legacy keys → anon public |
| `SUPABASE_TABLE` | `LISTADO_CARTAS` | Nombre de tu tabla |

> ⚠️ **IMPORTANTE**: Usa la **Legacy anon key** (empieza con `eyJ...`), NO la Publishable key.

### Paso 3: Verificar Secrets Creados

Deberías ver 3 secrets en la lista:
```
✅ SUPABASE_URL
✅ SUPABASE_KEY  
✅ SUPABASE_TABLE
```

---

## ▶️ Ejecutar el Workflow

### Ejecución Automática (Programada)

El workflow se ejecuta **automáticamente todos los días a las 8:00 AM** (hora Chile).

No requiere ninguna acción manual.

### Ejecución Manual (On-Demand)

Para ejecutar manualmente:

1. Ve a **Actions** tab en GitHub
2. Selecciona **Daily TCG Scraper** en el menú lateral
3. Click en **Run workflow** (botón derecho)
4. (Opcional) Cambia el keyword de búsqueda
5. Click en **Run workflow** verde

#### Ejecutar con keyword personalizado:

```
Keyword: charizard    # Busca Charizard en vez de Pikachu
```

---

## 📊 Ver Resultados

### Opción 1: Logs en GitHub Actions

1. Ve a **Actions** tab
2. Click en el workflow run más reciente
3. Expande el step **🕷️ Run scraper and upload to Supabase**
4. Verás el output del scraper

### Opción 2: Descargar CSV

Cada run genera un CSV como artifact:

1. Ve al workflow run
2. Scroll hasta **Artifacts** al final de la página
3. Descarga `scraper-csv-XXXX.zip`

### Opción 3: Ver en Supabase

1. Abre Supabase → Table Editor
2. Selecciona tabla `LISTADO_CARTAS`
3. Filtra por `search_keyword = 'pikachu'` y fecha reciente

---

## 🔔 Notificaciones de Errores

Si el scraper falla, GitHub automáticamente:

1. **Crea un issue** en el repositorio con detalles del error
2. **Envía un email** a tu cuenta de GitHub
3. Labels: `scraper-failure`, `automated`

### Revisar Issues de Fallo

Ve a **Issues** tab → Busca label `scraper-failure`

---

## 🛠️ Troubleshooting

### Error: "Resource not accessible by integration"

**Causa**: GitHub Actions no tiene permisos para crear issues.

**Solución**:
1. Settings → Actions → General
2. Scroll a **Workflow permissions**
3. Selecciona **Read and write permissions**
4. ✅ Check **Allow GitHub Actions to create and approve pull requests**
5. Guardar

### Error: "Invalid API key"

**Causa**: Secret `SUPABASE_KEY` incorrecto.

**Solución**:
1. Verifica que usas **Legacy anon key** (empieza con `eyJ...`)
2. Re-configura el secret si es necesario

### Error: "Table does not exist"

**Causa**: Tabla no creada o nombre incorrecto.

**Solución**:
1. Ejecuta `docs/setup/create_supabase_table.sql` en Supabase
2. Verifica que `SUPABASE_TABLE` sea exactamente `LISTADO_CARTAS`

### Error: "Resource not accessible by integration"

**Causa**: GitHub Actions no tiene permisos de escritura.

**Solución**:
El workflow ya tiene los permisos configurados correctamente:
```yaml
permissions:
  contents: read
  issues: write
```

Si aún tienes este error:
1. Settings → Actions → General
2. Scroll a **Workflow permissions**
3. Selecciona **Read and write permissions**
4. ✅ Check **Allow GitHub Actions to create and approve pull requests**
5. Guardar

### El workflow no se ejecuta automáticamente

**Causa**: GitHub desactiva workflows si no hay commits recientes.

**Solución**:
1. Hacer un commit cualquiera (ej. update README)
2. O ejecutar manualmente 1 vez para reactivar el schedule

---

## ⚙️ Personalización

### Cambiar Frecuencia

Edita `.github/workflows/scraper-daily.yml`:

```yaml
schedule:
  # Diario a las 8:00 AM
  - cron: '0 11 * * *'
  
  # Cambiar a semanal (lunes 8:00 AM):
  - cron: '0 11 * * 1'
  
  # Cambiar a cada 6 horas:
  - cron: '0 */6 * * *'
```

**Referencia cron**: https://crontab.guru/

### Agregar Múltiples Keywords

Edita el step del workflow:

```yaml
run: |
  for KEYWORD in pikachu charizard mewtwo; do
    echo "🔍 Scraping: $KEYWORD"
    python scripts/pipeline_complete.py "$KEYWORD"
  done
```

---

## 📈 Monitoreo

### Ver Historial de Ejecuciones

**Actions** tab → **Daily TCG Scraper** → Ver lista de runs con:
- ✅ Success (verde)
- ❌ Failure (rojo)  
- ⏸️ Cancelled (gris)

### Estadísticas

GitHub muestra:
- Tiempo promedio de ejecución
- Tasa de éxito/fallo
- Frecuencia de ejecución

---

## 🚀 Próximos Pasos

Una vez configurado:

- [ ] Configurar los 3 secrets en GitHub
- [ ] Ejecutar workflow manualmente para probar
- [ ] Verificar que datos lleguen a Supabase
- [ ] Dejar que se ejecute automáticamente diariamente
- [ ] Revisar issues de errores si ocurren

---

**Última actualización**: 2026-04-18
