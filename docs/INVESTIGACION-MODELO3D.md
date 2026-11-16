# Investigación de modelos 3D anatómicos para la pantalla «Hoy»

> **Nota (2026-11-15):** informe previo a la implementación. Al final se usó **BodyParts3D (CC BY 4.0)** como modelo único, incluida su piel como silueta; `humano.glb` ya no se usa. Ver `DECISIONES.md` §8 y `public/ATRIBUCIONES.md`.

Fecha de la investigación: 15 de noviembre de 2026. Alcance: solo investigación en línea; no se descargó ningún modelo y no se tocó código ni se agregaron archivos al proyecto en D:\Orbit-Health.

Aviso: lo que aquí se dice sobre licencias es un resumen de lo leído en cada página, no asesoría legal. Las dudas están marcadas con «DUDA».

## 1. Resumen

1. No existe (según lo encontrado) un único modelo gratuito, con licencia permisiva, en GLB, liviano y con piel, esqueleto y órganos como mallas separadas y con nombre.
2. La mejor fuente de datos con órganos nombrados es BodyParts3D (DBCLS, Japón). Su página oficial de descarga hoy declara CC BY 4.0, que permite uso comercial sin copyleft, pero otras fuentes la citan como CC BY-SA 2.1 Japón. Hay una contradicción que debe aclararse antes de usarla.
3. Z-Anatomy (derivado de BodyParts3D) es el más completo y con mejores nombres, pero es CC BY-SA 4.0 (copyleft) y mezcla componentes con licencias no comerciales; es el de mayor riesgo legal.
4. NIH 3D y Sketchfab ofrecen piezas sueltas (cráneo, torso, corazón, esqueleto) con licencias CC0 o CC BY, pero ninguna cubre el cuerpo completo; sirven como complemento.
5. Cualquier opción exige armar el modelo nosotros (exportar, simplificar, nombrar y comprimir en GLB); es viable alcanzar menos de 8 MB, pero ese tamaño es una estimación, no una medida.

## 2. Tabla comparativa

Todos los datos de licencia se leyeron en la página original indicada. Donde el tamaño final dice «estimado», no se midió.

