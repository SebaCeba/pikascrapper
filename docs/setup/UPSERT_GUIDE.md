# 🔄 Sistema de UPSERT para Actualización de Precios

## 📖 ¿Qué es UPSERT?

**UPSERT = UPDATE + INSERT**

El scraper ahora usa UPSERT para mantener los datos actualizados:
- **Si el vendedor ya tiene la carta** → Actualiza precio, stock y fecha
- **Si es un nuevo vendedor** → Inserta nuevo registro

## 🎯 Comportamiento

### Ejemplo Real

**Día 1 (19 de abril):**
```
Pikachu SV05 #051 | Vendedor: Juan | Precio: $100 | Stock: 5
→ ✅ INSERTA (nuevo vendedor)
```

**Día 2 (20 de abril):**
```
Pikachu SV05 #051 | Vendedor: Juan | Precio: $120 | Stock: 3
→ ♻️ ACTUALIZA (mismo vendedor, precio cambió)

Pikachu SV05 #051 | Vendedor: Pedro | Precio: $95 | Stock: 10
→ ✅ INSERTA (nuevo vendedor)
```

**Día 3 (21 de abril):**
```
Pikachu SV05 #051 | Vendedor: Juan | Precio: $120 | Stock: 3
→ ♻️ ACTUALIZA (mismo precio, actualiza fecha)

Pikachu SV05 #051 | Vendedor: Pedro | Precio: $90 | Stock: 8
→ ♻️ ACTUALIZA (precio bajó)
```

## 🔑 Criterios de Unicidad

Un registro es considerado "duplicado" si coinciden:

1. **Carta**: `nombre` + `numero` + `edicion`
2. **Vendedor**: `vendedor`
3. **Variante**: `idioma` + `estado`

**Ejemplo:**
- Pikachu | Juan | Inglés | NM → Registro A
- Pikachu | Juan | Español | NM → Registro B (diferente, idioma distinto)
- Pikachu | Pedro | Inglés | NM → Registro C (diferente, vendedor distinto)

## ⚙️ Configuración Inicial

### Paso 1: Ejecutar SQL en Supabase

1. Ve a: Supabase → SQL Editor
2. Ejecuta: `docs/setup/add_unique_constraint.sql`
3. Esto creará:
   - UNIQUE constraint para identificar duplicados
   - Limpieza de duplicados existentes

### Paso 2: Verificar Constraint

```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'unique_card_vendor_offer';
```

Deberías ver:
```
constraint_name: unique_card_vendor_offer
constraint_definition: UNIQUE (nombre, numero, edicion, vendedor, idioma, estado)
```

## 📊 Ventajas vs Desventajas

### ✅ Ventajas

- **Datos siempre actualizados**: Precios y stock reflejan la última scraping
- **Sin duplicados**: Un solo registro por vendedor/carta/variante
- **Eficiente**: No crece indefinidamente la tabla
- **Fácil consulta**: No necesitas filtrar por fecha más reciente

### ⚠️ Desventajas

- **No hay historial**: No puedes ver cómo cambió el precio en el tiempo
- **Pérdida de datos antiguos**: Si un vendedor deja de vender, su registro se mantiene pero no se actualiza

## 🔄 Alternativa: Historial de Precios

Si quieres **tracking histórico** en vez de UPSERT:

1. **NO ejecutes** `add_unique_constraint.sql`
2. Modifica el scraper para usar `ignore-duplicates` en vez de `merge-duplicates`
3. Cada día se insertará como nuevo registro

**Consulta para ver historial:**
```sql
SELECT 
  fecha_extraccion,
  vendedor,
  precio,
  cantidad
FROM "LISTADO_CARTAS"
WHERE nombre = 'Pikachu' 
  AND numero = '051/162'
  AND vendedor = 'Juan'
ORDER BY fecha_extraccion DESC;
```

## 🧪 Testear UPSERT

### Prueba Manual

```bash
# Ejecuta 2 veces el mismo scraper
node scripts/scraper.js pikachu
# Espera 1 minuto
node scripts/scraper.js pikachu
```

**Resultado esperado:**
- Primera vez: Inserta N registros
- Segunda vez: Actualiza N registros (mismo número)
- Total en DB: N registros (no duplicados)

### Verificar en Supabase

```sql
-- Contar registros de hoy
SELECT COUNT(*) 
FROM "LISTADO_CARTAS" 
WHERE fecha_extraccion = '2026-04-19';

-- Ver registros actualizados
SELECT 
  nombre,
  vendedor,
  precio,
  fecha_extraccion,
  updated_at
FROM "LISTADO_CARTAS"
WHERE DATE(updated_at) = CURRENT_DATE
ORDER BY updated_at DESC
LIMIT 20;
```

## 🚨 Troubleshooting

### Error: "resolution=merge-duplicates failed"

**Causa**: No existe el UNIQUE constraint

**Solución**: Ejecuta `docs/setup/add_unique_constraint.sql`

### Se siguen creando duplicados

**Causa**: El constraint no coincide con los campos del scraper

**Solución**: Verifica que el constraint incluya exactamente:
```sql
UNIQUE (nombre, numero, edicion, vendedor, idioma, estado)
```

### "Constraint already exists"

**Causa**: Ya ejecutaste el SQL anteriormente

**Solución**: Todo está bien, puedes ignorar el error

## 📚 Referencias

- [Supabase UPSERT Docs](https://supabase.com/docs/guides/api/upsert-data)
- [PostgreSQL UNIQUE Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS)
