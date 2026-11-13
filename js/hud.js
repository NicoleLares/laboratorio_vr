
import * as THREE from "three";

// ========================================
// NEXUS VR - HUD INTERACTIVO
// ETAPA 5
// ========================================

function roundedRect(ctx, x, y, w, h, radius) {

  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.closePath();
}

function formatTime(totalSeconds) {

  const seconds = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remaining).padStart(2, "0")
  );
}

// ========================================
// CREAR BOTÓN TRIDIMENSIONAL
// ========================================

function createVRButton(label, action, color, x) {

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 160;

  const ctx = canvas.getContext("2d");

  roundedRect(ctx, 8, 8, 496, 144, 25);

  ctx.fillStyle = "#10283f";
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 49px Arial";

  ctx.fillText(label, 256, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.73, 0.23),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    })
  );

  // Debajo del panel principal
  mesh.position.set(
    x,
    -0.56,
    0.06
  );

  mesh.userData = {
    type: "vr-button",
    action
  };

  return mesh;
}

// ========================================
// CREAR PANEL PRINCIPAL
// ========================================

export function createHUD() {

  const canvas = document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 448;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo inicializar el HUD."
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.86, 0.81),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false
    })
  );

  panel.userData.type = "hud";

  const group = new THREE.Group();

  group.position.set(
    0,
    1.73,
    -2.40
  );

  group.add(panel);

  // Botón para comenzar de nuevo
  const resetButton = createVRButton(
    "REINICIAR",
    "reset",
    "#54dfff",
    -0.44
  );

  // Botón para salir de VR
  const exitButton = createVRButton(
    "SALIR DE VR",
    "exit",
    "#ff8b96",
    0.44
  );

  group.add(resetButton);
  group.add(exitButton);

  const buttons = [
    resetButton,
    exitButton
  ];

  const current = {
    completed: 0,
    elapsedSeconds: 0,
    status: "PREPARADO",
    message: "LABORATORIO LISTO"
  };

  // ======================================
  // DIBUJAR TEXTO DEL HUD
  // ======================================

  function draw() {

    ctx.clearRect(
      0, 0,
      canvas.width,
      canvas.height
    );

    roundedRect(
      ctx, 8, 8,
      1008, 432, 34
    );

    ctx.fillStyle = "#0b1c30";
    ctx.fill();

    ctx.strokeStyle = "#3cabc9";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Encabezado
    ctx.textAlign = "left";

    ctx.fillStyle = "#54dfff";
    ctx.font = "bold 49px Arial";

    ctx.fillText(
      "NEXUS LAB",
      48,
      80
    );

    ctx.fillStyle = "#a6b6d3";
    ctx.font = "bold 23px Arial";

    ctx.fillText(
      "LABORATORIO VR",
      735,
      79
    );

    ctx.strokeStyle = "#294660";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(45, 108);
    ctx.lineTo(979, 108);
    ctx.stroke();

    // Tarjetas del progreso y tiempo
    roundedRect(
      ctx, 44, 132,
      438, 190, 18
    );

    ctx.fillStyle = "#122c43";
    ctx.fill();

    roundedRect(
      ctx, 542, 132,
      438, 190, 18
    );

    ctx.fill();

    ctx.fillStyle = "#a6b6d3";
    ctx.font = "bold 27px Arial";

    ctx.fillText(
      "PROGRESO",
      75,
      180
    );

    ctx.fillText(
      "TIEMPO",
      575,
      180
    );

    ctx.fillStyle = "#54dfff";
    ctx.font = "bold 92px Arial";

    ctx.fillText(
      `${current.completed}/5`,
      75,
      283
    );

    ctx.fillStyle = "#f0f5ff";
    ctx.font = "bold 78px Arial";

    ctx.fillText(
      formatTime(current.elapsedSeconds),
      575,
      282
    );

    // Estado con colores
    let statusColor = "#62e3ad";

    if (current.status === "ERROR") {
      statusColor = "#ff8b96";
    }

    if (current.status === "ACIERTO") {
      statusColor = "#54dfff";
    }

    if (current.status === "COMPLETADO") {
      statusColor = "#ffe18a";
    }

    ctx.fillStyle = statusColor;
    ctx.font = "bold 28px Arial";

    ctx.fillText(
      `ESTADO: ${current.status}`,
      48,
      372,
      930
    );

    // Mensaje inferior
    ctx.fillStyle = "#d5e3f6";
    ctx.font = "25px Arial";

    ctx.fillText(
      current.message,
      48,
      411,
      930
    );

    texture.needsUpdate = true;
  }

  // ======================================
  // ACTUALIZAR INDICADORES
  // ======================================

  function update(data = {}) {

    Object.assign(current, data);

    current.completed = THREE.MathUtils.clamp(
      current.completed,
      0,
      5
    );

    draw();
  }

  // ======================================
  // RESALTAR BOTONES
  // ======================================

  function setHoveredButton(button) {

    for (const item of buttons) {

      const hovered = item === button;

      item.scale.setScalar(
        hovered ? 1.075 : 1
      );

      item.material.color.setHex(
        hovered ? 0xb9efff : 0xffffff
      );
    }
  }

  // ======================================
  // LIBERAR RECURSOS
  // ======================================

  function dispose() {

    panel.geometry.dispose();
    panel.material.dispose();
    texture.dispose();

    for (const button of buttons) {

      button.geometry.dispose();

      button.material.map?.dispose();
      button.material.dispose();
    }
  }

  update();

  return {
    group,
    buttons,
    update,
    setHoveredButton,
    dispose
  };
}
