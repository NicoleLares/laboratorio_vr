
const renderStatus = document.getElementById(
  "render-status"
);

const compatibilityStatus = document.getElementById(
  "compatibility-status"
);

const vrMessage = document.getElementById(
  "vr-message"
);

const enterVRButton = document.getElementById(
  "enter-vr"
);

// Estado del renderizador
export function setRenderStatus(message) {
  renderStatus.textContent = message;
}

// Compatibilidad WebXR
export function setCompatibility(message, supported) {

  compatibilityStatus.textContent = message;

  compatibilityStatus.classList.remove(
    "success",
    "error"
  );

  compatibilityStatus.classList.add(
    supported ? "success" : "error"
  );

  enterVRButton.disabled = !supported;
}

// Mensajes del visor
export function setVRMessage(message) {
  vrMessage.textContent = message;
}

// Referencia al botón de entrada
export function getVRButton() {
  return enterVRButton;
}
