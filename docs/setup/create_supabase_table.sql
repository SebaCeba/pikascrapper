-- Script SQL para crear tabla en Supabase
-- Ejecuta esto en el SQL Editor de Supabase
-- ⚠️  Este DDL refleja el esquema real usado en producción.
-- Nombre de tabla: LISTADO_CARTAS (debe coincidir con SUPABASE_TABLE en .env / GitHub Secrets)

CREATE TABLE public."LISTADO_CARTAS" (
  -- Información de la carta
  nombre          TEXT NULL,
  edicion         TEXT NULL,
  rareza          TEXT NULL,
  numero          TEXT NULL,
  foto_url        TEXT NULL,

  -- Información del vendedor
  vendedor        TEXT NULL,
  precio          TEXT NULL,
  idioma          TEXT NULL,
  ubicacion       TEXT NULL,
  estado          TEXT NULL,
  cantidad        BIGINT NULL,
  url_producto    TEXT NULL,

  -- Metadata de scraping
  fecha_extraccion TEXT NULL,
  imported_at     TIMESTAMP WITH TIME ZONE NULL,
  search_keyword  TEXT NULL,

  -- UNIQUE constraint para habilitar UPSERT (prevención de duplicados)
  -- Un registro es único por: carta (nombre+numero+edicion) + vendedor + variante (idioma+estado)
  CONSTRAINT unique_card_vendor_offer UNIQUE (nombre, numero, edicion, vendedor, idioma, estado)
) TABLESPACE pg_default;

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_nombre           ON public."LISTADO_CARTAS" (nombre);
CREATE INDEX idx_precio           ON public."LISTADO_CARTAS" (precio);
CREATE INDEX idx_vendedor         ON public."LISTADO_CARTAS" (vendedor);
CREATE INDEX idx_edicion          ON public."LISTADO_CARTAS" (edicion);
CREATE INDEX idx_search_keyword   ON public."LISTADO_CARTAS" (search_keyword);
CREATE INDEX idx_fecha_extraccion ON public."LISTADO_CARTAS" (fecha_extraccion);

-- Comentarios explicativos
COMMENT ON TABLE  public."LISTADO_CARTAS"                  IS 'Cartas TCG scraped desde TCGmatch — un registro por oferta de vendedor';
COMMENT ON COLUMN public."LISTADO_CARTAS".nombre           IS 'Nombre de la carta (ej: Pikachu)';
COMMENT ON COLUMN public."LISTADO_CARTAS".edicion          IS 'Set/Edición (ej: SV05: Temporal Forces)';
COMMENT ON COLUMN public."LISTADO_CARTAS".rareza           IS 'Rareza (Common, Rare, etc.)';
COMMENT ON COLUMN public."LISTADO_CARTAS".numero           IS 'Número de colección (ej: 051/162)';
COMMENT ON COLUMN public."LISTADO_CARTAS".foto_url         IS 'URL de la imagen de la carta';
COMMENT ON COLUMN public."LISTADO_CARTAS".vendedor         IS 'Nombre del vendedor en TCGmatch';
COMMENT ON COLUMN public."LISTADO_CARTAS".precio           IS 'Precio en CLP (ej: $1.000)';
COMMENT ON COLUMN public."LISTADO_CARTAS".idioma           IS 'Idioma de la carta (Inglés, Español, etc.)';
COMMENT ON COLUMN public."LISTADO_CARTAS".ubicacion        IS 'Ubicación del vendedor';
COMMENT ON COLUMN public."LISTADO_CARTAS".estado           IS 'Estado de la carta (Excelente (NM), etc.)';
COMMENT ON COLUMN public."LISTADO_CARTAS".cantidad         IS 'Unidades disponibles';
COMMENT ON COLUMN public."LISTADO_CARTAS".url_producto     IS 'URL del producto en TCGmatch';
COMMENT ON COLUMN public."LISTADO_CARTAS".fecha_extraccion IS 'Fecha en que se hizo el scraping (YYYY-MM-DD)';
COMMENT ON COLUMN public."LISTADO_CARTAS".imported_at      IS 'Timestamp de cuando se subió a Supabase';
COMMENT ON COLUMN public."LISTADO_CARTAS".search_keyword   IS 'Keyword usado en el scraper (ej: pikachu)';
