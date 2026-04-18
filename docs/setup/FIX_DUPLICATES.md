# 🔧 Solución a Datos Duplicados en Supabase

## 📋 Problema
Cada vez que ejecutas el pipeline, los mismos datos se insertan nuevamente causando duplicados.

---

## ✅ Solución Inmediata: Limpiar Duplicados

### Paso 1: Ejecutar en Supabase SQL Editor

Ve a: https://ghofbhsevrgfglcgblxs.supabase.co/project/default/sql/new

Copia y pega este SQL:

```sql
-- Ver cuántos duplicados tienes
SELECT 
  nombre, 
  vendedor, 
  precio, 
  fecha_extraccion,
  COUNT(*) as duplicados
FROM "LISTADO_CARTAS"
GROUP BY nombre, vendedor, precio, fecha_extraccion
HAVING COUNT(*) > 1
ORDER BY duplicados DESC
LIMIT 20;

-- Eliminar duplicados (mantener solo el más reciente)
DELETE FROM "LISTADO_CARTAS"
WHERE id NOT IN (
  SELECT MAX(id)
  FROM "LISTADO_CARTAS"
  GROUP BY nombre, vendedor, precio, edicion, rareza, numero, fecha_extraccion
);

-- Verificar cuántos quedaron
SELECT COUNT(*) as total_registros FROM "LISTADO_CARTAS";
```

### Paso 2: Crear Constraint para Prevenir Duplicados

**IMPORTANTE**: Ejecuta esto DESPUÉS de limpiar duplicados:

```sql
-- Crear índice único compuesto
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_card_offer 
ON "LISTADO_CARTAS" (
  nombre, 
  vendedor, 
  precio, 
  edicion, 
  fecha_extraccion
);
```

Esto evitará duplicados automáticamente en el futuro.

---

## 🛡️ Prevención Automática (Ya Implementada)

El script `pipeline_complete.py` ya está actualizado para:

✅ Ignorar duplicados automáticamente con:
```python
"Prefer": "resolution=ignore-duplicates"
```

✅ Reportar cuántos duplicados se encontraron:
```
⚠️  X duplicados ignorados
✅ Y registros nuevos insertados
```

---

## 🔄 Alternativas

### Opción A: Vaciar TODA la tabla y empezar de cero

```sql
TRUNCATE TABLE "LISTADO_CARTAS";
```

⚠️ **PELIGRO**: Esto borra TODO. Luego ejecuta el pipeline para rellenar.

### Opción B: Eliminar solo datos de hoy

```sql
DELETE FROM "LISTADO_CARTAS" 
WHERE fecha_extraccion = '2026-04-18';
```

### Opción C: Eliminar solo datos de Pikachu

```sql
DELETE FROM "LISTADO_CARTAS" 
WHERE search_keyword = 'pikachu';
```

---

## 📊 Verificar Estado Actual

```sql
-- Ver resumen de datos por fecha y keyword
SELECT 
  fecha_extraccion,
  search_keyword,
  COUNT(*) as total_registros
FROM "LISTADO_CARTAS"
GROUP BY fecha_extraccion, search_keyword
ORDER BY fecha_extraccion DESC;

-- Ver total general
SELECT COUNT(*) as total FROM "LISTADO_CARTAS";
```

---

## 🚀 Flujo Recomendado

1. **Limpiar duplicados existentes** (Paso 1 arriba)
2. **Crear constraint UNIQUE** (Paso 2 arriba)
3. **Ejecutar pipeline normalmente** - los duplicados se ignorarán automáticamente

---

## ❓ FAQ

**P: ¿Qué pasa si ejecuto el pipeline varias veces después de crear el constraint?**
R: Solo se insertarán registros nuevos. Los duplicados se ignorarán automáticamente.

**P: ¿Esto afecta los datos existentes?**
R: No, solo previene duplicados futuros. Necesitas limpiar los existentes manualmente.

**P: ¿Cuándo se considera un registro "duplicado"?**
R: Cuando tiene el mismo: nombre + vendedor + precio + edición + fecha_extraccion

---

**Última actualización**: 2026-04-18
