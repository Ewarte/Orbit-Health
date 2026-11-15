/*
  DATOS DE DEMOSTRACIÓN. Las cifras y textos no son umbrales validados:
  se sustituyen por el motor de evaluación y el contenido médico con fuente.
*/
import type {
  GuidanceProtocol,
  Indicator,
  Mission,
  MissionTrendPoint,
  Notice,
  RoutineTask,
  Zone,
} from '../types'

export const mission: Mission = {
  day: 47,
  place: 'Lunar transit',
  lastCheck: '07:10',
  phase: 'Translunar Coasting Phase',
  totalDays: 180,
  distanceEarthKm: 342800,
  distanceTargetKm: 41600,
  cabinPressureKpa: 101.3,
  cabinOxygenPercent: 20.9,
  cabinCo2Percent: 0.32,
  cabinTempCelsius: 21.4,
  radiationDoseTotalMsv: 16.8,
  crewReadinessIndex: 88,
  crewMembersCount: 4,
}

export const zones: Zone[] = [
  { id: 'head', name: 'Brain & behavior', about: 'Hazard: Isolation and confinement; shifting light cycles and work demands. NASA lists chronic sleep loss, constant work demands and irregular body clocks as risks, and notes that isolation, radiation and distance from Earth can take a toll on mental health.' },
  { id: 'heart', name: 'Heart & circulation', about: 'Blood pressure and heart rate. Microgravity causes bodily fluids to shift upward into the chest and head, altering cardiovascular workload.' },
  { id: 'metabolism', name: 'Metabolism & nutrition', about: 'Blood sugar and energy regulation. Microgravity and space diet alter how the body stores and utilizes metabolic fuel.' },
  { id: 'body', name: 'Whole body & immune', about: 'Body temperature and infection monitoring. Closed-loop spacecraft environments require close vigilance of immune responses.' },
  { id: 'legs', name: 'Bones & muscles', about: 'Bone density and muscle conditioning. In zero gravity, bones and muscles undergo rapid deconditioning without rigorous daily countermeasures.' },
]

export const indicators: Indicator[] = [
  { id: 'bp', name: 'Blood pressure', value: '128/82', unit: 'mmHg', status: 'ok', reason: '', zone: 'heart', history: [126, 128, 125, 129, 127, 130, 128] },
  { id: 'hr', name: 'Heart rate', value: '64', unit: 'bpm', status: 'ok', reason: '', zone: 'heart', history: [65, 63, 66, 64, 65, 63, 64] },
  { id: 'glucose', name: 'Blood sugar', value: '96', unit: 'mg/dL', status: 'ok', reason: '', zone: 'metabolism', history: [98, 93, 97, 94, 99, 95, 96] },
  { id: 'temp', name: 'Body temperature', value: '36.7', unit: '°C', status: 'ok', reason: '', zone: 'body', history: [36.6, 36.6, 36.7, 36.5, 36.6, 36.6, 36.7] },
  { id: 'sleep', name: 'Sleep', value: '5.8', unit: 'h', status: 'watch', reason: '3 short nights', zone: 'head', history: [7.4, 7.2, 7.4, 6.8, 5.6, 5.8, 5.8] },
  { id: 'mood', name: 'Mood', value: '3', unit: 'of 5', status: 'watch', reason: 'below your usual', zone: 'head', history: [4, 4, 4, 3, 3, 3, 3] },
  { id: 'vision', name: 'Vision', value: 'No change', unit: '', status: 'ok', reason: '', zone: 'head', history: [] },
  { id: 'exercise', name: 'Bone & muscle session', value: '45', unit: 'min today', status: 'watch', reason: 'Below 80 min orbital protocol', zone: 'legs', history: [90, 80, 85, 40, 50, 45, 45] },
]

export const notices: Notice[] = [
  {
    indicatorId: 'sleep',
    title: 'Sleep needs attention.',
    summary: 'Three short nights in a row. Short sleep lowers focus and mood.',
    steps: [
      'Dim cabin lights one hour before sleep',
      'No caffeine after midday',
      'Tell your crew if tonight is also short',
    ],
  },
]

