# src/features/medical

**Qué va aquí:** Vista médica: pantalla técnica para el médico de vuelo.

**Quién:** R5

**Ahora hay:**
- `MedicalPage.tsx`: encabezado (misión, entorno, día de vuelo, MET, registros), resumen por indicador, tabla de registros con el origen de cada dato, filtro de 7 días, 30 días o todo, y botones «Exportar CSV» y «Exportar JSON».
- `medicalData.ts`: cálculos puros (filtro, resumen de 7 días, regla de tendencia, estado de cada celda). Usa los rangos del motor, que son un **borrador**.
- `exportData.ts`: arma el CSV (BOM UTF-8, coma, escapado, encabezados con unidades en el idioma activo) y el JSON (metadatos, aviso de borrador, orígenes). Puro y probado.
- `download.ts`: descarga con Blob y enlace, sin internet.
