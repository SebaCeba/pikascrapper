"""
Pipeline Completo: Scraper → CSV → Supabase

Propósito: Ejecutar scraper y subir automáticamente a Supabase
Dependencias: supabase, subprocess, os
Uso: python pipeline_complete.py pikachu
Output: Datos scraped y subidos a Supabase
"""

import subprocess
import sys
import os
import glob
from datetime import datetime
import requests
from dotenv import load_dotenv
import csv

# Cargar variables de entorno
load_dotenv()

# ======================
# CONFIGURACIÓN
# ======================

# Obtener directorio base del proyecto (un nivel arriba de scripts/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRAPER_SCRIPT = os.path.join(BASE_DIR, "scripts", "scraper.js")
SEARCH_KEYWORD = sys.argv[1] if len(sys.argv) > 1 else "pikachu"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "tcg_cards")

# ======================
# PASO 1: EJECUTAR SCRAPER
# ======================

def run_scraper(keyword):
    """
    Ejecuta el scraper de Node.js
    
    Args:
        keyword (str): Palabra clave para buscar
    
    Returns:
        str: Nombre del archivo CSV generado
    """
    print("🔍 PASO 1: Ejecutando scraper...")
    print(f"   Buscando: {keyword}")
    
    # Ejecutar scraper
    result = subprocess.run(
        ["node", SCRAPER_SCRIPT, keyword],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        raise Exception(f"Error en scraper: {result.stderr}")
    
    # Buscar el CSV más reciente en el directorio base del proyecto
    csv_pattern = os.path.join(BASE_DIR, f"*{keyword}*.csv")
    csv_files = glob.glob(csv_pattern)
    
    if not csv_files:
        raise Exception(f"No se generó CSV para '{keyword}'")
    
    # Obtener el más reciente
    latest_csv = max(csv_files, key=os.path.getctime)
    
    print(f"   ✅ CSV generado: {latest_csv}")
    return latest_csv

# ======================
# PASO 2: LEER Y TRANSFORMAR CSV
# ======================

def read_csv_file(filename):
    """Lee el CSV y retorna los datos transformados"""
    data = []
    
    # Mapeo de nombres CSV → Supabase
    column_mapping = {
        'Nombre': 'nombre',
        'Edición': 'edicion',
        'Rareza': 'rareza',
        'Número': 'numero',
        'Foto URL': 'foto_url',
        'Vendedor': 'vendedor',
        'Precio': 'precio',
        'Idioma': 'idioma',
        'Ubicación': 'ubicacion',
        'Estado': 'estado',
        'Cantidad': 'cantidad',
        'URL Producto': 'url_producto',
        'Fecha Extracción': 'fecha_extraccion'
    }
    
    with open(filename, 'r', encoding='utf-8') as file:
        csv_reader = csv.DictReader(file)
        for row in csv_reader:
            # Transformar nombres de columnas
            transformed_row = {}
            for csv_col, db_col in column_mapping.items():
                if csv_col in row:
                    transformed_row[db_col] = row[csv_col]
            data.append(transformed_row)
    
    return data

# ======================
# PASO 3: SUBIR A SUPABASE
# ======================

def upload_to_supabase(data, table_name):
    """
    Sube datos a Supabase usando API REST
    
    Args:
        data (list): Registros a subir
        table_name (str): Nombre de la tabla
    
    Returns:
        dict: Respuesta de Supabase
    """
    print(f"📤 PASO 3: Subiendo a Supabase...")
    
    # Construir URL del endpoint
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    # Headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Agregar metadata a cada registro
    for record in data:
        record['imported_at'] = datetime.now().isoformat()
        record['search_keyword'] = SEARCH_KEYWORD
    
    # Hacer request
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Error HTTP {response.status_code}: {response.text}")
    
    result = response.json()
    print(f"   ✅ {len(result)} registros insertados")
    
    return result

# ======================
# FUNCIÓN PRINCIPAL
# ======================

def main():
    """Ejecuta el pipeline completo"""
    
    print("=" * 60)
    print("🚀 PIPELINE COMPLETO: SCRAPER → CSV → SUPABASE")
    print("=" * 60)
    print()
    
    # Validar configuración
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Variables de entorno no configuradas")
        print("   Crea archivo .env con SUPABASE_URL y SUPABASE_KEY")
        sys.exit(1)
    
    try:
        # Paso 1: Scraper
        csv_file = run_scraper(SEARCH_KEYWORD)
        print()
        
        # Paso 2: Leer CSV
        print("📖 PASO 2: Leyendo CSV...")
        records = read_csv_file(csv_file)
        print(f"   ✅ {len(records)} registros leídos")
        print()
        
        # Paso 3: Subir
        response = upload_to_supabase(records, SUPABASE_TABLE)
        print()
        
        # Resumen
        print("=" * 60)
        print("✅ PIPELINE COMPLETADO")
        print("=" * 60)
        print(f"Keyword buscado: {SEARCH_KEYWORD}")
        print(f"CSV generado: {csv_file}")
        print(f"Registros procesados: {len(records)}")
        print(f"Registros en Supabase: {len(response)}")
        print(f"Tabla: {SUPABASE_TABLE}")
        print()
        print(f"🔗 Ver datos en: {SUPABASE_URL}/project/default/editor/{SUPABASE_TABLE}")
        
    except Exception as e:
        print()
        print("=" * 60)
        print(f"❌ ERROR: {e}")
        print("=" * 60)
        sys.exit(1)

# ======================
# EJECUCIÓN
# ======================

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python pipeline_complete.py <keyword>")
        print("Ejemplo: python pipeline_complete.py pikachu")
        sys.exit(1)
    
    main()
