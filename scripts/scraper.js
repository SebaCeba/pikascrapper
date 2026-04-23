/**
 * TCGMatch.cl Scraper - Cartas TCG
 * 
 * Extrae información de cartas del catálogo de TCGMatch.cl,
 * incluyendo datos generales de cada carta y la lista completa de vendedores.
 * 
 * MODOS DE OPERACIÓN:
 * 1. CSV Mode (default): Guarda resultados en CSV con timestamp
 * 2. Supabase Mode: Sube directo a Supabase si detecta variables de entorno
 * 
 * Variables de entorno para Supabase Mode:
 * - SUPABASE_URL: URL de tu proyecto Supabase
 * - SUPABASE_KEY: API key (anon/service_role)
 * - SUPABASE_TABLE: Nombre de la tabla (default: tcg_cards)
 * 
 * Uso: node scraper.js <keyword>
 * Ejemplo: node scraper.js pikachu
 */

require('dotenv').config();
const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');

// Polyfill para fetch en Node.js < 18
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

// ----------------------------
// CONFIGURACIÓN
// ----------------------------
const BASE_URL = 'https://tcgmatch.cl';
const SEARCH_QUERY = process.argv[2] || 'Pikachu';
const MAX_PAGES = Infinity;  // Cambiar a un número para limitar páginas
const DELAY_MS = 1500;       // Pausa entre peticiones (ms)

