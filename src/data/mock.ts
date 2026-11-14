/*
  DATOS DE DEMOSTRACIÓN. Las cifras y textos no son umbrales validados:
  se sustituyen por el motor de evaluación y el contenido médico con fuente.
*/
import type { Indicator, Mission, Notice, Zone } from '../types'

export const mission: Mission = {
  day: 47,
  place: 'Lunar transit',
  lastCheck: '07:10',
}

export const zones: Zone[] = [
  { id: 'head', name: 'Head and rest', about: 'Sleep, mood and vision. Isolation shifts sleep and mood; fluids moving toward the head can affect your eyes.' },
  { id: 'heart', name: 'Heart and circulation', about: 'Blood pressure and heart rate. Fluids shift toward the upper body in low gravity.' },
  { id: 'metabolism', name: 'Metabolism', about: 'Blood sugar. Diet and activity change how your body uses energy on a mission.' },
  { id: 'body', name: 'Whole body', about: 'Body temperature. An early sign of infection in a closed cabin.' },
  { id: 'legs', name: 'Bones and muscles', about: 'Without gravity, bones and muscles weaken unless you exercise.' },
]

export const indicators: Indicator[] = [
  { id: 'bp', name: 'Blood pressure', value: '128/82', unit: 'mmHg', status: 'ok', reason: '', zone: 'heart', history: [126, 128, 125, 129, 127, 130, 128] },
  { id: 'hr', name: 'Heart rate', value: '64', unit: 'bpm', status: 'ok', reason: '', zone: 'heart', history: [65, 63, 66, 64, 65, 63, 64] },
  { id: 'glucose', name: 'Blood sugar', value: '96', unit: 'mg/dL', status: 'ok', reason: '', zone: 'metabolism', history: [98, 93, 97, 94, 99, 95, 96] },
  { id: 'temp', name: 'Body temperature', value: '36.7', unit: '°C', status: 'ok', reason: '', zone: 'body', history: [36.6, 36.6, 36.7, 36.5, 36.6, 36.6, 36.7] },
  { id: 'sleep', name: 'Sleep', value: '5.2', unit: 'hours', status: 'watch', reason: '3 short nights', zone: 'head', history: [7.4, 7.2, 7.4, 6.8, 5.6, 5.3, 5.2] },
  { id: 'mood', name: 'Mood', value: '2', unit: 'of 5', status: 'watch', reason: 'below your usual', zone: 'head', history: [4, 4, 4, 3, 3, 2, 2] },
  // Respuesta sí/no del chequeo, sin tendencia numérica.
  { id: 'vision', name: 'Vision', value: 'No change', unit: '', status: 'ok', reason: '', zone: 'head', history: [] },
  { id: 'exercise', name: 'Exercise', value: '85', unit: 'min today', status: 'ok', reason: '', zone: 'legs', history: [90, 80, 95, 0, 90, 85, 85] },
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
