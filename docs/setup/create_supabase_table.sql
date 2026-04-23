-- Script SQL para crear tabla en Supabase
-- Ejecuta esto en el SQL Editor de Supabase
-- Nombre de tabla: LISTADO_CARTAS (debe coincidir con SUPABASE_TABLE en .env / GitHub Secrets)

CREATE TABLE "LISTADO_CARTAS" (
  -- ID auto-incremental (clave primaria)
  id BIGSERIAL PRIMARY KEY,
  
  -- Información de la carta
  nombre TEXT NOT NULL,
  edicion TEXT,
  rareza TEXT,
  numero TEXT,
  foto_url TEXT,
  
  -- Información del vendedor
  vendedor TEXT,
  precio TEXT,
  idioma TEXT,
  ubicacion TEXT,
  estado TEXT,
  cantidad TEXT,
  url_producto TEXT,
  
  -- Metadata de scraping
  fecha_extraccion TEXT,
  imported_at TIMESTAMP DEFAULT NOW(),
  search_keyword TEXT,
  
  -- Timestamps automáticos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- UNIQUE constraint para habilitar UPSERT (prevención de duplicados)
  -- Un registro es único por: carta (nombre+numero+edicion) + vendedor + variante (idioma+estado)
  CONSTRAINT unique_card_vendor_offer UNIQUE (nombre, numero, edicion, vendedor, idioma, estado)
);

-- Trigger para actualizar updated_at automáticamente en cada UPDATE (UPSERT)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listado_cartas_updated_at
  BEFORE UPDATE ON "LISTADO_CARTAS"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_nombre ON "LISTADO_CARTAS"(nombre);
CREATE INDEX idx_precio ON "LISTADO_CARTAS"(precio);
CREATE INDEX idx_vendedor ON "LISTADO_CARTAS"(vendedor);
CREATE INDEX idx_edicion ON "LISTADO_CARTAS"(edicion);
CREATE INDEX idx_search_keyword ON "LISTADO_CARTAS"(search_keyword);
CREATE INDEX idx_fecha_extraccion ON "LISTADO_CARTAS"(fecha_extraccion);

-- Comentarios explicativos
COMMENT ON TABLE "LISTADO_CARTAS" IS 'Tabla para almacenar cartas TCG scraped desde TCGmatch';
COMMENT ON COLUMN "LISTADO_CARTAS".nombre IS 'Nombre de la carta (ej: Pikachu)';
COMMENT ON COLUMN "LISTADO_CARTAS".edicion IS 'Set/Edición de la carta (ej: SV05: Temporal Forces)';
COMMENT ON COLUMN "LISTADO_CARTAS".rareza IS 'Rareza de la carta (Common, Rare, etc.)';
COMMENT ON COLUMN "LISTADO_CARTAS".numero IS 'Número de colección (ej: 051/162)';
COMMENT ON COLUMN "LISTADO_CARTAS".foto_url IS 'URL de la imagen de la carta';
COMMENT ON COLUMN "LISTADO_CARTAS".vendedor IS 'Nombre del vendedor en TCGmatch';
COMMENT ON COLUMN "LISTADO_CARTAS".precio IS 'Precio en formato texto (ej: $100 CLP)';
COMMENT ON COLUMN "LISTADO_CARTAS".idioma IS 'Idioma de la carta (Inglés, Español, etc.)';
COMMENT ON COLUMN "LISTADO_CARTAS".ubicacion IS 'Ubicación del vendedor';
COMMENT ON COLUMN "LISTADO_CARTAS".estado IS 'Estado de la carta (Excelente (NM), etc.)';
COMMENT ON COLUMN "LISTADO_CARTAS".cantidad IS 'Cantidad disponible';
COMMENT ON COLUMN "LISTADO_CARTAS".url_producto IS 'URL del producto en TCGmatch';
COMMENT ON COLUMN "LISTADO_CARTAS".fecha_extraccion IS 'Fecha en que se hizo el scraping';
COMMENT ON COLUMN "LISTADO_CARTAS".imported_at IS 'Timestamp de cuando se subió a Supabase';
COMMENT ON COLUMN "LISTADO_CARTAS".search_keyword IS 'Keyword usado en el scraper (ej: pikachu)';
COMMENT ON COLUMN "LISTADO_CARTAS".updated_at IS 'Se actualiza automáticamente en cada UPSERT';
