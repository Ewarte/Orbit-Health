# Instalación y uso sin conexión

Orbit Health funciona **sin internet**. Hay dos maneras de tenerla en una tablet o computadora: instalarla como app (recomendado) o copiar un único archivo.

## 1. Instalar como app (recomendado)

Necesitas abrir una vez la dirección web de la app (debe empezar con `https://`) con internet. Después ya no hace falta conexión.

### En Windows (Surface Pro) con Microsoft Edge
1. Abre la dirección de la app en Edge.
2. Toca los tres puntos `…` (arriba a la derecha) → **Aplicaciones** → **Instalar esta aplicación**. También puede aparecer un ícono de instalación en la barra de direcciones.
3. Confirma con **Instalar**. Se crea un ícono de Orbit Health en el menú Inicio y en el escritorio.

### En iPad con Safari
1. Abre la dirección de la app en **Safari** (otros navegadores no instalan apps en iPad).
2. Toca **Compartir** (el cuadrado con una flecha hacia arriba) → **Agregar a pantalla de inicio**.
3. Toca **Agregar**. Aparece el ícono de Orbit Health en la pantalla de inicio.

### Cómo comprobar que funciona sin conexión
Con la app ya abierta una vez, apaga el Wi-Fi (o activa el modo avión) y ábrela de nuevo desde su ícono. Debe verse igual, con el holograma incluido.

## 2. Versión portátil (un solo archivo)

Sirve para llevar la app en una memoria USB o copiarla a una carpeta, sin instalar nada.

1. Copia el archivo `OrbitHealth.html` a la computadora (por ejemplo, al escritorio).
2. Haz **doble clic**. Se abre en el navegador.
3. Úsala con **Edge o Chrome**.

Importante:
- **En iPad no se puede abrir un archivo local así.** En iPad usa la opción 1 (app instalada).
- La versión portátil no se instala ni se actualiza sola: para actualizarla, reemplaza el archivo por el nuevo.
- Pesa unos 4 MB porque lleva dentro todo (letras y modelo 3D).

## 3. Para el equipo técnico

```bash
npm run build           # revisa tipos y genera dist/ (la app instalable, con service worker)
npm run preview         # sirve dist/ en http://localhost:4173 para probarla
npm run build:portable  # genera dist-portable/OrbitHealth.html (un solo archivo)
```

Notas:
- `dist/` funciona en cualquier carpeta o subdirectorio (rutas relativas). El `sw.js` se genera solo en el build, con la lista de todos los archivos y una versión calculada por el contenido; al publicar una versión nueva, los dispositivos la descargan y borran la anterior.
- El service worker solo se registra en `http://` o `https://`. En `localhost` se puede probar con `npm run preview`. Desde `file://` no se registra (por eso existe la versión portátil).
- El archivo portátil no lleva manifiesto ni service worker.

## 4. Dónde publicar la app

**La app está publicada en Vercel:** https://orbit-health-six.vercel.app/ (la administra otra persona del equipo).

Para que esa dirección se pueda **instalar** y funcione **sin conexión**, tiene que publicarse una versión que incluya este trabajo (manifiesto, íconos y `sw.js`). Cómo llega una versión nueva a esa dirección depende de cómo se configuró:

- **Si Vercel está conectado al repositorio:** cada cambio que entra a la rama de producción (por ejemplo `develop`) se publica solo.
- **Si se subió a mano:** hay que volver a publicar después de cada cambio.

Configuración que necesita Vercel (la detecta sola, pero conviene comprobarla):

| Ajuste | Valor |
|---|---|
| Framework | Vite |
| Comando de build | `npm run build` |
| Carpeta de salida | `dist` |
| Comando de instalación | `npm install` |

El archivo `vercel.json` del repositorio hace que `sw.js` y el manifiesto se sirvan siempre actualizados (sin caché), para que las tablets reciban cada versión nueva.

**Comprobar después de publicar:** abrir la dirección en Edge, ver que aparece el ícono de «Instalar aplicación», instalarla, cortar la conexión y recargar: «Hoy» debe seguir cargando con el holograma.

Cualquier otro servidor estático con `https://` también sirve (GitHub Pages, Netlify o uno propio: basta con copiar el contenido de `dist/`). Se necesita `https://` porque los navegadores solo permiten instalar apps y usar el modo sin conexión en direcciones seguras (`localhost` también vale para pruebas).

## 5. Dónde quedan los datos

Los datos que se registran se guardan **en el propio dispositivo** (en el navegador), no en internet. Esto implica:

- Cada dispositivo tiene sus propios datos: no se sincronizan entre tablets.
- **Si se borran los datos del navegador (historial, cookies y datos de sitios), se borran también los datos de Orbit Health.**
- La app instalada y la versión portátil guardan sus datos por separado.
