# Investigación: tablets y computadoras de las tripulaciones y cómo se instala software

Fecha de la investigación: 15 de noviembre de 2026.
Convención: **[OFICIAL]** = NASA, ESA u otra agencia; **[SECUNDARIO]** = prensa, blogs, foros, Wikipedia; **[DEDUCIDO]** = conclusión mía a partir de lo anterior.

## Resumen (5 líneas)

1. En la ISS conviven laptops «Station Support Computers» (SSC), iPads gestionados con un sistema MDM y algunas Surface Pro; en Artemis II cada astronauta llevó una Surface Pro 5 (Windows) como «dispositivo de cómputo portátil» (PCD).
2. Crew Dragon usa pantallas táctiles propias basadas en Chromium sobre Linux (fuente de SpaceX, no de NASA); Starliner tiene tabletas y pantallas, pero no hallé modelo ni sistema operativo.
3. No hay tienda de apps: todo software pasa por un proceso de aprobación de NASA y se envía desde tierra; el propio documento del JSC dice que las apps web funcionan en cualquier plataforma de la red interna de la estación (Ops LAN) y desalienta las apps nativas de iPad.
4. La app ya probada en Artemis II fue un paquete HTML/JS/CSS que corría en el navegador de la Surface Pro, sin internet: es el precedente más directo para nuestra app.
5. Recomendación: web instalable (PWA) o, mejor aún, sitio estático que funcione desde archivos locales, sin CDN, táctil, y probado en Windows/Edge y en iPad/Safari; una app nativa solo si hay hardware que la exija.

## Tabla de dispositivos

| Dispositivo | Dónde se usa | Sistema operativo | Fuente | Confianza |
|---|---|---|---|---|
| Microsoft Surface Pro 5 (PCD) | Orion, Artemis II (abril de 2026), una por astronauta; una falló en vuelo | Windows (versión no indicada); usan OneNote y un paquete navegador HTML | Guía de datos de ciencia de Artemis II (NASA) | Alta (modelo); media (versión de Windows, ver «No confirmado») |
| iPhone 17 Pro Max | Orion, Artemis II, uso personal/fotografía | iOS (modificado según prensa) | Podcast NASA (iPhones); detalles en prensa | Media: NASA confirma el uso como cámara; el proceso de pruebas solo en prensa |
| Nikon D5 (cámara) | Orion, Artemis II | No aplica | Guía de datos de ciencia de Artemis II | Alta |
| Pantallas principales de Orion (3) con teclas en el borde y cursor | Orion (cabina) | No indicado | NASA, podcast y NTRS | Media |
| Laptops SSC (Station Support Computers) | ISS: tareas no críticas (cronogramas, correo, inventario) | Antes Windows 7 con Internet Explorer 11 (2019); hoy no confirmado | NTRS 20190000220; blog de la estación | Alta (histórico); baja (actual) |
| Lenovo ThinkPad T61p | ISS, 23 unidades como SSC (2019) | Windows 7 / Debian en servidores | NTRS 20190000220 | Alta (para 2019) |
| iPad (3, luego iPad Air 2) | ISS: cronogramas, procedimientos, mensajes, apps de ciencia | iOS con Safari (iOS 6 en el estudio de 2019; iPad Air 2 actualizado en 2017) | Informes diarios de la ISS (NASA) y NTRS | Alta (histórico); baja (modelo actual) |
| Surface Pro (ISS) | ISS: cargas útiles MED2 y Biomolecule Sequencer | Windows | NTRS 20170008536 (PLUTO, 2017) | Media (modelo exacto no dado) |
| LG Nexus 5 (Android), Google Glass | ISS, demostración ESA mobiPV (2015), de hardware comercial (COTS) | Android | Presentación final de ESA mobiPV | Alta (solo demostración) |
| iPad con aplicación de ultrasonido (Butterfly iQ) | ISS, 2022 | iPadOS/iOS | NASA, resumen semanal de ciencia | Alta |
| Pantallas táctiles de Crew Dragon | Crew Dragon | Linux a medida; interfaz web en Chromium | SpaceX (AMA de 2020, reproducido en prensa) | Media (fuente de la empresa, no de NASA) |
| Tabletas y pantallas de Starliner | Starliner | No encontrado | Podcast NASA; documentación de control de misión | Baja (solo existencia) |

## Respuestas a las 6 preguntas

### 1. ISS: tablets, computadoras y pantallas

