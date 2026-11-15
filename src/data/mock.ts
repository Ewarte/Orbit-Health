/*
  DATOS DE DEMOSTRACIÓN. Las cifras y textos no son umbrales validados:
  se sustituyen por el motor de evaluación y el contenido médico con fuente.
*/
import { defaultMission } from '../lib/missionTime'
import type { Indicator, Mission, Notice, Zone } from '../types'

// Estación espacial, despegue 46 días antes de ahora (día de vuelo 47).
export const mission: Mission = defaultMission(Date.now())

export const zones: Zone[] = [
  { id: 'head', name: 'Brain & behavior', about: 'Hazard: Isolation and confinement; shifting light cycles and work demands. NASA lists chronic sleep loss, constant work demands and irregular body clocks as risks, and notes that isolation, radiation and distance from Earth can take a toll on mental health.' },
  { id: 'heart', name: 'Heart, lungs & circulation', about: 'Blood pressure, heart rate, blood oxygen and breathing. Microgravity causes bodily fluids to shift upward into the chest and head, altering cardiovascular workload.' },
  { id: 'metabolism', name: 'Metabolism & digestion', about: 'Digestion, organs such as the liver, stomach, intestines and kidneys, blood sugar (optional) and energy regulation. Microgravity and space diet alter how the body stores and utilizes metabolic fuel.' },
  { id: 'body', name: 'Whole body & immunity', about: 'The whole body: body temperature and infection monitoring. Closed-loop spacecraft environments require close vigilance of immune responses.' },
  { id: 'legs', name: 'Bones & muscles', about: 'The whole skeleton and the limbs: bone density and muscle conditioning. In zero gravity, bones and muscles undergo rapid deconditioning without rigorous daily countermeasures.' },
]

export const indicators: Indicator[] = [
  { id: 'bp', name: 'Blood pressure', value: '128/82', unit: 'mmHg', status: 'ok', reason: '', zone: 'heart', history: [126, 128, 125, 129, 127, 130, 128] },
  { id: 'hr', name: 'Heart rate', value: '64', unit: 'bpm', status: 'ok', reason: '', zone: 'heart', history: [65, 63, 66, 64, 65, 63, 64] },
  { id: 'spo2', name: 'Blood oxygen (SpO₂)', value: '98', unit: '%', status: 'ok', reason: '', zone: 'heart', history: [97, 98, 96, 98, 99, 98, 98] },
  { id: 'resp', name: 'Respiratory rate', value: '14', unit: 'breaths/min', status: 'ok', reason: '', zone: 'heart', history: [14, 15, 13, 14, 16, 14, 14] },
  { id: 'temp', name: 'Body temperature', value: '36.7', unit: '°C', status: 'ok', reason: '', zone: 'body', history: [36.6, 36.6, 36.7, 36.5, 36.6, 36.6, 36.7] },
  { id: 'sleep', name: 'Sleep', value: '5.8', unit: 'h', status: 'watch', reason: '3 short nights', reasonKey: 'reason.shortNights', reasonParams: { n: 3 }, zone: 'head', history: [7.4, 7.2, 7.4, 6.8, 5.6, 5.8, 5.8] },
  { id: 'mood', name: 'Mood', value: '3', unit: 'of 5', status: 'watch', reason: 'below your usual', reasonKey: 'reason.belowUsual', zone: 'head', history: [4, 4, 4, 3, 3, 3, 3] },
  { id: 'vision', name: 'Vision', value: 'No change', unit: '', status: 'ok', reason: '', zone: 'head', history: [] },
  { id: 'exercise', name: 'Bone & muscle session', value: '45', unit: 'min today', status: 'watch', reason: 'Below 80 min orbital protocol', reasonKey: 'reason.belowOrbital', reasonParams: { min: 80 }, zone: 'legs', history: [90, 80, 85, 40, 50, 45, 45] },
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
