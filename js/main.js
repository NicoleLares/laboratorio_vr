
import * as THREE from "three";

import {
  createLaboratoryScene
} from "./scene.js";

import {
  createHands
} from "./hands.js";

import {
  createInteraction
} from "./interaction.js";

import {
  setRenderStatus,
  setCompatibility,
  setVRMessage,
  getVRButton
} from "./ui.js";

// ========================================
// NEXUS VR - APLICACIÓN PRINCIPAL
// ETAPA 4
// ========================================

const container = document.getElementById(
  "scene-container"
);

const vrButton = getVRButton();

async function initializeApplication() {

  let renderer;

  // ======================================
  // RENDERIZADOR THREE.JS
  // ======================================

  try {

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        1.5
      )
    );

    renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    renderer.toneMapping =
      THREE.ACESFilmicToneMapping;

    renderer.xr.enabled = true;

    renderer.xr.setReferenceSpaceType(
      "local-floor"
    );

    container.appendChild(
      renderer.domElement
    );

  } catch (error) {

    console.error(
      "Error al inicializar WebGL:",
      error
    );

    setRenderStatus(
      "No se pudo iniciar el entorno 3D."
    );

    setCompatibility(
      "WebGL no está disponible.",
      false
    );

    return;
  }

  // ======================================
  // LABORATORIO
  // ======================================

  const laboratory = createLaboratoryScene();

  const {
    scene,
    camera,
    update
  } = laboratory;

  // Crear manos una sola vez
  const hands = createHands(
    renderer,
    scene
  );

  // Conectar sistema de interacción
  const interaction = createInteraction(
    laboratory,
    hands
  );

  // ======================================
  // VISTA RESPONSIVA
  // ======================================

  function resizeScene() {

    const width = Math.max(
      1,
      container.clientWidth
    );

    const height = Math.max(
      1,
      container.clientHeight
    );

    renderer.setSize(
      width,
      height,
      false
    );

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resizeScene();

  if ("ResizeObserver" in window) {

    const observer = new ResizeObserver(
      resizeScene
    );

    observer.observe(container);

  } else {

    window.addEventListener(
      "resize",
      resizeScene
    );
  }

  // ======================================
  // ANIMACIÓN THREE.JS Y WEBXR
  // ======================================

  renderer.setAnimationLoop((time) => {

    const seconds = time * 0.001;

    update(seconds);

    // Interacción únicamente en VR
    if (renderer.xr.isPresenting) {
      interaction.update();
    }

    renderer.render(scene, camera);
  });

  setRenderStatus(
    "Laboratorio 3D inicializado."
  );

  // ======================================
  // COMPROBAR COMPATIBILIDAD
  // ======================================

  if (!window.isSecureContext) {

    setCompatibility(
      "Se necesita HTTPS o localhost para WebXR.",
      false
    );

    return;
  }

  if (!navigator.xr) {

    setCompatibility(
      "WebXR no está disponible en este navegador.",
      false
    );

    setVRMessage(
      "Utiliza Meta Quest Browser para entrar a VR."
    );

    return;
  }

  let supported = false;

  try {

    supported =
      await navigator.xr.isSessionSupported(
        "immersive-vr"
      );

  } catch (error) {

    console.error(
      "Error al comprobar WebXR:",
      error
    );
  }

  if (!supported) {

    setCompatibility(
      "Este navegador no admite sesiones immersive-vr.",
      false
    );

    setVRMessage(
      "La vista 3D está disponible. " +
      "Para VR utiliza Meta Quest 3."
    );

    return;
  }

  setCompatibility(
    "El navegador admite sesiones VR inmersivas.",
    true
  );

  setVRMessage(
    "Se solicitará acceso al seguimiento de manos."
  );

  // ======================================
  // EVENTOS DE SESIÓN
  // ======================================

  renderer.xr.addEventListener(
    "sessionstart",
    () => {

      vrButton.textContent = "Salir de VR";

      setVRMessage(
        "VR activa. Apunta y haz pinza para mover piezas."
      );

      console.log(
        "NEXUS VR: sesión iniciada."
      );
    }
  );

  renderer.xr.addEventListener(
    "sessionend",
    () => {

      interaction.stop();

      vrButton.textContent =
        "Entrar a realidad virtual";

      vrButton.disabled = false;

      setVRMessage(
        "Sesión VR finalizada. " +
        "Puedes volver a entrar."
      );

      console.log(
        "NEXUS VR: sesión finalizada."
      );
    }
  );

  // ======================================
  // ENTRAR / SALIR DE VR
  // ======================================

  vrButton.addEventListener(
    "click",
    async () => {

      vrButton.disabled = true;

      try {

        if (renderer.xr.isPresenting) {

          const currentSession =
            renderer.xr.getSession();

          if (currentSession) {
            await currentSession.end();
          }

          return;
        }

        // Solicitar una sesión exclusivamente VR
        // con seguimiento obligatorio de manos
        const session =
          await navigator.xr.requestSession(
            "immersive-vr",
            {
              requiredFeatures: [
                "local-floor",
                "hand-tracking"
              ]
            }
          );

        try {

          await renderer.xr.setSession(
            session
          );

        } catch (error) {

          // Cerrar sesión si Three.js falla
          try {
            await session.end();
          } catch (endError) {
            console.warn(endError);
          }

          throw error;
        }

      } catch (error) {

        console.error(
          "No fue posible iniciar o cerrar VR:",
          error
        );

        setVRMessage(
          "No se pudo iniciar VR con manos: " +
          error.message
        );

      } finally {

        vrButton.disabled = false;
      }
    }
  );
}

// ========================================
// INICIAR APLICACIÓN
// ========================================

initializeApplication().catch((error) => {

  console.error(
    "Error general de NEXUS VR:",
    error
  );

  setRenderStatus(
    "Error al cargar la aplicación."
  );
});