**[OFICIAL]**
- Las SSC son las laptops de actividades que no son de mando y control (blog NASA de la estación, mayo de 2023). La red interna se llama Ops LAN. NASA lista el sistema SSC como «servidores y clientes (laptops), tablets y otros dispositivos portátiles» (NTRS 20170008536).
- Un artículo técnico de NASA de 2019 dice: la tripulación tenía 23 laptops Lenovo T61p llamadas SSC, con Windows 7 e Internet Explorer 11, y iPads con Safari, todos conectados a la Ops LAN (NTRS 20190000220).
- iPads: en 2012 el programa de la ISS compró tres iPads certificados para la tripulación (NTRS 20130000791). En 2016 se comenzó a sustituir los iPad 3 por iPad Air 2 para ver cronogramas, procedimientos y mensajes; en 2017 se actualizó el iOS de un iPad Air 2 conectándolo a una SSC; en 2023 aparece «actualización de iPad por conexión CrewNet» (informes diarios de la ISS).
- Surface Pro con cargas útiles de ciencia (MED2, Biomolecule Sequencer) y apps de iPad (Dose Tracker, iShort, FineMotor, Food Intake Tracker) figuran en el documento PLUTO de 2017.
- En 2022 la tripulación hizo ecografías con un iPad (resumen semanal de ciencia de NASA).

**[SECUNDARIO]**
- Cambio de Windows XP a Debian Linux en 2013 y reemplazo de ThinkPad por HP ZBook con Windows 10 (TechRepublic, Computer Weekly, Phys.org y otros). No lo confirmé en documentos de NASA.

**[DEDUCIDO]** La flota actual probablemente es mixta (Windows, Linux en algunos sistemas de mando e iPads). No hay fuente oficial reciente con modelos y versiones.

### 2. Naves

- **Orion (Artemis II) [OFICIAL]:** cada astronauta tuvo una Microsoft Surface Pro 5 («PCD»). Sus usos: grabar audio de observaciones, guardar notas manuscritas (en un archivo OneNote ya preparado), retransmitir imágenes y mostrar el «Lunar Targeting Package». Este último es una herramienta interactiva en el navegador, entregada como carpeta comprimida con JPEG, PNG, JS, CSS y HTML. Una de las cuatro PCD falló antes del sobrevuelo lunar y dos astronautas compartieron una (guía de datos de ciencia de Artemis II). NASA también dice que la tripulación tiene tabletas y laptops para revisar procedimientos y cargar entretenimiento antes del lanzamiento. Las pantallas principales (3) se manejan con dispositivo de cursor, perilla y teclas físicas en el borde (podcast de NASA). Los objetivos de la misión incluían probar restricción de acceso a las tabletas y la conexión Bluetooth de un dosímetro con ellas (documento de objetivos de Artemis II).
- **Orion, iPhone [OFICIAL parcial]:** un podcast de NASA confirma que la tripulación llevó iPhones como cámaras. Detalles (modelo 17 Pro Max, pruebas en cuatro fases, modificaciones) vienen de la guía de datos (modelo) y de prensa (proceso) **[SECUNDARIO]**.
- **Crew Dragon:** NASA confirma pantallas táctiles y guantes compatibles con ellas. Que corran Chromium con HTML/JS/CSS sobre un Linux a medida sale del AMA de SpaceX de 2020 **[SECUNDARIO: fuente de la empresa, no de NASA]**. No encontré tabletas personales o de procedimientos de Dragon en fuentes oficiales.
- **Starliner [OFICIAL]:** un podcast de NASA dice que los astronautas tendrán tabletas para bitácoras electrónicas y que los guantes son táctiles; la documentación de control de misión menciona unidades de pantalla, redes inalámbricas y tabletas, con un rol de soporte de tabletas. No encontré modelo ni sistema operativo.

### 3. Certificación y carga de software

**Hardware [OFICIAL]**
- El programa de la ISS simplificó la certificación de hardware comercial (COTS) para poder usar dispositivos como el iPad (NTRS 20130000791).
- Las baterías de litio de dispositivos COTS (laptops, tablets, cámaras) se rigen por el estándar JSC 20793; exige revisión de diseño, certificación, tolerancia a dos fallas y seguimiento de vida útil; para COTS remite a JSC 66548 (NTRS 20160003504).
- En la demostración mobiPV de ESA, los retos de calificar hardware comercial fueron: radiofrecuencia (Bluetooth, Wi-Fi, GSM), baterías internas, materiales (vidrio, plásticos) y carga.
- Ventilación, radiación y seguridad eléctrica: **no encontré documento oficial que detalle esos pasos para tablets**. No los invento.

