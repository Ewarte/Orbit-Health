/*
  Idiomas de la app: español (por defecto) e inglés.
  Cada texto visible vive en `messages`, con la misma clave en los dos idiomas.
  Los componentes no deben escribir textos sueltos: usan `t('clave')`.
*/

export type Lang = 'es' | 'en'

export const LANG_STORAGE_KEY = 'orbit_health_lang'

const es = {
  'nav.today': 'Hoy',
  'nav.check': 'Chequeo diario',
  'nav.trends': 'Tendencias',
  'nav.guidance': 'Orientación',
  'nav.routine': 'Rutina',
  'nav.mission': 'Misión',

  'shell.title': 'Salud de la tripulación',
  'shell.navLabel': 'Principal',
  'shell.notBuilt': 'Aún no está construida',
  'shell.offline': 'Sin enlace con tierra. Todo funciona en este dispositivo.',
  'shell.language': 'Idioma',
  'shell.switchTo': 'Cambiar a inglés',

  'mission.eyebrow': 'Configuración de la misión',
  'mission.title': 'Contexto de la misión',
  'mission.intro': 'Esta información se guarda en el dispositivo y sigue disponible sin enlace con tierra.',
  'mission.day': 'Día de la misión',
  'mission.place': 'Ubicación',
  'mission.save': 'Guardar misión',
  'mission.loadSimulation': 'Cargar simulación de 47 días',
  'mission.simulationPlace': 'Tránsito lunar',
  'mission.stationPlace': 'Estación Espacial Internacional',
  'mission.saved': 'Contexto de la misión guardado en este dispositivo.',
  'mission.offline': 'El modo sin conexión está activo. Los registros, el contexto de la misión y la telemetría simulada se quedan en este dispositivo.',
  'mission.launch': 'Despegue (UTC)',
  'mission.launchHelp': 'Fecha y hora del despegue en UTC. La app no usa la zona horaria del dispositivo.',
  'mission.environment': 'Entorno de la misión',
  'mission.env.capsule': 'Cápsula',
  'mission.env.capsule.about': 'Cápsula en ascenso o acoplada; se usa UTC y tiempo de misión (MET).',
  'mission.env.station': 'Estación espacial',
  'mission.env.station.about': 'La tripulación vive en hora UTC (GMT), como en la ISS.',
  'mission.env.transit': 'Tránsito',
  'mission.env.transit.about': 'Viaje entre mundos; se usa UTC y tiempo de misión (MET).',
  'mission.env.moon': 'Luna',
  'mission.env.moon.about': 'Superficie o órbita lunar; se usa UTC y MET.',
  'mission.env.mars': 'Marte',
  'mission.env.mars.about': 'Superficie de Marte; se usa el sol y la hora solar local.',
  'mission.arrival': 'Llegada a la superficie (UTC, opcional)',
  'mission.marsLongitude': 'Longitud este del sitio (grados)',
  'mission.marsLongitudeHelp': 'Por defecto 77,45: Jezero, sitio de Perseverance.',
  'mission.clock.title': 'Reloj de la misión',
  'mission.clock.utc': 'Hora UTC',
  'mission.clock.utcStation': 'Hora UTC (la de la tripulación)',
  'mission.clock.date': 'Fecha UTC',
  'mission.clock.met': 'Tiempo de misión (MET)',
  'mission.clock.flightDay': 'Día de vuelo',
  'mission.clock.sleep': 'Ventana de sueño de referencia 21:30–06:00 GMT',
  'mission.clock.sleepIn': 'Ahora es horario de sueño.',
  'mission.clock.sleepOut': 'Ahora es horario de vigilia.',
  'mission.clock.sleepSource': 'Fuente: NASA NTRS 20240002094.',
  'mission.clock.moonNotice': 'No existe aún una hora lunar oficial; NASA la sigue investigando (oct. 2026). Se usa UTC.',
  'mission.clock.sol': 'Número de sol',
  'mission.clock.solNone': 'Sin fecha de llegada',
  'mission.clock.mtc': 'Hora de Marte coordinada (MTC)',
  'mission.clock.lmst': 'Hora solar local (LMST)',
  'mission.clock.marsHours': 'horas marcianas',
  'mission.clock.note': 'Cálculos propios a partir de definiciones de NASA; ver docs/INVESTIGACION-TIEMPO.md',
  'routine.clockLabel': 'Reloj de la rutina: {label}',

  'routine.eyebrow': 'Rutina diaria',
  'routine.title': 'Rutina de hoy',
  'routine.intro': 'Mantén a la vista las contramedidas esenciales y márcalas cuando las completes.',
  'routine.progress': '{done} de {total} completadas',
  'routine.reset': 'Reiniciar',
  'routine.task.check': 'Completar el chequeo diario de salud',
  'routine.task.exercise': 'Sesión de resistencia y movilidad',
  'routine.task.review': 'Revisar alertas y orientación',
  'routine.task.sleep': 'Rutina de luces bajas en la cabina',
  'routine.reminders.title': 'Recordatorios',
  'routine.reminders.note': 'Los avisos suenan a la hora de cada tarea mientras la app esté abierta.',
  'routine.reminders.on': 'Recordatorio activado para «{task}». Pulsa para desactivarlo.',
  'routine.reminders.off': 'Recordatorio desactivado para «{task}». Pulsa para activarlo.',
  'routine.reminders.dueTitle': 'Es hora de',
  'routine.reminders.dismiss': 'Entendido',
  'routine.reminders.enableSystem': 'Activar avisos del sistema',
  'routine.reminders.systemOn': 'Avisos del sistema activados.',
  'routine.reminders.systemDenied': 'El sistema bloqueó los avisos. Los recordatorios se verán solo dentro de la app.',
  'routine.reminders.systemUnsupported': 'Este dispositivo no admite avisos del sistema. Los recordatorios se verán dentro de la app.',
  'guidance.eyebrow': 'Protocolo sin conexión',
  'guidance.title': 'Qué hacer ahora',
  'guidance.intro': 'Sigue los pasos en orden. Si los síntomas son graves, usa de inmediato el protocolo médico de la tripulación.',
  'guidance.count.one': '1 indicador necesita atención',
  'guidance.count.other': '{n} indicadores necesitan atención',
  'guidance.status.watch': 'Vigilar',
  'guidance.status.act': 'Actuar ya',
  'guidance.current': 'Valor actual',
  'guidance.meaning': 'Qué significa',
  'guidance.doNow': 'Haz esto ahora',
  'guidance.ifWorse': 'Si empeora',
  'guidance.prevent': 'Cómo prevenirlo',
  'guidance.notify': 'A quién avisar',
  'guidance.source': 'Fuente',
  'guidance.basis.nasa': 'Basado en fichas de NASA',
  'guidance.basis.team': 'Deducción del equipo: NASA no cubre este indicador',
  'guidance.draft': 'Borrador por revisar',
  'guidance.generic.meaning': 'Este indicador está fuera de lo habitual.',
  'guidance.generic.doNow': 'Repite la medición después de descansar.',
  'guidance.generic.ifWorse': 'Sigue el protocolo médico de la tripulación.',
  'guidance.generic.notify': 'Oficial médico de la tripulación',
  'guidance.empty.title': 'Todo en orden',
  'guidance.empty.body': 'Ningún indicador necesita atención ahora. Estas son las costumbres que ayudan a mantenerlos así.',
  'guidance.footer': 'Recordatorio: esta orientación se guarda en este dispositivo y no sustituye el protocolo médico aprobado. Es un borrador del equipo pendiente de revisión médica.',
} as const

