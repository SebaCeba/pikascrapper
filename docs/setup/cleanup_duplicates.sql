-- Script para limpiar duplicados y prevenir futuros duplicados en Supabase

-- ============================================================
-- PARTE 1: ELIMINAR DUPLICADOS EXISTENTES
-- ============================================================

-- Ver cuántos duplicados hay
SELECT 
  nombre, 
  vendedor, 
  precio, 
  fecha_extraccion,
  COUNT(*) as duplicados
FROM "LISTADO_CARTAS"
GROUP BY nombre, vendedor, precio, fecha_extraccion
HAVING COUNT(*) > 1
ORDER BY duplicados DESC;

-- Eliminar duplicados manteniendo solo el registro más reciente de cada grupo
DELETE FROM "LISTADO_CARTAS"
WHERE id NOT IN (
  SELECT MAX(id)
  FROM "LISTADO_CARTAS"
  GROUP BY nombre, vendedor, precio, edicion, rareza, numero, fecha_extraccion
);

-- Verificar cuántos registros quedan
SELECT COUNT(*) as total_registros FROM "LISTADO_CARTAS";

-- ============================================================
-- PARTE 2: PREVENIR DUPLICADOS FUTUROS
-- ============================================================

-- Crear índice único compuesto para prevenir duplicados
-- Combinación única: nombre + vendedor + precio + edición + fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_card_offer 
ON "LISTADO_CARTAS" (
  nombre, 
  vendedor, 
  precio, 
  edicion, 
  fecha_extraccion
);

-- ============================================================
-- ALTERNATIVA: Si prefieres reemplazar la tabla completa
-- ============================================================

-- Opción A: Vaciar toda la tabla (PELIGRO: borra todo)
-- TRUNCATE TABLE "LISTADO_CARTAS";

-- Opción B: Eliminar solo registros de hoy
-- DELETE FROM "LISTADO_CARTAS" 
-- WHERE fecha_extraccion = '2026-04-18';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver resumen de datos actuales
SELECT 
  fecha_extraccion,
  search_keyword,
  COUNT(*) as total_registros
FROM "LISTADO_CARTAS"
GROUP BY fecha_extraccion, search_keyword
ORDER BY fecha_extraccion DESC;