export const defaultRoutineTasks: RoutineTask[] = [
  {
    id: 'tsk-01',
    title: 'Toma matutina de biométricas y cabina cuff',
    description: 'Registro de presión arterial, frecuencia en reposo y temperatura timpánica en Daily Check.',
    category: 'medical',
    timeStr: '07:15',
    durationMin: 15,
    completed: true,
    mandatory: true,
    impact: 'Base de telemetría médica diaria para el equipo de vuelo.',
    completedAt: '07:22',
  },
  {
    id: 'tsk-02',
    title: 'Sesión ARED: Contramedida de fuerza resistiva',
    description: 'Protocolo de sentadillas y peso muerto en ARED con carga axial a 2.5G simulados.',
    category: 'exercise',
    timeStr: '08:30',
    durationMin: 45,
    completed: true,
    mandatory: true,
    impact: 'Protección contra pérdida acelerada de densidad mineral ósea (fémur y columna lumbar).',
    completedAt: '09:15',
  },
  {
    id: 'tsk-03',
    title: 'Pack nutricional Alpha + Suplemento Vitamina D3',
    description: 'Ingesta calórica matutina controlada en sodio con 1000 UI de colecalciferol.',
    category: 'nutrition',
    timeStr: '10:15',
    durationMin: 15,
    completed: true,
    mandatory: false,
    impact: 'Mantenimiento del balance hidroelectrolítico y absorción de calcio.',
    completedAt: '10:28',
  },
  {
    id: 'tsk-04',
    title: 'Cardio T2: Cinta ergométrica supersónica (35 min restantes)',
    description: 'Completar los 35 minutos pendientes para alcanzar los 80 min reglamentarios de contramedida.',
    category: 'exercise',
    timeStr: '12:00',
    durationMin: 35,
    completed: false,
    mandatory: true,
    targetIndicatorId: 'exercise',
    impact: 'Mitigación del desacondicionamiento cardiovascular y atrofia de sóleo.',
  },
  {
    id: 'tsk-05',
    title: 'Inspección de filtros de regeneración CO2 (ECLSS)',
    description: 'Verificación del nivel de cartuchos de hidróxido de litio y flujo de recirculación.',
    category: 'cabin',
    timeStr: '14:30',
    durationMin: 20,
    completed: false,
    mandatory: true,
    impact: 'Control de presión parcial de CO2 (< 0.4%) para evitar cefalea y somnolencia.',
  },
  {
    id: 'tsk-06',
    title: 'Evaluación psicomotora y vigilancia cognitiva (PVT)',
    description: 'Test reactivo de 10 minutos para evaluar tiempo de respuesta y fatiga operativa.',
    category: 'medical',
    timeStr: '16:45',
    durationMin: 15,
    completed: false,
    mandatory: false,
    targetIndicatorId: 'mood',
    impact: 'Detección temprana de fatiga acumulada por déficit de sueño.',
  },
  {
    id: 'tsk-07',
    title: 'Protocolo de luz circadiana tenue (450nm) y ventilador personal',
    description: 'Atenuación lumínica en la cabina individual 60 min antes del horario de descanso.',
    category: 'rest',
    timeStr: '21:00',
    durationMin: 15,
    completed: false,
    mandatory: true,
    targetIndicatorId: 'sleep',
    impact: 'Inducción de secreción de melatonina y facilitación de fase de sueño profundo.',
  },
]

export function generateMissionTrends(currentDay = 47): MissionTrendPoint[] {
  const points: MissionTrendPoint[] = []

  for (let d = 1; d <= currentDay; d++) {
    const daysBack = currentDay - d
    const dateObj = new Date(2026, 10, 14 - daysBack)
    const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = dateObj.getDate()
    const dateStr = `${monthStr} ${dayNum < 10 ? '0' : ''}${dayNum}`

    // Distancia progresiva hacia la Luna (órbita / tránsito)
    const distanceEarthKm = Math.round((d / 50) * 350000 + Math.sin(d * 0.2) * 2000)

    // Radiación acumulada de la misión: ~0.36 mSv/día
    const cumulativeRadiationMsv = Number((d * 0.358 + Math.sin(d * 0.1) * 0.2).toFixed(2))

    // Presión de cabina nominal: ~101.3 kPa con mínimas variaciones operativas
    const cabinPressureKpa = Number((101.3 + Math.sin(d * 0.5) * 0.3).toFixed(1))

    // CO2 en cabina: oscila entre 0.29% y 0.36%
    const cabinCo2Percent = Number((0.31 + Math.cos(d * 0.3) * 0.04).toFixed(2))

    // Adherencia al ejercicio (%): ligera caída en los días 44-46 por fatiga
    let exerciseScore = Math.round(92 + Math.sin(d * 0.4) * 6)
    if (d >= 44 && d <= 46) exerciseScore = 65
    if (d === 47) exerciseScore = 72

    // Índice de preparación del astronauta (Readiness): 84 - 95%
    let readinessIndex = Math.round(92 + Math.cos(d * 0.3) * 5)
    if (d >= 45) readinessIndex = 86 // Refleja el cansancio acumulado

    points.push({
      day: d,
      dateStr,
      distanceEarthKm,
      cumulativeRadiationMsv,
      cabinPressureKpa,
      cabinCo2Percent,
      exerciseComplianceScore: exerciseScore,
      readinessIndex,
    })
  }

  return points
}