| # | Candidato | Enlace | Licencia (según la página) | Atribución | Formato | Tamaño | Órganos separados | Partes con nombre | Notas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | BodyParts3D 4.0 (DBCLS) | https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html | CC BY 4.0 según la página de licencia oficial (lic.html). DUDA: Z-Anatomy y otros proyectos lo citan como CC BY-SA 2.1 Japón (versión antigua) | Sí. Texto pedido: «BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International» | OBJ en ZIP (un OBJ por parte FMA) | `partof_BP3D_4.0_obj_99.zip` 62 MB; `isa_BP3D_4.0_obj_99.zip` 136 MB (reducción 99 %). Subconjunto en GLB: estimado de 3 a 10 MB, sin medir | Sí (cerebro, corazón, pulmones, hígado, estómago, intestinos, riñones, huesos, etc.) | Sí: listas `partof_parts_list_e.txt` e `isa_parts_list_e.txt` con ID FMA y nombre | Es solo datos (sin piel completa ni texturas; el contorno de piel hay que construirlo o usar la parte «skin» si existe, sin verificar). Hay que convertir de OBJ a GLB y simplificar. Solo en inglés/FMA |
| 2 | Z-Anatomy | https://github.com/Z-Anatomy/Models-of-human-anatomy | CC BY-SA 4.0 (README del repositorio) | Sí, varias: BodyParts3D (CC BY-SA 2.1 Japón), Z-Anatomy (CC BY-SA 4.0), Wikipedia (CC BY-SA 3.0) para definiciones, código de Lluís Vinent | Plantilla de Blender (`Z-Anatomy.zip`, `Startup.blend`); el repositorio de la aplicación indica también FBX. No hay GLB oficial | No indicado en las páginas. Se debe medir tras exportar | Sí, muy completo (cuerpo entero, sistemas) | Sí, nomenclatura anatómica (Terminologia Anatomica, archivo `TA2.csv`) | Copyleft: las obras derivadas deben compartirse bajo la misma licencia. Un proyecto que lo usa advierte que upstream no mapea licencia por malla y que algunos componentes (otras fuentes) son CC BY-NC o CC BY-NC-SA, es decir, no comerciales. Riesgo alto para una app con distribución |
| 3 | NIH 3D – cráneo y ojos Visible Human (NLM 3D: Anatomy) | https://3d.nih.gov/entries/3DPX-020591 | CC BY 4.0 | Sí (autor kbrowne; la página enlaza una guía de cita) | GLB (con UV y mapas normales) | No indicado | Cráneo y ojos como piezas | Parcial (no verificado el nombre de cada malla) | Útil solo para la cabeza. Baja resolución por diseño. Versión 2 |
| 4 | NIH 3D – corazón humano (Biology Notes Online) | https://3d.nih.gov/entries/3DPX-022787 | Dominio público / CC0 1.0 | No exigida; la página nombra a Sourav Pan y Biology Notes Online | «Mesh File» (extensión no indicada) | No indicado | Una sola pieza (solo el corazón) | No | Buen complemento para el corazón. DUDA menor: las entradas de NIH 3D a veces mezclan avisos de derechos de autor en la descripción; revisar cada entrada |
| 5 | NIH 3D – torso humano detallado (Artec 3D) | https://3d.nih.gov/entries/3DPX-022818 | CC BY. La insignia dice 4.0 pero la descripción dice 3.0: DUDA | Sí (SunnyArt / Artec 3D) | «Mesh File» (extensión no indicada) | No indicado | No: es un escaneo de torso | No | Sirve como silueta/piel del torso, pero es un escaneo de alta resolución, pesado; haría falta decimarlo. Sin piernas ni cabeza completas |
| 6 | Sketchfab – «free low poly PBR textured human skeleton» (AaronJOlson) | https://sketchfab.com/3d-models/free-low-poly-pbr-bsdf-textured-human-skeleton-d0c9919aec004fd39d65ce7a7960969b | CC BY 4.0 | Sí | Descarga con `.blend` (la página no lista GLB) | 466,6 mil triángulos, 234,1 mil vértices (demasiado alto para tablet sin decimar) | Huesos separados (probable; no verificado) | No verificado | Pese al nombre «low poly», es pesado. Solo esqueleto |
| 7 | Sketchfab – «human organ» (dimas9933) | https://sketchfab.com/3d-models/human-organ-762cc28ede774bc3996238a66a93d8a2 | CC BY 4.0 | Sí | La página muestra «Download 3D Model»; formatos no listados | 18 mil triángulos, 9 mil vértices (liviano) | No verificado | No verificado | Contenido exacto desconocido (la página no lo detalla). Hay que verlo en el visor antes de decidir |
| 8 | OpenGameArt – «Human Lungs» (Scribe) | https://opengameart.org/content/human-lungs | CC0 según el resultado de búsqueda. NO verificado en la página (HTTP 403) | No exigida si es CC0 | No verificado | No verificado | Solo pulmones | No | Dato de segunda mano; confirmar en navegador. El autor menciona otros órganos |

Descartados tras verificar:
- Sketchfab «generalized human body» (tashtego): CC BY-NC, prohíbe uso comercial; además es de músculos, sin órganos.
- Sketchfab «visible interactive human exploding skull»: CC BY-NC-ND (según el resultado de búsqueda), no sirve.
- Virtual Body «Segmented Internal Organs of the Visible Human Male» (CC BY): es un modelo de vóxeles en TIFF, no malla, y la distribución figura como pausada. No útil.
- Kenney, Quaternius, Poly Pizza, Smithsonian 3D, Open3DLab, Blender Market gratuito: las búsquedas no devolvieron ningún modelo de anatomía humana con órganos. No se pudo confirmar su ausencia al 100 %; recomendable una búsqueda manual en poly.pizza («organs», «anatomy»).
- CGTrader/TurboSquid: casi todo es de pago o con licencia propia; no cumple el criterio.
- Open 3D Model Project (anatomytool.org): la página falló por certificado vencido; no se pudo verificar. Queda pendiente.