**Software [OFICIAL, con reserva]**
- Según un resumen de una página del JSC (no pude abrirla directamente porque el servidor es interno; solo leí el resumen de búsqueda): las apps de iPad (de empresa o B2B) se envían a la estación mediante un sistema MDM a medida gestionado por un contratista de NASA; el servidor valida la app con Apple y la tripulación la instala desde una app «Self Service». Esa página «desaconseja» apps de iPad salvo que el experimento necesite hardware de tableta, y dice que las **apps web pueden usarse en cualquier plataforma de la Ops LAN**. NASA usa JAMF como MDM (informe de 2015, prensa de NASA/JAMF).
- No hay tienda de apps pública; el software se sube desde tierra y los astronautas lo instalan solo desde ese entorno controlado. Los astronautas no instalan software por su cuenta **[DEDUCIDO]**.
- Ejemplo de entrega: el Lunar Targeting Package llegó como carpeta a las PCD durante la misión (guía de datos de Artemis II).

### 4. Apps y web apps ya existentes

- **[OFICIAL]** Lunar Targeting Package (Artemis II): herramienta HTML/JS/CSS interactiva en el navegador de la Surface Pro, sin internet (la nave está a distancia lunar; el paquete se entregó por enlace de datos).
- **[OFICIAL]** AMO (software de apoyo a decisiones, 2019): app web servida desde un servidor de la Ops LAN, mostrada en Internet Explorer 11 (Windows 7) y Safari (iPad), con diseño que tuvo que adaptarse a pantalla táctil y a orientación vertical/horizontal.
- **[OFICIAL]** mobiPV (ESA, 2015): visor móvil de procedimientos con iPad, smartphone y Google Glass; en la ISS funcionó en iPad; hubo límites de ancho de banda y la voz no funcionó bien; los astronautas preferían la tableta al teléfono.
- **[OFICIAL]** Salud: el seguimiento de ingesta de comida se hace con una app de tableta diaria (NASA, preguntas frecuentes de salud); Dose Tracker (medicación) en iPad; el sistema MIST de NASA incluye un «Exercise Information System»; EveryWear de ESA es una app de iPad que se conecta a sensores portátiles (ejercicio, pulso, sueño). No hallé documentos que digan si estas apps funcionan sin conexión.
- **Navegador:** Internet Explorer 11 y Safari (2019, histórico); Chromium en Dragon (secundario); navegador de la Surface en Orion no indicado.
- **[DEDUCIDO]** Casi todo funciona en red interna cerrada, con latencias y cortes; por lo tanto las apps deben tolerar desconexión.

### 5. Luna y Marte

- **[OFICIAL]** El Rapid Prototyping Lab de la Oficina de Astronautas diseña interfaces de software con la meta de interfaces comunes entre Orion y Gateway, y aporta a las cabinas de los módulos de aterrizaje lunar (HLS). No encontré documento sobre tabletas de Gateway ni de Starship HLS.
- **[OFICIAL]** Para Marte, los documentos de ExMC (Exploration Medical Capability) plantean autonomía médica de la tripulación: demoras y cortes de comunicación hacen inviable la telemedicina en tiempo real, y se estudia un sistema de apoyo a decisiones clínicas (CDSS). No describen el dispositivo.
- **[DEDUCIDO]** Una app de salud que funcione sin internet encaja con esa dirección. No hay fuente sobre hardware para Marte.

### 6. Conclusión práctica

**¿PWA, nativa o ambas? [DEDUCIDO]**
- Priorizar una **aplicación web** que se pueda entregar como carpeta estática (HTML/JS/CSS) y también instalar como PWA. Razones: es lo que NASA ya hizo en Artemis II; la guía del JSC dice que las apps web funcionan en cualquier plataforma de la Ops LAN y desalienta las nativas de iPad; la certificación y el mantenimiento de apps nativas son más costosos.
- Una app nativa (iOS) solo tiene sentido si necesita hardware que el navegador no da (por ejemplo, Bluetooth de sensores). Aun así debe pasar por el MDM. No se recomienda en esta fase.
- Matiz: la instalación como PWA depende del navegador y de políticas del dispositivo; en un entorno controlado puede no estar disponible. Por eso conviene que la app abra también desde un archivo/servidor local sin instalación.

