"""
Pipeline Completo: Scraper → Supabase

Propósito: Ejecutar scraper que sube automáticamente a Supabase
Dependencias: subprocess, os
Uso: python pipeline_complete.py pikachu
Output: Datos scraped y subidos a Supabase

NOTA: Este script ahora es un wrapper simple del scraper.js
El scraper detecta automáticamente si debe subir a Supabase o generar CSV
"""

import subprocess
import sys
import os
from dotenv import load_dotenv

# ======================
# CONFIGURACIÓN
# ======================

# Obtener directorio base del proyecto (un nivel arriba de scripts/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Cargar variables de entorno desde el directorio base
load_dotenv(os.path.join(BASE_DIR, '.env'))

SCRAPER_SCRIPT = os.path.join(BASE_DIR, "scripts", "scraper.js")
SEARCH_KEYWORD = sys.argv[1] if len(sys.argv) > 1 else "pikachu"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "tcg_cards")

# Verificar modo de operación
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY)

# ======================
# EJECUTAR SCRAPER
# ======================

def run_scraper(keyword):
    """
    Ejecuta el scraper de Node.js
    El scraper detecta automáticamente si debe:
    - Subir directo a Supabase (si hay variables de entorno)
    - Generar CSV (si no hay variables de entorno)
    
    Args:
        keyword (str): Palabra clave para buscar
    
    Returns:
        int: Código de salida del scraper
    """
    mode = "🔗 Supabase Direct Upload" if USE_SUPABASE else "📁 CSV Export"
    
    print("=" * 60)
    print("🚀 PIPELINE: SCRAPER AUTOMATIZADO")
    print("=" * 60)
    print(f"🔍 Keyword: {keyword}")
    print(f"⚙️  Modo: {mode}")
    print("=" * 60)
    print()
    
    # Ejecutar scraper desde el directorio base del proyecto
    result = subprocess.run(
        ["node", SCRAPER_SCRIPT, keyword],
        cwd=BASE_DIR,
        encoding='utf-8',
        errors='ignore'
    )
    
    print()
    print("=" * 60)
    
    # Verificar resultado
    if result.returncode == 0:
        if USE_SUPABASE:
            print("✅ PIPELINE COMPLETADO")
            print(f"📊 Datos subidos a Supabase")
            print(f"🗃️  Tabla: {SUPABASE_TABLE}")
        else:
            print("✅ PIPELINE COMPLETADO")
            print(f"📁 CSV generado exitosamente")
    else:
        print("❌ ERROR EN PIPELINE")
        print(f"💥 Código de salida: {result.returncode}")
    
    print("=" * 60)
    
    return result.returncode

# ======================
# FUNCIÓN PRINCIPAL
# ======================

def main():
    """Ejecuta el pipeline simplificado"""
    
    try:
        exit_code = run_scraper(SEARCH_KEYWORD)
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Pipeline interrumpido por el usuario")
        sys.exit(1)
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
