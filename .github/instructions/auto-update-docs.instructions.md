---
description: "Aplica cuando se realizan cambios al código, scripts, o funcionalidad del proyecto. Actualiza automáticamente contexto.md y README.md con registro de cambios. Keywords: update docs, actualizar documentación, apply changes, modificar código, update changelog, registro de cambios."
applyTo: "**"
---

# Actualización Automática de Documentación

Cada vez que apliques cambios al proyecto (código, scripts, archivos de configuración, etc.), debes actualizar **ambos** archivos de documentación:

## 1. contexto.md - Registro de Avances

Agrega una nueva entrada en la sección `## Registro de Avances` con este formato:

```markdown
- **YYYY-MM-DD HH:MM**: [Resumen ejecutivo del cambio en una línea]
```

**Reglas:**
- Usa la fecha y hora actual
- Una línea concisa describiendo el cambio principal
- Ordena cronológicamente (más reciente primero o último según el patrón existente)
- Ejemplos de buenos resúmenes:
  - "Se implementa scraping de múltiples páginas con paginación automática"
  - "Se corrige el selector CSS para extraer rareza correctamente"
  - "Se agrega manejo de errores para productos sin vendedores"

## 2. README.md - Documentación del Proyecto

Si el README.md no existe, créalo con esta estructura base:

```markdown
# Pikascrapper

Proyecto de web scraping para extraer información de cartas Pikachu desde TCGmatch.cl.

## Características

- Extracción de información completa de productos (nombre, edición, rareza, número)
- Scraping de ofertas de múltiples vendedores
- Exportación a CSV con timestamp
- [Lista características implementadas basadas en contexto.md]

## Uso

[Instrucciones básicas de cómo ejecutar el scraper]

## Último cambio

**YYYY-MM-DD HH:MM**: [Resumen ejecutivo del último cambio]

## Tecnologías

- Node.js
- [Otras dependencias del package.json]
```

Si ya existe, actualiza solo la sección `## Último cambio` con el cambio más reciente.

## Flujo de Trabajo

1. **Aplica el cambio solicitado por el usuario**
2. **Actualiza contexto.md** agregando entrada al Registro de Avances
3. **Actualiza README.md** modificando la sección "Último cambio"
4. **Confirma al usuario** mostrando las actualizaciones realizadas

## Excepciones

NO actualices los documentos cuando:
- Solo estés leyendo archivos o explorando el código
- Respondas preguntas sin modificar archivos
- Hagas cambios triviales en documentación (typos, formato)