export type MessageKey = keyof typeof es

const en: Record<MessageKey, string> = {
  'nav.today': 'Today',
  'nav.check': 'Daily check',
  'nav.trends': 'Trends',
  'nav.guidance': 'Guidance',
  'nav.routine': 'Routine',
  'nav.mission': 'Mission',

  'shell.title': 'Crew health',
  'shell.navLabel': 'Main',
  'shell.notBuilt': 'Not built yet',
  'shell.offline': 'No ground link. Everything runs on this device.',
  'shell.language': 'Language',
  'shell.switchTo': 'Switch to Spanish',

  'mission.eyebrow': 'Mission configuration',
  'mission.title': 'Mission context',
  'mission.intro': 'This information is stored on the device and remains available without a ground link.',
  'mission.day': 'Mission day',
  'mission.place': 'Location',
  'mission.save': 'Save mission',
  'mission.loadSimulation': 'Load 47-day simulation',
  'mission.simulationPlace': 'Lunar transit',
  'mission.stationPlace': 'International Space Station',
  'mission.saved': 'Mission context saved on this device.',
  'mission.offline': 'Offline mode is active. Records, mission context and simulated telemetry stay on this device.',
  'mission.launch': 'Launch (UTC)',
  'mission.launchHelp': 'Launch date and time in UTC. The app does not use the device time zone.',
  'mission.environment': 'Mission environment',
  'mission.env.capsule': 'Capsule',
  'mission.env.capsule.about': 'Capsule ascending or docked; UTC and mission elapsed time (MET) are used.',
  'mission.env.station': 'Space station',
  'mission.env.station.about': 'The crew lives on UTC (GMT), as on the ISS.',
  'mission.env.transit': 'Transit',
  'mission.env.transit.about': 'Travel between worlds; UTC and mission elapsed time (MET) are used.',
  'mission.env.moon': 'Moon',
  'mission.env.moon.about': 'Lunar surface or orbit; UTC and MET are used.',
  'mission.env.mars': 'Mars',
  'mission.env.mars.about': 'Martian surface; the sol and local solar time are used.',
  'mission.arrival': 'Surface arrival (UTC, optional)',
  'mission.marsLongitude': 'Site east longitude (degrees)',
  'mission.marsLongitudeHelp': 'Default 77.45: Jezero, Perseverance’s site.',
  'mission.clock.title': 'Mission clock',
  'mission.clock.utc': 'UTC time',
  'mission.clock.utcStation': 'UTC time (the crew’s time)',
  'mission.clock.date': 'UTC date',
  'mission.clock.met': 'Mission elapsed time (MET)',
  'mission.clock.flightDay': 'Flight day',
  'mission.clock.sleep': 'Reference sleep window 21:30–06:00 GMT',
  'mission.clock.sleepIn': 'It is sleep time now.',
  'mission.clock.sleepOut': 'It is awake time now.',
  'mission.clock.sleepSource': 'Source: NASA NTRS 20240002094.',
  'mission.clock.moonNotice': 'There is no official lunar time yet; NASA is still researching it (Oct. 2026). UTC is used.',
  'mission.clock.sol': 'Sol number',
  'mission.clock.solNone': 'No arrival date',
  'mission.clock.mtc': 'Mars Coordinated Time (MTC)',
  'mission.clock.lmst': 'Local mean solar time (LMST)',
  'mission.clock.marsHours': 'Martian hours',
  'mission.clock.note': 'Own calculations from NASA definitions; see docs/INVESTIGACION-TIEMPO.md',
  'routine.clockLabel': 'Routine clock: {label}',

  'routine.eyebrow': 'Daily routine',
  'routine.title': 'Today’s routine',
  'routine.intro': 'Keep the essential countermeasures visible and mark them as you complete them.',
  'routine.progress': '{done} of {total} complete',
  'routine.reset': 'Reset',
  'routine.task.check': 'Complete the daily health check',
  'routine.task.exercise': 'Resistance and mobility session',
  'routine.task.review': 'Review alerts and guidance',
  'routine.task.sleep': 'Cabin lights-down routine',
  'routine.reminders.title': 'Reminders',
  'routine.reminders.note': 'Alerts sound at each task’s time while the app is open.',
  'routine.reminders.on': 'Reminder on for “{task}”. Press to turn it off.',
  'routine.reminders.off': 'Reminder off for “{task}”. Press to turn it on.',
  'routine.reminders.dueTitle': 'It’s time for',
  'routine.reminders.dismiss': 'Got it',
  'routine.reminders.enableSystem': 'Turn on system alerts',
  'routine.reminders.systemOn': 'System alerts are on.',
  'routine.reminders.systemDenied': 'The system blocked alerts. Reminders will only show inside the app.',
  'routine.reminders.systemUnsupported': 'This device does not support system alerts. Reminders will show inside the app.',

  'guidance.eyebrow': 'Offline protocol',
  'guidance.title': 'What to do next',
  'guidance.intro': 'Follow the steps in order. If symptoms are severe, use the crew medical protocol immediately.',
  'guidance.count.one': '1 indicator needs attention',
  'guidance.count.other': '{n} indicators need attention',
  'guidance.status.watch': 'Watch',
  'guidance.status.act': 'Act now',
  'guidance.current': 'Current value',
  'guidance.meaning': 'What it means',
  'guidance.doNow': 'Do this now',
  'guidance.ifWorse': 'If it gets worse',
  'guidance.prevent': 'How to prevent it',
  'guidance.notify': 'Who to notify',
  'guidance.source': 'Source',
  'guidance.basis.nasa': 'Based on NASA risk pages',
  'guidance.basis.team': 'Team inference: NASA does not cover this indicator',
  'guidance.draft': 'Draft pending review',
  'guidance.generic.meaning': 'This indicator is outside the usual range.',
  'guidance.generic.doNow': 'Repeat the reading after resting.',
  'guidance.generic.ifWorse': 'Follow the crew medical protocol.',
  'guidance.generic.notify': 'Crew medical officer',
  'guidance.empty.title': 'All clear',
  'guidance.empty.body': 'No indicator needs attention right now. These habits help keep it that way.',
  'guidance.footer': 'Reminder: this guidance is stored on this device and does not replace the approved medical protocol. It is a team draft pending medical review.',
}

