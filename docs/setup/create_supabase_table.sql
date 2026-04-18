-- Script SQL para crear tabla en Supabase
-- Ejecuta esto en el SQL Editor de Supabase

CREATE TABLE tcg_cards (
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
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_nombre ON tcg_cards(nombre);
CREATE INDEX idx_precio ON tcg_cards(precio);
CREATE INDEX idx_vendedor ON tcg_cards(vendedor);
CREATE INDEX idx_edicion ON tcg_cards(edicion);
CREATE INDEX idx_search_keyword ON tcg_cards(search_keyword);
CREATE INDEX idx_fecha_extraccion ON tcg_cards(fecha_extraccion);

-- Comentarios explicativos
COMMENT ON TABLE tcg_cards IS 'Tabla para almacenar cartas TCG scraped desde TCGmatch';
COMMENT ON COLUMN tcg_cards.nombre IS 'Nombre de la carta (ej: Pikachu)';
COMMENT ON COLUMN tcg_cards.edicion IS 'Set/Edición de la carta (ej: SV05: Temporal Forces)';
COMMENT ON COLUMN tcg_cards.rareza IS 'Rareza de la carta (Common, Rare, etc.)';
COMMENT ON COLUMN tcg_cards.numero IS 'Número de colección (ej: 051/162)';
COMMENT ON COLUMN tcg_cards.foto_url IS 'URL de la imagen de la carta';
COMMENT ON COLUMN tcg_cards.vendedor IS 'Nombre del vendedor en TCGmatch';
COMMENT ON COLUMN tcg_cards.precio IS 'Precio en formato texto (ej: $100 CLP)';
COMMENT ON COLUMN tcg_cards.idioma IS 'Idioma de la carta (Inglés, Español, etc.)';
COMMENT ON COLUMN tcg_cards.ubicacion IS 'Ubicación del vendedor';
COMMENT ON COLUMN tcg_cards.estado IS 'Estado de la carta (Excelente (NM), etc.)';
COMMENT ON COLUMN tcg_cards.cantidad IS 'Cantidad disponible';
COMMENT ON COLUMN tcg_cards.url_producto IS 'URL del producto en TCGmatch';
COMMENT ON COLUMN tcg_cards.fecha_extraccion IS 'Fecha en que se hizo el scraping';
COMMENT ON COLUMN tcg_cards.imported_at IS 'Timestamp de cuando se subió a Supabase';
COMMENT ON COLUMN tcg_cards.search_keyword IS 'Keyword usado en el scraper (ej: pikachu)';
