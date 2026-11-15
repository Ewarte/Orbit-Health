# Decisiones del proyecto y su respaldo

Registro de las decisiones tomadas del 14 al 15 de noviembre de 2026, con el motivo y la evidencia que las respalda. Cada decisión enlaza al informe donde está la fuente.

**Cómo leer la evidencia:** los informes separan lo **oficial** (NASA y otras agencias), lo **secundario** (prensa, blogs, Wikipedia) y lo **deducido** por el equipo. Una decisión basada en algo deducido lo dice.

## Documentos de respaldo
| Documento | Qué contiene |
|---|---|
| [RETO.md](RETO.md) | Texto original del reto de Space Apps 2026 y lo que pide en realidad. |
| [FUENTES.md](FUENTES.md) | Lectura de los 5 enlaces del reto y 16 páginas de NASA: peligros, riesgos y qué falta. |
| [INVESTIGACION-NASA.md](INVESTIGACION-NASA.md) | Cómo se controlan de verdad los signos vitales a bordo: botiquín, equipos, oficial médico. |
| [INVESTIGACION-TIEMPO.md](INVESTIGACION-TIEMPO.md) | Cómo se mide el tiempo en cohetes, estación, Luna y Marte. Corrige la sección 2 de INVESTIGACION-NASA. |
| [INVESTIGACION-TABLETS.md](INVESTIGACION-TABLETS.md) | Qué tablets y computadoras usan las tripulaciones y cómo se instala software. |
| [INVESTIGACION-MODELO3D.md](INVESTIGACION-MODELO3D.md) | Modelos 3D anatómicos gratuitos y sus licencias. |
| [../public/ATRIBUCIONES.md](../public/ATRIBUCIONES.md) | Licencia y lista de partes del modelo anatómico usado. |

## Decisiones

### 1. Indicadores: los que se miden de verdad a bordo
- **Decisión:** 9 indicadores en el chequeo diario: presión arterial, frecuencia cardíaca, **oxígeno en sangre (SpO₂)**, **frecuencia respiratoria**, temperatura, sueño, ánimo, ejercicio y visión. La **glucosa queda opcional** («No medido»).
- **Por qué:** el botiquín de la estación tiene tensiómetro, oxímetro de dedo, estetoscopio y termómetro, pero **no tiene glucómetro**. La sangre que se extrae es para investigación y se analiza después. La frecuencia respiratoria aparece entre los signos vitales que NASA pide registrar.
- **Evidencia:** [INVESTIGACION-NASA.md §1.1, §1.3, §1.5 y §1.7](INVESTIGACION-NASA.md) (lista oficial del botiquín, Evidence Report de NASA, NASA-STD-3001). El reto sí nombra la glucosa como indicador útil ([RETO.md](RETO.md)): por eso se mantiene, pero opcional.

### 2. Datos calculados a partir de una medición general
- **Decisión:** de una sola lectura de presión se calculan solas la **presión arterial media** y la **presión de pulso**. No cambian el estado del indicador.
- **Por qué:** un mismo equipo entrega varios datos. El oxímetro de dedo da oxígeno y pulso en una lectura. Calcularlos evita pedir más datos al astronauta.
- **Evidencia:** [INVESTIGACION-NASA.md §1.3](INVESTIGACION-NASA.md) (el oxímetro mide oxígeno, monóxido de carbono, metahemoglobina y perfusión). Las fórmulas son estándar clínico, no de NASA.

### 3. Umbrales y textos médicos: borrador por revisar
- **Decisión:** los rangos de `healthEngine.ts` y las guías de `src/data/guidance.ts` se muestran marcados como **borrador por revisar**, con su fuente y si son base NASA o deducción del equipo.
- **Por qué:** ninguna página de NASA leída da rangos normales ni criterios de cuándo avisar. Para glucosa y temperatura la explicación espacial es deducción del equipo.
- **Evidencia:** [FUENTES.md §1, §7 y §8](FUENTES.md).
- **Pendiente:** que alguien con criterio médico los revise y citar guías clínicas para cada rango.

### 4. Lenguaje simple para el astronauta
- **Decisión:** la interfaz habla en lenguaje llano, con entrada guiada paso a paso.
- **Por qué:** el oficial médico de la tripulación «puede haber tenido o no formación médica previa» y recibe unas 40 horas de instrucción. Solo en misiones planetarias de más de 210 días la norma exige nivel de médico.
- **Evidencia:** [INVESTIGACION-NASA.md §1.6](INVESTIGACION-NASA.md).
- **Pendiente:** una **vista técnica** para el oficial médico y el cirujano de vuelo (aprobada, sin construir).

### 5. Tiempo de la misión
- **Decisión:** la app lee el reloj del dispositivo **siempre en UTC** y guarda el **instante de despegue en UTC**. De ahí calcula el MET, el día de vuelo y, en Marte, el número de sol y la hora solar local. No usa la zona horaria del dispositivo.
- **Por qué:**
  - La estación vive en UTC/GMT.
  - Cohetes y cápsulas usan MET.
  - No existe todavía una hora lunar oficial.
  - En Marte, el sol dura 88 775,244 s.
  - **Ningún documento** dice que un dispositivo de a bordo muestre MET u hora marciana, así que la app lo calcula.
