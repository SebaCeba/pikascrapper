-- ============================================================
-- Script para agregar UNIQUE CONSTRAINT a tabla existente
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- PASO 1: Eliminar duplicados existentes (si los hay)
-- Mantiene solo el registro más reciente de cada combinación
-- ============================================================

WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY nombre, numero, edicion, vendedor, idioma, estado 
      ORDER BY fecha_extraccion DESC, created_at DESC
    ) as rn
  FROM "LISTADO_CARTAS"
)
DELETE FROM "LISTADO_CARTAS"
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- PASO 2: Agregar constraint UNIQUE
-- Esto previene duplicados futuros basándose en:
-- - Carta (nombre + numero + edicion)
-- - Vendedor específico
-- - Variante (idioma + estado)
-- ============================================================

ALTER TABLE "LISTADO_CARTAS" 
ADD CONSTRAINT unique_card_vendor_offer 
UNIQUE (nombre, numero, edicion, vendedor, idioma, estado);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver el constraint creado:
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'unique_card_vendor_offer';

-- Contar registros antes y después:
SELECT COUNT(*) as total_registros FROM "LISTADO_CARTAS";

-- ============================================================
-- NOTAS:
-- ============================================================
-- 
-- Con este constraint:
-- ✅ Mismo vendedor + misma carta + mismo idioma/estado = ACTUALIZA
-- ✅ Nuevo vendedor = INSERTA
-- ✅ Mismo vendedor pero diferente idioma = INSERTA
-- ✅ Precio actualizado = ACTUALIZA registro existente
--
-- El scraper ahora hará UPSERT automáticamente
-- ============================================================
