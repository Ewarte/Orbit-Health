export interface IndicatorContent {
  id: 'bloodOxygen' | 'radiationDose' | 'boneDensity'
  name: string
  unit: string
  normalRange: string
  source: { label: string; url: string }
  whyItMatters: string
}

/** Contenido de referencia para las tres métricas que faltaban en el panel. */
export const indicatorContent: IndicatorContent[] = [
  {
    id: 'bloodOxygen',
    name: 'Blood oxygen (SpO₂)',
    unit: '%',
    normalRange: '95–100%',
    // Fuente: https://www.nasa.gov/hrp/risks/ que describe los riesgos de la hipoxia y la exposición a la presión y al ambiente de cabina.
    source: { label: 'NASA — Human spaceflight risks', url: 'https://www.nasa.gov/hrp/risks/' },
    whyItMatters: 'Ayuda a detectar hipoxia y cambios asociados a la presión o al ambiente de cabina.',
  },
  {
    id: 'radiationDose',
    name: 'Radiation dose',
    unit: 'mSv/day',
    normalRange: '0.10–0.50 mSv/day',
    // Fuente: https://www.nasa.gov/hrp/radiation/space-radiation-risks/ que describe los riesgos de la radiación espacial.
    source: { label: 'NASA — Space radiation risks', url: 'https://www.nasa.gov/hrp/radiation/space-radiation-risks/' },
    whyItMatters: 'La exposición acumulada requiere vigilancia operacional y registro continuo durante el tránsito espacial.',
  },
  {
    id: 'boneDensity',
    name: 'Bone density',
    unit: 'T-score',
    normalRange: 'Above −1.0',
    // Fuente: https://humanresearchroadmap.nasa.gov/Risks/default.aspx que describe los riesgos de la pérdida de masa ósea y fracturas.
    source: { label: 'NASA — Human Research Program risks', url: 'https://humanresearchroadmap.nasa.gov/Risks/default.aspx' },
    whyItMatters: 'La gravedad reducida favorece la pérdida de masa ósea y eleva el riesgo de fractura.',
  },
]
