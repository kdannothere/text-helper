// background.js

import {
  findAndReplaceTextInFields,
  showSnackbarInContentScript,
} from "./content_injected_functions.js";

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "perform_single_action") {
    console.warn(`Unknown command: ${command}`);
    return;
  }

  console.log(
    `[Background] Hotkey pressed. Attempting to perform action (Replacement Mode).`
  );

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.id) {
      console.error("[Background] Could not get active tab.");
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Text Helper",
        message: "Error: Could not get active tab to perform action.",
        priority: 2,
      });
      return;
    }

    const storageResult = await chrome.storage.local.get(null);
    let operationName = "replace";
    let occurrencesCount = 0;

    console.log("[Background] Initiating 'replace' operation.");

    const numPairs = storageResult.numPairs || 0;
    const replacementRules = [];

    let hasAnySearchText = false;
    for (let i = 1; i <= numPairs; i++) {
      const findText = storageResult[`findText${i}`] || "";
      const replaceWithText = storageResult[`replaceWithText${i}`] || "";
      const maxOccurrences = storageResult[`maxOccurrences${i}`]; // Get new value
      // Ensure maxOccurrences is a number, default to 0 (unlimited) if not.
      const parsedMaxOccurrences =
        typeof maxOccurrences === "number" ? maxOccurrences : 0;

      if (findText) {
        replacementRules.push({
          find: findText,
          replace: replaceWithText,
          maxOccurrences: parsedMaxOccurrences, // Add to the rule object
        });
        hasAnySearchText = true;
      }
      console.log(
        `[Background] Replace Pair ${i}: "${findText}" -> "${replaceWithText}" (Max: ${
          parsedMaxOccurrences || "All"
        })`
      );
    }

    if (!hasAnySearchText) {
      console.warn(
        "[Background] Replacement Mode: No search texts provided for any step."
      );
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showSnackbarInContentScript,
        args: [
          "Replacement Mode: Please provide text for at least one search step in the extension popup.",
        ],
      });
      return;
    }

    const replaceResult = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: findAndReplaceTextInFields,
      args: [replacementRules],
    });
    occurrencesCount = replaceResult[0]?.result || 0;

    if (occurrencesCount === 0) {
      let message = `No changes made by Replacement Mode rules.`;
      console.log(`[Background] ${message}`);
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showSnackbarInContentScript,
        args: [message],
      });
    } else {
      console.log(
        `[Background] Successfully performed ${operationName} operation on ${occurrencesCount} occurrence${
          occurrencesCount === 1 ? "" : "s"
        }.`
      );
      let messageNormal = `Replacement performed on ${occurrencesCount} occurrence${
        occurrencesCount === 1 ? "" : "s"
      }.`;
      let messageImportant = "Check replaced values.";
      let snackbarDelay = 8000;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showSnackbarInContentScript,
        args: [messageNormal, messageImportant, snackbarDelay],
      });
    }
  } catch (error) {
    console.error(`[Background] Error during ${command} process:`, error);
    const errorMessage = error.message || "An unknown error occurred.";
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab && tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: showSnackbarInContentScript,
          args: [
            `An error occurred during operation: ${errorMessage}\n\nCheck browser console for more details.`,
            "",
            10000,
          ],
        });
      } else {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Text Helper Error",
          message: `Error: ${errorMessage}`,
          priority: 2,
        });
      }
    } catch (alertError) {
      console.error("[Background] Failed to show snackbar:", alertError);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Text Helper Error",
        message: `Error: ${errorMessage}`,
        priority: 2,
      });
    }
  }
});
