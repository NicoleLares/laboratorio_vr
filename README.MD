# 🥽 NEXUS VR — Laboratorio Virtual de Ensamblaje 3D

**Práctica 3.1 — Introducción a las Aplicaciones VR**

Aplicación web de realidad virtual desarrollada con **Three.js, WebXR, JavaScript y Bootstrap 5**, diseñada para funcionar en **Meta Quest 3** mediante seguimiento de manos (*Hand Tracking*).

El proyecto propone una experiencia educativa inmersiva en la que el usuario debe manipular cinco objetos tridimensionales y colocarlos en sus destinos correspondientes, utilizando únicamente sus manos.

---

## 🌐 Enlaces del proyecto

- **Aplicación web:** https://nicolelares.github.io/laboratorio_vr/
- **Repositorio GitHub:** https://github.com/NicoleLares/laboratorio_vr
- **Demostración de referencia:** https://threejs.org/examples/webxr_vr_handinput_pointerdrag.html

## 🎯 Objetivo

Desarrollar un laboratorio virtual de manipulación y ensamblaje 3D que permita interactuar con objetos tridimensionales mediante seguimiento real de manos en Meta Quest 3.

La aplicación integra detección de manos, selección mediante raycasting, gestos de pinza, arrastre de objetos, validación de destinos, retroalimentación audiovisual y seguimiento del progreso.

## ✨ Funcionalidades

### 🖐️ Seguimiento de manos

- Reconocimiento de ambas manos mediante WebXR.
- Representación tridimensional de las articulaciones.
- Rayos virtuales para apuntar a los objetos.
- Selección mediante gesto de pinza entre índice y pulgar.
- Arrastre y liberación de piezas.
- Resaltado visual de objetos seleccionables.
- Liberación segura ante pérdida de seguimiento.
- Prevención de selección simultánea de una pieza por ambas manos.

### 🧩 Ensamblaje tridimensional

El laboratorio incluye cinco piezas geométricas:

| Pieza | Color | Destino |
|---|---|---|
| Cubo | Azul | Base cuadrada |
| Esfera | Verde | Base circular |
| Cono | Naranja | Base cónica |
| Cilindro | Violeta | Base cilíndrica |
| Prisma triangular | Amarillo | Base triangular |

Cada pieza tiene un identificador único y un destino específico.

**Reglas de ensamblaje:**

1. Seleccionar una pieza mediante pinza.
2. Arrastrarla hacia su destino.
3. Soltarla para iniciar la validación.
4. Comprobar la identidad y proximidad al destino.
5. Confirmar el ensamblaje o permitir un nuevo intento.

### ✅ Validación de aciertos y errores

**Ensamblaje correcto:**

- Ajuste automático al destino (*snap-to-target*).
- Indicador visual verde.
- Sonido de confirmación.
- Bloqueo de la pieza colocada.
- Incremento del contador de progreso.

**Ensamblaje incorrecto:**

- Indicador temporal rojo.
- Sonido de error.
- Mensaje explicativo.
- Retorno de la pieza a su posición inicial.
- Conservación del progreso anterior.

La validación utiliza una tolerancia horizontal configurable de **0.20 unidades del mundo 3D**, equivalentes aproximadamente a 20 centímetros virtuales cuando se utiliza la escala de metros de WebXR.

## ⏱️ Panel inmersivo (HUD)

El laboratorio incorpora un panel tridimensional desarrollado con Three.js.

El HUD muestra:

- Nombre del laboratorio.
- Contador de piezas ensambladas: **0/5 a 5/5**.
- Cronómetro en formato `MM:SS`.
- Estado de la actividad.
- Mensajes de selección, acierto y error.
- Notificación de finalización.

También incluye dos controles tridimensionales:

**Reiniciar:** restablece posiciones, orientaciones, estados, materiales, progreso y cronómetro.

**Salir de VR:** finaliza la sesión inmersiva y permite regresar a la interfaz web.

Ambos controles funcionan mediante rayos de selección y gestos de pinza.

## 🛠️ Tecnologías utilizadas

| Tecnología | Función |
|---|---|
| HTML5 | Estructura de la aplicación |
| CSS3 | Diseño visual y responsividad |
| Bootstrap 5.3.9 | Interfaz web inicial |
| JavaScript ES Modules | Arquitectura modular |
| Three.js 0.187.0 | Escenario y objetos 3D |
| WebGL | Renderizado tridimensional |
| WebXR Device API | Sesiones de realidad virtual |
| XR Hand Tracking | Seguimiento de manos |
| Raycasting | Selección de objetos |
| Canvas API | Texturas del HUD y destinos |
| Web Audio API | Sonidos de confirmación y error |
| GitHub Pages | Alojamiento público HTTPS |

