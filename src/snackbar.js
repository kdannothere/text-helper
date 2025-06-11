// snackbar.js

/**
 * Displays a snackbar message at the top of the page with normal and bold text parts.
 * @param {string} messageNormal The main message text, displayed slightly larger.
 * @param {string} messageImportant The important part of the message, displayed in bold.
 * @param {number} [duration=3000] How long the snackbar should be visible in milliseconds.
 */
export function showSnackbar(messageNormal, messageImportant, duration = 3000) {
  let snackbar = document.getElementById("extension-snackbar");

  // If snackbar doesn't exist, create it and append to body
  if (!snackbar) {
    snackbar = document.createElement("div");
    snackbar.id = "extension-snackbar";
    snackbar.style.cssText = `
      visibility: hidden; /* Hidden by default. */
      min-width: 250px; /* Set a minimum width */
      background-color: #333; /* Black background color */
      color: #fff; /* White text color */
      text-align: center; /* Centered text */
      border-radius: 2px; /* Rounded borders */
      padding: 16px; /* Padding */
      position: fixed; /* Sit on top of the screen */
      z-index: 2147483647; /* High z-index to be on top of everything */
      left: 50%; /* Center the snackbar */
      transform: translateX(-50%); /* Adjust for perfect centering */
      top: 30px; /* Position at the top, with some margin */
      font-size: 17px; /* Base font size */
      opacity: 0; /* Start invisible for animation */
      transition: opacity 0.5s, top 0.5s; /* Smooth transition */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Subtle shadow */
      display: flex; /* Use flexbox to center content */
      flex-direction: column; /* Stack messages vertically */
      align-items: center; /* Center items horizontally */
    `;
    document.body.appendChild(snackbar);
  }

  // Clear previous content
  snackbar.innerHTML = "";

  // Create normal message element
  if (messageNormal) {
    const normalSpan = document.createElement("span");
    normalSpan.style.fontSize = "1.1em"; // Slightly bigger than base (17px)
    normalSpan.style.marginBottom = messageImportant ? "5px" : "0"; // Add margin if there's an important message
    normalSpan.textContent = messageNormal;
    snackbar.appendChild(normalSpan);
  }

  // Create important message element
  if (messageImportant) {
    const importantSpan = document.createElement("span");
    importantSpan.style.fontWeight = "bold";
    importantSpan.style.fontSize = "1.1em"; // Make bold text slightly bigger as well for emphasis
    importantSpan.textContent = messageImportant;
    snackbar.appendChild(importantSpan);
  }

  snackbar.style.visibility = "visible";
  snackbar.style.opacity = "1";
  snackbar.style.top = "30px"; // Ensure it's in position

  // Hide the snackbar after 'duration' milliseconds
  clearTimeout(snackbar.timeoutId); // Clear any previous timeout
  snackbar.timeoutId = setTimeout(() => {
    snackbar.style.opacity = "0";
    snackbar.style.top = "0px"; // Move slightly up as it fades out
    setTimeout(() => {
      snackbar.style.visibility = "hidden";
      // We keep the element in the DOM for reuse, no removal here.
    }, 500); // Wait for fade out animation
  }, duration);
}
