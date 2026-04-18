const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('Navegando al producto...');
    await page.goto('https://tcgmatch.cl/producto/catalogo/30587', { waitUntil: 'networkidle2' });
    // Esperar para hidratación o tablas de vendedores
    await new Promise(r => setTimeout(r, 5000));
    const html = await page.content();
    fs.writeFileSync('product_page.html', html);
    console.log('HTML de producto guardado en product_page.html');
    await page.screenshot({ path: 'product_page.png', fullPage: true });

    await browser.close();
})();