// Configuración Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'tcg_cards';
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ----------------------------
// PASO 1: Recolectar enlaces de productos del catálogo
// ----------------------------
async function getProductLinks(page) {
    const links = new Set();
    let currentPage = 1;

    while (currentPage <= MAX_PAGES) {
        const url = `${BASE_URL}/cartas/busqueda/q=${encodeURIComponent(SEARCH_QUERY)}&page=${currentPage}`;
        console.log(`  📄 Página ${currentPage}: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await sleep(DELAY_MS);

        // Cerrar modal "Entendido" si aparece
        try {
            const btns = await page.$$('button');
            for (const btn of btns) {
                const txt = await btn.evaluate(el => el.innerText?.trim());
                if (txt === 'Entendido') { await btn.click(); await sleep(500); break; }
            }
        } catch (e) {}

        // Recolectar links de /producto/catalogo/
        const pageLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href^="/producto/catalogo/"]'))
                .map(a => a.href);
        });

        if (pageLinks.length === 0) {
            console.log(`  ⏹ Página ${currentPage} sin más resultados de catálogo.`);
            break;
        }

        pageLinks.forEach(l => links.add(l));
        console.log(`  ✓ ${pageLinks.length} productos (acumulado: ${links.size})`);

        // Verificar si hay siguiente página
        const hasNext = await page.evaluate(() => !!document.querySelector('a[aria-label="Next page"]'));
        if (!hasNext) {
            console.log(`  ⏹ Última página alcanzada.`);
            break;
        }
        currentPage++;
    }

    return Array.from(links);
}

// ----------------------------
// PASO 2: Extraer detalles de un producto individual
// ----------------------------
async function scrapeProduct(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(2500);
    try { await page.waitForSelector('p.text-2xl', { timeout: 8000 }); } catch(e) {}

    const data = await page.evaluate(() => {
        // --- NOMBRE ---
        const nombre = document.querySelector('p.text-2xl.font-semibold')?.innerText?.trim() || '';

        // --- FOTO ---
        const fotoEl = document.querySelector('img[alt="Imagen del producto"]');
        const foto = fotoEl ? fotoEl.src : '';

        // --- EDICIÓN, RAREZA, NÚMERO ---
        let edicion = '', rareza = '', numero = '';
        const detailLabels = document.querySelectorAll('span.font-medium');
        for (const label of detailLabels) {
            const labelText = label.innerText?.trim().toLowerCase() || '';
            const parentP = label.closest('p');
            if (!parentP) continue;

            if (labelText.includes('edici')) {
                const linkEl = parentP.querySelector('a');
                edicion = linkEl ? linkEl.innerText.trim() : parentP.innerText.replace(label.innerText, '').trim();
            }
            if (labelText.includes('rareza')) {
                rareza = parentP.innerText.replace(label.innerText, '').trim();
            }
            if (labelText.includes('mero')) {
                numero = parentP.innerText.replace(label.innerText, '').trim();
            }
        }

        // --- VENDEDORES ---
        const vendedores = [];
        const vendorBlocks = document.querySelectorAll('div.overflow-hidden.bg-white.shadow-sm');

        for (const block of vendorBlocks) {
            // Vendedor
            const vendedorEl = block.querySelector('a[href^="/@"] p.font-medium, a[href*="/perfil/"] p.font-medium');
            const vendedor = vendedorEl?.innerText?.trim() || '';
            if (!vendedor) continue;

            // Ubicación
            const ubicacionEl = block.querySelector('p.ml-1.text-sm');
            const ubicacion = ubicacionEl?.innerText?.trim() || '';

            // Idioma y Estado (badges)
            const badges = block.querySelectorAll('span[class*="inline-flex"][class*="rounded-full"]');
            let idioma = '', estado = '';
            for (const badge of badges) {
                const txt = badge.innerText?.trim();
                if (!txt) continue;
                if (badge.className.includes('yellow')) {
                    idioma = txt;
                } else if (badge.className.includes('gray') && (txt.includes('NM') || txt.includes('LP') || txt.includes('MP') || txt.includes('HP') || txt.includes('Menta') || txt.includes('Excelente') || txt.includes('Buen') || txt.includes('Moderado') || txt.includes('Jugado'))) {
                    estado = txt;
                }
            }

            // Precio
            const precioEl = block.querySelector('p.text-green-800');
            const precio = precioEl?.innerText?.trim() || '';

            // Cantidad
            const cantidadText = block.querySelector('div.bg-gray-50')?.innerText?.trim() || '';
            const cantidadMatch = cantidadText.match(/de\s+(\d+)/);
            const cantidad = cantidadMatch ? cantidadMatch[1] : '';

            vendedores.push({ vendedor, precio, idioma, ubicacion, estado, cantidad });
        }

        return { nombre, foto, edicion, rareza, numero, vendedores };
    });

    return data;
}

// ----------------------------
// PASO 3: Subir datos a Supabase (modo alternativo a CSV)
// ----------------------------

// Deduplicar filas en memoria usando la misma clave que el UNIQUE constraint de Supabase:
// (nombre, numero, edicion, vendedor, idioma, estado)
// Esto es un respaldo por si el constraint aún no está configurado en la BD.
function deduplicateRows(rows) {
    const seen = new Set();
    const unique = [];
    for (const row of rows) {
        const key = [row.nombre, row.numero, row.edicion, row.vendedor, row.idioma, row.estado].join('\0');
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(row);
        }
    }
    const duplicates = rows.length - unique.length;
    if (duplicates > 0) {
        console.log(`  ⚠️  ${duplicates} filas duplicadas eliminadas antes de subir (total: ${unique.length})`);
    }
    return unique;
}

async function uploadToSupabase(rows) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error('SUPABASE_URL y SUPABASE_KEY son requeridos para usar modo Supabase');
    }

    console.log(`\n📤 Subiendo ${rows.length} registros a Supabase (modo UPSERT)...`);
    
    // Convertir datos al formato de Supabase (snake_case y valores null para vacíos)
    const supabaseRows = rows.map(row => ({
        nombre: row.nombre || null,
        edicion: row.edicion || null,
        rareza: row.rareza || null,
        numero: row.numero || null,
        foto_url: row.foto || null,
        vendedor: row.vendedor || null,
        precio: row.precio || null,
        idioma: row.idioma || null,
        ubicacion: row.ubicacion || null,
        estado: row.estado || null,
        cantidad: row.cantidad ? parseInt(row.cantidad) : null,
        url_producto: row.url_producto || null,
        fecha_extraccion: row.fecha_extraccion || null,
        search_keyword: SEARCH_QUERY.toLowerCase()
    }));

    const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
    
    try {
        // UPSERT: Inserta nuevos o actualiza existentes basándose en UNIQUE constraint
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(supabaseRows)
        });

        if (!response.ok) {
            const errorText = await response.text();
            
            // Si el error es por falta de constraint, dar instrucciones
            if (errorText.includes('constraint') || errorText.includes('unique')) {
                console.log('\n⚠️  Error: Falta UNIQUE constraint en la tabla');
                console.log('📝 Ejecuta este SQL en Supabase para habilitar UPSERT:');
                console.log('   docs/setup/add_unique_constraint.sql\n');
            }
            
            throw new Error(`Error HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        const processed = Array.isArray(result) ? result.length : rows.length;
        
        console.log(`✅ ${processed} registros procesados (insertados o actualizados)`);
        console.log('   • Nuevos vendedores → insertados');
        console.log('   • Vendedores existentes → precios/stock actualizados');
        
        return true;
    } catch (error) {
        console.error('❌ Error subiendo a Supabase:', error.message);
        throw error;
    }
}

// ----------------------------
// PRINCIPAL
// ----------------------------
async function main() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const keyword = SEARCH_QUERY.toLowerCase().replace(/\s+/g, '_');
    const csvFilename = `${dateStr}_${keyword}_tcgmatch.csv`;

    console.log('═'.repeat(60));
    console.log(`  TCGMatch Scraper - ${SEARCH_QUERY}`);
    console.log(`  Fecha: ${dateStr}`);
    console.log(`  Modo: ${USE_SUPABASE ? '🔗 Supabase Direct Upload' : '📁 CSV Export'}`);
    if (!USE_SUPABASE) {
        console.log(`  Archivo de salida: ${csvFilename}`);
    }
    console.log('═'.repeat(60));

    // Configurar argumentos de Puppeteer según entorno
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    const launchOptions = {
        headless: "new",
        args: isCI ? [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ] : []
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // --- Recolectar links de productos ---
    console.log('\n[1/2] Recolectando links de productos del catálogo...\n');
    const productLinks = await getProductLinks(page);
    console.log(`\n📦 Total de productos únicos: ${productLinks.length}\n`);

    // --- Configurar CSV Writer (solo si no usamos Supabase) ---
    let csvWriter = null;
    if (!USE_SUPABASE) {
        csvWriter = createObjectCsvWriter({
            path: csvFilename,
            header: [
                { id: 'nombre', title: 'Nombre' },
                { id: 'edicion', title: 'Edición' },
                { id: 'rareza', title: 'Rareza' },
                { id: 'numero', title: 'Número' },
                { id: 'foto', title: 'Foto URL' },
                { id: 'vendedor', title: 'Vendedor' },
                { id: 'precio', title: 'Precio' },
                { id: 'idioma', title: 'Idioma' },
                { id: 'ubicacion', title: 'Ubicación' },
                { id: 'estado', title: 'Estado' },
                { id: 'cantidad', title: 'Cantidad' },
                { id: 'url_producto', title: 'URL Producto' },
                { id: 'fecha_extraccion', title: 'Fecha Extracción' },
            ],
            encoding: 'utf8',
            append: false,
        });
    }

    // --- Extraer datos de cada producto ---
    console.log('[2/2] Extrayendo detalles de cada producto...\n');
    const allRows = [];
    let totalVendedores = 0;

    for (let i = 0; i < productLinks.length; i++) {
        const url = productLinks[i];
        console.log(`[${i + 1}/${productLinks.length}] ${url}`);

        try {
            const productData = await scrapeProduct(page, url);
            const { nombre, foto, edicion, rareza, numero, vendedores } = productData;

            if (vendedores.length === 0) {
                allRows.push({
                    nombre, edicion, rareza, numero, foto,
                    vendedor: '', precio: '', idioma: '', ubicacion: '', estado: '', cantidad: '',
                    url_producto: url, fecha_extraccion: dateStr,
                });
            } else {
                for (const v of vendedores) {
                    allRows.push({
                        nombre, edicion, rareza, numero, foto,
                        ...v, url_producto: url, fecha_extraccion: dateStr,
                    });
                }
            }
            totalVendedores += vendedores.length;
            console.log(`  ✓ ${nombre} | Ed: ${edicion} | #${numero} | ${rareza} | ${vendedores.length} vendedor(es)`);
        } catch (err) {
            console.log(`  ✗ Error: ${err.message}`);
        }

        await sleep(DELAY_MS);
    }

    await browser.close();

    // --- Guardar resultados ---
    console.log('\n' + '═'.repeat(60));
    
    if (USE_SUPABASE) {
        // Modo Supabase: deduplicar en memoria y luego subir
        const uniqueRows = deduplicateRows(allRows);
        try {
            await uploadToSupabase(uniqueRows);
            console.log(`  ✅ Scraping completado y datos subidos!`);
            console.log(`  📊 ${productLinks.length} productos | ${totalVendedores} ofertas de vendedores`);
            console.log(`  🔗 ${uniqueRows.length} registros subidos a Supabase`);
        } catch (error) {
            console.error('  ❌ Error en subida a Supabase');
            process.exit(1);
        }
    } else {
        // Modo CSV: escribir archivo
        await csvWriter.writeRecords(allRows);
        console.log(`  ✅ Scraping completado!`);
        console.log(`  📊 ${productLinks.length} productos | ${totalVendedores} ofertas de vendedores`);
        console.log(`  📁 ${allRows.length} filas guardadas en ${csvFilename}`);
    }
    
    console.log('═'.repeat(60));
}

main().catch(console.error);
