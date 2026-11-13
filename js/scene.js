
import * as THREE from "three";
import { createHUD } from "./hud.js";

// ========================================
// NEXUS VR - ETAPA 3
// Escenario, piezas y destinos
// ========================================

const TABLE = {
  width: 2.35,
  depth: 1.34,
  height: 0.12,
  x: 0,
  y: 0.86,
  z: -1.65
};

const TABLE_TOP = TABLE.y + TABLE.height / 2;

// Configuración central de las cinco piezas
export const PIECE_DEFINITIONS = [
  {
    id: "cubo",
    name: "CUBO",
    color: 0x43a5ff
  },
  {
    id: "esfera",
    name: "ESFERA",
    color: 0x50e0a5
  },
  {
    id: "cono",
    name: "CONO",
    color: 0xffac65
  },
  {
    id: "cilindro",
    name: "CILINDRO",
    color: 0xab8cff
  },
  {
    id: "prisma",
    name: "PRISMA",
    color: 0xffdc71
  }
];

// Posiciones de las cinco columnas
const COLUMN_X = [-0.94, -0.47, 0, 0.47, 0.94];

// ========================================
// CREACIÓN DE GEOMETRÍAS
// ========================================

function createPieceGeometry(id) {
  switch (id) {
    case "cubo":
      return new THREE.BoxGeometry(
        0.24, 0.24, 0.24
      );

    case "esfera":
      return new THREE.SphereGeometry(
        0.13, 24, 16
      );

    case "cono":
      return new THREE.ConeGeometry(
        0.14, 0.27, 32
      );

    case "cilindro":
      return new THREE.CylinderGeometry(
        0.12, 0.12, 0.25, 32
      );

    case "prisma":
      // Prisma con base triangular
      return new THREE.CylinderGeometry(
        0.145, 0.145, 0.23, 3
      );

    default:
      throw new Error(
        `Geometría desconocida: ${id}`
      );
  }
}

// ========================================
// PISO Y AMBIENTE
// ========================================

function createEnvironment(scene) {
  scene.background = new THREE.Color(0x08101e);
  scene.fog = new THREE.Fog(
    0x08101e, 5, 12
  );

  const ambient = new THREE.AmbientLight(
    0xffffff, 1.5
  );
  scene.add(ambient);

  const mainLight = new THREE.DirectionalLight(
    0xd8edff, 2.4
  );
  mainLight.position.set(1.5, 3.5, 1);
  scene.add(mainLight);

  const violetLight = new THREE.PointLight(
    0x8b6cff, 15, 5
  );
  violetLight.position.set(
    -1.3, 2.1, -2
  );
  scene.add(violetLight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x101b2b,
      roughness: 0.9
    })
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  scene.add(floor);

  const grid = new THREE.GridHelper(
    12, 36,
    0x345675,
    0x1b3047
  );

  grid.position.y = -0.015;
  scene.add(grid);
}

// ========================================
// MESA DEL LABORATORIO
// ========================================

function createTable(scene) {
  const tableMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x233752,
      metalness: 0.3,
      roughness: 0.45
    });

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(
      TABLE.width,
      TABLE.height,
      TABLE.depth
    ),
    tableMaterial
  );

  table.position.set(
    TABLE.x,
    TABLE.y,
    TABLE.z
  );

  scene.add(table);

  // Borde luminoso
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(table.geometry),
    new THREE.LineBasicMaterial({
      color: 0x54dfff
    })
  );
  table.add(edges);

  // Cuatro patas de mesa
  const legMaterial =
    new THREE.MeshStandardMaterial({
      color: 0x17263d,
      metalness: 0.25,
      roughness: 0.6
    });

  for (const x of [-1.04, 1.04]) {
    for (const z of [-2.15, -1.15]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.08, 0.81, 0.08
        ),
        legMaterial
      );

      leg.position.set(x, 0.405, z);
      scene.add(leg);
    }
  }

  // Separador entre piezas y destinos
  const separator = new THREE.Mesh(
    new THREE.BoxGeometry(
      2.15, 0.006, 0.012
    ),
    new THREE.MeshBasicMaterial({
      color: 0x4ad5ed
    })
  );

  separator.position.set(
    0,
    TABLE_TOP + 0.005,
    -1.65
  );

  scene.add(separator);
}

// ========================================
// PIEZAS MANIPULABLES
// ========================================

function createPiece(definition, x) {
  const geometry = createPieceGeometry(
    definition.id
  );

  geometry.computeBoundingBox();

  const material =
    new THREE.MeshStandardMaterial({
      color: definition.color,
      roughness: 0.3,
      metalness: 0.15,
      emissive: definition.color,
      emissiveIntensity: 0.08,
      flatShading: definition.id === "prisma"
    });

  const mesh = new THREE.Mesh(
    geometry,
    material
  );

  // Colocación exactamente sobre la mesa
  const minY = geometry.boundingBox.min.y;

  mesh.position.set(
    x,
    TABLE_TOP - minY + 0.012,
    -1.28
  );

  // Identificadores para raycasting futuro
  mesh.userData = {
    type: "piece",
    pieceId: definition.id,
    destinationId: definition.id,
    movable: true
  };

  // Datos centrales de esta pieza
  return {
    id: definition.id,
    name: definition.name,
    destinationId: definition.id,
    mesh,
    state: "available",

    initialPosition: mesh.position.clone(),
    initialQuaternion: mesh.quaternion.clone(),
    initialScale: mesh.scale.clone()
  };
}

