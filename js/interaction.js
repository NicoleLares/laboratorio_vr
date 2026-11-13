
import * as THREE from "three";

// ========================================
// NEXUS VR - SISTEMA DE INTERACCIÓN
// ETAPA 4
// ========================================

// Límites basados en la mesa de la Etapa 3
const BOUNDS = {
  minX: -0.99,
  maxX: 0.99,
  minZ: -2.14,
  maxZ: -1.25
};

const MIN_DISTANCE = 0.30;
const SMOOTHING = 0.35;

export function createInteraction(
  laboratory,
  hands
) {

  const { pieces, hud } = laboratory;

  const raycaster = new THREE.Raycaster();
  raycaster.near = 0.02;
  raycaster.far = 4;

  const tempPoint = new THREE.Vector3();

  const plane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    0
  );

  // Una selección activa por mano
  const grabs = new Map();

  // Evita seleccionar una pieza con dos manos
  const claimed = new Set();

  let lastHUD = "";

  let feedback = "";
  let feedbackUntil = 0;

  const selectable = pieces.map(
    (piece) => piece.mesh
  );

  function report(message, duration = 1200) {
    feedback = message;
    feedbackUntil = performance.now() + duration;
  }

  // Crear rayo desde la mano
  function updateRay(slot) {

    slot.controller.updateMatrixWorld(true);

    raycaster.ray.origin.setFromMatrixPosition(
      slot.controller.matrixWorld
    );

    raycaster.ray.direction
      .set(0, 0, -1)
      .transformDirection(
        slot.controller.matrixWorld
      );
  }

  // Buscar piezas alcanzadas por el rayo
  function findPiece() {

    const hits = raycaster.intersectObjects(
      selectable,
      false
    );

    for (const hit of hits) {

      const piece = pieces.find(
        (item) => item.mesh === hit.object
      );

      if (
        piece &&
        piece.state !== "placed"
      ) {
        return { hit, piece };
      }
    }

    return null;
  }

  // Intersección con un plano horizontal
  function getTablePoint(height) {

    if (
      raycaster.ray.direction.y >= -0.025
    ) {
      return null;
    }

    plane.set(
      new THREE.Vector3(0, 1, 0),
      -height
    );

    const point = raycaster.ray.intersectPlane(
      plane,
      tempPoint
    );

    if (!point) return null;

    const distance = point.distanceTo(
      raycaster.ray.origin
    );

    if (
      distance < 0.05 ||
      distance > 4.5
    ) {
      return null;
    }

    return point.clone();
  }

  function clamp(value, min, max) {
    return THREE.MathUtils.clamp(
      value, min, max
    );
  }

  // Evitar que dos piezas se atraviesen
  function isPositionFree(x, z, movingPiece) {

    for (const other of pieces) {

      if (other === movingPiece) {
        continue;
      }

      const dx = x - other.mesh.position.x;
      const dz = z - other.mesh.position.z;

      const distance = Math.hypot(dx, dz);

      if (distance < MIN_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  // ======================================
  // SELECCIÓN
  // ======================================

  function beginGrab(slot, result) {

    const { piece } = result;

    if (
      claimed.has(piece.id) ||
      piece.state === "placed"
    ) {
      return;
    }

    const point = getTablePoint(
      piece.mesh.position.y
    );

    if (!point) {
      report("INCLINA EL RAYO HACIA LA MESA");
      return;
    }

    // Mantener offset para evitar saltos
    const offset = piece.mesh.position
      .clone()
      .sub(point);

    grabs.set(slot.index, {
      piece,
      offset
    });

    claimed.add(piece.id);

    piece.state = "selected";

    report(
      `SELECCIONADO: ${piece.name}`
    );
  }

  // ======================================
  // MOVIMIENTO
  // ======================================

  function moveGrab(slot) {

    const grab = grabs.get(slot.index);

    if (!grab) return;

    const { piece, offset } = grab;

    const mesh = piece.mesh;

    const point = getTablePoint(
      mesh.position.y
    );

    if (!point) return;

    const targetX = clamp(
      point.x + offset.x,
      BOUNDS.minX,
      BOUNDS.maxX
    );

    const targetZ = clamp(
      point.z + offset.z,
      BOUNDS.minZ,
      BOUNDS.maxZ
    );

    // Movimiento suavizado
    const nextX = THREE.MathUtils.lerp(
      mesh.position.x,
      targetX,
      SMOOTHING
    );

    const nextZ = THREE.MathUtils.lerp(
      mesh.position.z,
      targetZ,
      SMOOTHING
    );

    if (isPositionFree(nextX, nextZ, piece)) {

      mesh.position.x = nextX;
      mesh.position.z = nextZ;

    } else if (
      isPositionFree(
        nextX,
        mesh.position.z,
        piece
      )
    ) {

      mesh.position.x = nextX;

    } else if (
      isPositionFree(
        mesh.position.x,
        nextZ,
        piece
      )
    ) {

      mesh.position.z = nextZ;
    }

    // La altura no se modifica:
    // la pieza permanece sobre la mesa.
    piece.state = "moving";
  }

  // ======================================
  // LIBERACIÓN
  // ======================================

  function endGrab(slot, lostTracking = false) {

    const grab = grabs.get(slot.index);

    if (!grab) return;

    const piece = grab.piece;

    if (piece.state !== "placed") {
      piece.state = "available";
    }

    claimed.delete(piece.id);
    grabs.delete(slot.index);

    if (lostTracking) {

      report(
        "SEGUIMIENTO PERDIDO: PIEZA LIBERADA"
      );

    } else {

      report(
        `SOLTASTE: ${piece.name}`
      );
    }
  }

  // ======================================
  // RESALTADO DE OBJETOS
  // ======================================

  function updateHighlights(hovered) {

    for (const piece of pieces) {

      const material = piece.mesh.material;

      const grabbed = claimed.has(piece.id);

      if (grabbed) {

        material.emissiveIntensity = 0.55;

      } else if (hovered.has(piece.id)) {

        material.emissiveIntensity = 0.32;

      } else {

        material.emissiveIntensity = 0.08;
      }
    }
  }

  // ======================================
  // PANEL DE ESTADO VR
  // ======================================

  function updateHUD() {

    const tracked = hands.slots.filter(
      (slot) => slot.tracking
    ).length;

    let status = "ACTIVO";
    let message = "";

    if (tracked === 0) {

      status = "SIN MANOS";
      message = "ACERCA TUS MANOS AL VISOR";

    } else if (grabs.size > 0) {

      status = "MOVIENDO";
      message = "SUELTA LA PINZA PARA LIBERAR";

    } else {

      status = "ACTIVO";
      message =
        `MANOS: ${tracked}/2 - APUNTA Y HAZ PINZA`;
    }

    if (performance.now() < feedbackUntil) {
      message = feedback;
    }

    const key = `${status}|${message}`;

    if (key !== lastHUD) {

      hud.update({
        completed: 0,
        elapsedSeconds: 0,
        status,
        message
      });

      lastHUD = key;
    }
  }

  // ======================================
  // ACTUALIZACIÓN POR FRAME
  // ======================================

  function update() {

    hands.update();

    const hovered = new Set();

    for (const slot of hands.slots) {

      // Si se pierde una mano,
      // liberar cualquier pieza agarrada
      if (!slot.tracking) {

        endGrab(slot, true);
        continue;
      }

      updateRay(slot);

      // Liberar al terminar la pinza
      if (slot.justReleased) {
        endGrab(slot);
      }

      // Seleccionar al iniciar la pinza
      if (
        slot.justPressed &&
        !grabs.has(slot.index)
      ) {

        const result = findPiece();

        if (result) {
          beginGrab(slot, result);
        }
      }

      if (grabs.has(slot.index)) {

        moveGrab(slot);

        slot.setRayDistance(1.5);

      } else {

        const result = findPiece();

        if (result) {

          slot.setRayDistance(
            result.hit.distance
          );

          if (!claimed.has(result.piece.id)) {

            hovered.add(
              result.piece.id
            );
          }

        } else {

          slot.setRayDistance(2.5);
        }
      }
    }

    updateHighlights(hovered);
    updateHUD();
  }

  // ======================================
  // CIERRE SEGURO DE VR
  // ======================================

  function stop() {

    for (const slot of hands.slots) {
      endGrab(slot, true);
    }

    claimed.clear();
    grabs.clear();

    hands.resetAll();

    updateHighlights(new Set());

    lastHUD = "";
    feedbackUntil = 0;

    hud.update({
      completed: 0,
      elapsedSeconds: 0,
      status: "PREPARADO",
      message: "LABORATORIO LISTO"
    });
  }

  return {
    update,
    stop
  };
}