export const guidanceProtocols: GuidanceProtocol[] = [
  {
    id: 'prot-sleep-01',
    title: 'Contramedida Circadiana y Manejo de Fatiga (NASA HRP)',
    category: 'Descanso e Higiene del Sueño',
    targetRisk: 'Risk of Performance Decrements and Disorders Related to Sleep Loss',
    severity: 'watch',
    summary: 'Protocolo de intervención ante 3 o más noches con registro menor a 6 horas.',
    rationale: 'En microgravedad la ausencia de señales luminosas solares naturales y el ruido de ventilación en cabina alteran los husos de sueño REM y no-REM.',
    actionSteps: [
      'Atenuar luces de la cabina a longitud de onda cálida (espectro 450nm) al menos 60 minutos antes de ingresar a la cucheta.',
      'Cero cafeína o bebidas estimulantes después de las 13:00 UTC.',
      'Verificar sellado acústico y tapones de oído de microfibra de grado espacial.',
      'Si el déficit continúa por 4 noches, notificar al Cirujano de Vuelo y priorizar siesta programada de 30 minutos.',
    ],
    recommendedTaskTitle: 'Atenuación circadiana de luz en cabina 60m antes de dormir',
    recommendedCategory: 'rest',
    recommendedDurationMin: 15,
  },
  {
    id: 'prot-exercise-02',
    title: 'Recuperación de Volumen de Ejercicio Óseo/Muscular',
    category: 'Acondicionamiento Físico',
    targetRisk: 'Risk of Impaired Performance Due to Reduced Muscle Mass, Strength and Endurance',
    severity: 'watch',
    summary: 'Protocolo complementario cuando la sesión diaria queda por debajo de los 80 minutos objetivo.',
    rationale: 'Sin carga gravitatoria constante, el cuerpo experimenta una pérdida acelerada de masa muscular en sóleo y gemelos, además de resorción ósea de calcio.',
    actionSteps: [
      'Realizar una sesión fraccionada vespertina de 35 minutos en la cinta ergométrica T2.',
      'Mantener hidratación con solución isotónica (500 ml) durante la sesión.',
      'Registrar valores de esfuerzo percibido (RPE) en el panel de telemetría.',
    ],
    recommendedTaskTitle: 'Sesión complementaria en cinta T2 (35 min) para alcanzar protocolo',
    recommendedCategory: 'exercise',
    recommendedDurationMin: 35,
  },
  {
    id: 'prot-cardio-03',
    title: 'Vigilancia de Presión Arterial y Cefalización de Fluidos',
    category: 'Sistema Cardiovascular',
    targetRisk: 'Risk of Cardiovascular Adaptations & Orthostatic Intolerance',
    severity: 'ok',
    summary: 'Monitoreo de adaptación hemodinámica al desplazamiento de líquidos corporales.',
    rationale: 'Durante el tránsito lunar, el volumen central intravascular aumenta transitoriamente debido a la redistribución cefálica.',
    actionSteps: [
      'Monitorear presión diastólica y sistólica con manguito calibrado en reposo al despertar.',
      'Asegurar consumo de 2.2 litros de líquido filtrado a lo largo del día.',
      'Realizar ejercicios activos de flexión plantar para estimular retorno venoso.',
    ],
    recommendedTaskTitle: 'Medición cardiovascular vespertina post-entrenamiento',
    recommendedCategory: 'medical',
    recommendedDurationMin: 10,
  },
]
