
import * as THREE from "three";

// ========================================
// NEXUS VR - MOTOR DEL JUEGO
// ETAPA 5
// ========================================

// Distancia horizontal máxima en metros
// virtuales de Three.js.
export const SNAP_TOLERANCE = 0.20;

export function createGame(laboratory) {

  const { pieces, targets, hud } = laboratory;

  const placed = new Set();
  const errors = new Map();

  // Guardamos los materiales originales
  const originals = new Map(
    pieces.map(piece => [
      piece.id,
      {
        emissive:
          piece.mesh.material.emissive.clone(),
        intensity:
          piece.mesh.material.emissiveIntensity
      }
    ])
  );

  const targetColors = new Map(
    targets.map(target => [
      target.id,
      target.mesh.children[0].material.color.clone()
    ])
  );

  let phase = "pending";
  let accumulatedMs = 0;
  let startTime = null;
  let paused = false;

  let notice = null;
  let noticeUntil = 0;
  let lastHUD = "";

  let audioContext = null;

  // ======================================
  // CRONÓMETRO
  // ======================================

  function elapsedMs(now = performance.now()) {

    if (startTime === null) {
      return accumulatedMs;
    }

    return accumulatedMs + (now - startTime);
  }

  function elapsedSeconds(now = performance.now()) {
    return elapsedMs(now) / 1000;
  }

  function formatTime(seconds) {
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const remaining = total % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(remaining).padStart(2, "0")
    );
  }

  function start() {

    if (phase !== "pending") return;

    phase = "active";
    paused = false;
    startTime = performance.now();

    console.log("NEXUS VR: reto iniciado.");
  }

  function pause() {

    if (
      phase === "active" &&
      startTime !== null
    ) {
      accumulatedMs = elapsedMs();
      startTime = null;
    }

    paused = true;
    lastHUD = "";
  }

  function resume() {

    paused = false;

    if (
      phase === "active" &&
      startTime === null
    ) {
      startTime = performance.now();
    }

    lastHUD = "";
  }

  // ======================================
  // SONIDOS SIN ARCHIVOS EXTERNOS
  // ======================================

  function unlockAudio() {

    try {
      const AudioClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioClass) return;

      if (!audioContext) {
        audioContext = new AudioClass();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(
          error => console.warn(
            "Audio suspendido:", error
          )
        );
      }

    } catch (error) {
      console.warn(
        "Audio no disponible:", error
      );
    }
  }

  function tone(frequency, offset = 0, duration = 0.12) {

    if (
      !audioContext ||
      audioContext.state !== "running"
    ) return;

    const now = audioContext.currentTime + offset;

    const oscillator =
      audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.0001, now
    );

    gain.gain.exponentialRampToValueAtTime(
      0.065, now + 0.018
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001, now + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }

  function playSound(type) {

    if (type === "success") {
      tone(620);
      tone(840, 0.10);
    }

    if (type === "error") {
      tone(220, 0, 0.17);
    }

    if (type === "complete") {
      tone(520, 0);
      tone(660, 0.13);
      tone(880, 0.26, 0.20);
    }
  }

  // ======================================
  // MENSAJES DEL JUEGO
  // ======================================

  function notify(message, status = "ACTIVO", duration = 1600) {

    notice = { message, status };
    noticeUntil = performance.now() + duration;

    lastHUD = "";
  }

  // ======================================
  // RESTAURACIÓN DE MATERIALES
  // ======================================

  function restoreMaterial(piece) {

    const original = originals.get(piece.id);
    if (!original) return;

    piece.mesh.material.emissive.copy(
      original.emissive
    );

    piece.mesh.material.emissiveIntensity =
      original.intensity;
  }

  function markError(piece) {

    piece.mesh.material.emissive.setHex(
      0xff2020
    );

    piece.mesh.material.emissiveIntensity = 0.8;

    errors.set(
      piece.id,
      performance.now() + 1200
    );
  }

  function isInError(piece) {
    return errors.has(piece.id);
  }

  function clearError(piece) {

    errors.delete(piece.id);

    if (piece.state !== "placed") {
      restoreMaterial(piece);
    }
  }

  // ======================================
  // COMPROBAR LA PIEZA AL SOLTARLA
  // ======================================

  function release(piece) {

    // Evitar sumar una pieza dos veces
    if (
      placed.has(piece.id) ||
      phase === "completed"
    ) {
      return false;
    }

    // Distancia horizontal X/Z a cada destino
    const nearest = targets
      .map(target => ({
        target,
        distance: Math.hypot(
          piece.mesh.position.x - target.center.x,
          piece.mesh.position.z - target.center.z
        )
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    // Error de distancia
    if (
      !nearest ||
      nearest.distance > SNAP_TOLERANCE
    ) {

      markError(piece);

      // Devolver la pieza a su origen
      piece.mesh.position.copy(
        piece.initialPosition
      );

      piece.mesh.quaternion.copy(
        piece.initialQuaternion
      );

      notify(
        "ERROR: ACERCA LA PIEZA A SU DESTINO",
        "ERROR"
      );

      playSound("error");
      return false;
    }

    // Error de identidad
    if (
      nearest.target.id !== piece.destinationId
    ) {

      markError(piece);

      piece.mesh.position.copy(
        piece.initialPosition
      );

      piece.mesh.quaternion.copy(
        piece.initialQuaternion
      );

      notify(
        `ERROR: ${piece.name} NO VA EN ${nearest.target.name}`,
        "ERROR"
      );

      playSound("error");
      return false;
    }

    // ====================================
    // ACIERTO - SNAP TO TARGET
    // ====================================

    const target = nearest.target;

    piece.mesh.position.set(
      target.center.x,

      // Centrar sobre la superficie
      // superior del receptáculo
      piece.initialPosition.y + 0.027,

      target.center.z
    );

    piece.mesh.quaternion.copy(
      piece.initialQuaternion
    );

    piece.mesh.scale.copy(
      piece.initialScale
    );

    piece.state = "placed";
    piece.mesh.userData.movable = false;

    target.state = "completed";

    placed.add(piece.id);
    errors.delete(piece.id);

    // Indicador verde en la pieza
    piece.mesh.material.emissive.setHex(
      0x16a34a
    );

    piece.mesh.material.emissiveIntensity = 0.45;

    // Destino marcado en verde
    target.mesh.children[0].material.color.setHex(
      0x247650
    );

    console.log(
      `Pieza colocada: ${piece.id}. ` +
      `Progreso: ${placed.size}/5`
    );

    if (placed.size === 5) {

      // Detener el cronómetro
      accumulatedMs = elapsedMs();
      startTime = null;

      phase = "completed";

      playSound("complete");

      notify(
        `LABORATORIO COMPLETADO EN ${formatTime(elapsedSeconds())}`,
        "COMPLETADO",
        10000
      );

    } else {

      playSound("success");

      notify(
        `CORRECTO: ${piece.name} - ${placed.size}/5`,
        "ACIERTO",
        1800
      );
    }

    return true;
  }

  // ======================================
  // REINICIAR TODO EL LABORATORIO
  // ======================================

  function reset() {

    placed.clear();
    errors.clear();

    for (const piece of pieces) {

      piece.mesh.position.copy(
        piece.initialPosition
      );

      piece.mesh.quaternion.copy(
        piece.initialQuaternion
      );

      piece.mesh.scale.copy(
        piece.initialScale
      );

      piece.mesh.userData.movable = true;
      piece.state = "available";

      restoreMaterial(piece);
    }

    for (const target of targets) {

      target.state = "pending";

      target.mesh.children[0].material.color.copy(
        targetColors.get(target.id)
      );
    }

    phase = "pending";
    accumulatedMs = 0;
    startTime = null;
    paused = false;

    notice = null;
    noticeUntil = 0;
    lastHUD = "";

    notify(
      "REINICIADO: COMIENZA DE NUEVO",
      "PREPARADO",
      1500
    );

    update({
      tracked: 0,
      dragging: false
    });

    console.log(
      "NEXUS VR: laboratorio reiniciado."
    );
  }

  // ======================================
  // ACTUALIZAR CRONÓMETRO Y HUD
  // ======================================

  function update({
    tracked = 0,
    dragging = false
  } = {}) {

    const now = performance.now();

    // El rojo de error es temporal
    for (const [id, until] of errors) {

      if (now >= until) {

        const piece = pieces.find(
          item => item.id === id
        );

        if (piece && piece.state !== "placed") {
          restoreMaterial(piece);
        }

        errors.delete(id);
      }
    }

    let status = "PREPARADO";
    let message = "APUNTA Y HAZ PINZA PARA COMENZAR";

    if (phase === "completed") {

      status = "COMPLETADO";
      message =
        `RETO TERMINADO EN ${formatTime(elapsedSeconds(now))}`;

    } else if (paused) {

      status = "PAUSA";
      message = "VUELVE A ENTRAR A VR";

    } else if (tracked === 0) {

      status = "SIN MANOS";
      message = "MUESTRA TUS MANOS AL VISOR";

    } else if (dragging) {

      status = "MOVIENDO";
      message = "SUELTA LA PINZA EN EL DESTINO";

    } else if (phase === "active") {

      status = "ACTIVO";
      message = `MANOS: ${tracked}/2 - ENSAMBLA LAS PIEZAS`;
    }

    if (
      notice &&
      now < noticeUntil &&
      phase !== "completed"
    ) {
      status = notice.status;
      message = notice.message;
    }

    const time = Math.floor(
      elapsedSeconds(now)
    );

    const key = [
      placed.size,
      time,
      status,
      message
    ].join("|");

    // No reconstruir la textura cada frame
    if (key !== lastHUD) {

      hud.update({
        completed: placed.size,
        elapsedSeconds: time,
        status,
        message
      });

      lastHUD = key;
    }
  }

  return {
    start,
    pause,
    resume,
    release,
    reset,
    update,
    unlockAudio,
    notify,
    isInError,
    clearError,
    getPhase: () => phase
  };
}
