
import * as THREE from "three";

import {
  XRHandModelFactory
} from "three/addons/webxr/XRHandModelFactory.js";

// ========================================
// NEXUS VR - SEGUIMIENTO DE MANOS
// ETAPA 4
// ========================================

export function createHands(renderer, scene) {

  const factory = new XRHandModelFactory();

  const slots = [0, 1].map((index) => {

    // Espacio del rayo de apuntado
    const controller = renderer.xr.getController(index);

    // Mano articulada
    const hand = renderer.xr.getHand(index);

    // Modelo ligero: esferas en las articulaciones
    hand.add(
      factory.createHandModel(hand, "spheres")
    );

    scene.add(hand);
    scene.add(controller);

    // Rayo de selección
    const rayGeometry = new THREE.BufferGeometry()
      .setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
      ]);

    const rayMaterial = new THREE.LineBasicMaterial({
      color: index === 0 ? 0x54dfff : 0xa68cff,
      transparent: true,
      opacity: 0.85,
      depthTest: true
    });

    const laser = new THREE.Line(
      rayGeometry,
      rayMaterial
    );

    laser.visible = false;
    laser.scale.z = 2;

    controller.add(laser);

    // Cursor del rayo
    const cursor = new THREE.Mesh(
      new THREE.SphereGeometry(0.014, 12, 8),
      new THREE.MeshBasicMaterial({
        color: index === 0 ? 0x54dfff : 0xa68cff
      })
    );

    cursor.position.z = -2;
    cursor.visible = false;

    controller.add(cursor);

    // Estado individual de cada mano
    const slot = {
      index,
      controller,
      hand,
      laser,
      cursor,

      source: null,
      tracking: false,
      pressed: false,

      justPressed: false,
      justReleased: false,

      pinchSignal: false,
      selectSignal: false,

      setRayDistance(distance) {
        const d = THREE.MathUtils.clamp(
          distance, 0.1, 4
        );

        laser.scale.z = d;
        cursor.position.z = -d;
      },

      reset() {
        this.source = null;
        this.tracking = false;
        this.pressed = false;

        this.justPressed = false;
        this.justReleased = false;

        this.pinchSignal = false;
        this.selectSignal = false;

        laser.visible = false;
        cursor.visible = false;
      }
    };

    // Detectar únicamente fuentes de manos
    controller.addEventListener(
      "connected",
      (event) => {

        const source = event.data;

        if (source && source.hand) {
          slot.reset();
          slot.source = source;

          console.log(
            "Mano conectada:",
            source.handedness
          );
        } else {
          // No utilizamos controles físicos
          slot.reset();
        }
      }
    );

    controller.addEventListener(
      "disconnected",
      () => {
        slot.reset();
      }
    );

    // Three.js puede emitir pinchstart/pinchend
    // a partir de las articulaciones de los dedos
    controller.addEventListener(
      "pinchstart",
      () => {
        if (slot.source?.hand) {
          slot.pinchSignal = true;
        }
      }
    );

    controller.addEventListener(
      "pinchend",
      () => {
        slot.pinchSignal = false;
      }
    );

    // Eventos WebXR de selección como alternativa
    controller.addEventListener(
      "selectstart",
      (event) => {
        if (
          event.data?.hand &&
          event.data === slot.source
        ) {
          slot.selectSignal = true;
        }
      }
    );

    controller.addEventListener(
      "selectend",
      () => {
        slot.selectSignal = false;
      }
    );

    return slot;
  });

  function update() {

    for (const slot of slots) {

      const indexTip =
        slot.hand.joints["index-finger-tip"];

      const thumbTip =
        slot.hand.joints["thumb-tip"];

      // Exigimos posiciones visibles de ambos dedos
      const tracking = Boolean(
        slot.source?.hand &&
        slot.controller.visible &&
        slot.hand.visible &&
        indexTip?.visible &&
        thumbTip?.visible
      );

      // Estado de pinza calculado por Three.js
      const jointPinch = Boolean(
        slot.hand.inputState?.pinching
      );

      const nextPressed = Boolean(
        tracking &&
        (
          slot.pinchSignal ||
          slot.selectSignal ||
          jointPinch
        )
      );

      slot.justPressed =
        nextPressed && !slot.pressed;

      slot.justReleased =
        !nextPressed && slot.pressed;

      slot.pressed = nextPressed;
      slot.tracking = tracking;

      if (!tracking) {
        slot.pinchSignal = false;
        slot.selectSignal = false;
      }

      slot.laser.visible = tracking;
      slot.cursor.visible = tracking;
    }
  }

  function resetAll() {
    for (const slot of slots) {
      slot.reset();
    }
  }

  return {
    slots,
    update,
    resetAll
  };
}
