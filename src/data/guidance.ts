/*
  Orientación por indicador: qué significa, qué hacer, qué hacer si empeora, cómo prevenir y a quién avisar.

  BORRADOR POR REVISAR. Lo redactó el equipo de producto a partir de las fichas de riesgo de NASA
  (ver docs/FUENTES.md, secciones 5 y 8). No sustituye el protocolo médico aprobado, y NASA no da
  criterios de «cuándo avisar»: esa parte es siempre una propuesta del equipo.

  Cada entrada dice en qué se basa (`basis`):
  - 'nasa': la ficha de NASA da la causa y las contramedidas.
  - 'team': la fuente no cubre este indicador; la explicación es una deducción del equipo.
*/
import type { Lang } from '../lib/i18n'

export type Bilingual = Record<Lang, string>
export type BilingualList = Record<Lang, string[]>

export interface GuidanceEntry {
  indicatorId: string
  name: Bilingual
  basis: 'nasa' | 'team'
  meaning: Bilingual
  doNow: BilingualList
  ifWorse: BilingualList
  prevent: BilingualList
  notify: Bilingual
  source: { label: string; url: string }
}

const MEDICAL_OFFICER: Bilingual = {
  es: 'Oficial médico de la tripulación y cirujano de vuelo',
  en: 'Crew medical officer and flight surgeon',
}

