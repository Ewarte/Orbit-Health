export interface ActionGuide {
  indicatorId: string
  watch: string[]
  actNow: string[]
  notify: string
}

/** Guías operativas offline: son orientación de producto, no sustituyen el protocolo médico. */
export const actionGuides: ActionGuide[] = [
  {
    indicatorId: 'sleep',
    watch: ['Dim cabin lights one hour before sleep.', 'Avoid caffeine after midday and record tonight’s sleep.'],
    actNow: ['Tell your crew if the short sleep continues tonight.', 'Notify the flight surgeon if fatigue affects a critical task.'],
    notify: 'Crew health lead + flight surgeon',
  },
  {
    indicatorId: 'bloodOxygen',
    watch: ['Repeat the reading after resting for five minutes.', 'Check the cabin oxygen and pressure status.'],
    actNow: ['Stop strenuous activity and use the crew medical protocol.', 'Notify the flight surgeon and the crew health lead immediately.'],
    notify: 'Flight surgeon + crew health lead',
  },
  {
    indicatorId: 'radiationDose',
    watch: ['Confirm the dosimeter reading and timestamp.', 'Move to the designated shelter area if mission control advises it.'],
    actNow: ['Follow the radiation storm shelter protocol.', 'Notify the flight surgeon and mission operations.'],
    notify: 'Flight surgeon + mission operations',
  },
  {
    indicatorId: 'boneDensity',
    watch: ['Confirm the measurement and review the exercise log.', 'Complete the scheduled resistance countermeasure.'],
    actNow: ['Pause non-essential activity if pain or injury is present.', 'Notify the flight surgeon before modifying the exercise plan.'],
    notify: 'Flight surgeon + exercise officer',
  },
]
