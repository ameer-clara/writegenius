const OPENAI_API_KEY = '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';
const OPEN_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

let storedRanges = null;

function createFloatingWindow(content) {
  const floatingWindow = document.createElement('div');
  floatingWindow.classList.add('openai-floating-window');
  floatingWindow.innerHTML = `
  <div class="openai-floating-header">
    <span class="openai-floating-close">x</span>
  </div>
  <div class="openai-floating-body">
    <div class="openai-generated-text">${content}</div>
    <button id="openai-floating-replace">Replace Selected Text</button>
  </div>
  `;
  document.body.appendChild(floatingWindow);

  const closeIcon = floatingWindow.querySelector('.openai-floating-close');
  closeIcon.addEventListener('click', () => {
    removeFloatingWindow(floatingWindow);
  });

  const body = floatingWindow.querySelector('.openai-floating-body');
  let initialMousePosition = null;
  let initialFloatingWindowPosition = null;
  let isDragging = false;

  body.addEventListener('mousedown', (event) => {
    initialMousePosition = { x: event.clientX, y: event.clientY };
    const { left, top } = floatingWindow.getBoundingClientRect();
    initialFloatingWindowPosition = { x: left, y: top };
    isDragging = true;
  });

  document.addEventListener('mousemove', (event) => {
    if (isDragging) {
      const dx = event.clientX - initialMousePosition.x;
      const dy = event.clientY - initialMousePosition.y;
      const x = initialFloatingWindowPosition.x + dx;
      const y = initialFloatingWindowPosition.y + dy;
      positionFloatingWindow(floatingWindow, x, y);
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  const replaceButton = floatingWindow.querySelector('#openai-floating-replace');
  console.log('replace button clicked before: ' + storedRanges);

  replaceButton.addEventListener('click', () => {
    if (storedRanges) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      storedRanges.forEach((range) => selection.addRange(range));

      const range = selection.getRangeAt(0);

      // Save the current caret position
      const savedCaretPosition = document.createElement('span');
      savedCaretPosition.id = 'saved-caret-position';
      range.insertNode(savedCaretPosition);

      // Replace the selected text
      range.setStartAfter(savedCaretPosition);
      range.deleteContents();

      const generatedContent = floatingWindow.querySelector('.openai-generated-text');
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = generatedContent.innerHTML;
      while (tempContainer.firstChild) {
        range.insertNode(tempContainer.firstChild);
      }

      // Restore the caret position
      const caretPosition = document.getElementById('saved-caret-position');
      const newCaretPosition = document.createRange();
      newCaretPosition.setStartAfter(caretPosition);
      newCaretPosition.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newCaretPosition);

      // Remove the saved caret position span
      caretPosition.remove();

      // Reset the stored range information
      storedRanges = null;
    }

    // Remove the floating window
    removeFloatingWindow(floatingWindow);
  });

  return floatingWindow;
}

function positionFloatingWindow(floatingWindow, x, y) {
  floatingWindow.style.left = `${x}px`;
  floatingWindow.style.top = `${y}px`;
}

function removeFloatingWindow(floatingWindow) {
  floatingWindow.remove();
}

function formatResponseToHtml(text) {
  return text.replace(/\n/g, '<br>');
}

async function processTextWithOpenAI(text, selectedPromptType) {
  console.log('calling openai: ' + text + ' ' + selectedPromptType);
  const response = await fetch(OPEN_API_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: selectedPromptType + text }],
      max_tokens: 250,
    }),
  });

  const data = await response.json();
  console.log('got response: ', data);
  return data.choices[0].message.content; // Return the generated text
}

chrome.runtime.onMessage.addListener(async (message) => {
  const result = await processTextWithOpenAI(message.selectionText, message.menuItemId);

  const selection = window.getSelection();
  storedRanges = [];
  for (let i = 0; i < selection.rangeCount; i++) {
    storedRanges.push(selection.getRangeAt(i));
  }

  const formattedResult = formatResponseToHtml(result);
  const floatingWindow = createFloatingWindow(formattedResult);
  const { x, y } = storedRanges[0].getBoundingClientRect();
  positionFloatingWindow(floatingWindow, x, y + 25);
  setTimeout(() => removeFloatingWindow(floatingWindow), 15000);
});
