// TEST MODE: Solo 3 productos para validar selectores exactos
const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');

const BASE_URL = 'https://tcgmatch.cl';
const SEARCH_QUERY = 'Pikachu';
const DELAY_MS = 1500;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function scrapeProduct(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2' });
    await sleep(2500);
    // Esperar a que el contenido del producto se renderice (la p con el nombre)
    try { await page.waitForSelector('p.text-2xl', { timeout: 8000 }); } catch(e) {}

    const data = await page.evaluate(() => {
        // --- NOMBRE ---
        // El nombre está en <p class="text-2xl font-semibold">Pikachu</p>
        const nombre = document.querySelector('p.text-2xl.font-semibold')?.innerText?.trim() || '';

        // --- FOTO ---
        const fotoEl = document.querySelector('img[alt="Imagen del producto"]');
        const foto = fotoEl ? fotoEl.src : '';

        // --- EDICIÓN, RAREZA, NÚMERO ---
        // Estructura: <p><span class="font-medium">Edición:</span> <a ...>SV05: Temporal Forces</a></p>
        //             <p><span class="font-medium">Rareza:</span> <!-- -->Common</p>
        //             <p><span class="font-medium">Número:</span> <!-- -->051/162</p>
        let edicion = '', rareza = '', numero = '';

        const detailLabels = document.querySelectorAll('span.font-medium');
        for (const label of detailLabels) {
            const labelText = label.innerText?.trim().toLowerCase() || '';
            const parentP = label.closest('p');
            if (!parentP) continue;

            // El valor está después del span, puede ser un <a> o texto directo
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

        // Cada vendedor está en un div con clases: overflow-hidden bg-white px-4 py-4 shadow-sm sm:rounded-md sm:px-6 grid...
        // Dentro de div.space-y-3 (sección #others) o la primera oferta en la zona superior
        const vendorBlocks = document.querySelectorAll('div.overflow-hidden.bg-white.shadow-sm');

        for (const block of vendorBlocks) {
            // Vendedor: <a href="/@..."><p class="font-medium">nombre</p></a>
            const vendedorEl = block.querySelector('a[href^="/@"] p.font-medium, a[href*="/perfil/"] p.font-medium');
            const vendedor = vendedorEl?.innerText?.trim() || '';
            if (!vendedor) continue; // saltar bloques que no son vendedores

            // Ubicación: <p class="ml-1 text-sm font-light">Huechuraba</p>
            const ubicacionEl = block.querySelector('p.ml-1.text-sm');
            const ubicacion = ubicacionEl?.innerText?.trim() || '';

            // Badges: idioma y estado
            const badges = block.querySelectorAll('span[class*="inline-flex"][class*="rounded-full"]');
            let idioma = '', estado = '';
            for (const badge of badges) {
                const txt = badge.innerText?.trim();
                if (!txt) continue;
                // Idioma: badge con bg-yellow-50
                if (badge.className.includes('yellow')) {
                    idioma = txt;
                }
                // Estado: badge con bg-gray-50 (que contiene NM, LP, etc)
                else if (badge.className.includes('gray') && (txt.includes('NM') || txt.includes('LP') || txt.includes('MP') || txt.includes('HP') || txt.includes('Menta') || txt.includes('Excelente') || txt.includes('Buen') || txt.includes('Moderado') || txt.includes('Jugado'))) {
                    estado = txt;
                }
            }

            // Precio: <p class="text-green-800 font-semibold ...">$100 CLP</p>
            const precioEl = block.querySelector('p.text-green-800');
            const precio = precioEl?.innerText?.trim() || '';

            // Cantidad: "de N" en el div de cantidad
            const cantidadText = block.querySelector('div.bg-gray-50')?.innerText?.trim() || '';
            const cantidadMatch = cantidadText.match(/de\s+(\d+)/);
            const cantidad = cantidadMatch ? cantidadMatch[1] : '';

            vendedores.push({ vendedor, precio, idioma, ubicacion, estado, cantidad });
        }

        return { nombre, foto, edicion, rareza, numero, vendedores };
    });

    return data;
}

async function main() {
    const dateStr = new Date().toISOString().slice(0, 10);
    console.log('=== MODO TEST: 1 página, máx 3 productos ===\n');

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Obtener solo la primera página de búsqueda
    const searchUrl = `${BASE_URL}/cartas/busqueda/q=${encodeURIComponent(SEARCH_QUERY)}&page=1`;
    console.log('Navegando a:', searchUrl);
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Cerrar modal "Entendido" si aparece
    try {
        const btns = await page.$$('button');
        for (const btn of btns) {
            const txt = await btn.evaluate(el => el.innerText?.trim());
            if (txt === 'Entendido') { await btn.click(); await sleep(500); break; }
        }
    } catch (e) {}

    // Obtener primeros 3 links de catálogo
    const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href^="/producto/catalogo/"]')).map(a => a.href).slice(0, 3)
    );

    console.log(`\nLinks encontrados: ${links.length}`);
    links.forEach(l => console.log(' -', l));

    const allRows = [];
    for (let i = 0; i < links.length; i++) {
        console.log(`\n${'─'.repeat(50)}`);
        console.log(`[${i+1}/${links.length}] ${links[i]}`);
        const d = await scrapeProduct(page, links[i]);
        console.log(`  Nombre    : ${d.nombre || '(vacío)'}`);
        console.log(`  Foto      : ${d.foto ? d.foto.substring(0, 60) + '...' : '(vacío)'}`);
        console.log(`  Edición   : ${d.edicion || '(vacío)'}`);
        console.log(`  Rareza    : ${d.rareza || '(vacío)'}`);
        console.log(`  Número    : ${d.numero || '(vacío)'}`);
        console.log(`  Vendedores: ${d.vendedores.length}`);
        d.vendedores.forEach((v, j) => {
            console.log(`    [${j+1}] ${v.vendedor} | ${v.precio} | ${v.idioma} | ${v.estado} | ${v.ubicacion} | cant: ${v.cantidad}`);
        });

        if (d.vendedores.length === 0) {
            allRows.push({ nombre: d.nombre, edicion: d.edicion, rareza: d.rareza, numero: d.numero, foto: d.foto, vendedor: '', precio: '', idioma: '', ubicacion: '', estado: '', cantidad: '', url_producto: links[i], fecha_extraccion: dateStr });
        } else {
            for (const v of d.vendedores) {
                allRows.push({ nombre: d.nombre, edicion: d.edicion, rareza: d.rareza, numero: d.numero, foto: d.foto, ...v, url_producto: links[i], fecha_extraccion: dateStr });
            }
        }
    }

    // Guardar CSV de prueba
    const csvWriter = createObjectCsvWriter({
        path: `TEST_${dateStr}_pikachu_tcgmatch.csv`,
        header: [
            { id: 'nombre', title: 'Nombre' }, { id: 'edicion', title: 'Edición' },
            { id: 'rareza', title: 'Rareza' }, { id: 'numero', title: 'Número' },
            { id: 'foto', title: 'Foto URL' }, { id: 'vendedor', title: 'Vendedor' },
            { id: 'precio', title: 'Precio' }, { id: 'idioma', title: 'Idioma' },
            { id: 'ubicacion', title: 'Ubicación' }, { id: 'estado', title: 'Estado' },
            { id: 'cantidad', title: 'Cantidad' }, { id: 'url_producto', title: 'URL Producto' },
            { id: 'fecha_extraccion', title: 'Fecha Extracción' },
        ]
    });
    await csvWriter.writeRecords(allRows);
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`✅ CSV generado: TEST_${dateStr}_pikachu_tcgmatch.csv (${allRows.length} filas)`);

    await browser.close();
}

main().catch(console.error);
