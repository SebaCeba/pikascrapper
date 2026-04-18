-- =============================================
-- PikaTracker - Esquema SQLite
-- =============================================

-- Catálogo de cartas únicas
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    edicion TEXT DEFAULT '',
    rareza TEXT DEFAULT '',
    numero TEXT DEFAULT '',
    foto_url TEXT DEFAULT '',
    url_producto TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'tcgmatch',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ofertas de vendedores (snapshot por fecha de extracción)
CREATE TABLE IF NOT EXISTS card_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    vendedor TEXT NOT NULL,
    precio INTEGER DEFAULT 0,
    idioma TEXT DEFAULT '',
    ubicacion TEXT DEFAULT '',
    estado TEXT DEFAULT '',
    cantidad INTEGER DEFAULT 0,
    fecha_extraccion DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Historial diario de precios por carta
CREATE TABLE IF NOT EXISTS card_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    precio_min INTEGER DEFAULT 0,
    precio_max INTEGER DEFAULT 0,
    precio_promedio INTEGER DEFAULT 0,
    total_stock INTEGER DEFAULT 0,
    total_vendedores INTEGER DEFAULT 0,
    fecha DATE NOT NULL,
    UNIQUE(card_id, fecha)
);

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Wishlist del usuario
CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    card_id INTEGER NOT NULL REFERENCES cards(id),
    target_price INTEGER DEFAULT 0,
    notify_stock INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, card_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_card_offers_card_id ON card_offers(card_id);
CREATE INDEX IF NOT EXISTS idx_card_offers_fecha ON card_offers(fecha_extraccion);
CREATE INDEX IF NOT EXISTS idx_card_price_history_card ON card_price_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_price_history_fecha ON card_price_history(fecha);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_nombre ON cards(nombre);