La aplicación utiliza bibliotecas mediante CDN y no requiere Node.js, npm ni herramientas de compilación.

## 📂 Estructura del proyecto

**Directorio principal: `laboratorio_vr/`**

- `index.html` — Portada, import map y acceso a VR.
- `css/style.css` — Estilos, animaciones y diseño responsivo.
- `js/main.js` — Inicialización de Three.js y gestión WebXR.
- `js/scene.js` — Creación de la mesa, piezas, destinos e iluminación.
- `js/hands.js` — Seguimiento de manos y reconocimiento de pinzas.
- `js/interaction.js` — Raycasting, selección, arrastre y botones VR.
- `js/game.js` — Reglas de ensamblaje, validación, sonidos y cronómetro.
- `js/hud.js` — Panel inmersivo y controles tridimensionales.
- `js/ui.js` — Mensajes de compatibilidad e interfaz HTML.
- `assets/favicon.svg` — Icono de la aplicación.
- `README.md` — Documentación del proyecto.

### Arquitectura modular

El proyecto separa las responsabilidades principales para facilitar su mantenimiento.

El módulo `main.js` coordina la aplicación. `scene.js` crea el escenario y los objetos. `hands.js` procesa las entradas de manos, mientras que `interaction.js` administra las selecciones y movimientos.

Las reglas de negocio están centralizadas en `game.js`, evitando duplicaciones del contador y del estado de las piezas.

Finalmente, `hud.js` presenta información dentro del entorno tridimensional y `ui.js` administra la interfaz web inicial.

## 🚀 Instalación y ejecución local

### Requisitos

- Visual Studio Code.
- Extensión Live Server.
- Navegador compatible con WebGL.
- Conexión a internet para cargar las dependencias CDN.

### Instrucciones

1. Clonar el repositorio:

   `git clone https://github.com/NicoleLares/laboratorio_vr.git`

2. Abrir la carpeta del proyecto en Visual Studio Code.

3. Localizar el archivo `index.html`.

4. Hacer clic derecho y seleccionar **Open with Live Server**.

5. Abrir la dirección local generada, por ejemplo:

   `http://127.0.0.1:5500/`

6. Verificar la carga de la portada y del escenario tridimensional.

**Importante:** la visualización en computadora permite revisar el proyecto, pero no sustituye una sesión inmersiva con seguimiento real de manos.

## 🥽 Ejecución en Meta Quest 3

### Requisitos del visor

- Meta Quest 3.
- Meta Quest Browser.
- Seguimiento de manos habilitado.
- Conexión a internet.
- Acceso al sitio mediante HTTPS.

### Instrucciones de uso

1. Encender los Meta Quest 3.
2. Habilitar Hand Tracking.
3. Abrir Meta Quest Browser.
4. Visitar https://nicolelares.github.io/laboratorio_vr/
5. Seleccionar **Entrar a realidad virtual**.
6. Permitir el inicio de la sesión WebXR.
7. Apuntar a una pieza con una mano.
8. Unir índice y pulgar para seleccionarla.
9. Arrastrarla hacia el destino correspondiente.
10. Separar los dedos para soltarla.
11. Repetir hasta completar las cinco piezas.

Al completar el laboratorio, el sistema mostrará el tiempo final y el estado de la actividad.

Se recomienda utilizar una zona segura, permanecer sentado o de pie en una postura cómoda y evitar gestos reservados para el menú del sistema Meta.

## 🧪 Pruebas funcionales

El desarrollo contempla las siguientes verificaciones:

| Prueba | Resultado esperado |
|---|---|
| Portada web | Diseño responsivo y carga correcta |
| Escenario 3D | Mesa, cinco piezas y cinco destinos visibles |
| Inicio VR | Sesión immersive-vr |
| Seguimiento | Reconocimiento de ambas manos |
| Raycasting | Detección y resaltado de piezas |
| Pinza | Selección y liberación |
| Arrastre | Movimiento controlado sobre la mesa |
| Error de destino | Aviso sin incremento del contador |
| Error de distancia | Rechazo de colocación incorrecta |
| Ensamblaje correcto | Ajuste automático y bloqueo |
| Contador | Progreso de 0/5 a 5/5 |
| Cronómetro | Registro del tiempo del reto |
| Reiniciar | Restauración del laboratorio |
| Salir de VR | Finalización segura de la sesión |

