// replacement_mode.js

import { showSnackbar } from "./snackbar.js";
export { showSnackbar as showSnackbarInContentScript };

// Utility function to escape special characters for RegExp
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the matched substring
}

// Function for Replacement Mode with an array of configurable steps and occurrence limits
export function findAndReplaceTextInFields(replacementRules) {
  let totalCount = 0;

  // Helper function to process elements
  function processElements(elements) {
    replacementRules.forEach((rule, index) => {
      // Move rule iteration here
      const findText = rule.find;
      const replaceWithText = rule.replace;
      const maxOccurrences = rule.maxOccurrences; // 0 means unlimited
      let replacementsMadeForRule = 0; // Initialize for each rule, outside element loop

      if (!findText) return; // Skip to next rule

      const regex = new RegExp(escapeRegExp(findText), "g"); // 'g' for global search

      elements.forEach((elem) => {
        if (maxOccurrences > 0 && replacementsMadeForRule >= maxOccurrences) {
          return; // Skip element if max occurrences for this rule are already met
        }

        const originalContent =
          elem.value !== undefined ? elem.value : elem.textContent;
        let currentContent = originalContent;
        let replacedInThisElement = false;
        let currentElementTotalReplaced = 0; // This tracks replacements within the current element for *this rule*

        if (!findText) return;

        // If maxOccurrences is 0 or less, replace all.
        // Otherwise, replace up to maxOccurrences.
        if (maxOccurrences <= 0) {
          const newContent = currentContent.replaceAll(
            findText,
            replaceWithText
          );
          if (newContent !== currentContent) {
            const matches = currentContent.match(regex);
            currentElementTotalReplaced = matches ? matches.length : 0;
            currentContent = newContent;
            replacedInThisElement = true;
          }
        } else {
          // Limited replacements using replace with a counter callback
          currentContent = currentContent.replace(regex, (match) => {
            if (replacementsMadeForRule < maxOccurrences) {
              replacementsMadeForRule++;
              currentElementTotalReplaced++; // Increment for the current element and rule
              replacedInThisElement = true;
              return replaceWithText;
            }
            return match; // Return original match if limit reached
          });
        }

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
    });
  }

  // --- Handle input and textarea elements ---
  const inputElements = document.querySelectorAll(
    "input[type=text], input[type=number], input[type=search], input[type=url], input[type=tel], input[type=password], textarea"
  );
  processElements(inputElements);

  // --- Handle contenteditable elements ---
  const contentEditableElements = document.querySelectorAll(
    '[contenteditable="true"]'
  );
  processElements(contentEditableElements);

  return totalCount;
}
