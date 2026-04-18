"""
Supabase CSV Uploader - Versión con Requests

Propósito: Subir CSV a Supabase usando API REST directo
Dependencias: requests, csv, python-dotenv
Uso: python upload_to_supabase_requests.py 2026-04-18_pikachu_tcgmatch.csv
Output: Datos insertados con reporte detallado
"""

import requests
import csv
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# ======================
# 1. CONFIGURACIÓN
# ======================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "tcg_cards")

# ======================
# 2. LEER Y TRANSFORMAR CSV
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
        
        print(f"📋 Columnas detectadas: {', '.join(csv_reader.fieldnames)}")
        
        for row in csv_reader:
            # Transformar nombres de columnas
            transformed_row = {}
            for csv_col, db_col in column_mapping.items():
                if csv_col in row:
                    transformed_row[db_col] = row[csv_col]
            
            # Agregar timestamp de importación
            transformed_row['imported_at'] = datetime.now().isoformat()
            
            data.append(transformed_row)
    
    return data

# ======================
# 3. SUBIR A SUPABASE
# ======================

def upload_to_supabase(data, table_name):
    """
    Sube datos a Supabase usando API REST
    
    Args:
        data (list): Registros a subir
        table_name (str): Nombre de la tabla
    """
    print(f"📤 Subiendo {len(data)} registros a tabla '{table_name}'...")
    
    # Construir URL del endpoint
    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    
    # Headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    try:
        # Hacer POST request
        response = requests.post(url, json=data, headers=headers)
        
        # Verificar respuesta
        if response.status_code in [200, 201]:
            inserted_data = response.json()
            print(f"   ✅ {len(inserted_data)} registros insertados")
            return inserted_data
        else:
            print(f"   ❌ Error HTTP {response.status_code}")
            print(f"   Respuesta: {response.text}")
            raise Exception(f"Error al insertar: {response.text}")
    
    except Exception as e:
        print(f"❌ Error al insertar datos: {e}")
        raise

# ======================
# 4. FUNCIÓN PRINCIPAL
# ======================

def main():
    """Función principal de ejecución"""
    
    print("=" * 60)
    print("📤 SUPABASE CSV UPLOADER (Requests)")
    print("=" * 60)
    print()
    
    # Verificar argumentos
    if len(sys.argv) < 2:
        print("❌ Uso: python upload_to_supabase_requests.py <archivo.csv>")
        sys.exit(1)
    
    csv_filename = sys.argv[1]
    
    # Verificar configuración
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Error: Variables de entorno no configuradas")
        print("   Verifica tu archivo .env")
        sys.exit(1)
    
    print(f"✅ Configuración cargada")
    print(f"   URL: {SUPABASE_URL}")
    print(f"   Tabla: {SUPABASE_TABLE}")
    print()
    
    try:
        # Paso 1: Leer CSV
        print("📖 Paso 1/2: Leyendo CSV...")
        records = read_csv_file(csv_filename)
        print(f"   ✅ {len(records)} registros leídos")
        print()
        
        # Paso 2: Subir a Supabase
        print("📤 Paso 2/2: Subiendo a Supabase...")
        response = upload_to_supabase(records, SUPABASE_TABLE)
        print()
        
        # Resumen final
        print("=" * 60)
        print("✅ PROCESO COMPLETADO")
        print("=" * 60)
        print(f"Archivo: {csv_filename}")
        print(f"Registros procesados: {len(records)}")
        print(f"Registros insertados: {len(response)}")
        print(f"Tabla: {SUPABASE_TABLE}")
        
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
    main()