**Validación realizada:** se probó el proyecto en Meta Quest 3 y se confirmó el funcionamiento de la experiencia. Las capturas, registros y video de demostración deben conservarse como evidencias de las pruebas correspondientes.

## 🎨 Diseño de la experiencia

NEXUS VR utiliza una estética futurista con:

- Fondo azul oscuro.
- Detalles luminosos cian y violeta.
- Piezas de colores diferenciados.
- Superficies tridimensionales de bajo costo gráfico.
- Panel holográfico.
- Tipografía legible.
- Retroalimentación mediante colores, mensajes y sonidos.

Bootstrap 5 se utiliza exclusivamente en la portada web.

Los paneles y controles visibles durante la sesión inmersiva están implementados mediante geometrías y texturas de Three.js.

## ⚙️ Consideraciones técnicas

- Las bibliotecas se cargan mediante CDN con versiones fijas.
- El import map permite resolver Three.js y sus complementos.
- Los módulos locales utilizan rutas relativas compatibles con GitHub Pages.
- No se utiliza backend ni base de datos.
- No se almacenan credenciales o tokens.
- No se utiliza realidad aumentada ni passthrough.
- La experiencia inmersiva requiere compatibilidad con WebXR y seguimiento de manos.
- El laboratorio mantiene un estado central de piezas colocadas.
- Las piezas completadas no pueden volver a manipularse.
- Se evita validar ensamblajes al perder el seguimiento.
- El cronómetro conserva el tiempo acumulado al cerrar y volver a entrar en VR.
- Las geometrías sencillas y el uso controlado de texturas ayudan a reducir el procesamiento gráfico.

## ⚠️ Limitaciones conocidas

- La experiencia de manipulación está diseñada para Meta Quest 3 y requiere seguimiento de manos compatible.
- Los navegadores de escritorio pueden mostrar únicamente la vista previa 3D.
- La versión publicada necesita conexión a internet para cargar las bibliotecas CDN.
- Las colisiones se controlan mediante restricciones geométricas sencillas; no se incorpora un motor de física completo.
- La interacción depende de que las manos permanezcan dentro del campo de seguimiento del visor.
- Los resultados de rendimiento deben medirse directamente en el dispositivo.

## 📚 Referencias y recursos

- [Three.js](https://threejs.org/)
- [Ejemplo oficial de Hand Input Pointer Drag](https://threejs.org/examples/webxr_vr_handinput_pointerdrag.html)
- [WebXR Device API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Bootstrap](https://getbootstrap.com/)
- [Documentación de GitHub Pages](https://docs.github.com/en/pages)

## 📄 Licencias y créditos

El proyecto utiliza Three.js y Bootstrap, distribuidos bajo licencia MIT.

Las geometrías, texturas de interfaz y elementos gráficos del laboratorio se generan mediante código, sin necesidad de descargar modelos tridimensionales externos.

El desarrollo se realizó con apoyo de herramientas de inteligencia artificial para la planificación, generación, revisión y mejora del código. Su funcionamiento fue comprobado durante las pruebas del proyecto.

La licencia de las dependencias no implica automáticamente que el código original de este repositorio tenga una licencia de reutilización. Para establecerla, deberá incorporarse un archivo `LICENSE`.

## 👩‍💻 Autoría

**Nicole Lares**

Ingeniería en Tecnologías de la Información y Comunicaciones

**Asignatura:** Introducción a las Aplicaciones VR  
**Práctica:** 3.1 — Laboratorio virtual de manipulación y ensamblaje 3D  
**Año:** 2026

## 🏁 Conclusión

El desarrollo de NEXUS VR permitió aplicar conceptos de realidad virtual inmersiva, renderizado tridimensional, seguimiento de manos y programación modular.

La integración de Three.js y WebXR hizo posible construir un entorno interactivo en el que los objetos pueden seleccionarse, desplazarse y ensamblarse mediante gestos naturales.

También se implementaron mecanismos de validación de errores, actualización del progreso, retroalimentación audiovisual y control del estado de la actividad.

La publicación mediante GitHub Pages permitió acceder a la aplicación desde Meta Quest Browser sin requerir un servidor propio ni procesos de compilación.

Este proyecto demuestra la aplicación de tecnologías web modernas en experiencias educativas inmersivas.

---

**NEXUS VR · Laboratorio Virtual de Ensamblaje 3D · 2026**