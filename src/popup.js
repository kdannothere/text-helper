// popup.js

document.addEventListener("DOMContentLoaded", () => {
  // saveButton is no longer needed as the button is removed
  const statusMessage = document.getElementById("statusMessage");

  const replaceConfigInputsDiv = document.getElementById(
    "replaceConfigInputs"
  );
  const numPairsInput = document.getElementById("numPairs");
  const generatePairsButton = document.getElementById("generatePairsButton");
  const dynamicReplaceInputsDiv = document.getElementById(
    "dynamicReplaceInputs"
  );

  /**
   * Generates input fields for replacement based on the number of pairs.
   * Includes fields for find, replace, and max occurrences.
   * @param {number} num The number of pairs to generate.
   * @param {Object} savedValues Optional object containing saved values to pre-populate.
   */
  function generateInputFields(num, savedValues = {}) {
    dynamicReplaceInputsDiv.innerHTML = ""; // Clear existing fields
    for (let i = 1; i <= num; i++) {
      const pairContainer = document.createElement("div");
      pairContainer.classList.add("input-group");

      const header = document.createElement("div");
      header.classList.add("input-group-header");
      header.textContent = `Pair ${i}:`;
      pairContainer.appendChild(header);

      const findLabel = document.createElement("label");
      findLabel.setAttribute("for", `findText${i}`);
      findLabel.textContent = "Text to Find:";
      findLabel.style.marginBottom = "2px";
      pairContainer.appendChild(findLabel);

      const findInput = document.createElement("input");
      findInput.type = "text";
      findInput.id = `findText${i}`;
      findInput.placeholder = `Text to find for pair ${i}...`;
      findInput.value = savedValues[`findText${i}`] || "";
      findInput.style.marginBottom = "2px";
      pairContainer.appendChild(findInput);

      const replaceLabel = document.createElement("label");
      replaceLabel.setAttribute("for", `replaceWithText${i}`);
      replaceLabel.textContent = "Replace With:";
      replaceLabel.style.marginBottom = "2px";
      pairContainer.appendChild(replaceLabel);

      const replaceInput = document.createElement("input");
      replaceInput.type = "text";
      replaceInput.id = `replaceWithText${i}`;
      replaceInput.placeholder = `Replacement text...`;
      replaceInput.value = savedValues[`replaceWithText${i}`] || "";
      replaceInput.style.marginBottom = "2px";
      pairContainer.appendChild(replaceInput);

      const maxOccurrencesLabel = document.createElement("label");
      maxOccurrencesLabel.setAttribute("for", `maxOccurrences${i}`);
      maxOccurrencesLabel.textContent = `Max Occurrences (0 for unlimited):`;
      maxOccurrencesLabel.style.marginBottom = "2px";
      pairContainer.appendChild(maxOccurrencesLabel);

      const maxOccurrencesInput = document.createElement("input");
      maxOccurrencesInput.type = "number";
      maxOccurrencesInput.id = `maxOccurrences${i}`;
      maxOccurrencesInput.min = "0";
      // Ensure saved value is a number, default to 0 if not
      maxOccurrencesInput.value =
        typeof savedValues[`maxOccurrences${i}`] === "number"
          ? savedValues[`maxOccurrences${i}`]
          : 0;
      pairContainer.appendChild(maxOccurrencesInput);

      // Add change listeners for autosaving
      findInput.addEventListener("change", saveSettings);
      replaceInput.addEventListener("change", saveSettings);
      maxOccurrencesInput.addEventListener("change", saveSettings);

      dynamicReplaceInputsDiv.appendChild(pairContainer);
    }
  }

  // Load settings when the popup opens
  async function loadSettings() {
    try {
      const storageResult = await chrome.storage.local.get(null);
      console.log("[Popup] Loaded settings:", storageResult);

      // Restore Replacement Mode settings
      const numPairs = storageResult.numPairs || 1;
      numPairsInput.value = numPairs;
      generateInputFields(numPairs, storageResult); // Pass saved values to pre-populate

      // Trigger autosave if numPairs changes when popup is opened for the first time
      // This covers cases where 'numPairs' might be manually edited or not set on first run
      if (numPairsInput.value != numPairs) {
        saveSettings();
      }

      statusMessage.textContent = `Replacement Mode is active.`;
      statusMessage.style.color = "#4a5568";
    } catch (error) {
      console.error("[Popup] Error loading settings:", error);
      statusMessage.textContent = "Error loading settings.";
      statusMessage.style.color = "#dc2626";
    }
  }

  // Save settings to chrome.storage.local
  async function saveSettings() {
    console.log("[Popup] Attempting to save settings...");
    const dataToSave = {};

    // Save numPairs for replacement
    const numPairs = parseInt(numPairsInput.value, 10);
    dataToSave.numPairs = numPairs;

    // Save each replacement pair
    for (let i = 1; i <= numPairs; i++) {
      const findInput = document.getElementById(`findText${i}`);
      const replaceInput = document.getElementById(`replaceWithText${i}`);
      const maxOccurrencesInput = document.getElementById(`maxOccurrences${i}`); // Get the max occurrences input

      if (findInput) dataToSave[`findText${i}`] = findInput.value;
      if (replaceInput) dataToSave[`replaceWithText${i}`] = replaceInput.value;
      // Store max occurrences. Use 0 if input is empty or not a valid number.
      if (maxOccurrencesInput) {
        dataToSave[`maxOccurrences${i}`] =
          parseInt(maxOccurrencesInput.value, 10) || 0;
      } else {
        dataToSave[`maxOccurrences${i}`] = 0; // Default to 0 if element doesn't exist (e.g., if somehow a pair was removed)
      }
    }

    try {
      await chrome.storage.local.set(dataToSave);
      console.log(`[Popup] Saved replacement settings.`);
      console.log(`[Popup] All settings saved:`, dataToSave);

      statusMessage.textContent = `Settings saved!`;
      statusMessage.style.color = "#16a34a";

      setTimeout(() => {
        statusMessage.textContent = `Replacement Mode is active.`;
        statusMessage.style.color = "#4a5568";
      }, 2000);
    } catch (error) {
      console.error("[Popup] Error saving settings:", error);
      statusMessage.textContent = "Error saving settings.";
      statusMessage.style.color = "#dc2626";
    }
  }

  // Event Listeners
  // No need for a save button listener, as autosave is implemented

  numPairsInput.addEventListener("change", () => {
    generateInputFields(parseInt(numPairsInput.value, 10));
    saveSettings(); // Autosave when number of pairs changes
  });

  generatePairsButton.addEventListener("click", () => {
    generateInputFields(parseInt(numPairsInput.value, 10));
    saveSettings(); // Autosave when generate button is clicked
  });

  // Initial load of settings when the popup is opened
  loadSettings();
});
