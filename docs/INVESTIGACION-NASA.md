# Cómo se controla de verdad la salud y el tiempo en el espacio (fuentes oficiales)

Investigado el 2026-11-15. Complementa a `FUENTES.md`.

**Qué se leyó (documentos completos descargados, no resúmenes):**
- Lista del botiquín de la estación: *3.001 Medical Kit – Contents and Reference* (NASA, versión SpX-6).
- *Evidence Report: Risk of Adverse Health Outcomes and Decrements in Performance Due to In-Flight Medical Conditions* (NASA NTRS 20170004604).
- *Autonomous Medical Care for Exploration Class Space Missions* (Hamilton, NASA NTRS 20070032039).
- *NASA-STD-3001 Technical Brief: Spaceflight Experience and Medical Care* (OCHMO).
- *ISS Medical Project On-Orbit Hardware* (NASA, revisión 2016).

**Qué se leyó resumido por una herramienta (verificar antes de citar):** NASA-STD-3001 Vol. 1 sección 3, la página *Standard Measures*, un blog de la estación del 2026-07-08, la página de algoritmos de Mars24 y los resultados de búsqueda sobre MET, Artemis II y tiempo lunar.

**Qué NO se pudo hacer:** abrir la página del reto en spaceappschallenge.org. La conexión segura falla desde esta PC (error de certificado con la herramienta, `curl` y PowerShell). Los buscadores no muestran recursos nuevos, pero no se puede descartar que existan. Hay que abrir la pestaña *Resources* en un navegador.

---

## 1. Cómo se controlan los signos vitales a bordo

### 1.1 Lo que hay en el botiquín (fuente: lista oficial del botiquín)
Paquete de diagnóstico (azul): **tensiómetro automático con dos manguitos (grande y pequeño), oxímetro de dedo, estetoscopio, termómetro**, otoscopio, oftalmoscopio, tonómetro y carta de agudeza visual. Además hay **tiras reactivas de orina (Chemstrip 10)** y una bolsa para recoger orina.

**No aparece ningún glucómetro ni analizador de sangre** en esa lista. «Glucosa» solo aparece como efecto de medicamentos.

### 1.2 Equipos de investigación en órbita (fuente: hardware médico de la estación)
- **Actiwatch:** reloj de muñeca que mide movimiento y luz ambiente, para sueño, ritmo circadiano y actividad.
- **Holter 2:** electrocardiograma portátil de hasta 24 horas, con electrodos en el torso.
- **Ecógrafo (Ultrasound 2):** con transmisión de video a tierra en tiempo real.
- **Oxímetro de dedo** y cánula nasal para respiración (con el analizador de presión craneal).
- **Recolección de sangre, saliva y orina** y una centrífuga refrigerada: las muestras se guardan para analizar después.
- **Laptops** con Windows XP/7 (en 2016) para controlar el equipo y bajar datos.

### 1.3 Qué dice NASA de su propio sistema (fuente: Evidence Report, sección Biomonitoring)
- Capacidades de EE. UU.: **electrocardiograma de 12 derivaciones por cable, presión arterial semiautomática y oximetría de dedo** (oxígeno, monóxido de carbono, metahemoglobina, perfusión). Rusia tiene capacidades similares.
- Es «adecuado para vigilancia básica **a demanda**», pero NASA lo critica: **lleva mucho tiempo**, el ECG exige afeitar y verificar señales, **la presión es sensible al error del operador y a la talla del manguito**, el oxímetro es poco amigable, y **todos los equipos requieren registrar los datos a mano y transferir archivos**, lo que consume tiempo de la tripulación.
- Piden «sensores pequeños, fáciles y preferiblemente inalámbricos» que midan, guarden y transmitan.

### 1.4 Lo que se ve hoy en la estación (fuente: blog de la estación, 2026-07-08, leído resumido)
Un astronauta **se midió la presión él mismo** con manguitos de brazo, muñeca y dedo. Otro **se sacó sangre y orina para el estudio CIPHER** y las guardó en un congelador científico para analizarlas después. En la cinta de correr, otro usó un **monitor de ritmo cardíaco Bluetooth** cuyos datos iban a una tablet para que médicos en Tierra los analizaran.

### 1.5 Glucosa
- **No es una medición rutinaria en vuelo.** Ni el botiquín ni el hardware médico incluyen glucómetro.
- Sí hay extracciones de sangre, pero **para investigación** (Standard Measures, CIPHER): se almacenan y se analizan después, no sirven para vigilancia diaria.
- El documento de atención autónoma (Hamilton) solo nombra el glucómetro como **dispositivo especial para un tripulante con una condición previa** que lo necesite.
- Una entrevista de 1998 menciona un analizador de sangre a bordo; es histórico y no hay evidencia de que siga.
- **Conclusión:** en nuestra app la glucosa no refleja la práctica real. El reto sí la nombra como «indicador útil», así que podemos mantenerla, pero marcada como opcional y «solo si hay dispositivo».

