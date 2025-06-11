// content_injected_functions.js

import { showSnackbar } from "./snackbar.js";
export { showSnackbar as showSnackbarInContentScript };

// Function to be executed in the content script context to read the clipboard safely
// (Keeping this here, though it's no longer used in background.js with the current design)
export function readClipboardInContentScriptSafely() {
  return new Promise((resolve) => {
    const textarea = document.createElement("textarea");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";

    document.body.appendChild(textarea);

    textarea.focus();
    let clipboardContent = "";
    try {
      if (document.execCommand("paste")) {
        clipboardContent = textarea.value;
      }
    } catch (e) {
      console.error("Failed to execute paste command:", e);
    } finally {
      document.body.removeChild(textarea);
    }
    resolve(clipboardContent);
  });
}

// Utility function to escape special characters for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the matched substring
}

// Function for Replacement Mode with an array of configurable steps and occurrence limits
export function findAndReplaceTextInFields(replacementRules) {
  let totalCount = 0;

  // Helper function to process elements
  function processElements(elements) {
    elements.forEach((elem) => {
      const originalContent =
        elem.value !== undefined ? elem.value : elem.textContent;
      let currentContent = originalContent;
      let replacedInThisElement = false;
      let currentElementTotalReplaced = 0;

      replacementRules.forEach((rule, index) => {
        const findText = rule.find;
        const replaceWithText = rule.replace;
        const maxOccurrences = rule.maxOccurrences; // 0 means unlimited

        if (!findText) {
          console.warn(
            `[Replacement Mode] Rule ${
              index + 1
            }: Found text is empty. Skipping.`
          );
          return;
        }

        let replacementsMadeForRule = 0;
        const regex = new RegExp(escapeRegExp(findText), "g"); // 'g' for global search

        // If maxOccurrences is 0 or less, replace all.
        // Otherwise, replace up to maxOccurrences.
        if (maxOccurrences <= 0) {
          // Replace all occurrences using replaceAll for simplicity when no limit
          const newContent = currentContent.replaceAll(
            findText,
            replaceWithText
          );
          if (newContent !== currentContent) {
            replacementsMadeForRule =
              (currentContent.length - newContent.length) /
              (findText.length - replaceWithText.length || 1); // rough count,
            // better to use regex match counting
            if (findText.length !== replaceWithText.length) {
              const matches = currentContent.match(regex);
              replacementsMadeForRule = matches ? matches.length : 0;
            } else {
              // If lengths are same, simple string replacement, need to count by iterating
              // This is a fallback, replaceAll is usually more efficient
              const parts = currentContent.split(findText);
              replacementsMadeForRule = parts.length - 1;
            }
            currentContent = newContent;
            replacedInThisElement = true;
          }
        } else {
          // Limited replacements using replace with a counter callback
          currentContent = currentContent.replace(regex, (match) => {
            if (replacementsMadeForRule < maxOccurrences) {
              replacementsMadeForRule++;
              replacedInThisElement = true;
              return replaceWithText;
            }
            return match; // Return original match if limit reached
          });
        }
        currentElementTotalReplaced += replacementsMadeForRule;
        console.log(
          `[Replacement Mode] Rule ${
            index + 1
          }: ${replacementsMadeForRule} replacement(s) made.`
        );
      });

      if (replacedInThisElement) {
        if (elem.value !== undefined) {
          elem.value = currentContent;
        } else {
          elem.textContent = currentContent;
        }
        totalCount += currentElementTotalReplaced; // Add to global total
        elem.dispatchEvent(new Event("input", { bubbles: true }));
        elem.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  // --- Handle input and textarea elements ---
  const inputElements = document.querySelectorAll(
    "input[type=text], input[type=search], input[type=url], input[type=tel], input[type=password], textarea"
  );
  processElements(inputElements);

  // --- Handle contenteditable elements ---
  const contentEditableElements = document.querySelectorAll(
    '[contenteditable="true"]'
  );
  processElements(contentEditableElements);

  console.log(
    `Finished processing. Total replaced count: ${totalCount}.`
  );
  return totalCount;
}

// Function to prompt user for replacement text (in content script) - No longer used.
export function promptForReplacementText(textToFind) {
  // This function is kept for backward compatibility if other parts of your
  // extension might still use it, but it's explicitly replaced by stored values
  // for the 'replace' action in background.js.
  // It's not used by the new replace feature.
  return new Promise((resolve) => {
    const replacement = prompt(
      `Found "${textToFind}". Enter text to replace it with (leave empty to delete):`
    );
    resolve(replacement !== null ? replacement : undefined);
  });
}
