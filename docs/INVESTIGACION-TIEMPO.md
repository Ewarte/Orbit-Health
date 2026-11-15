# Investigación: cómo se mide y se muestra el tiempo a la tripulación

Fecha de la investigación: 2026-11-15. No se tocó código del proyecto.

Etiquetas de evidencia usadas en todo el documento:
- **OFICIAL**: página o documento de NASA, ESA, IAU, Casa Blanca u otra agencia, leído por esta investigación (con la salvedad indicada cuando solo se vio el resumen de un buscador).
- **SECUNDARIO**: prensa, Wikipedia, blogs, sitios no oficiales.
- **DEDUCIDO**: conclusión mía a partir de fuentes; no está escrita así en ninguna fuente.

Nota de método: las páginas web se leyeron con una herramienta que resume el contenido (no se vio el texto completo). Dos PDF de NTRS se descargaron y se leyeron con `pdftotext`. Donde la fuente era solo un fragmento de buscador, se indica «(fragmento de buscador)».

---

## 1. Resumen en 5 líneas

1. **Estación Espacial Internacional (ISS):** la tripulación vive en **UTC/GMT**; NASA ya dijo que se «alejó del tiempo de misión» para la ISS. Despertar hacia las 06:00 GMT y dormir entre las 21:30 y las 22:00 GMT, con cambios por acoplamientos y caminatas.
2. **Cohetes y cápsulas:** se usa **MET** (tiempo transcurrido desde el despegue) junto con T-/L- en la cuenta atrás. Artemis II usó MET como referencia operativa principal.
3. **Luna:** **no existe aún un estándar publicado de Tiempo Lunar Coordinado (LTC)**. NASA lo califica «en investigación» (página actualizada el 2026-10-28); el plazo de la Casa Blanca para la estrategia es el **31 de diciembre de 2026**. La IAU sí definió el tiempo coordenado lunar **TCL** en 2024.
4. **Marte:** el sol dura **24 h 39 min 35,244 s**; cada lugar usa su hora solar media local. No hay norma oficial para tripulaciones en tránsito o en superficie.
5. **No se encontró ningún documento oficial** que diga que las laptops o tablets de a bordo muestren MET, hora marciana o hora lunar. Lo único confirmado: el cronograma a bordo (OSTPV/OpTIMIS) marca la hora actual con una línea roja. Para la app, lo más seguro es **reloj del dispositivo en UTC + instante de lanzamiento guardado**, y no depender de que el aparato calcule nada.

---

## 2. Tabla por contexto

| Contexto | Referencia de tiempo | Fórmula | Fuente principal | Confianza |
|---|---|---|---|---|
| Cohete / cápsula (Shuttle, Orion, Dragon) | MET, formato `D/HH:MM:SS` desde el despegue; cuenta atrás con L-/T- | `MET = ahora_UTC − despegue_UTC` | NASA podcast «Telling Time on Other Worlds»; línea de tiempo Crew-10; Press Kit Artemis II | Alta (OFICIAL). Excepción: el MET del Shuttle empezaba en el encendido de los cohetes sólidos y el de Apolo (GET) en el último segundo entero antes del despegue; ver sección 4, pregunta 2 |
| Estación (ISS) | UTC/GMT | `hora a bordo = UTC` (sin desfase) | ESA (Tim Peake), NASA (podcast, NTRS 20240002094) | Alta (OFICIAL) |
| Luna | UTC y MET para Artemis; LTC aún no existe; TCL definido por la IAU | `MET = ahora_UTC − despegue_UTC`. Para LTC no hay fórmula publicada | NASA «Lunar Time»; OSTP 2024; IAU 2024 | Alta para MET/UTC; Baja para LTC (sin estándar) |
| Marte (superficie) | Sol de 88 775,244 s; hora solar media local (LMST) | `LMST = AMT + longitud_este/15` (horas marcianas); `MSD = (JD − 2405522,0)/1,0274912` | Mars24 (NASA GISS); Press Kit Perseverance (JPL) | Alta para duración del sol y LMST (OFICIAL); Media para la fórmula MSD (DEDUCIDA de la definición oficial) |
| Tránsito Tierra–Marte o Tierra–Luna | Sin norma publicada. Lo razonable: MET y UTC | `MET = ahora_UTC − despegue_UTC` | Ninguna específica | Baja (DEDUCIDO) |

