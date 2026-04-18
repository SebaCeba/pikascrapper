/**
 * server.js
 * API REST para PikaTracker. Sirve también los archivos estáticos del frontend.
 * 
 * Uso: node server.js
 * Puerto: 3000 (configurable con PORT env var)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────
// Servir el frontend estático de Lovable
// Coloca los archivos del frontend en la carpeta ./frontend/
// ─────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, 'frontend');
app.use(express.static(FRONTEND_DIR));

// ─────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────

// GET /api/cards
// Listado de cartas con filtros, búsqueda y paginación
app.get('/api/cards', (req, res) => {
    const {
        q,           // búsqueda por nombre
        edicion,     // filtrar por edición
        rareza,      // filtrar por rareza
        precio_min,  // precio mínimo
        precio_max,  // precio máximo
        con_stock,   // 'true' = solo con stock
        page = 1,
        limit = 24,
    } = req.query;

    const today = new Date().toISOString().slice(0, 10);
    let where = [];
    let params = [];

    if (q) { where.push('c.nombre LIKE ?'); params.push(`%${q}%`); }
    if (edicion) { where.push('c.edicion = ?'); params.push(edicion); }
    if (rareza) { where.push('c.rareza = ?'); params.push(rareza); }
    if (con_stock === 'true') { where.push('COALESCE(ph.total_vendedores, 0) > 0'); }
    if (precio_min) { where.push('ph.precio_min >= ?'); params.push(parseInt(precio_min)); }
    if (precio_max) { where.push('ph.precio_min <= ?'); params.push(parseInt(precio_max)); }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cards = db.prepare(`
        SELECT 
            c.id, c.nombre, c.edicion, c.rareza, c.numero, c.foto_url, c.url_producto,
            COALESCE(ph.precio_min, 0) as precio_min,
            COALESCE(ph.precio_max, 0) as precio_max,
            COALESCE(ph.total_vendedores, 0) as total_vendedores,
            COALESCE(ph.total_stock, 0) as total_stock
        FROM cards c
        LEFT JOIN card_price_history ph ON ph.card_id = c.id 
            AND ph.fecha = (SELECT MAX(fecha) FROM card_price_history WHERE card_id = c.id)
        ${whereClause}
        ORDER BY ph.total_vendedores DESC, c.nombre ASC
        LIMIT ? OFFSET ?
    `).all([...params, parseInt(limit), offset]);

    const total = db.prepare(`
        SELECT COUNT(*) as n FROM cards c
        LEFT JOIN card_price_history ph ON ph.card_id = c.id 
            AND ph.fecha = (SELECT MAX(fecha) FROM card_price_history WHERE card_id = c.id)
        ${whereClause}
    `).get([...params]).n;

    res.json({
        cards,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
    });
});

// GET /api/cards/:id
// Detalle de una carta con lista de vendedores
app.get('/api/cards/:id', (req, res) => {
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) return res.status(404).json({ error: 'Carta no encontrada' });

    const latestDate = db.prepare(
        'SELECT MAX(fecha_extraccion) as fecha FROM card_offers WHERE card_id = ?'
    ).get(req.params.id)?.fecha;

    const offers = db.prepare(`
        SELECT vendedor, precio, idioma, ubicacion, estado, cantidad
        FROM card_offers
        WHERE card_id = ? AND fecha_extraccion = ?
        ORDER BY precio ASC
    `).all(req.params.id, latestDate);

    res.json({ ...card, offers });
});

// GET /api/cards/:id/history
// Historial de precios de una carta
app.get('/api/cards/:id/history', (req, res) => {
    const history = db.prepare(`
        SELECT fecha, precio_min, precio_max, precio_promedio, total_stock, total_vendedores
        FROM card_price_history
        WHERE card_id = ?
        ORDER BY fecha ASC
    `).all(req.params.id);
    res.json(history);
});

// GET /api/dashboard/restock
// Cartas que no tenían stock y ahora sí tienen
app.get('/api/dashboard/restock', (req, res) => {
    const dates = db.prepare(
        'SELECT DISTINCT fecha FROM card_price_history ORDER BY fecha DESC LIMIT 2'
    ).all();

    if (dates.length < 2) return res.json([]);

    const [today, yesterday] = [dates[0].fecha, dates[1].fecha];
    const restocked = db.prepare(`
        SELECT 
            c.id, c.nombre, c.edicion, c.rareza, c.numero, c.foto_url, c.url_producto,
            ph_hoy.precio_min as precio_actual,
            ph_hoy.total_vendedores as vendedores_actual,
            ph_ayer.total_vendedores as vendedores_ayer
        FROM cards c
        JOIN card_price_history ph_hoy ON ph_hoy.card_id = c.id AND ph_hoy.fecha = ?
        JOIN card_price_history ph_ayer ON ph_ayer.card_id = c.id AND ph_ayer.fecha = ?
        WHERE ph_ayer.total_vendedores = 0 AND ph_hoy.total_vendedores > 0
        ORDER BY ph_hoy.total_vendedores DESC
        LIMIT 20
    `).all(today, yesterday);

    res.json(restocked);
});

// GET /api/dashboard/trending
// Más vendidos (mayor bajada de stock desde la fecha dada)
app.get('/api/dashboard/trending', (req, res) => {
    const { since_date } = req.query;

    const dates = db.prepare(
        'SELECT DISTINCT fecha FROM card_price_history ORDER BY fecha DESC LIMIT 2'
    ).all();

    if (dates.length < 2) return res.json([]);
    const [today, yesterday] = [dates[0].fecha, dates[1].fecha];
    const compareDate = since_date || yesterday;

    const trending = db.prepare(`
        SELECT 
            c.id, c.nombre, c.edicion, c.rareza, c.numero, c.foto_url, c.url_producto,
            ph_hoy.precio_min as precio_actual,
            ph_hoy.total_stock as stock_actual,
            ph_antes.total_stock as stock_antes,
            (ph_antes.total_stock - ph_hoy.total_stock) as unidades_vendidas
        FROM cards c
        JOIN card_price_history ph_hoy ON ph_hoy.card_id = c.id AND ph_hoy.fecha = ?
        JOIN card_price_history ph_antes ON ph_antes.card_id = c.id AND ph_antes.fecha = ?
        WHERE ph_antes.total_stock > ph_hoy.total_stock
        ORDER BY unidades_vendidas DESC
        LIMIT 20
    `).all(today, compareDate);

    res.json(trending);
});

// ─── WISHLIST ──────────────────────────────

// GET /api/wishlist/:user_id
app.get('/api/wishlist/:user_id', (req, res) => {
    const wishlist = db.prepare(`
        SELECT 
            w.id, w.target_price, w.notify_stock, w.created_at,
            c.id as card_id, c.nombre, c.edicion, c.rareza, c.numero, c.foto_url, c.url_producto,
            COALESCE(ph.precio_min, 0) as precio_actual,
            COALESCE(ph.total_vendedores, 0) as total_vendedores
        FROM wishlist w
        JOIN cards c ON c.id = w.card_id
        LEFT JOIN card_price_history ph ON ph.card_id = c.id
            AND ph.fecha = (SELECT MAX(fecha) FROM card_price_history WHERE card_id = c.id)
        WHERE w.user_id = ?
        ORDER BY w.created_at DESC
    `).all(req.params.user_id);
    res.json(wishlist);
});

// GET /api/wishlist/:user_id/alerts
// Cambios de precio en wishlist respecto al día anterior
app.get('/api/wishlist/:user_id/alerts', (req, res) => {
    const dates = db.prepare(
        'SELECT DISTINCT fecha FROM card_price_history ORDER BY fecha DESC LIMIT 2'
    ).all();
    if (dates.length < 2) return res.json([]);
    const [today, yesterday] = [dates[0].fecha, dates[1].fecha];

    const alerts = db.prepare(`
        SELECT 
            c.id as card_id, c.nombre, c.edicion, c.foto_url, c.url_producto,
            ph_hoy.precio_min as precio_hoy,
            ph_ayer.precio_min as precio_ayer,
            w.target_price,
            ROUND(((ph_ayer.precio_min - ph_hoy.precio_min) * 100.0 / NULLIF(ph_ayer.precio_min, 0)), 1) as cambio_pct
        FROM wishlist w
        JOIN cards c ON c.id = w.card_id
        LEFT JOIN card_price_history ph_hoy ON ph_hoy.card_id = c.id AND ph_hoy.fecha = ?
        LEFT JOIN card_price_history ph_ayer ON ph_ayer.card_id = c.id AND ph_ayer.fecha = ?
        WHERE w.user_id = ?
          AND ph_hoy.precio_min IS NOT NULL
          AND ph_ayer.precio_min IS NOT NULL
          AND ph_hoy.precio_min != ph_ayer.precio_min
        ORDER BY ABS(cambio_pct) DESC
    `).all(today, yesterday, req.params.user_id);
    res.json(alerts);
});

// POST /api/wishlist
app.post('/api/wishlist', (req, res) => {
    const { user_id, card_id, target_price = 0, notify_stock = 1 } = req.body;
    if (!user_id || !card_id) return res.status(400).json({ error: 'user_id y card_id requeridos' });
    try {
        db.prepare(`
            INSERT OR IGNORE INTO wishlist (user_id, card_id, target_price, notify_stock)
            VALUES (?, ?, ?, ?)
        `).run(user_id, card_id, target_price, notify_stock);
        res.json({ ok: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// DELETE /api/wishlist/:id
app.delete('/api/wishlist/:id', (req, res) => {
    db.prepare('DELETE FROM wishlist WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

// ─── USUARIOS (simple, sin JWT por ahora) ──

// POST /api/users/register
app.post('/api/users/register', (req, res) => {
    const { email, display_name } = req.body;
    if (!email) return res.status(400).json({ error: 'email requerido' });
    try {
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, display_name)
            VALUES (?, 'local', ?)
        `).run(email, display_name || email.split('@')[0]);
        res.json({ id: result.lastInsertRowid, email, display_name });
    } catch (e) {
        res.status(400).json({ error: 'Email ya registrado' });
    }
});

// POST /api/users/login (simplificado sin contraseña por ahora)
app.post('/api/users/login', (req, res) => {
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
});

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
    const user = db.prepare('SELECT id, email, display_name, avatar_url, last_login, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
});

// PUT /api/users/:id
app.put('/api/users/:id', (req, res) => {
    const { display_name, avatar_url } = req.body;
    db.prepare('UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?')
        .run(display_name, avatar_url, req.params.id);
    res.json({ ok: true });
});

// ─── FILTERS helper ─────────────────────────

// GET /api/filters
// Devuelve las opciones únicas para los filtros del frontend
app.get('/api/filters', (req, res) => {
    const ediciones = db.prepare('SELECT DISTINCT edicion FROM cards WHERE edicion != "" ORDER BY edicion').all().map(r => r.edicion);
    const rarezas = db.prepare('SELECT DISTINCT rareza FROM cards WHERE rareza != "" ORDER BY rareza').all().map(r => r.rareza);
    res.json({ ediciones, rarezas });
});

// ─── SPA fallback ───────────────────────────
// Si Lovable usa react-router, redirigir todas las rutas al index.html
app.use((req, res) => {
    const indexPath = path.join(FRONTEND_DIR, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ error: 'Frontend no encontrado. Coloca los archivos en ./frontend/' });
    }
});

// ─── START ──────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  🚀 PikaTracker API corriendo en http://localhost:${PORT}`);
    console.log(`  📁 Frontend esperado en: ./frontend/`);
    console.log('═'.repeat(50));
    console.log('\nEndpoints disponibles:');
    console.log('  GET  /api/cards                   - Catálogo');
    console.log('  GET  /api/cards/:id               - Detalle carta');
    console.log('  GET  /api/cards/:id/history       - Historial precios');
    console.log('  GET  /api/dashboard/restock       - Volvieron con stock');
    console.log('  GET  /api/dashboard/trending      - Más vendidos');
    console.log('  GET  /api/wishlist/:user_id       - Mi wishlist');
    console.log('  GET  /api/wishlist/:user_id/alerts - Cambios de precio');
    console.log('  POST /api/wishlist                - Agregar wishlist');
    console.log('  POST /api/users/register          - Registro');
    console.log('  POST /api/users/login             - Login\n');
});