**Restricciones para la app [DEDUCIDO salvo indicación]**
- Funcionar 100 % sin conexión: sin CDN, sin fuentes ni scripts remotos, sin llamadas a APIs externas; todo empaquetado. Probar con la red apagada.
- Compatibilidad amplia: Chromium/Edge (Windows, Surface), Safari en iPad y navegadores antiguos; evitar APIs recientes sin alternativa (el registro fue Internet Explorer 11 en 2019; hoy no confirmado).
- Pantalla táctil con guantes: botones grandes, sin gestos finos ni arrastre preciso (NASA indica que los guantes reducen la tactilidad y hacen el cursor más lento e impreciso). Adaptarse a orientación vertical y horizontal (reto señalado en el diseño de AMO).
- Tamaño pequeño y arranque rápido: los paquetes se envían por enlace de bajo ancho de banda; evitar activos pesados. Datos guardados localmente (no depender de IndexedDB sin respaldo de exportación).
- Batería y calor: poca actividad en segundo plano, sin animaciones continuas, modo oscuro opcional.
- Sin dependencia de cuentas ni nube; exportar datos a un archivo (el flujo de Artemis II descargó el archivo OneNote entero).
- Acceso restringido y privacidad: Artemis II probó restringir acceso a las tabletas; ofrecer bloqueo simple.
- Tolerar fallo del dispositivo: una de las 4 PCD falló y dos astronautas compartieron una; permitir varios perfiles en un mismo dispositivo y exportar/importar datos.

## Qué NO se pudo confirmar

- Versión de Windows y navegador de las Surface Pro 5 de Orion.
- Flota actual de laptops de la ISS (modelos y sistema operativo hoy); los ThinkPad T61p/Windows 7 son de 2019 y la información sobre HP ZBook/Windows 10/Debian es secundaria.
- Texto completo de las páginas del JSC `tsc.jsc.nasa.gov/roi-swprocess` (servidor interno, no resuelve el dominio): solo conozco su contenido por el resumen del buscador.
- Pasos oficiales de certificación de ventilación, radiación y seguridad eléctrica para tablets; solo encontré el estándar de baterías.
- Proceso de pruebas del iPhone 17 Pro Max (solo prensa) y si hay apps instaladas en él.
- Dispositivos y sistema operativo de Starliner, y existencia de tabletas personales o de procedimientos en Crew Dragon.
- Tabletas de Gateway, módulos de aterrizaje lunar o Marte.
- Si las apps de salud y ejercicio de la ISS funcionan sin conexión.
- Uso de tablets en el segmento ruso, JAXA y CSA: no encontré fuente.
- Datos de baterías de litio de dispositivos de consumo, EMI y outgassing: no hallé documento específico de tablets.

## Fuentes