## 3. Recomendación: los 2 mejores

### Opción A (recomendada): BodyParts3D 4.0, tomando solo las partes que necesitamos

Por qué:
- Tiene órganos como mallas separadas y con nombre oficial (lista FMA), justo lo que se pide para resaltar zonas.
- La página oficial de licencia hoy dice CC BY 4.0: uso comercial y redistribución permitidos con atribución, sin obligación de compartir igual.
- Se puede elegir un subconjunto pequeño (decenas de partes) y mantener el GLB final liviano.
- Datos con reducción de polígonos al 99 % ya disponibles (ZIP de 62 MB, del que solo usaríamos una fracción).

Condiciones antes de adoptarla:
1. Resolver la DUDA de licencia: la página oficial dice CC BY 4.0, pero Z-Anatomy y otros la citan como CC BY-SA 2.1 Japón. Conviene guardar una captura de la página de licencia con fecha y, si es posible, escribir al DBCLS (contacto indicado en su página) para confirmarlo por escrito.
2. Si resultara BY-SA, el copyleft aplicaría al modelo derivado (no necesariamente a todo el código de la app, pero es una DUDA para revisar con una persona experta).
3. Construir la piel/silueta: BodyParts3D es de estructuras anatómicas; hay que comprobar si incluye una parte de piel utilizable o crear una silueta con el humano actual (`public/humano.glb`) como envoltura translúcida.

### Opción B: híbrido de piezas CC0/CC BY (NIH 3D + Sketchfab) como respaldo o complemento

Por qué:
- Licencias claras y permisivas (CC0 para el corazón de NIH; CC BY 4.0 para cráneo, torso y el modelo de Sketchfab de 18 mil triángulos).
- Si BodyParts3D resultara con copyleft inaceptable, se puede mantener el humano actual de silueta y añadir órganos sueltos escalados a mano.

Contras: cada pieza tiene estilo distinto, hay que escalarlas y alinearlas a mano, y no existen nombres de malla garantizados. Más trabajo artesanal.

Z-Anatomy queda en tercer lugar: es el más rico, pero CC BY-SA 4.0 más componentes no comerciales sin mapa por malla lo hacen el más arriesgado. Solo recomendable si el equipo acepta publicar los modelos derivados bajo CC BY-SA y se auditan las mallas usadas una por una.

## 4. Riesgos

Licencia:
- Contradicción de versión de licencia en BodyParts3D (CC BY 4.0 vs CC BY-SA 2.1 Japón). Prioridad alta.
- Copyleft de Z-Anatomy (BY-SA): el modelo modificado debe redistribuirse con la misma licencia y con sus avisos.
- Componentes no comerciales dentro de Z-Anatomy (CC BY-NC, BY-NC-SA) sin marca por malla.
- Entradas de NIH 3D con avisos contradictorios (torso: 4.0 vs 3.0; riñón: «dominio público» con aviso de derechos en la descripción).
- Sketchfab: la licencia puede cambiar o el autor retirar el modelo; guardar captura de la página el día de la descarga.
- Obligación de atribución: la app debe incluir una pantalla de créditos accesible sin conexión.
- El contexto médico/de salud: advertir que es un modelo educativo y no un diagnóstico (decisión del equipo, no legal).

Peso:
- Los datos originales son grandes (BodyParts3D 62 MB y 136 MB en ZIP; esqueleto de Sketchfab con 466 mil triángulos). El objetivo de menos de 8 MB exige selección de partes, simplificación y compresión; es alcanzable pero no está medido.
- Texturas (si las hay) pesan más que la geometría: preferir colores planos por material.

Rendimiento en tablet:
- Muchas mallas separadas implican muchas llamadas de dibujo (draw calls). Mantener por debajo de unas 50 a 80 mallas, o fusionar las que se resaltan juntas.
- Evitar transparencias múltiples apiladas (piel + órganos) en tabletas modestas: usar una sola capa translúcida para la piel.
- Decodificar Draco/meshopt consume CPU al cargar; meshopt suele ser más ligero de descomprimir. Hay que probar en la tableta objetivo.
- Funcionamiento sin conexión: el GLB y los decodificadores (Draco WASM o meshopt) deben incluirse en la caché de la app (service worker), no cargarse desde CDN.