---

## 3. Respuestas a las 7 preguntas

### Pregunta 1. Estación Espacial Internacional

**Qué hora usan: UTC/GMT.** (OFICIAL)
- ESA, Tim Peake, 2016: la estación usa «UTC (Universal Time Coordinated), which is basically GMT»; el control de misión se reparte entre Houston y Moscú. Su blog añade que el horario de dormir se da «(we're on GMT)».
- Podcast de NASA «Telling Time on Other Worlds» (Kevin Coggins, programa SCaN): la ISS ahora corre en UTC para coordinar continuamente a los socios; dice «so we've kind of shifted away from Mission time for the ISS».

**Horario de la tripulación.** (OFICIAL)
- Resumen de NTRS 20240002094 (*Impact of Sleep Shifting Strategies on the ISS*): las tripulaciones recientes tienen una ventana fija de **21:30 a 06:00 GMT**.
- Las preferencias personales varían: Peake dice despertar hacia las 6:30 y acostarse entre las 22:00 y la medianoche; Gerst (SECUNDARIO, blog de ESA, fragmento de buscador) menciona 6:30 y 22:15.
- «Despertar 06:00 GMT, dormir 22:00 GMT» (versión de la sección 2 de `INVESTIGACION-NASA.md`) proviene de la respuesta de Expedition 3 en una página antigua de NASA (fragmento de buscador; la página dio error 403 al abrirla). **Corrección:** la cifra reciente verificada es 21:30–06:00 GMT, no 22:00.

**Cambios del ciclo por acoplamientos y caminatas.** (OFICIAL, NTRS 20240002094)
- Los eventos de vehículos visitantes y los imprevistos obligan a mover el sueño. Hubo «sueño dividido» (dos periodos similares en 24 h) en acoplamientos, reubicaciones y desacoplamientos: 8 de 19 tripulantes tuvieron 11 episodios; el primer periodo cayó por la tarde antes del evento y el segundo a la mañana siguiente (promedio de 2,89 h y 4,30 h en cama). El resumen no describe los procedimientos concretos.
- Blog de la estación (fragmento de buscador, 2020-11-19, Expedition 64): la tripulación ajustó sus horarios para recibir a cuatro astronautas en Crew Dragon y tuvo «un turno de sueño extendido». Ese texto da la hora de despertar en EST, no en GMT.
- No hay «zona horaria de la tripulación» distinta de GMT: **el reloj sigue en GMT; lo que se mueve es el horario de dormir y trabajar** (DEDUCIDO de las dos fuentes anteriores).

**Relojes, laptops y cronograma.**
- OFICIAL (NASA/TM-20205006969, leído con `pdftotext`): el *Onboard Short-term Plan Viewer* (OSTPV) muestra el horario como líneas de tiempo de colores, y permite marcar pasos como ejecutados y abrir procedimientos. Su versión nueva, **OpTIMIS**, «puede usarse en un iPad» y fue usada por «un número limitado de tripulantes». OpTIMIS muestra «una línea roja vertical con la hora actual del día», luz/noche y disponibilidad de TDRS. El plan contiene unos tres días (ayer, hoy, mañana).
- OFICIAL (NTRS, fragmento de buscador, 2019): la tripulación tiene 23 laptops Lenovo T61p, llamadas SSC (*Station Support Computers*).
- **No se encontró** ninguna fuente que diga si las SSC sincronizan su reloj con un servidor de tiempo de la estación (NTP o similar). Ver sección 5.

### Pregunta 2. Cohetes y naves (Shuttle, Orion/Artemis, Dragon, Soyuz)

- **MET:** NASA (podcast, Coggins): Mercury, Gemini, Apolo y Shuttle usaron MET como «contador estandarizado y continuo, días, horas, minutos, segundos, desde el instante del lanzamiento»; «todas las operaciones del Shuttle se planificaron respecto a ese reloj». (OFICIAL)
- **Dónde empieza el cero:** la historia de NASA (SP-4029, fragmento de buscador) dice que en Apolo se llamaba GET (*Ground Elapsed Time*), referido al último segundo entero antes del despegue, y que en el Shuttle el MET empezó con el encendido de los cohetes sólidos. (OFICIAL, fragmento)
- **Línea de tiempo oficial de Crew-10:** NASA publica un PDF con columnas **GMT, MET, hora de Houston y hora del Este**. Despegue = `073/23:03:46 GMT` (día del año/hh:mm:ss) con MET `+0/00:00:00`; acoplamiento completo = `075/03:43:00 GMT`, MET `+1/04:39:13`. (OFICIAL, fragmento de buscador; el PDF es del plan previo al vuelo.)
- **Cuenta atrás:** el Press Kit de Artemis II usa reloj **L-** (hasta el despegue, en horas y minutos) y **T-**; en las pausas programadas el T- se detiene y el L- sigue. (OFICIAL, página leída)
- **Artemis II:** NASA (podcast) dice que usaría MET como «referencia operativa principal desde el lanzamiento». El Press Kit da los eventos como `D/HH:MM` (por ejemplo `+1/01:37` para la quema de inyección translunar), sujeto a la fecha de lanzamiento, y organiza al equipo por **día de vuelo**. Despegue real: 22:35:12 UTC del 2026-04-01 (6:35 p. m. EDT) según el blog de lanzamiento de NASA y JPL Horizons (fragmento de buscador). (OFICIAL)
- **Cómo lo ve la tripulación:** **no se encontró** descripción oficial de cómo se muestra el MET en las pantallas de Orion, Dragon o Soyuz. Lo único hallado: Orion tiene tres unidades de pantalla y más de 60 formatos gráficos (NASA, fragmento de buscador) y Dragon usa pantallas táctiles (SECUNDARIO). Sobre Soyuz no apareció nada.
- **Dispositivos personales en Artemis II:** SECUNDARIO (prensa): cada tripulante llevó un iPhone 17 Pro Max para fotos y video, con radios desactivadas, sin función operativa. No son fuente de hora de misión.

### Pregunta 3. Luna

- **Memorándum OSTP, 2 de abril de 2024** (OFICIAL, archivo de la Casa Blanca; solo se leyó el comunicado, no el texto completo del memorándum): instruye a NASA a trabajar con Comercio, Defensa, Estado y Transporte para «entregar una estrategia para la implementación de LTC» a más tardar el **31 de diciembre de 2026**.
- **Plan de NASA** (OFICIAL, página «Lunar Time», actualizada el 2026-10-28):
  - NASA, a través de SCaN, «lidera los esfuerzos del gobierno de EE. UU. e internacionales para establecer LTC».
  - **Propone** establecerlo con un conjunto de relojes atómicos en la Luna, pero «NASA y sus socios investigan qué modelo matemático lo establecerá mejor»: el método **no está decidido**.
  - Un reloj en la Tierra parece perder en promedio **58,7 microsegundos por día** visto desde la Luna.
  - La BIPM desarrolla cómo mantener el tiempo lunar convertible a UTC; el IAG estudia cómo mapear el tiempo de referencia a relojes en la superficie.
  - La página no da fecha de publicación ni plazo.
- **IAU 2024** (SECUNDARIO/OFICIAL parcial): la página de NASA confirma que la IAU definió el tiempo de referencia lunar **TCL** (*Lunar Coordinate Time*). Una página de la IAU mostrada por el buscador indica que la Asamblea General de 2024 adoptó la Resolución II (sistema de referencia lunar y TCL, con unidad coherente con el segundo SI) y una Resolución III sobre un tiempo lunar coordinado. **No pude abrir el PDF de la IAU** (error 404), así que el texto exacto de las resoluciones **no está verificado**. AIP FYI (SECUNDARIO) dice que en agosto de 2024 la IAU pidió formalmente a las agencias un estándar de tiempo lunar.
- **LunaNet** (OFICIAL, resumen de buscador): define un *LunaNet Reference Time* (LRT), distinto de LTC; la relación entre LRT y UTC se deja para futuras versiones de la especificación (versión 5, enero de 2025).
- **¿Existe un estándar publicado a noviembre de 2026? No hay evidencia de que exista.** Las dos búsquedas amplias y la página de NASA actualizada hace tres semanas lo describen como trabajo en curso. Con la fecha límite aún por llegar (31-dic-2026), la ausencia es consistente, pero no puedo afirmar que no exista un borrador interno.
- **Qué usa Artemis:** MET + UTC (ver pregunta 2). NASA (podcast) afirma que MET no sirve para el esfuerzo Luna-Marte a largo plazo porque los activos lunares necesitan una escala común.
- Un día lunar dura unos **29,5 días terrestres** (NASA, podcast, OFICIAL).

### Pregunta 4. Marte

- **Duración del sol:** 24 h 39 min 35,244 s = **88 775,244 s** ≈ 24,65979 h ≈ 1,0274912 días (OFICIAL, notas técnicas de Mars24; coincide con el Press Kit de Perseverance, JPL).
- **Mars24** (NASA GISS, versión 8.3.1 del 2023-05-18, página actualizada el 2026-11-13; OFICIAL): muestra el lado diurno/nocturno y «la hora estándar de Marte» más horas locales. Define:
  - **Mars Sol Date (MSD)**: conteo secuencial de soles desde el 29 de diciembre de 1873, aproximadamente al mediodía de Greenwich, **JD 2405522,0**. Ejemplo oficial: MSD 44796,0 ≈ 2000-ene-6,0.
  - **Hora solar media local (LMST):** se obtiene sumando a la hora en el meridiano de origen un número de horas marcianas igual a la longitud este dividida entre 15. Ejemplo: a 45° O la hora es 3 horas marcianas menor.
  - **MTC (Mars Coordinated Time):** la copia de las notas técnicas en oregonl5.nss.org lo define como hora solar media en el meridiano de origen (como UTC). La lectura de la página principal de GISS **no mostró** el término MTC. **No pude reconciliar ambas lecturas** y el texto original del GISS podría contenerlo. Trátese como SECUNDARIO.
  - Rango de la ecuación del tiempo en Marte: de −51,1 a +39,9 minutos.
  - Meridiano de origen: 47,95137° al este del Viking 1.
- **Equipos de rovers** (OFICIAL, Press Kits de Perseverance; NTRS 20050019531 *Choosing Mars-Time*, leído con `pdftotext`):
  - Durante los primeros 90 soles el equipo de Perseverance trabaja en hora marciana, corriendo su inicio de turno unos 40 minutos más tarde cada día; después lo abandona porque es muy duro.
  - El estudio de MER (2003-2004): Mars Time era el más eficiente a corto plazo pero requiere más equipos y solo es sostenible unas 30 soles; a las dos semanas los horarios de despertar y comida se habían corrido unas 9 horas. Se optó por Mars Time con turnos limitados (máximo 4 turnos seguidos y varios días libres, según una fuente citada en el estudio) y se volvió a hora terrestre.
  - Pathfinder (1997) trabajó unos 87 días en Mars Time.
  - Los miembros usan **sol** y no días terrestres.
- **Tripulaciones:** **no existe documento oficial** hallado sobre un horario de tripulación en tránsito o en superficie marciana. Solo hay análogos: FMARS 2007 en el Ártico canadiense, siete personas en hora marciana durante 37 días, posible por la luz de 24 h (NASA Astrobiology, SECUNDARIO/OFICIAL parcial). Un documento de NASA de julio de 2026 (NASA/SP-20260005907, sobre polvo marciano) menciona retrasos de comunicación de hasta 44 minutos que exigen más autonomía, pero no horario.
- **Relojes en Marte:** el podcast afirma que andan más rápido que en la Tierra, pero da dos cifras que no coinciden entre sí («477.000.000-ésimo de segundo» y «477 microsegundos»). No usar ninguna sin verificar.

### Pregunta 5. ¿Algún dispositivo de a bordo se personaliza para mostrar tiempo de misión?

**No se encontró ningún documento oficial que lo diga.**
- Lo más cercano: OSTPV/OpTIMIS en las SSC y iPads de la estación, que muestran la **hora del día** en un cronograma (NASA/TM-20205006969). No dice que muestre MET ni hora marciana.
- Un resumen de buscador menciona un documento NTRS de 2021 («Internet of Space Things», SpaceCHI) y otros sobre procedimientos web (iPV). No se abrieron.
- Para Orion no se halló nada sobre qué muestran las pantallas.
- El juicio negativo es «no se encontró», no «no existe».

### Pregunta 6. Cómo saber qué hora tiene AHORA la tripulación de la ISS y dónde está

- **Hora:** la de la ISS es UTC/GMT (ver pregunta 1); en cualquier instante, hora de la tripulación = UTC actual. Un lector humano puede compararla con la ventana 21:30–06:00 GMT (dormir) de NTRS 20240002094. (DEDUCIDO)
- **Dónde está:**
  - **Spot the Station**, mapa en vivo: https://spotthestation.nasa.gov/tracking_map.cfm . Muestra la posición actual y la trayectoria 90 minutos antes y después (OFICIAL).
  - **App oficial Spot the Station**: incluye mapa en tiempo real de la posición (FAQ 16); las visibilidades se muestran en la hora local del lugar elegido (FAQ 13). Una órbita dura unos 90 minutos y la velocidad es de unas 17 500 mph (28 000 km/h).
  - Página «Get to Know the Space Station» de NASA: menciona un *ISS Tracker* y video en vivo de la Tierra (fragmento de buscador).
- **Blog de la estación:** https://www.nasa.gov/blogs/spacestation/ (publica a diario qué hace la tripulación). No es fuente de hora exacta.

### Pregunta 7. Conclusión práctica para la app

**Recomendación (DEDUCIDA a partir de lo anterior):**

1. **La fuente de hora debe ser el reloj del dispositivo, leído siempre en UTC** (por ejemplo `Date.now()` o `Instant`). Todo lo demás se calcula a partir de él. Motivo: no hay evidencia de que los aparatos de a bordo calculen MET ni hora marciana; solo sabemos que el cronograma de la ISS muestra la hora del día.
2. **Guardar el instante de lanzamiento en UTC** de cada misión (y, para Marte, el instante de llegada o del primer sol). No guardar «MET» como número fijo: se recalcula siempre.
3. **No usar la zona horaria del dispositivo** para decidir horarios de la tripulación. En la ISS el reloj es GMT/UTC. En tránsito y en Luna, UTC.
4. **Offset configurable** para quien quiera ver su horario local (Houston, Moscú, Madrid): solo para mostrar, nunca para calcular rutinas.
5. **Reloj de respaldo:** si el reloj del dispositivo se desvía o el astronauta lo cambia, la app debería aceptar un «ajuste manual» o una hora tomada de la nave. Lo ideal es que el equipo de la app pregunte a una persona de operaciones de vuelo cómo sincronizan las SSC. (No confirmado, ver sección 5.)
6. **Hora lunar y marciana:** hoy no hay LTC publicado; mostrar UTC y MET en misiones lunares y avisar que LTC está «en definición». En Marte, mostrar el sol y la hora solar local solo en superficie.

**Fórmulas (DEDUCIDAS salvo donde se indica fuente oficial):**

```
MET = ahora_UTC − despegue_UTC
  Formato: D/HH:MM:SS (como en NASA). Antes del despegue: T- = despegue_UTC − ahora_UTC.
  Salvedad: el cero oficial depende de la misión (Apolo: último segundo entero
  antes del despegue; Shuttle: encendido de los cohetes sólidos; ver pregunta 2).
  Para la app, usar el despegue declarado por la misión.

Día de vuelo (Flight Day) = piso(MET en días) + 1
  Es lo habitual en los programas de NASA (Artemis II usa "Flight Day"), pero la
  regla exacta no se verificó en una fuente oficial.

JD = ms_Unix / 86 400 000 + 2 440 587,5            (estándar astronómico)

MSD = (JD − 2 405 522,0) / 1,0274912               (oficial: definición de MSD de Mars24;
                                                    la división es DEDUCIDA. Comprobación hecha:
                                                    (2 451 549,5 − 2 405 522,0)/1,0274912 ≈ 44 796,0,
                                                    que es el ejemplo oficial.)
  Mejora no verificada: la fórmula completa de Allison y McEwen (2000) corrige TT−UTC
  y un término de 0,00096; no se pudo leer en esta investigación. Error de la fórmula
  simple: del orden de decenas de segundos (≈ segundos de TT−UTC y el término de 0,00096 sol).
  Esta estimación es DEDUCIDA, no medida.

MTC (horas) = 24 × frac(MSD)                       (SECUNDARIO: definición MTC en la copia de notas)
Hora solar local en longitud λ (este, en grados) = MTC + λ/15   (módulo 24; OFICIAL en la definición de LMST)
Número de sol de una misión = piso(MSD − MSD_aterrizaje) + 1   (DEDUCIDO; cada misión define su propio sol 0 o sol 1)
```

---

## 4. Verificación y corrección de `INVESTIGACION-NASA.md` sección 2

| Afirmación de la versión inicial | Veredicto |
|---|---|
| MET `días/horas:minutos:segundos` desde el despegue; líneas de tiempo con GMT y MET juntos | **Confirmada** (Crew-10, fragmento de buscador del PDF de NASA). Matiz: el cero depende de la misión (ver pregunta 2). |
| Artemis II usa MET con formato `1/01:42` | **Confirmada** (Press Kit). |
| Estación en GMT/UTC; despierta 06:00 GMT, se acuesta 22:00 GMT | **Parcialmente corregida**: GMT/UTC confirmada. Horario reciente verificado: **21:30–06:00 GMT** (NTRS 20240002094). Los 22:00 vienen de una página antigua. |
| Artemis: MET y UTC; no hay tiempo lunar oficial | **Confirmada**. LTC sigue sin estándar a 2026-11-15 según la evidencia disponible. |
| OSTP pidió LTC «para fines de 2026» | **Precisión**: lo que pide es una **estrategia de implementación** (no el estándar terminado) a más tardar el 31-dic-2026. |
| IAU adoptó TCL en 2024 | **Confirmada** (página de NASA). Texto exacto de las resoluciones **no verificado**. |
| Sol de 24 h 39 min 35,244 s; hora solar media local; equipos viven en hora marciana unos 90 soles | **Confirmada** (Mars24, Press Kit de Perseverance, JPL). Precisión: es la fase inicial de verificación; luego vuelven a hora de la Tierra. |
| Tránsito a Marte: MET y UTC, sin fuente oficial | **Sigue sin fuente oficial.** |
| «MTC viene de fuentes secundarias» | **Matiz**: la copia de las notas técnicas de Mars24 en oregonl5.nss.org sí define MTC. La lectura de la página de GISS no lo mostró. Tratar como SECUNDARIO hasta abrir el texto original. |
| «Rutina y recordatorios se comparan contra ese reloj, no contra la hora del dispositivo» | **Hay que matizarlo**: el reloj del dispositivo en UTC sí es la base de todo cálculo; lo que no se debe usar es su **zona horaria**. |

---

## 5. Lo que NO se pudo confirmar

1. **Si las laptops SSC o iPads de la ISS sincronizan su reloj con un servidor de tiempo de la estación** (NTP, GPS u otro). No hay fuente.
2. **Si algún dispositivo de a bordo muestra MET, hora lunar u hora marciana** (pregunta 5). No hay fuente.
3. **Cómo muestran el MET Orion, Dragon y Soyuz.** No se encontró descripción oficial.
4. **El texto completo del memorándum OSTP** (solo el comunicado) y **el texto de las resoluciones II y III de la IAU de 2024** (PDF devolvió 404).
5. **Si existe un borrador interno de LTC o de la estrategia** que NASA debe entregar al 31-dic-2026.
6. **La página original de Expedition 3** (error 403) con los 06:00 GMT / 22:00 GMT; solo se vio el fragmento del buscador.
7. **El PDF de la línea de tiempo de Crew-10** y **el blog de la estación del 2020-11-19** solo se vieron como fragmentos de buscador.
8. **La definición de MTC en la página original de GISS** y **la fórmula completa de Allison y McEwen (2000)** para MSD con correcciones.
9. **El valor del desfase de reloj en Marte** (el podcast da dos cifras incompatibles).
10. **Cualquier horario oficial de tripulación en tránsito o superficie de Marte.**
11. **La página del reto de Space Apps** (problema de certificado ya anotado en `INVESTIGACION-NASA.md`): pendiente de abrir en un navegador.
12. La lista de blogs recientes de la estación aparece con fechas de 2026 en los resultados; el buscador advirtió posibles inconsistencias de fechas.

---

## 6. Fuentes con URL

### OFICIAL
- NASA, Lunar Time (LTC, TCL, 58,7 µs): https://www.nasa.gov/communicating-with-missions/lunar-time/
- NASA podcast «Telling Time on Other Worlds» (MET, ISS en UTC, Artemis II, Marte): https://www.nasa.gov/podcasts/houston-we-have-a-podcast/telling-time-on-other-worlds/
- Casa Blanca, comunicado OSTP sobre estandarización del tiempo celestial, 2024-04-02: https://bidenwhitehouse.archives.gov/ostp/news-updates/2024/04/02/white-house-office-of-science-and-technology-policy-releases-celestial-time-standardization-policy
- NASA, Artemis II Press Kit: https://www.nasa.gov/artemis-ii-press-kit/
- NASA, blog de lanzamiento de Artemis II: https://www.nasa.gov/blogs/missions/2026/04/01/live-artemis-ii-launch-day-updates/
- NASA, línea de tiempo Crew-10 (GMT/MET): https://www.nasa.gov/wp-content/uploads/2025/03/for-web-march-14-crew-10-launch-to-dock-timeline.pdf
- NASA NTRS 20240002094, *Impact of Sleep Shifting Strategies on the ISS*: https://ntrs.nasa.gov/citations/20240002094
- NASA/TM-20205006969 (OSTPV, OpTIMIS, SSC): https://ntrs.nasa.gov/api/citations/20205006969/downloads/NASA%20TM%2020205006969.pdf
- NASA NTRS 20050019531, *Choosing Mars-Time* (MER): https://ntrs.nasa.gov/api/citations/20050019531/downloads/20050019531.pdf
- NASA GISS, Mars24: https://www.giss.nasa.gov/tools/mars24/ y notas técnicas https://www.giss.nasa.gov/tools/mars24/help/notes.html
- JPL, Press Kit de lanzamiento de Mars 2020 Perseverance: https://www.jpl.nasa.gov/news/press_kits/mars_2020/download/mars_2020_launch_press_kit.pdf
- NASA, Spot the Station, mapa en vivo: https://spotthestation.nasa.gov/tracking_map.cfm
- NASA, Spot the Station FAQ: https://www.nasa.gov/missions/station/spot-the-station-frequently-asked-questions/
- NASA, blog de la estación: https://www.nasa.gov/blogs/spacestation/
- NASA, especificación LunaNet (v5, 2025): https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-interoperability-specification-v5-baseline.pdf
- NASA, respuestas de la tripulación Expedition 3 (solo fragmento): https://www.spaceflight.nasa.gov/feedback/expert/answer/isscrew/expedition3/index.html
- IAU, Resolución II de 2024 (404, no leído): https://iau.org/static/resolutions/IAU2024_Resol2_English.pdf
- ESA, Tim Peake, preguntas frecuentes: https://blogs.esa.int/tim-peake/2016/03/27/frequently-asked-questions/
- ESA, Alexander Gerst, 20 preguntas (fragmento): https://blogs.esa.int/alexander-gerst/2018/11/21/spacestationfaqs/
- NASA Astrobiology, «Living on Mars Time» (FMARS): https://astrobiology.nasa.gov/news/check-type-living-on-mars-time/

### SECUNDARIO
- AIP FYI, *Lunar Time Standard Taking Shape* (2024-09-06): https://www.aip.org/fyi/lunar-time-standard-taking-shape
- Copia de las notas técnicas de Mars24 (define MTC): https://oregonl5.nss.org/mist/docs/Mars24J/help/notes.html
- Prensa sobre iPhones en Artemis II (por ejemplo AppleInsider): https://appleinsider.com/articles/26/04/02/iphones-are-going-to-the-moon-on-artemis-ii
- Artículo de preprint sobre tiempo lunar (arXiv 2511.02709, no revisado por pares): https://arxiv.org/html/2511.02709v1

### DEDUCIDO
- Todas las fórmulas de la pregunta 7, la recomendación de arquitectura y la lectura «hora de la tripulación = UTC actual».
