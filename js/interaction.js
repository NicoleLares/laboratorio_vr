
import * as THREE from "three";

import {
  createGame
} from "./game.js";

// ========================================
// NEXUS VR - INTERACCIÓN Y ENSAMBLAJE
// ETAPA 5
// ========================================

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
  hands,
  options = {}
) {

  const { pieces, hud } = laboratory;

  const game = createGame(laboratory);

  const raycaster = new THREE.Raycaster();

  raycaster.near = 0.02;
  raycaster.far = 4;

  const point = new THREE.Vector3();

  const plane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    0
  );

  const grabs = new Map();
  const claimed = new Set();

  const selectable = pieces.map(
    piece => piece.mesh
  );

  let exitRequested = false;

  // ======================================
  // RAYO DE APUNTADO
  // ======================================

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

  // ======================================
  // INTERSECCIONES
  // ======================================

  function findPiece() {

    const hits = raycaster.intersectObjects(
      selectable,
      false
    );

    for (const hit of hits) {

      const piece = pieces.find(
        item => item.mesh === hit.object
      );

      if (
        piece &&
        piece.state !== "placed" &&
        !claimed.has(piece.id)
      ) {
        return {
          hit,
          piece
        };
      }
    }

    return null;
  }

  function findButton() {

    const hits = raycaster.intersectObjects(
      hud.buttons,
      false
    );

    return hits.length ? hits[0] : null;
  }

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

    const hit = raycaster.ray.intersectPlane(
      plane,
      point
    );

    if (!hit) return null;

    const distance = hit.distanceTo(
      raycaster.ray.origin
    );

    if (
      distance < 0.05 ||
      distance > 4.5
    ) {
      return null;
    }

    return hit.clone();
  }

  // ======================================
  // EVITAR COLISIONES ENTRE PIEZAS
  // ======================================

  function isPositionFree(x, z, moving) {

    for (const other of pieces) {

      if (other === moving) continue;

      const distance = Math.hypot(
        x - other.mesh.position.x,
        z - other.mesh.position.z
      );

      if (distance < MIN_DISTANCE) {
        return false;
      }
    }

    return true;
  }

  // ======================================
  // AGARRAR UNA PIEZA
  // ======================================

  function beginGrab(slot, piece) {

    if (
      claimed.has(piece.id) ||
      piece.state === "placed"
    ) return;

    const tablePoint = getTablePoint(
      piece.mesh.position.y
    );

    if (!tablePoint) return;

    game.clearError(piece);

    const offset = piece.mesh.position
      .clone()
      .sub(tablePoint);

    grabs.set(slot.index, {
      piece,
      offset
    });

    claimed.add(piece.id);
    piece.state = "selected";

    // El reto inicia con la primera selección
    game.start();
  }

  // ======================================
  // ARRASTRAR UNA PIEZA
  // ======================================

  function moveGrab(slot) {

    const grab = grabs.get(slot.index);

    if (!grab) return;

    const { piece, offset } = grab;
    const mesh = piece.mesh;

    const tablePoint = getTablePoint(
      mesh.position.y
    );

    if (!tablePoint) return;

    const targetX = THREE.MathUtils.clamp(
      tablePoint.x + offset.x,
      BOUNDS.minX,
      BOUNDS.maxX
    );

    const targetZ = THREE.MathUtils.clamp(
      tablePoint.z + offset.z,
      BOUNDS.minZ,
      BOUNDS.maxZ
    );

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

    if (
      isPositionFree(
        nextX,
        nextZ,
        piece
      )
    ) {

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

    // La altura se conserva
    piece.state = "moving";
  }

  // ======================================
  // LIBERAR Y VALIDAR
  // ======================================

  function endGrab(slot, validate = true) {

    const grab = grabs.get(slot.index);

    if (!grab) return;

    const piece = grab.piece;

    grabs.delete(slot.index);
    claimed.delete(piece.id);

    if (piece.state !== "placed") {
      piece.state = "available";
    }

    // Solo validar con liberación normal
    if (validate) {

      game.release(piece);

    } else {

      game.notify(
        "PIEZA LIBERADA SIN VALIDAR",
        "ACTIVO",
        1000
      );
    }
  }

  function cancelAllGrabs() {

    for (const slot of hands.slots) {

      if (grabs.has(slot.index)) {
        endGrab(slot, false);
      }
    }

    grabs.clear();
    claimed.clear();
  }

  // ======================================
  // RESALTADO
  // ======================================

  function updateHighlights(hovered) {

    for (const piece of pieces) {

      if (
        piece.state === "placed" ||
        game.isInError(piece)
      ) {
        continue;
      }

      const grabbed = claimed.has(piece.id);

      if (grabbed) {

        piece.mesh.material.emissiveIntensity =
          0.55;

      } else if (hovered.has(piece.id)) {

        piece.mesh.material.emissiveIntensity =
          0.32;

      } else {

        piece.mesh.material.emissiveIntensity =
          0.08;
      }
    }
  }

  // ======================================
  // BOTONES DEL HUD
  // ======================================

  function activateButton(button) {

    const action = button.userData.action;

    if (action === "reset") {

      cancelAllGrabs();
      game.reset();

      console.log(
        "Botón VR: Reiniciar"
      );
    }

    if (action === "exit" && !exitRequested) {

      exitRequested = true;

      cancelAllGrabs();

      if (typeof options.onExitVR === "function") {

        Promise.resolve()
          .then(() => options.onExitVR())
          .catch(error => {

            exitRequested = false;

            console.error(
              "Error al salir de VR:",
              error
            );

            game.notify(
              "NO SE PUDO CERRAR VR",
              "ERROR"
            );
          });
      }
    }
  }

  // ======================================
  // ACTUALIZACIÓN EN VR
  // ======================================

  function update() {

    hands.update();

    const hoveredPieces = new Set();

    let hoveredButton = null;

    for (const slot of hands.slots) {

      if (!slot.tracking) {

        // La pérdida de tracking no cuenta
        // como un intento de colocación
        if (grabs.has(slot.index)) {
          endGrab(slot, false);
        }

        continue;
      }

      updateRay(slot);

      // Liberar antes de nuevas selecciones
      if (slot.justReleased) {
        endGrab(slot, true);
      }

      // Si ya está agarrando una pieza,
      // continuar el movimiento
      if (grabs.has(slot.index)) {

        moveGrab(slot);
        slot.setRayDistance(1.5);

        continue;
      }

      // Detectar pieza y botón
      const pieceResult = findPiece();
      const buttonHit = findButton();

      // El objeto más cercano tiene prioridad
      const useButton = Boolean(
        buttonHit &&
        (
          !pieceResult ||
          buttonHit.distance <=
            pieceResult.hit.distance
        )
      );

      if (useButton) {

        hoveredButton = buttonHit.object;

        slot.setRayDistance(
          buttonHit.distance
        );

        if (slot.justPressed) {

          activateButton(
            buttonHit.object
          );

          if (exitRequested) break;
        }

        continue;
      }

      if (pieceResult) {

        slot.setRayDistance(
          pieceResult.hit.distance
        );

        hoveredPieces.add(
          pieceResult.piece.id
        );

        if (
          slot.justPressed &&
          game.getPhase() !== "completed"
        ) {

          beginGrab(
            slot,
            pieceResult.piece
          );
        }

      } else {

        slot.setRayDistance(2.5);
      }
    }

    hud.setHoveredButton(
      hoveredButton
    );

    updateHighlights(hoveredPieces);

    const tracked = hands.slots.filter(
      slot => slot.tracking
    ).length;

    game.update({
      tracked,
      dragging: grabs.size > 0
    });
  }

  // ======================================
  // SALIR Y VOLVER A ENTRAR A VR
  // ======================================

  function stop() {

    cancelAllGrabs();

    hands.resetAll();

    hud.setHoveredButton(null);

    updateHighlights(new Set());

    game.pause();

    game.update();
  }

  function resume() {

    exitRequested = false;
    game.resume();
  }

  return {
    update,
    stop,
    resume,
    unlockAudio: game.unlockAudio
  };
}
