export function triggerConfetti() {
  const viewportHeight = window.innerHeight;
  const fixedHeightFromTop = 300; // Adjust this value as needed
  const yOrigin = fixedHeightFromTop / viewportHeight;

  confetti({
    particleCount: 200,
    spread: 80,
    origin: { y: yOrigin },
    colors: ["#c9a33c", "#4ba44b", "#4f48da", "#d9571f"],
    zIndex: 5,
  });
}

export function displayMessage(message, isError = false) {
  const messageElement = document.getElementById("gameMessage");
  messageElement.textContent = message;
  messageElement.style.display = "block"; // Make the bubble visible
  // messageElement.style.transform = "translateX(0)"; // Reset transform

  if (isError) {
    // messageElement.style.animation = "shake 1.5s";
    // messageElement.style.backgroundColor = "#9a0000";
    messageElement.style.animation = "fadeInOut 1s";
  } else {
    messageElement.style.animation = "fadeInOut 3s";
  }

  // Adjust the timeout duration based on the animation
  const timeoutDuration = isError ? 1000 : 3000;
  setTimeout(() => {
    messageElement.style.display = "none";
    messageElement.style.animation = "none"; // Reset the animation
  }, timeoutDuration);
}

export function hashDate(date) {
  var hash = 0;
  for (var i = 0; i < date.length; i++) {
    var character = date.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function setVisibilityByClass(
  className,
  isVisible,
  displayType = "block"
) {
  const elements = document.querySelectorAll(`.${className}`);
  elements.forEach((element) => {
    if (isVisible) {
      element.style.display = displayType;
    } else {
      element.style.display = "none";
    }
  });
}