- **Evidencia:** [INVESTIGACION-TIEMPO.md](INVESTIGACION-TIEMPO.md) (podcast de NASA, líneas de tiempo Crew-10 y Artemis II, NTRS 20240002094, Mars24 de NASA GISS, página de NASA sobre tiempo lunar).
- **Corrección:** la ventana de sueño de referencia en la estación es **21:30–06:00 GMT**, no hasta las 22:00 como decía la versión inicial.
- **Deducido:** las fórmulas de día de vuelo y número de sol; se indican como cálculo propio en pantalla.

### 6. Despliegue: app web sin conexión
- **Decisión:** app web que se abre desde una carpeta sin instalar nada, e instalable como PWA donde se permita. Todo funciona sin internet: fuentes tipográficas y modelos 3D viajan dentro del paquete, sin CDN.
- **Por qué:** en Artemis II se usó un paquete interactivo en HTML, JS y CSS abierto en el navegador desde una carpeta. En la estación no hay tienda de apps y, según una página interna de NASA (vista solo como resumen de buscador), se recomiendan apps web.
- **Evidencia:** [INVESTIGACION-TABLETS.md](INVESTIGACION-TABLETS.md).
- **Pendiente:** el manifiesto y el service worker de la PWA.

### 7. Diseño para tablet en horizontal
- **Decisión:** diseño «horizontal primero» (1180×820 y 1368×912; mínimo 1024), botones de al menos 44 px para uso con guantes.
- **Por qué:** en Artemis II cada astronauta llevó una Microsoft Surface Pro 5; en la estación se usan iPads. Starliner usa tablets y guantes táctiles.
- **Evidencia:** [INVESTIGACION-TABLETS.md](INVESTIGACION-TABLETS.md).

### 8. Holograma: un solo modelo con zoom a los órganos
- **Decisión:** vista general con la silueta de alambre (`public/humano.glb`) y, al elegir una zona o un órgano, zoom con los órganos y huesos reales (`public/anatomia.glb`).
- **Por qué:** el reto sugiere una figura humana en la que cada parte se pueda tocar ([RETO.md](RETO.md), Objectives). La vista general da el panorama; el zoom muestra el órgano concreto.
- **Licencia:** BodyParts3D, © The Database Center for Life Science, **CC BY 4.0** según su página oficial: gratuito, exige atribución, que se muestra bajo el holograma.
- **Evidencia:** [INVESTIGACION-MODELO3D.md](INVESTIGACION-MODELO3D.md) y [../public/ATRIBUCIONES.md](../public/ATRIBUCIONES.md).
- **Límite:** el conjunto de datos descargado no incluye el bazo.

### 9. Zonas del cuerpo
| Zona | Qué abarca | Indicadores |
|---|---|---|
| Cerebro y conducta | Cerebro | Sueño, ánimo, visión |
| Corazón, pulmones y circulación | Corazón, pulmones, tráquea | Presión, frecuencia cardíaca, oxígeno, respiración |
| Metabolismo y digestión | Hígado, estómago, esófago, intestinos, páncreas, riñones, vejiga | Glucosa (opcional) |
| Cuerpo entero e inmunidad | Todo el cuerpo | Temperatura |
| Huesos y músculos | Todo el esqueleto y las extremidades | Ejercicio |

- **Por qué:** cada zona agrupa lo que afecta un mismo peligro del vuelo espacial ([FUENTES.md §4 y §5](FUENTES.md)). Por ejemplo, la pérdida de hueso y músculo afecta a todo el esqueleto, no solo a las piernas.

### 10. Idiomas
- **Decisión:** español por defecto, inglés como alternativa con un botón. Si el sistema está en inglés y nadie eligió idioma, arranca en inglés.
- **Por qué:** los usuarios pueden no ser técnicos ni hablar inglés; el reto y NASA están en inglés.

### 11. Rutina con recordatorios, sin rachas
- **Decisión:** la rutina se reinicia cada día de misión y cada tarea tiene recordatorio. Sin rachas ni puntos.
- **Por qué:** decisión del equipo. Los recordatorios usan el reloj de la misión (punto 5). Solo suenan con la app abierta.

## Pendientes conocidos
1. Revisión médica de umbrales y guías (punto 3).
2. Vista técnica para el médico (punto 4).
3. PWA instalable (punto 6).
4. Integración con sensores (la propia NASA pide sensores pequeños e inalámbricos, [INVESTIGACION-NASA.md §1.3](INVESTIGACION-NASA.md)).
5. Abrir la pestaña *Resources* del reto en un navegador: desde la PC de desarrollo no se pudo (error de certificado).
6. Probar en una tablet real.
