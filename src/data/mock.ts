/*
  DATOS DE DEMOSTRACIÓN. Solo quedan las zonas del cuerpo: los textos no son contenido médico
  validado. Los indicadores y avisos salen ahora de los chequeos reales (healthEngine y guidanceLogic).
*/
import type { Zone } from '../types'

export const zones: Zone[] = [
  { id: 'head', name: 'Brain & behavior', about: 'Hazard: Isolation and confinement; shifting light cycles and work demands. NASA lists chronic sleep loss, constant work demands and irregular body clocks as risks, and notes that isolation, radiation and distance from Earth can take a toll on mental health.' },
  { id: 'heart', name: 'Heart, lungs & circulation', about: 'Blood pressure, heart rate, blood oxygen and breathing. Microgravity causes bodily fluids to shift upward into the chest and head, altering cardiovascular workload.' },
  { id: 'metabolism', name: 'Metabolism & digestion', about: 'Digestion, organs such as the liver, stomach, intestines and kidneys, blood sugar (optional) and energy regulation. Microgravity and space diet alter how the body stores and utilizes metabolic fuel.' },
  { id: 'body', name: 'Whole body & immunity', about: 'The whole body: body temperature and infection monitoring. Closed-loop spacecraft environments require close vigilance of immune responses.' },
  { id: 'legs', name: 'Bones & muscles', about: 'The whole skeleton and the limbs: bone density and muscle conditioning. In zero gravity, bones and muscles undergo rapid deconditioning without rigorous daily countermeasures.' },
]
