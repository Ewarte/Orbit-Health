# Atribuciones

## Modelo anatómico (Versión B del holograma)

Archivo: `public/anatomia.glb`

- Datos de origen: **BodyParts3D**, © The Database Center for Life Science (DBCLS), Japón.
- Licencia: Creative Commons Attribution 4.0 International (CC BY 4.0), según la página oficial de licencia:
  https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html
- Texto de atribución pedido por la página oficial: «BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International».
- Descarga: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html (archivo `partof_BP3D_4.0_obj_99.zip`).
- Cambios hechos al material original: se eligieron 34 grupos de partes (esqueleto completo, 13 órganos y la piel), se unieron las piezas de cada grupo en una sola malla, se pasaron de milímetros con eje Z hacia arriba a metros con eje Y hacia arriba, se simplificó la malla y se comprimió con meshopt. Es un modelo educativo, no sirve para diagnóstico. No incluye bazo: el conjunto de datos descargado no trae esa parte.

Mallas incluidas (nombre en el GLB → parte de BodyParts3D e identificador FMA). Cuando una malla agrupa varias partes se indican todas.

Zona «Cerebro y conducta»:
- `cerebro`: brain (FMA50801).

Zona «Corazón, pulmones y circulación»:
- `corazon`: heart (FMA7088).
- `pulmon_der`: right lung (FMA7309).
- `pulmon_izq`: left lung (FMA7310).
- `traquea`: trachea (FMA7394).

Zona «Metabolismo y digestión»:
- `higado`: liver (FMA7197).
- `estomago`: stomach (FMA7148).
- `esofago`: esophagus (FMA7131).
- `intestino_delgado`: small intestine (FMA7200).
- `intestino_grueso`: large intestine (FMA7201).
- `pancreas`: pancreas (FMA7198).
- `rinon_der`: right kidney (FMA7204).
- `rinon_izq`: left kidney (FMA7205).
- `vejiga`: urinary bladder (FMA15900).

Zona «Cuerpo entero e inmunidad»:
- `piel`: skin (FMA7163).

Zona «Huesos y músculos» (esqueleto completo):
- `craneo`: skull (FMA46565) y mandible (FMA52748).
- `columna`: vertebral column (FMA13478), con todas las vértebras y los discos.
- `costillas`: las 24 costillas (de first rib, FMA7857 y FMA7987, a twelfth rib), sus cartílagos costales y sternum (FMA7485).
- `hombros`: right clavicle (FMA13322), left clavicle (FMA13323), right scapula (FMA13395), left scapula (FMA13396).
- `humero_der`, `humero_izq`: right humerus (FMA23130), left humerus (FMA23131).
- `antebrazo_der`, `antebrazo_izq`: right radius (FMA23464) y right ulna (FMA23467); left radius (FMA23465) y left ulna (FMA23468).
- `mano_der`, `mano_izq`: huesos de la mano, right hand (FMA9713) y left hand (FMA9714), con carpo, metacarpianos y falanges.
- `pelvis`: right hip bone (FMA16586), left hip bone (FMA16587), sacrum (FMA16202) y pelvis (FMA9578).
- `femur_der`, `femur_izq`: right femur (FMA24474), left femur (FMA24475).
- `rotula_der`, `rotula_izq`: right patella (FMA24486), left patella (FMA24487).
- `tibia_der`, `tibia_izq`: right tibia (FMA24477) y right fibula (FMA24480); left tibia (FMA24478) y left fibula (FMA24481).
- `pie_der`, `pie_izq`: huesos del pie, right foot (FMA11343) y left foot (FMA11344), con tarso, metatarsianos y falanges.

## Silueta de la vista general

La silueta de alambre es la malla `piel` de este mismo modelo (BodyParts3D), así que silueta, órganos y huesos comparten postura. El modelo anterior (`humano.glb`) se retiró del proyecto el 2026-11-15.
