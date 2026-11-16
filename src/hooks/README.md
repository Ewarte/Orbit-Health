# src/hooks

**Qué va aquí:** Funciones de React compartidas entre pantallas, por ejemplo leer las mediciones o el estado evaluado.

**Quién:** R1

**Ahora hay:** `useDialogFocus.ts`: foco accesible en diálogos (Escape cierra, el foco entra al título y vuelve al botón que lo abrió, Tab no se escapa). Los recordatorios de la rutina viven en `src/features/mission/useRoutineReminders.ts`.