export const guidanceEntries: GuidanceEntry[] = [
  {
    indicatorId: 'sleep',
    name: { es: 'Sueño', en: 'Sleep' },
    basis: 'nasa',
    meaning: {
      es: 'Dormir poco empeora el rendimiento y la salud. En el espacio influyen la sobrecarga de trabajo, la luz irregular y el reloj biológico desajustado.',
      en: 'Short sleep lowers performance and health. In space it is driven by heavy workload, irregular light and a disrupted body clock.',
    },
    doNow: {
      es: ['Baja las luces de la cabina una hora antes de dormir.', 'Evita la cafeína después del mediodía.', 'Respeta tu hora fija de descanso hoy.'],
      en: ['Dim the cabin lights one hour before sleep.', 'Avoid caffeine after midday.', 'Keep your fixed rest time today.'],
    },
    ifWorse: {
      es: ['Avisa a tu tripulación si esta noche también duermes poco.', 'Avisa al oficial médico si el cansancio afecta una tarea crítica.'],
      en: ['Tell your crew if tonight is also short.', 'Tell the medical officer if fatigue affects a critical task.'],
    },
    prevent: {
      es: ['Horarios de descanso fijos.', 'Luz que imita el día y la noche.'],
      en: ['Fixed rest times.', 'Lighting that mimics day and night.'],
    },
    notify: { es: 'Líder de salud de la tripulación y oficial médico', en: 'Crew health lead and medical officer' },
    source: { label: 'NASA — Risk from inadequate sleep and irregular schedules', url: 'https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/' },
  },
  {
    indicatorId: 'mood',
    name: { es: 'Ánimo', en: 'Mood' },
    basis: 'nasa',
    meaning: {
      es: 'El aislamiento, la poca privacidad, la monotonía y el retraso en las comunicaciones pueden causar ansiedad o ánimo bajo, y afectan al sueño y a las decisiones.',
      en: 'Isolation, little privacy, monotony and communication delays can cause anxiety or low mood, and affect sleep and decisions.',
    },
    doNow: {
      es: ['Escribe en tu diario personal.', 'Habla con un compañero o con tu familia.', 'Busca un rato de privacidad y cuida las plantas, si hay.'],
      en: ['Write in your personal journal.', 'Talk with a crewmate or with family.', 'Take some private time and tend the plants, if any.'],
    },
    ifWorse: {
      es: ['Si el ánimo bajo dura varios días, habla con el oficial médico o con el apoyo de conducta en tierra.'],
      en: ['If low mood lasts several days, talk to the medical officer or ground behavioral support.'],
    },
    prevent: {
      es: ['Contacto regular con familia y profesionales.', 'Rutinas con variedad y momentos propios.'],
      en: ['Regular contact with family and professionals.', 'Varied routines and time of your own.'],
    },
    notify: { es: 'Oficial médico y apoyo de conducta en tierra', en: 'Medical officer and ground behavioral support' },
    source: { label: 'NASA — Risk of behavioral conditions and psychiatric disorders', url: 'https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/' },
  },
  {
    indicatorId: 'bp',
    name: { es: 'Presión arterial', en: 'Blood pressure' },
    basis: 'nasa',
    meaning: {
      es: 'En baja gravedad los líquidos suben hacia el pecho y la cabeza y el corazón y los vasos se adaptan. Eso puede alterar la presión arterial.',
      en: 'In low gravity fluids shift toward the chest and head and the heart and vessels adapt. This can change blood pressure.',
    },
    doNow: {
      es: ['Descansa sentado cinco minutos y repite la medición.', 'Bebe agua.', 'No hagas esfuerzo intenso hasta repetirla.'],
      en: ['Rest seated for five minutes and repeat the reading.', 'Drink water.', 'Avoid strenuous effort until you have repeated it.'],
    },
    ifWorse: {
      es: ['Si sientes mareo o desmayo, siéntate o acuéstate y avisa de inmediato.', 'Avisa al oficial médico si el valor sigue fuera de rango.'],
      en: ['If you feel dizzy or faint, sit or lie down and report it right away.', 'Tell the medical officer if the value stays out of range.'],
    },
    prevent: {
      es: ['Ejercicio regular.', 'Buena alimentación e hidratación.'],
      en: ['Regular exercise.', 'Good nutrition and hydration.'],
    },
    notify: MEDICAL_OFFICER,
    source: { label: 'NASA — Risk of cardiovascular adaptations', url: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/' },
  },
  {
    indicatorId: 'hr',
    name: { es: 'Frecuencia cardíaca', en: 'Heart rate' },
    basis: 'nasa',
    meaning: {
      es: 'El corazón cambia en baja gravedad (se vuelve más esférico) y trabaja distinto. Puede haber arritmias o frecuencia fuera de lo usual.',
      en: 'The heart changes in low gravity (it becomes more spherical) and works differently. Rhythm changes or an unusual rate can appear.',
    },
    doNow: {
      es: ['Descansa cinco minutos y repite la medición.', 'Anota si hiciste ejercicio o tomaste cafeína antes.'],
      en: ['Rest for five minutes and repeat the reading.', 'Note whether you exercised or had caffeine beforehand.'],
    },
    ifWorse: {
      es: ['Si hay dolor en el pecho, falta de aire o desmayo, para toda actividad y usa el protocolo médico de la tripulación.', 'Avisa al oficial médico si sigue fuera de rango.'],
      en: ['If there is chest pain, shortness of breath or fainting, stop all activity and use the crew medical protocol.', 'Tell the medical officer if it stays out of range.'],
    },
    prevent: {
      es: ['Ejercicio aeróbico y de fuerza casi a diario.', 'Dieta equilibrada.'],
      en: ['Aerobic and resistance exercise almost daily.', 'A balanced diet.'],
    },
    notify: MEDICAL_OFFICER,
    source: { label: 'NASA — Risk of cardiovascular adaptations', url: 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/' },
  },
  {
    indicatorId: 'glucose',
    name: { es: 'Glucosa', en: 'Blood sugar' },
    basis: 'team',
    meaning: {
      es: 'Con comida de larga duración, poca variedad y menos movimiento, el cuerpo puede regular peor el azúcar. NASA no desarrolla este indicador: la explicación es una deducción del equipo.',
      en: 'With long-duration food, little variety and less movement, the body may regulate sugar less well. NASA does not cover this indicator: this explanation is the team’s inference.',
    },
    doNow: {
      es: ['Repite la medición.', 'Revisa qué comiste y cuándo.', 'Bebe agua.'],
      en: ['Repeat the reading.', 'Review what you ate and when.', 'Drink water.'],
    },
    ifWorse: {
      es: ['Si hay mareo, sed intensa, confusión o debilidad, avisa de inmediato.', 'Avisa al oficial médico si el valor sigue fuera de rango.'],
      en: ['If there is dizziness, intense thirst, confusion or weakness, report it right away.', 'Tell the medical officer if the value stays out of range.'],
    },
    prevent: {
      es: ['Dieta variada y comidas a horas regulares.', 'Ejercicio diario.'],
      en: ['Varied diet and regular meal times.', 'Daily exercise.'],
    },
    notify: MEDICAL_OFFICER,
    source: { label: 'NASA — Risk of inadequate food and nutrition (no menciona la glucosa / does not mention glucose)', url: 'https://www.nasa.gov/reference/risk-of-inadequate-food-and-nutrition/' },
  },
  {
    indicatorId: 'temp',
    name: { es: 'Temperatura corporal', en: 'Body temperature' },
    basis: 'team',
    meaning: {
      es: 'En una nave cerrada los microbios pasan con facilidad de una persona a otra y el sistema inmune cambia. Una temperatura fuera de lo usual puede ser señal de infección. NASA no habla de fiebre: la explicación es una deducción del equipo.',
      en: 'In a closed spacecraft microbes pass easily between people and the immune system changes. A temperature outside the usual range can signal infection. NASA does not cover fever: this explanation is the team’s inference.',
    },
    doNow: {
      es: ['Repite la medición en unos minutos.', 'Descansa y bebe agua.', 'Reduce el contacto cercano con la tripulación mientras tanto.'],
      en: ['Repeat the reading in a few minutes.', 'Rest and drink water.', 'Limit close contact with the crew in the meantime.'],
    },
    ifWorse: {
      es: ['Avisa al oficial médico si la temperatura sigue fuera de rango o aparecen otros síntomas.'],
      en: ['Tell the medical officer if the temperature stays out of range or other symptoms appear.'],
    },
    prevent: {
      es: ['Higiene de manos y superficies.', 'Buen sueño y manejo del estrés, que ayudan a las defensas.'],
      en: ['Hand and surface hygiene.', 'Good sleep and stress management, which support the immune system.'],
    },
    notify: MEDICAL_OFFICER,
    source: { label: 'NASA — Risk of altered immune system responses (no menciona la fiebre / does not mention fever)', url: 'https://www.nasa.gov/reference/risk-of-altered-immune-system-responses/' },
  },
  {
    indicatorId: 'vision',
    name: { es: 'Visión', en: 'Vision' },
    basis: 'nasa',
    meaning: {
      es: 'Los líquidos suben hacia la cabeza y pueden causar cambios en el ojo y el nervio óptico (síndrome SANS). Es una pregunta del chequeo, no una medición.',
      en: 'Fluids shift toward the head and can cause changes in the eye and optic nerve (SANS). This is a check-in question, not a measurement.',
    },
    doNow: {
      es: ['Anota qué cambio notas y desde cuándo.', 'Repite la autoevaluación más tarde.'],
      en: ['Note what change you see and since when.', 'Repeat the self-check later.'],
    },
    ifWorse: {
      es: ['Avisa al oficial médico si la visión empeora o el cambio dura más de un día. Puede pedirte una imagen de la retina.'],
      en: ['Tell the medical officer if vision worsens or the change lasts more than a day. They may ask for a retina image.'],
    },
    prevent: {
      es: ['Seguir las contramedidas de la misión y el ejercicio diario.'],
      en: ['Follow the mission countermeasures and daily exercise.'],
    },
    notify: MEDICAL_OFFICER,
    source: { label: 'NASA — Risk of spaceflight-associated neuro-ocular syndrome (SANS)', url: 'https://www.nasa.gov/reference/risk-of-spaceflight-associated-neuro-ocular-syndrome-sans/' },
  },
  {
    indicatorId: 'exercise',
    name: { es: 'Ejercicio', en: 'Exercise' },
    basis: 'nasa',
    meaning: {
      es: 'Sin gravedad, huesos y músculos trabajan menos y se pierde fuerza y capacidad aeróbica. En la estación se hace ejercicio unas 1,5 horas al día, 6 a 7 días por semana.',
      en: 'Without gravity, bones and muscles work less and strength and aerobic capacity drop. On the station crews exercise about 1.5 hours a day, 6 to 7 days a week.',
    },
    doNow: {
      es: ['Completa tu sesión de fuerza y movilidad programada.', 'Registra los minutos al terminar.'],
      en: ['Complete your scheduled resistance and mobility session.', 'Log the minutes when you finish.'],
    },
    ifWorse: {
      es: ['Si hay dolor o lesión, pausa la actividad y avisa antes de cambiar el plan.', 'Si te saltas varios días, avisa al responsable de ejercicio.'],
      en: ['If there is pain or injury, pause and report before changing the plan.', 'If you skip several days, tell the exercise officer.'],
    },
    prevent: {
      es: ['Ejercicio de fuerza y aeróbico casi a diario.', 'Autoevaluaciones periódicas de forma física.'],
      en: ['Resistance and aerobic exercise almost daily.', 'Periodic fitness self-checks.'],
    },
    notify: { es: 'Responsable de ejercicio y oficial médico', en: 'Exercise officer and medical officer' },
    source: { label: 'NASA — Risk of reduced cardiorespiratory and musculoskeletal fitness', url: 'https://www.nasa.gov/reference/risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/' },
  },
]
