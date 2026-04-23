-- ============================================================
-- Script para agregar UNIQUE CONSTRAINT a tabla existente
-- Ejecutar en: Supabase → SQL Editor
-- Tabla: LISTADO_CARTAS (ajusta si usas otro nombre en SUPABASE_TABLE)
-- ============================================================

-- PASO 1: Eliminar duplicados existentes (si los hay)
-- Usa ctid (identificador físico de fila) porque la tabla no tiene columna id.
-- Mantiene la primera ocurrencia de cada combinación única.
-- ============================================================

DELETE FROM public."LISTADO_CARTAS" a
USING public."LISTADO_CARTAS" b
WHERE a.ctid > b.ctid
  AND a.nombre    IS NOT DISTINCT FROM b.nombre
  AND a.numero    IS NOT DISTINCT FROM b.numero
  AND a.edicion   IS NOT DISTINCT FROM b.edicion
  AND a.vendedor  IS NOT DISTINCT FROM b.vendedor
  AND a.idioma    IS NOT DISTINCT FROM b.idioma
  AND a.estado    IS NOT DISTINCT FROM b.estado;

-- PASO 2: Agregar constraint UNIQUE
-- Esto previene duplicados futuros basándose en:
-- - Carta (nombre + numero + edicion)
-- - Vendedor específico
-- - Variante (idioma + estado)
-- ============================================================

ALTER TABLE public."LISTADO_CARTAS" 
ADD CONSTRAINT unique_card_vendor_offer 
UNIQUE (nombre, numero, edicion, vendedor, idioma, estado);

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- Ver el constraint creado:
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'unique_card_vendor_offer';

-- Contar registros después de la limpieza:
SELECT COUNT(*) AS total_registros FROM public."LISTADO_CARTAS";

-- ============================================================
-- NOTAS:
-- ============================================================
-- 
-- Con este constraint:
-- ✅ Mismo vendedor + misma carta + mismo idioma/estado = ACTUALIZA (UPSERT)
-- ✅ Nuevo vendedor = INSERTA
-- ✅ Mismo vendedor pero diferente idioma = INSERTA
-- ✅ Precio o stock actualizado = ACTUALIZA registro existente
--
-- El scraper usa "resolution=merge-duplicates" en el header Prefer,
-- que activa ON CONFLICT DO UPDATE en Supabase.
-- ============================================================