export const messages: Record<Lang, Record<MessageKey, string>> = { es, en }

/**
 * Elige el idioma inicial: primero el que la persona guardó con el botón;
 * si no hay, el del sistema cuando es inglés; en cualquier otro caso, español.
 */
export function detectLanguage(saved: string | null, systemLanguages: readonly string[]): Lang {
  if (saved === 'es' || saved === 'en') return saved
  const first = systemLanguages[0]?.toLowerCase() ?? ''
  return first.startsWith('en') ? 'en' : 'es'
}

/** Devuelve el texto en el idioma pedido y rellena los huecos `{nombre}`. */
export function translate(lang: Lang, key: MessageKey, params?: Record<string, string | number>): string {
  const text = messages[lang][key]
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
}

/**
 * La ubicación de la misión es texto libre. Si es la de la simulación (guardada en cualquiera de
 * los dos idiomas), se muestra en el idioma activo; cualquier otro texto se respeta tal cual.
 */
export function localizePlace(place: string, lang: Lang): string {
  const simulation = [messages.es['mission.simulationPlace'], messages.en['mission.simulationPlace'], 'Lunar transit']
  if (simulation.includes(place)) return messages[lang]['mission.simulationPlace']
  const station = [messages.es['mission.stationPlace'], messages.en['mission.stationPlace']]
  return station.includes(place) ? messages[lang]['mission.stationPlace'] : place
}
