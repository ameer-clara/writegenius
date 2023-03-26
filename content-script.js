const OPEN_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

let storedRanges = null;
let promptType = null;

async function displayHistory() {
  const db = await openDatabase();
  const transaction = db.transaction('responses', 'readonly');
  const responsesStore = transaction.objectStore('responses');
  const getAllRequest = responsesStore.getAll();
  let historyHtml = '';

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = () => {
      const responses = getAllRequest.result;
      responses.sort((a, b) => b.timestamp - a.timestamp); // Sort in reverse chronological order

      responses.forEach((response) => {
        const timestamp = new Date(response.timestamp).toLocaleString();
        historyHtml += `<div class="history-item">
                          <p><strong>Prompt Type:</strong> ${response.promptType}</p>
                          <p><strong>Prompt:</strong> ${response.prompt}</p>
                          <p><strong>Response:</strong> ${response.response}</p>
                          <p><strong>Timestamp:</strong> ${timestamp}</p>
                          <p><strong>Model:</strong> ${response.model} | <strong>Temperature:</strong> ${response.temperature} | <strong>Max Tokens:</strong> ${response.maxLength} | <strong>Top P:</strong> ${response.topP} | <strong>Frequency penalty:</strong> ${response.frequencyPenalty} | <strong>Presence penalty:</strong> ${response.presencePenalty} |  </p>
                        </div>`;
      });

      resolve(historyHtml);
    };
  });
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open('openai_responses', 1);

    openRequest.onupgradeneeded = () => {
      const db = openRequest.result;
      db.createObjectStore('responses', { keyPath: 'id', autoIncrement: true });
    };

    openRequest.onsuccess = () => {
      resolve(openRequest.result);
    };

    openRequest.onerror = () => {
      reject(openRequest.error);
    };
  });
}

function loadSettings() {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          model: 'gpt-3.5-turbo',
          apiKey: '',
          temperature: 0.7,
          maxLength: 256,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0,
        },
        (settings) => {
          resolve(settings);
        }
      );
    });
  } catch (error) {
    alert('Cannot load settings. Please try again.');
  }
}

async function saveResponse(promptText, selectedPromptType, responseText, model, temperature, maxLength, topP, frequencyPenalty, presencePenalty) {
  const db = await openDatabase();
  const transaction = db.transaction('responses', 'readwrite');
  const responsesStore = transaction.objectStore('responses');
  const responseObj = {
    model: model,
    temperature: temperature,
    maxLength: maxLength,
    topP: topP,
    frequencyPenalty: frequencyPenalty,
    presencePenalty: presencePenalty,
    prompt: promptText,
    promptType: selectedPromptType,
    response: responseText,
    timestamp: new Date(),
  };

  return new Promise((resolve, reject) => {
    const saveRequest = responsesStore.add(responseObj);

    saveRequest.onsuccess = () => {
      resolve(saveRequest.result);
    };

    saveRequest.onerror = () => {
      reject(saveRequest.error);
    };
  });
}

function createFloatingWindow(content, error = false) {
  const floatingWindow = document.createElement('div');
  floatingWindow.classList.add('openai-floating-window');
  floatingWindow.innerHTML = `
  <div class="openai-floating-body">
    <div class="openai-generated-text">${content}</div>
  </div>
  <div class="openai-floating-header">
  <span>${error ? '' : "<button id='openai-floating-replace'>Replace Selected Text</button>"}
    <span class="openai-floating-close">x</span>
  </div>
  `;

  document.body.appendChild(floatingWindow);

  const closeIcon = floatingWindow.querySelector('.openai-floating-close');
  closeIcon.addEventListener('click', () => {
    removeFloatingWindow(floatingWindow);
  });
  const body = floatingWindow.querySelector('.openai-floating-header');
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

  if (!error) {
    const replaceButton = floatingWindow.querySelector('#openai-floating-replace');

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

        // Insert HTML content
        const generatedContent = floatingWindow.querySelector('.openai-generated-text');
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = generatedContent.innerHTML;
        let lastInsertedNode = null;

        // Create a document fragment to insert nodes in the correct order
        const fragment = document.createDocumentFragment();
        while (tempContainer.firstChild) {
          lastInsertedNode = tempContainer.firstChild;
          fragment.appendChild(lastInsertedNode);
        }

        range.insertNode(fragment);

        // Restore the caret position
        if (lastInsertedNode) {
          const newCaretPosition = document.createRange();
          newCaretPosition.setStartAfter(lastInsertedNode);
          newCaretPosition.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newCaretPosition);
        }

        // Remove the saved caret position span
        savedCaretPosition.remove();

        // Reset the stored range information
        storedRanges = null;
      }
      // Remove the floating window
      removeFloatingWindow(floatingWindow);
    });
  }

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

async function processTextWithOpenAI({ model, apiKey, temperature, maxLength, topP, frequencyPenalty, presencePenalty }, text, selectedPromptType) {
  console.log('calling openai: ' + selectedPromptType + text);
  try {
    const response = await fetch(OPEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: selectedPromptType + text }],
        max_tokens: maxLength,
        temperature,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
      }),
    });

    const data = await response.json(); // Return the generated text
    if (data.error) {
      throw data.error;
    } else {
      console.log('openai response: ', data);
      const result = data.choices[0].message.content;

      // Save the response along with the prompt text and timestamp
      await saveResponse(text, selectedPromptType, result, model, temperature, maxLength, topP, frequencyPenalty, presencePenalty);
      return result;
    }
  } catch (error) {
    // console.error('Error calling OpenAI:', error);
    throw error;
  }
}

// Content script code
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getHistory') {
    (async () => {
      try {
        const historyHtml = await displayHistory();
        sendResponse({ success: true, historyHtml });
      } catch (error) {
        // console.error('Error displaying history:', error);
        sendResponse({ success: false, error });
      }
    })();

    // This is important to keep the message channel open for async sendResponse
    return true;
  }

  if (request.type === 'contextMenu') {
    (async () => {
      const selection = window.getSelection();
      storedRanges = [];
      for (let i = 0; i < selection.rangeCount; i++) {
        storedRanges.push(selection.getRangeAt(i));
      }
      try {
        const settings = await loadSettings();
        // console.log('settings: ' + JSON.stringify(settings));
        const result = await processTextWithOpenAI(settings, request.selectionText, request.menuItemId);
        promptType = request.menuItemId;
        const formattedResult = formatResponseToHtml(result);
        const floatingWindow = createFloatingWindow(formattedResult);
        const { x, y } = storedRanges[0].getBoundingClientRect();
        positionFloatingWindow(floatingWindow, x, y + 25);
      } catch (error) {
        if (typeof error === 'object') {
          error = JSON.stringify(error);
        }
        const floatingWindow = createFloatingWindow(error, true);
        const { x, y } = storedRanges[0].getBoundingClientRect();
        positionFloatingWindow(floatingWindow, x, y + 25);
      }
    })();
  }
});
