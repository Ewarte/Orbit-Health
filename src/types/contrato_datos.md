Documentación del Contrato de Datos: Monitor Médico Orbital
Este documento define la estructura de datos (SpaceHealthRecord) que conecta el Motor de Evaluación (R3) con la Interfaz Visual (R4). Las métricas seleccionadas están fundamentadas en los riesgos biomédicos oficiales establecidos por la NASA y la Agencia Espacial Canadiense (CSA).

1. Estructura de Datos (src/types/index.ts)
El sistema utiliza 3 estados visuales estrictos para evaluar la salud del astronauta sin necesidad de conexión a internet.

TypeScript
// Estados de Alerta (Terminología aeroespacial)
export type AlertLevel = 'nominal' | 'warning' | 'critical'; 

// Estructura base de cada indicador
export interface AstronautMetric {
  value: number;
  unit: string;
  status: AlertLevel;
}

// Registro principal de Salud
export interface SpaceHealthRecord {
  id: string;             // Identificador único del registro (ej. UUID)
  timestamp: string;      // Fecha y hora del registro (ISO 8601)
  
  metrics: {
    heartRate: AstronautMetric;       // Frecuencia Cardíaca
    bloodOxygen: AstronautMetric;     // Saturación de Oxígeno
    radiationDose: AstronautMetric;   // Dosis de Radiación
    cognitiveStress: AstronautMetric; // Nivel de Estrés Cognitivo
    boneDensity: AstronautMetric;     // Densidad Ósea
    sleepQuality: AstronautMetric;    // Calidad del Sueño
  };

  overallStatus: AlertLevel; // Estado general consolidado
  protocolAction: string;    // Acción sugerida para emergencias offline
}
2. Justificación Científica de los 6 Indicadores (Fuentes NASA / CSA)
Cada métrica del contrato responde directamente a un riesgo documentado en el Programa de Investigación Humana (HRP) de la NASA y a las investigaciones de radiación de la CSA.

Métrica	Riesgo Oficial (NASA/CSA)	Justificación para el Monitoreo
Frecuencia Cardíaca (heartRate)	Risk of Cardiovascular Adaptations	La ingravidez altera la circulación sanguínea y la función cardíaca. Requiere monitoreo para evitar eventos adversos.
Oxígeno - SpO2 (bloodOxygen)	Risk of Hypoxia / Decompression Sickness	Transiciones de presión en la cabina o durante caminatas espaciales (EVA) generan riesgos de hipoxia tisular leve o severa.
Radiación (radiationDose)	Risk of Radiation-Induced Cancers	La radiación de neutrones en órbita (30% del total en la ISS) causa daño biológico acumulativo. Monitoreo fundamental (Proyecto CANS - CSA).
Estrés Cognitivo (cognitiveStress)	Risk of Behavioral Changes	El aislamiento prolongado, el confinamiento y la distancia de la Tierra afectan severamente el rendimiento mental de la tripulación.
Densidad Ósea (boneDensity)	Risk of Spaceflight-Induced Bone Changes	La falta de gravedad constante descompone la estructura ósea, haciéndola quebradiza (T-Score) y aumentando el riesgo de fracturas.
Calidad de Sueño (sleepQuality)	Risk of Inadequate Sleep	Horarios irregulares y altos niveles de estrés causan fatiga crónica. Es crucial medir el descanso para evitar fallos humanos operativos.
3. Reglas de Integración (Flujo R3 -> R4)
Ingreso de Datos (R5): El astronauta registra sus datos crudos o el sistema los lee del almacenamiento local.

Evaluación del Motor (R3): El motor lee los datos y, basado en umbrales médicos, asigna un status (nominal, warning, critical) a cada métrica, calcula el overallStatus (el estado más grave encontrado) e inyecta un protocolAction.

Renderizado de Interfaz (R4): La interfaz recibe el objeto SpaceHealthRecord y pinta dinámicamente:

Verde (Nominal)

Amarillo (Warning)

Rojo intermitente (Critical) en la figura humana interactiva y en las tarjetas correspondientes.