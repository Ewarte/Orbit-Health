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
  'mission.saved': 'Contexto de la misión guardado en este dispositivo.',
  'mission.offline': 'El modo sin conexión está activo. Los registros, el contexto de la misión y la telemetría simulada se quedan en este dispositivo.',

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

  'holo.title': 'Holograma biométrico 3D',
  'holo.sectionLabel': 'Holograma 3D interactivo',
  'holo.canvasLabel': 'Modelo 3D del cuerpo. Toca una zona para ver sus lecturas.',
  'holo.version.label': 'Versión del holograma',
  'holo.version.a': 'Versión A',
  'holo.version.b': 'Versión B',
  'holo.version.aHint': 'Malla de alambre',
  'holo.version.bHint': 'Órganos',
  'holo.resetView': 'Reiniciar vista',
  'holo.pause': 'Pausar giro',
  'holo.resume': 'Reanudar giro',
  'holo.active': 'Medición activa',
  'holo.noReadings': 'Aún no hay lecturas de esta zona.',
  'holo.zone': 'Zona',
  'holo.hint': 'Toca el cuerpo o un punto brillante',
  'holo.loading': 'Cargando el modelo…',
  'holo.status.ok': 'Normal',
  'holo.status.watch': 'Vigilar',
  'holo.status.act': 'Actuar ya',
  'holo.attribution': 'Modelo: BodyParts3D, © The Database Center for Life Science, licencia CC BY 4.0.',
  'holo.zone.head.label': 'Cerebro',
  'holo.zone.head.name': 'Cerebro y conducta',
  'holo.zone.heart.label': 'Corazón',
  'holo.zone.heart.name': 'Corazón y circulación',
  'holo.zone.metabolism.label': 'Metabolismo',
  'holo.zone.metabolism.name': 'Metabolismo',
  'holo.zone.body.label': 'Cuerpo / piel',
  'holo.zone.body.name': 'Cuerpo entero',
  'holo.zone.legs.label': 'Huesos / piernas',
  'holo.zone.legs.name': 'Huesos y músculos',
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
  'mission.saved': 'Mission context saved on this device.',
  'mission.offline': 'Offline mode is active. Records, mission context and simulated telemetry stay on this device.',

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

  'holo.title': '3D biometric hologram',
  'holo.sectionLabel': 'Interactive 3D hologram',
  'holo.canvasLabel': '3D model of the body. Tap a zone to see its readings.',
  'holo.version.label': 'Hologram version',
  'holo.version.a': 'Version A',
  'holo.version.b': 'Version B',
  'holo.version.aHint': 'Wireframe',
  'holo.version.bHint': 'Organs',
  'holo.resetView': 'Reset view',
  'holo.pause': 'Pause rotation',
  'holo.resume': 'Resume rotation',
  'holo.active': 'Active measurement',
  'holo.noReadings': 'No readings for this zone yet.',
  'holo.zone': 'Zone',
  'holo.hint': 'Tap the body or a glowing dot',
  'holo.loading': 'Loading the model…',
  'holo.status.ok': 'Normal',
  'holo.status.watch': 'Watch',
  'holo.status.act': 'Act now',
  'holo.attribution': 'Model: BodyParts3D, © The Database Center for Life Science, licensed under CC BY 4.0.',
  'holo.zone.head.label': 'Brain',
  'holo.zone.head.name': 'Brain & behavior',
  'holo.zone.heart.label': 'Heart',
  'holo.zone.heart.name': 'Heart & circulation',
  'holo.zone.metabolism.label': 'Metabolism',
  'holo.zone.metabolism.name': 'Metabolism',
  'holo.zone.body.label': 'Body / skin',
  'holo.zone.body.name': 'Whole body',
  'holo.zone.legs.label': 'Bones / legs',
  'holo.zone.legs.name': 'Bones & muscles',
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
  return simulation.includes(place) ? messages[lang]['mission.simulationPlace'] : place
}
