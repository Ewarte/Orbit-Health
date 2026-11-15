# Atribuciones

## Modelo anatómico (Versión B del holograma)

Archivo: `public/anatomia.glb`

- Datos de origen: **BodyParts3D**, © The Database Center for Life Science (DBCLS), Japón.
- Licencia: Creative Commons Attribution 4.0 International (CC BY 4.0), según la página oficial de licencia:
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Texto de atribución pedido por la página oficial: «BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International».
- Descarga: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (archivo `partof_BP3D_4.0_obj_99.zip`).
- Cambios hechos al material original: se eligieron 14 grupos de partes (piel, cerebro, corazón, pulmones, hígado, estómago, riñones, columna, fémures y tibias con peroné), se unieron las piezas de cada grupo, se pasaron de milímetros con eje Z hacia arriba a metros con eje Y hacia arriba, se simplificó la malla y se comprimió con meshopt. Es un modelo educativo, no sirve para diagnóstico.

Mallas incluidas (nombre en el GLB → parte de BodyParts3D, identificador FMA):
`piel` (skin, FMA7163), `cerebro` (brain, FMA50801), `corazon` (heart, FMA7088), `pulmon_der` (right lung, FMA7309), `pulmon_izq` (left lung, FMA7310), `higado` (liver, FMA7197), `estomago` (stomach, FMA7148), `rinon_der` (right kidney, FMA7204), `rinon_izq` (left kidney, FMA7205), `columna` (vertebral column, FMA13478), `femur_der` (right femur, FMA24474), `femur_izq` (left femur, FMA24475), `tibia_der` (right tibia, FMA24477, más right fibula, FMA24480), `tibia_izq` (left tibia, FMA24478, más left fibula, FMA24481).

## Modelo de malla de alambre (Versión A)

Archivo: `public/humano.glb` (modelo original del proyecto; su atribución no se modificó en esta tarea).