## 5. Pasos para integrarlo (sin implementarlo aún)

1. Confirmar la licencia: captura de pantalla de la página de licencia de BodyParts3D, correo de confirmación si es posible, y decidir con el equipo si se acepta BY o BY-SA.
2. Seleccionar partes: con `partof_parts_list_e.txt` elegir cerebro, corazón, pulmones (izquierdo y derecho), hígado, estómago, intestino delgado y grueso, riñones, columna vertebral, fémures, tibias/peronés, y cráneo y caja torácica. Descargar solo el ZIP `partof` (62 MB) en una carpeta temporal y extraer únicamente esos OBJ.
3. Convertir y ensamblar: importar los OBJ en Blender (o usar `obj2gltf` / `gltf-transform`), un objeto por parte, con nombres propios y estables (por ejemplo `cerebro`, `corazon`, `pulmon_izq`).
4. Simplificar: decimar a un presupuesto total de unos 100 a 200 mil triángulos (a ajustar en pruebas), con más detalle en corazón y cerebro.
5. Silueta de piel: reutilizar el humano actual (`humano.glb`) como malla `piel` translúcida o en alambre, alineada a escala con los órganos.
6. Exportar GLB y comprimir con `gltf-transform optimize` (cuantización + meshopt o Draco). Medir el tamaño real y compararlo con el límite de 8 MB.
7. Verificar en tableta: cuadros por segundo, tiempo de carga y consumo de memoria, sin conexión.
8. Créditos: añadir en la app la atribución exacta pedida por cada fuente.

Mapeo de partes a las zonas de la app (propuesta, sujeta a decisión del equipo):

| Zona de la app | Mallas del modelo |
|---|---|
| Cabeza | cráneo, cerebro (y ojos si se usa NIH 3D) |
| Corazón | corazón (y pulmones como contexto opcional) |
| Metabolismo | hígado, estómago, intestinos, riñones |
| Cuerpo | piel/silueta, columna, caja torácica, pulmones |
| Piernas | fémures, rótulas, tibias, peronés (y piel de las piernas) |

Implementación en three.js/@react-three/fiber: recorrer la escena con `scene.traverse`, agrupar por nombre de malla según la tabla anterior y cambiar material (emisivo/opacidad) de las mallas del grupo activo. Para no depender de nombres frágiles, guardar un archivo JSON propio `zona -> [nombres de malla]`.

## 6. Informe final breve

Qué se hizo: se investigó y verificó en las páginas originales la licencia, formato y datos de BodyParts3D, Z-Anatomy, varias entradas de NIH 3D y modelos de Sketchfab; se buscó sin éxito anatomía en Kenney, Quaternius, Poly Pizza, Smithsonian y similares. No se descargó nada ni se tocó el proyecto.

Archivo: D:\Space Apps\docs\INVESTIGACION-MODELO3D.md

Hallazgos clave:
- No hay un modelo único listo; la mejor base es BodyParts3D (órganos con nombre), con la salvedad de la contradicción CC BY 4.0 / CC BY-SA 2.1 Japón.
- Z-Anatomy es copyleft (BY-SA) y mezcla componentes no comerciales: riesgo alto.
- NIH 3D aporta corazón (CC0), cráneo (CC BY) y torso (CC BY), todo en piezas sueltas.
- Los tamaños finales en GLB son estimaciones, no medidas.

Pendientes:
- Confirmar por escrito la licencia vigente de BodyParts3D.
- Verificar en navegador el modelo de OpenGameArt (HTTP 403) y la entrada de Sketchfab «human organ» (contenido exacto).
- Revisar anatomytool.org (certificado vencido) y buscar a mano en poly.pizza.
- Prototipar la conversión para medir el tamaño real y el rendimiento en la tableta.
- Decidir si el equipo acepta CC BY-SA como posibilidad (decisión de negocio, no mía).
