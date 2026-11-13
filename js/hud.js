
import * as THREE from "three";

// ========================================
// NEXUS VR - HUD INMERSIVO
// ========================================

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(
    x + w, y, x + w, y + r
  );
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(
    x + w, y + h,
    x + w - r, y + h
  );
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(
    x, y + h, x, y + h - r
  );
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(
    x, y, x + r, y
  );
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

export function createHUD() {
  const canvas = document.createElement("canvas");

  canvas.width = 1024;
  canvas.height = 448;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error(
      "No se pudo crear el Canvas del HUD."
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(
    1.86,
    0.81
  );

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const panel = new THREE.Mesh(
    geometry,
    material
  );

  panel.userData = {
    type: "hud",
    selectable: false
  };

  const group = new THREE.Group();

  // Panel al fondo y encima de la mesa
  group.position.set(
    0,
    1.73,
    -2.40
  );

  group.add(panel);

  // Estado de presentación del panel
  const current = {
    completed: 0,
    elapsedSeconds: 0,
    status: "PREPARADO",
    message: "Laboratorio listo"
  };

  function draw() {
    ctx.clearRect(
      0, 0,
      canvas.width,
      canvas.height
    );

    // Fondo
    roundedRect(
      ctx,
      8, 8,
      1008, 432,
      35
    );

    ctx.fillStyle = "#0b1c30";
    ctx.fill();

    ctx.strokeStyle = "#3cabc9";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Cabecera
    ctx.fillStyle = "#54dfff";
    ctx.font = "bold 49px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      "NEXUS LAB",
      48,
      82
    );

    ctx.fillStyle = "#a6b6d3";
    ctx.font = "bold 23px Arial";
    ctx.fillText(
      "LABORATORIO VR",
      735,
      78
    );

    // Separador
    ctx.strokeStyle = "#294660";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(45, 107);
    ctx.lineTo(979, 107);
    ctx.stroke();

    // Recuadro de progreso
    roundedRect(
      ctx, 44, 132, 438, 190, 18
    );

    ctx.fillStyle = "#122c43";
    ctx.fill();

    // Recuadro de cronómetro
    roundedRect(
      ctx, 542, 132, 438, 190, 18
    );

    ctx.fillStyle = "#122c43";
    ctx.fill();

    // Progreso
    ctx.fillStyle = "#a6b6d3";
    ctx.font = "bold 27px Arial";

    ctx.fillText(
      "PROGRESO",
      75,
      180
    );

    ctx.fillStyle = "#54dfff";
    ctx.font = "bold 92px Arial";

    ctx.fillText(
      `${current.completed}/5`,
      75,
      284
    );

    // Cronómetro
    ctx.fillStyle = "#a6b6d3";
    ctx.font = "bold 27px Arial";

    ctx.fillText(
      "TIEMPO",
      575,
      180
    );

    ctx.fillStyle = "#f0f5ff";
    ctx.font = "bold 78px Arial";

    ctx.fillText(
      formatTime(current.elapsedSeconds),
      575,
      280
    );

    // Estado
    ctx.fillStyle = "#62e3ad";
    ctx.font = "bold 29px Arial";

    ctx.fillText(
      `ESTADO: ${current.status}`,
      48,
      374
    );

    // Mensajes
    ctx.fillStyle = "#b8c9df";
    ctx.font = "25px Arial";

    ctx.fillText(
      current.message,
      48,
      412,
      925
    );

    texture.needsUpdate = true;
  }

  function update(data = {}) {
    Object.assign(current, data);

    current.completed = Math.max(
      0,
      Math.min(5, current.completed)
    );

    draw();
  }

  function dispose() {
    texture.dispose();
    material.dispose();
    geometry.dispose();
  }

  update();

  return {
    group,
    update,
    dispose
  };
}
