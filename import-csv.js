/**
 * import-csv.js
 * Importa un CSV generado por scraper.js a la base de datos SQLite.
 * 
 * Uso: node import-csv.js [ruta-al-csv]
 * Ejemplo: node import-csv.js 2026-04-18_pikachu_tcgmatch.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const db = require('./db/database');

// Si no se pasa un archivo, buscar el CSV más reciente
function findLatestCsv() {
    const files = fs.readdirSync('.')
        .filter(f => f.endsWith('_pikachu_tcgmatch.csv') && !f.startsWith('TEST_'))
        .sort()
        .reverse();
    if (files.length === 0) throw new Error('No se encontró ningún CSV de scraping.');
    return files[0];
}

const csvFile = process.argv[2] || findLatestCsv();
console.log(`\n${'═'.repeat(55)}`);
console.log(`📥 Importando: ${csvFile}`);
console.log('═'.repeat(55));

// Leer y parsear el CSV
const content = fs.readFileSync(csvFile, 'utf8');
const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
});

console.log(`📊 Filas en CSV: ${rows.length}`);

// Helpers
const parsePrecio = (str) => {
    if (!str) return 0;
    return parseInt(str.replace(/\$|\.| CLP/g, '').trim()) || 0;
};

const parseCantidad = (str) => parseInt(str) || 0;

// Transacción principal
const importData = db.transaction((rows) => {
    let cardsInserted = 0, cardsUpdated = 0, offersInserted = 0;

    // Sentencias preparadas
    const upsertCard = db.prepare(`
        INSERT INTO cards (nombre, edicion, rareza, numero, foto_url, url_producto, updated_at)
        VALUES (@nombre, @edicion, @rareza, @numero, @foto_url, @url_producto, CURRENT_TIMESTAMP)
        ON CONFLICT(url_producto) DO UPDATE SET
            nombre = excluded.nombre,
            edicion = excluded.edicion,
            rareza = excluded.rareza,
            numero = excluded.numero,
            foto_url = excluded.foto_url,
            updated_at = CURRENT_TIMESTAMP
    `);

    const getCard = db.prepare(`SELECT id FROM cards WHERE url_producto = ?`);

    const insertOffer = db.prepare(`
        INSERT INTO card_offers (card_id, vendedor, precio, idioma, ubicacion, estado, cantidad, fecha_extraccion)
        VALUES (@card_id, @vendedor, @precio, @idioma, @ubicacion, @estado, @cantidad, @fecha_extraccion)
    `);

    const upsertHistory = db.prepare(`
        INSERT INTO card_price_history (card_id, precio_min, precio_max, precio_promedio, total_stock, total_vendedores, fecha)
        VALUES (@card_id, @precio_min, @precio_max, @precio_promedio, @total_stock, @total_vendedores, @fecha)
        ON CONFLICT(card_id, fecha) DO UPDATE SET
            precio_min = MIN(excluded.precio_min, card_price_history.precio_min),
            precio_max = MAX(excluded.precio_max, card_price_history.precio_max),
            precio_promedio = excluded.precio_promedio,
            total_stock = excluded.total_stock,
            total_vendedores = excluded.total_vendedores
    `);

    // Agrupar filas por url_producto
    const byUrl = {};
    for (const row of rows) {
        const url = row['URL Producto'];
        if (!url) continue;
        if (!byUrl[url]) byUrl[url] = [];
        byUrl[url].push(row);
    }

    for (const [url, cardRows] of Object.entries(byUrl)) {
        const first = cardRows[0];

        // Upsert carta
        upsertCard.run({
            nombre: first['Nombre'] || '',
            edicion: first['Edición'] || '',
            rareza: first['Rareza'] || '',
            numero: first['Número'] || '',
            foto_url: first['Foto URL'] || '',
            url_producto: url,
        });

        const card = getCard.get(url);
        if (!card) continue;
        const card_id = card.id;

        // Insertar ofertas de vendedores
        const fecha = first['Fecha Extracción'] || new Date().toISOString().slice(0, 10);
        let totalStock = 0;
        let precios = [];
        let vendedoresCount = 0;

        for (const row of cardRows) {
            if (!row['Vendedor']) continue; // fila sin vendedor (carta sin stock)
            const precio = parsePrecio(row['Precio']);
            const cantidad = parseCantidad(row['Cantidad']);

            insertOffer.run({
                card_id,
                vendedor: row['Vendedor'],
                precio,
                idioma: row['Idioma'] || '',
                ubicacion: row['Ubicación'] || '',
                estado: row['Estado'] || '',
                cantidad,
                fecha_extraccion: fecha,
            });

            offersInserted++;
            totalStock += cantidad;
            if (precio > 0) precios.push(precio);
            vendedoresCount++;
        }

        // Calcular agregados para historial
        const precio_min = precios.length > 0 ? Math.min(...precios) : 0;
        const precio_max = precios.length > 0 ? Math.max(...precios) : 0;
        const precio_promedio = precios.length > 0
            ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length)
            : 0;

        upsertHistory.run({
            card_id,
            precio_min,
            precio_max,
            precio_promedio,
            total_stock: totalStock,
            total_vendedores: vendedoresCount,
            fecha,
        });
    }

    return { cardsTotal: Object.keys(byUrl).length, offersInserted };
});

const result = importData(rows);

// Estadísticas finales
const totalCards = db.prepare('SELECT COUNT(*) as n FROM cards').get().n;
const totalOffers = db.prepare('SELECT COUNT(*) as n FROM card_offers').get().n;

console.log(`\n✅ Importación completada:`);
console.log(`   🃏 ${result.cardsTotal} cartas procesadas (total en BD: ${totalCards})`);
console.log(`   💼 ${result.offersInserted} ofertas insertadas (total en BD: ${totalOffers})`);
console.log('═'.repeat(55));