### Oficiales
- NASA, guía de datos de ciencia lunar de Artemis II: https://assets.science.nasa.gov/content/dam/science/missions/artemis/artemis-ii-prelimsci-report-/artemis2_data_user_guide.pdf
- NASA, Life Encapsulated (Orion, Artemis II): https://www.nasa.gov/directorates/esdmd/common-exploration-systems-development-division/orion-program/life-encapsulated-inside-nasas-orion-for-artemis-ii-moon-mission/
- NASA, preguntas sobre Artemis II (32 cámaras y dispositivos): https://www.nasa.gov/missions/nasa-answers-your-most-pressing-artemis-ii-questions/
- NASA, podcast Artemis II: Bringing the Mission to You (iPhones): https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-ii-bringing-the-mission-to-you/
- NASA, objetivos y prioridades de Artemis II: https://www.nasa.gov/wp-content/uploads/2026/03/artemis-ii-mission-prioirities-objectives-.pdf
- NASA, Spacecraft Displays (Orion): https://www.nasa.gov/johnson/HWHAP/spacecraft-displays
- NASA, podcast Orion: https://www.nasa.gov/podcasts/houston-we-have-a-podcast/orion/
- NTRS 20130000791, iPad en la ISS (certificación COTS): https://ntrs.nasa.gov/citations/20130000791
- NTRS 20170008536, PLUTO (SSC, iPad, Surface Pro): https://ntrs.nasa.gov/api/citations/20170008536/downloads/20170008536.pdf
- NTRS 20190000220, AMO en la Ops LAN de la ISS: https://ntrs.nasa.gov/api/citations/20190000220/downloads/20190000220.pdf
- NTRS 20160003504, JSC 20793 (baterías de vehículos tripulados): https://ntrs.nasa.gov/api/citations/20160003504/downloads/20160003504.pdf
- NASA, informe diario ISS 14/09/2017 (iPad Air 2, actualización de iOS): https://www.nasa.gov/blogs/stationreport/2017/09/14/iss-daily-summary-report-9-14-2017/
- NASA, informe diario ISS 16/11/2016 (iPad Air 2 sustituye iPad 3): https://www.nasa.gov/blogs/stationreport/2016/11/16/iss-daily-summary-report-11-16-2016/
- NASA, informe diario ISS 11/08/2023 (actualización de iPad por CrewNet): https://blogs.nasa.gov/stationreport/2023/08/11/iss-daily-summary-report-8-11-2023/
- NASA, informe diario ISS 26/05/2023 (SSC NAS): https://blogs.nasa.gov/stationreport/2023/05/26/iss-daily-summary-report-5-26-2023
- NASA, resumen semanal de ciencia, 11/07/2022 (ecografía con iPad): https://www.nasa.gov/missions/station/space-station-science-highlights-week-of-july-11-2022/
- NASA, salud de los astronautas (app de ingesta de comida): https://www.nasa.gov/missions/station/faq-the-real-story-about-astronaut-health-care-in-space/
- NASA, MIST (Exercise Information System): https://nasa.gov/feature/medical-information-systems-and-tools-mist
- NASA, podcast The Boeing Starliner: https://www.nasa.gov/podcasts/houston-we-have-a-podcast/the-boeing-starliner/
- NASA, documentación de operaciones conjuntas con Boeing: https://roundupreads.jsc.nasa.gov/roundup/1328
- NASA, Crew-13 (guantes táctiles): https://www.nasa.gov/blogs/commercialcrew/2026/10/01/nasas-spacex-crew-13-suits-up-for-launch/
- NASA, ficha de controles de tripulación OCHMO-TB-052: https://www.nasa.gov/wp-content/uploads/2026/10/ochmo-tb-052-crew-controls.pdf
- NASA, Rapid Prototyping Lab (interfaces comunes Orion/Gateway/HLS): https://www.nasa.gov/wp-content/uploads/2025/10/rpl-innovation-irad-poster-rpl-l-morin-120423.pdf
- NASA, ExMC concepto de operaciones médicas para Marte: https://ntrs.nasa.gov/citations/20200001715
- NASA, ExMC apoyo a decisiones clínicas: https://ntrs.nasa.gov/citations/20220017856
- ESA, mobiPV (presentación final): https://indico.esa.int/event/119/contributions/454/attachments/607/652/03_-_mobiPV.pdf
- ESA, EveryWear: https://www.esa.int/ESA_Multimedia/Images/2017/09/EveryWear_app
- NASA JSC, páginas de proceso de software de la ISS (solo vistas en resumen; servidor interno, no accesible): https://tsc.jsc.nasa.gov/roi-swprocess/sw_reqs.html, https://tsc.jsc.nasa.gov/roi-swprocess/ipad_certs.html, https://tsc.jsc.nasa.gov/roi-swprocess/ipad_update.html

### Secundarias
- SpaceX, AMA de software, junio de 2020 (Chromium/Linux en Dragon), reproducido en: https://hackaday.com/2020/06/08/displaying-html-interfaces-and-managing-network-nodes-in-space
- JAMF y NASA, gestión de iPads (informe de 2015): https://csrc.nist.gov/csrc/media/projects/forum/documents/august2015/forum-august2015-maples-cauwels.pdf
- Prensa sobre Surface Pro en Artemis II y Outlook: https://engadget.com/computing/artemis-ii-crew-is-just-like-us-needs-help-with-microsoft-outlook-issues-145230968.html
- Prensa sobre el iPhone 17 Pro Max y su certificación: https://appleinsider.com/articles/26/04/04/how-nasa-approved-the-iphone-17-pro-max-for-the-artemis-ii-space-mission
- TechRepublic, tecnología de la ISS (ThinkPad, HP ZBook): https://www.techrepublic.com/pictures/photos-from-the-thinkpad-to-the-ipad-the-tech-used-on-the-iss/
- Phys.org, migración de laptops a Linux en 2013: https://phys.org/news/2013-05-international-space-station-laptop-migration.html