### 1.6 Quién mide y cuánto saben (fuente: Evidence Report y NASA-STD-3001)
- **Cada tripulación designa un oficial médico (CMO): uno por cada tres tripulantes** en la estación.
- **Ese oficial «puede haber tenido o no formación médica previa»** y recibe **unas 40 horas** de instrucción antes del vuelo (unas 4 de diagnóstico, 5 de intervenciones y 10 de soporte vital básico y avanzado).
- Reciben **guía sobre cuándo hay que pedir ayuda médica a tierra**.
- Para **misiones planetarias de más de 210 días**, la norma exige un oficial médico **con nivel de médico**.
- NASA-STD-3001 pide capacidades para **«evaluar, registrar, monitorear y ver la tendencia» de signos vitales**, **comunicación privada con apoyo médico y psicológico en tierra**, y **«medios de atención médica autónoma y soporte vital avanzado»** en misiones lejanas.
- Los médicos de vuelo en Tierra revisan los datos; con la distancia a Marte hay retrasos de hasta 20 minutos por sentido (ver `FUENTES.md`), por eso la autonomía importa.

**Respuesta a «¿es todo general o piden datos específicos?»:** el astronauta común **no es médico**. Para un tripulante lo realista es entrada **simple y guiada**; los datos específicos los manejan el oficial médico y los médicos de tierra. La app debe hablarle al astronauta con lenguaje llano y generar un resumen más técnico para el oficial médico y el cirujano de vuelo.

### 1.7 Qué significa para nuestros 8 indicadores
| Indicador | ¿Se mide de verdad en la estación? | Cómo |
|---|---|---|
| Presión arterial | **Sí** | Tensiómetro semiautomático (manguitos), manual |
| Frecuencia cardíaca | **Sí** | Oxímetro, Holter, monitor Bluetooth en ejercicio |
| Temperatura | **Sí** | Termómetro del botiquín |
| Oxígeno en sangre (SpO₂) | **Sí** | Oxímetro de dedo (no está entre nuestros 8) |
| Sueño | **Sí** | Actiwatch (muñeca) y reportes de sueño |
| Ejercicio | **Sí** | Monitor de ritmo cardíaco, cinta, ejercicio diario |
| Ánimo / conducta | **Sí** | Encuestas y diario (ver `FUENTES.md`) |
| Visión | **Sí** | Imagen de retina que toma el astronauta; tonómetro, carta visual |
| Glucosa | **No de rutina** | Solo en casos especiales; sangre de investigación se analiza después |

---

## 2. Cómo se mide el tiempo y los días

| Contexto | Referencia | Fuente y estado |
|---|---|---|
| **Cohete / transbordador / cápsula** | **MET** (tiempo transcurrido de la misión), `días/horas:minutos:segundos` desde el despegue. Las líneas de tiempo oficiales muestran **GMT y MET juntos**. | Líneas de tiempo oficiales de NASA (Crew-10, Hubble). Artemis II usa MET (formato `1/01:42` = 1 día, 1 h, 42 min). |
| **Estación espacial (órbita)** | **GMT/UTC**. NASA dice que la tripulación despierta a las 06:00 GMT y se acuesta a las 22:00 GMT. | Blog oficial de NASA y reporte de Expedition 4 (resumen de búsqueda). |
| **Misión a la Luna (Artemis)** | **MET** de la misión y **UTC**. Todavía **no existe un tiempo lunar oficial**. | Press kit de Artemis II. La Casa Blanca (OSTP) pidió a NASA un **Tiempo Lunar Coordinado (LTC) para fines de 2026**; **no está confirmado que ya exista**. La IAU adoptó en 2024 un sistema de tiempo coordinado lunar (TCL). |
| **Superficie de Marte** | **Sol** (día marciano) de **24 h 39 min 35,244 s**. Cada sitio usa su **hora solar media local**. Los equipos de rovers viven en hora marciana unos 90 soles. | Press kit de Perseverance (JPL, fuente oficial) y notas técnicas de Mars24 (NASA GISS). |
| **Tránsito a Marte** | **MET** y **UTC** (se deduce; no se encontró una página oficial que lo diga). | **Sin fuente oficial.** |

**Fuera de lo verificado:** el término **MTC** (Mars Coordinated Time) viene de fuentes secundarias; la página de Mars24 que se leyó dice que no lo cubre. La duración de un día lunar (unos 29,5 días terrestres) es conocimiento general sin fuente NASA leída aquí.

### Qué implica para la app
1. **Mission** debería guardar el **entorno** (cápsula / estación / tránsito / Luna / Marte) y el **instante de lanzamiento en UTC**.
2. De ahí se calculan **MET**, **día de misión** y el **reloj local**: UTC en estación y tránsito; hora solar local de Marte (con sol de 24 h 39 min 35 s) en superficie.
3. **Rutina y recordatorios** se comparan contra ese reloj, no contra la hora del dispositivo.

---

## 3. Qué falta confirmar
1. Abrir la pestaña *Resources* del reto en un navegador y ver si hay recursos nuevos.
2. Confirmar en NASA el horario de la estación (blog del 2025/2026) y el tiempo en tránsito a Marte.
3. Verificar si el Tiempo Lunar Coordinado ya se publicó.
4. Rangos clínicos de cada indicador (sigue pendiente; ver `FUENTES.md` sección 8).
5. Que alguien con criterio médico revise `src/data/guidance.ts`.
