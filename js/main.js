
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
// ETAPA 5
// ========================================

const container = document.getElementById(
  "scene-container"
);

const vrButton = getVRButton();

async function initializeApplication() {

  let renderer;

  // ======================================
  // INICIALIZAR THREE.JS
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
      "Error al iniciar Three.js:",
      error
    );

    setRenderStatus(
      "No se pudo iniciar Three.js."
    );

    setCompatibility(
      "WebGL no disponible.",
      false
    );

    return;
  }

  // ======================================
  // CREAR LABORATORIO
  // ======================================

  const laboratory = createLaboratoryScene();

  const {
    scene,
    camera,
    update
  } = laboratory;

  // Modelos y seguimiento de las manos
  const hands = createHands(
    renderer,
    scene
  );

  // Cierre seguro desde el panel 3D
  async function exitVR() {

    const session = renderer.xr.getSession();

    if (session) {
      await session.end();
    }
  }

  // Interacciones y lógica del juego
  const interaction = createInteraction(
    laboratory,
    hands,
    {
      onExitVR: exitVR
    }
  );

  // ======================================
  // AJUSTAR EL RENDERIZADOR
  // ======================================

  function resizeScene() {

    const width = Math.max(
      container.clientWidth, 1
    );

    const height = Math.max(
      container.clientHeight, 1
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
  // ANIMACIÓN WEBXR
  // ======================================

  renderer.setAnimationLoop((time) => {

    const seconds = time * 0.001;

    update(seconds);

    if (renderer.xr.isPresenting) {

      interaction.update();
    }

    renderer.render(
      scene,
      camera
    );
  });

  setRenderStatus(
    "NEXUS VR - Laboratorio cargado."
  );

  // ======================================
  // DETECCIÓN DE WEBXR
  // ======================================

  if (!window.isSecureContext) {

    setCompatibility(
      "Se requiere HTTPS o localhost.",
      false
    );

    return;
  }

  if (!navigator.xr) {

    setCompatibility(
      "WebXR no disponible en este navegador.",
      false
    );

    setVRMessage(
      "Utiliza Meta Quest Browser para VR."
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
      "Error de compatibilidad WebXR:",
      error
    );
  }

  if (!supported) {

    setCompatibility(
      "Este navegador no admite immersive-vr.",
      false
    );

    setVRMessage(
      "La vista 3D funciona en computadora. " +
      "La experiencia inmersiva requiere Meta Quest 3."
    );

    return;
  }

  setCompatibility(
    "WebXR immersive-vr compatible.",
    true
  );

  setVRMessage(
    "Laboratorio preparado para seguimiento de manos."
  );

  // ======================================
  // INICIO DE SESIÓN XR
  // ======================================

  renderer.xr.addEventListener(
    "sessionstart",
    () => {

      interaction.resume();

      vrButton.textContent =
        "Salir de VR";

      setVRMessage(
        "Sesión VR activa. Ensambla las cinco piezas."
      );

      console.log(
        "NEXUS VR: sesión iniciada."
      );
    }
  );

  // ======================================
  // FINALIZACIÓN DE SESIÓN XR
  // ======================================

  renderer.xr.addEventListener(
    "sessionend",
    () => {

      interaction.stop();

      vrButton.textContent =
        "Entrar a realidad virtual";

      vrButton.disabled = false;

      setVRMessage(
        "Sesión terminada. El progreso se conserva."
      );

      console.log(
        "NEXUS VR: sesión finalizada."
      );
    }
  );

  // ======================================
  // BOTÓN HTML PARA ENTRAR A VR
  // ======================================

  vrButton.addEventListener(
    "click",
    async () => {

      vrButton.disabled = true;

      try {

        if (renderer.xr.isPresenting) {

          await exitVR();
          return;
        }

        // Solicitud de audio desde el clic
        // del usuario en la portada
        interaction.unlockAudio();

        // Solicitar realidad virtual,
        // no realidad aumentada.
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

          try {
            await session.end();
          } catch (endError) {
            console.warn(endError);
          }

          throw error;
        }

      } catch (error) {

        console.error(
          "Error al iniciar o cerrar VR:",
          error
        );

        setVRMessage(
          "No se pudo iniciar VR: " +
          error.message
        );

      } finally {

        vrButton.disabled = false;
      }
    }
  );
}

// ========================================
// INICIAR NEXUS VR
// ========================================

initializeApplication().catch((error) => {

  console.error(
    "Error general:",
    error
  );

  setRenderStatus(
    "Error al cargar el laboratorio."
  );
});