// ========================================
// TEXTURAS DE DESTINOS
// ========================================

function drawRoundedRect(ctx, x, y, w, h, r) {
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

function drawTargetIcon(ctx, id) {
  ctx.save();

  ctx.translate(192, 108);
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";

  switch (id) {
    case "cubo":
      ctx.strokeRect(-40, -40, 80, 80);
      break;

    case "esfera":
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.stroke();
      break;

    case "cono":
      ctx.beginPath();
      ctx.moveTo(0, -47);
      ctx.lineTo(47, 40);
      ctx.lineTo(-47, 40);
      ctx.closePath();
      ctx.stroke();
      break;

    case "cilindro":
      ctx.strokeRect(-37, -34, 74, 72);
      ctx.beginPath();
      ctx.ellipse(
        0, -34, 37, 13,
        0, 0, Math.PI * 2
      );
      ctx.stroke();
      break;

    case "prisma":
      ctx.beginPath();
      ctx.moveTo(-43, 37);
      ctx.lineTo(0, -42);
      ctx.lineTo(43, 37);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(30, -20);
      ctx.lineTo(43, 37);
      ctx.stroke();
      break;
  }

  ctx.restore();
}

function createTargetTexture(definition) {
  const canvas = document.createElement("canvas");

  canvas.width = 384;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  const color = `#${definition.color
    .toString(16)
    .padStart(6, "0")}`;

  // Fondo del receptáculo
  drawRoundedRect(
    ctx, 8, 8, 368, 240, 23
  );

  ctx.fillStyle = "#0d2135";
  ctx.fill();

  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.stroke();

  // Silueta individual
  ctx.strokeStyle = color;
  drawTargetIcon(ctx, definition.id);

  // Nombre del destino
  ctx.fillStyle = "#edf6ff";
  ctx.textAlign = "center";
  ctx.font = "bold 29px sans-serif";

  ctx.fillText(
    definition.name,
    192,
    216
  );

  const texture = new THREE.CanvasTexture(
    canvas
  );

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  return texture;
}

// ========================================
// DESTINOS DE ENSAMBLAJE
// ========================================

function createTarget(definition, x) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.39, 0.025, 0.31
    ),
    new THREE.MeshStandardMaterial({
      color: 0x142b3f,
      roughness: 0.5
    })
  );

  group.add(base);

  const texture = createTargetTexture(
    definition
  );

  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(
      0.37, 0.29
    ),
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide
    })
  );

  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.014;

  group.add(marker);

  // Base sobre la mesa
  group.position.set(
    x,
    TABLE_TOP + 0.014,
    -2.03
  );

  group.userData = {
    type: "target",
    targetId: definition.id
  };

  return {
    id: definition.id,
    name: definition.name,
    mesh: group,
    state: "pending",
    center: group.position.clone()
  };
}

// ========================================
// ESCENA PRINCIPAL
// ========================================

export function createLaboratoryScene() {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    62,
    1,
    0.1,
    30
  );

  // Cámara de vista previa en escritorio
  camera.position.set(
    0,
    1.85,
    0.35
  );

  camera.lookAt(0, 1.39, -1.75);

  createEnvironment(scene);
  createTable(scene);

  const pieces = [];
  const targets = [];

  // Crear exactamente cinco parejas
  PIECE_DEFINITIONS.forEach(
    (definition, index) => {
      const x = COLUMN_X[index];

      const piece = createPiece(
        definition,
        x
      );

      const target = createTarget(
        definition,
        x
      );

      scene.add(piece.mesh);
      scene.add(target.mesh);

      pieces.push(piece);
      targets.push(target);
    }
  );

  // Panel verdaderamente tridimensional
  const hud = createHUD();

  scene.add(hud.group);

  // Actualización visual inicial
  hud.update({
    completed: 0,
    elapsedSeconds: 0,
    status: "PREPARADO",
    message: "Interaccion con manos: Etapa 4"
  });

  // Solo piezas, sin mesa ni destinos
  const selectableMeshes = pieces.map(
    (piece) => piece.mesh
  );

  // Indicador decorativo del laboratorio
  const indicator = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 8),
    new THREE.MeshBasicMaterial({
      color: 0x54dfff
    })
  );

  indicator.position.set(
    0,
    1.29,
    -2.34
  );

  scene.add(indicator);

  function update(time) {
    // Solo animamos el indicador;
    // las cinco piezas permanecen estáticas.
    const pulse = 0.85 +
      Math.sin(time * 2.4) * 0.15;

    indicator.scale.setScalar(pulse);
  }

  return {
    scene,
    camera,
    update,
    pieces,
    targets,
    selectableMeshes,
    hud
  };
}
