const OPEN_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

let storedRanges = null;

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
        ${response.promptType.length > 0 ? `<p><strong>Prompt Type:</strong> ${response.promptType}</p>` : ''}
                          <p><strong>Prompt:</strong> ${response.prompt}</p>
                          <p><strong>Response:</strong> ${response.response}</p>
                          <p><strong>Timestamp:</strong> ${timestamp}</p>
                          <p><strong>Model:</strong> ${response.model} | <strong>Temperature:</strong> ${response.temperature} | <strong>Max Tokens:</strong> ${response.maxLength} | <strong>Top P:</strong> ${
          response.topP
        } | <strong>Frequency penalty:</strong> ${response.frequencyPenalty} | <strong>Presence penalty:</strong> ${response.presencePenalty} </p>
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
      db.createObjectStore('settings', { keyPath: 'key' });
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

async function saveResponse(promptText, selectedPromptType, responseText, model, temperature, maxLength, topP, frequencyPenalty, presencePenalty, usage, messages) {
  const db = await openDatabase();
  // TODO - disabled for now, investigate, one of the specified object stores was not found.
  // Update the total usage cost
  // const usageCost = (usage.total_tokens / 1000) * 0.002;
  // const newTotalUsageCost = (await getTotalUsageCost()) + usageCost;
  // await updateTotalUsageCost(newTotalUsageCost);

  return new Promise((resolve, reject) => {
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
      usage: usage,
      messages: messages,
      timestamp: new Date(),
    };

    const saveRequest = responsesStore.add(responseObj);
    saveRequest.onsuccess = () => {
      resolve(saveRequest.result);
    };
    saveRequest.onerror = () => {
      reject(saveRequest.error);
    };
  });
}

async function getLastConversation() {
  const db = await openDatabase();
  const transaction = db.transaction('responses', 'readonly');
  const responsesStore = transaction.objectStore('responses');
  const getRequest = responsesStore.openCursor(null, 'prev');

  return new Promise((resolve, reject) => {
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        resolve(getRequest.result.value);
      } else {
        resolve(null);
      }
    };
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

async function getTotalUsageCost() {
  const db = await openDatabase();
  const transaction = db.transaction('settings', 'readonly');
  const settingsStore = transaction.objectStore('settings');
  const getRequest = settingsStore.get('totalUsageCost');

  return new Promise((resolve, reject) => {
    getRequest.onsuccess = () => {
      resolve(getRequest.result ? getRequest.result.value : 0);
    };

    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

async function updateTotalUsageCost(newTotalUsageCost) {
  const db = await openDatabase();
  const transaction = db.transaction('settings', 'readwrite');
  const settingsStore = transaction.objectStore('settings');
  const putRequest = settingsStore.put({ key: 'totalUsageCost', value: newTotalUsageCost });

  return new Promise((resolve, reject) => {
    putRequest.onsuccess = () => {
      resolve(putRequest.result);
    };
    putRequest.onerror = () => {
      reject(putRequest.error);
    };
  });
}

function createFloatingWindow(content, error = false, loading = false) {
  const floatingWindow = document.createElement('div');
  floatingWindow.classList.add('openai-floating-window');
  floatingWindow.innerHTML = `
  <div class="openai-floating-header">
    <span>WriteGenius</span>
    <span class="openai-timer"></span>
    <div class="openai-busy-message"></div>
    <span class="openai-floating-close">x</span>
  </div>
  <div class="openai-floating-body">
  ${loading ? '<div class="openai-loading-icon">Loading...</div>' : ''}
    <div class="openai-generated-text">${content}</div>
  </div>
  <hr>
  <span>${error ? '' : "<button id='openai-floating-replace'>Replace Selected Text</button>"}
  ${loading ? "<button id='openai-floating-cancel'>Cancel</button>" : ''}
  `;

  document.body.appendChild(floatingWindow);

  if (loading) {
    const cancelButton = floatingWindow.querySelector('#openai-floating-cancel');
    cancelButton.addEventListener('click', () => {
      removeFloatingWindow(floatingWindow);
    });
  }

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
      chrome.runtime.sendMessage({
        type: 'trackEvent',
        eventName: 'Replace Text',
      });

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

async function showConfirmDialog(tokensUsed, costUsed, tokensEstimate, costEstimate) {
  const message = `
    Tokens used so far: ${tokensUsed}
    Cost so far: $${costUsed.toFixed(4)}

    Estimated new tokens: ${tokensEstimate}
    Estimated new cost: $${costEstimate.toFixed(4)}

    Do you want to continue the conversation?
  `;

  return new Promise((resolve) => {
    const userResponse = confirm(message);
    resolve(userResponse);
  });
}

async function processTextWithOpenAI({ model, apiKey, temperature, maxLength, topP, frequencyPenalty, presencePenalty, continueConversation }, text, selectedPromptType) {
  const startTime = performance.now();

  console.log('calling openai: ' + selectedPromptType + text);
  try {
    let messages = [{ role: 'user', content: selectedPromptType + text }];

    if (continueConversation) {
      const lastConversation = await getLastConversation();
      console.log('lastConversation: ', lastConversation);
      messages = lastConversation ? [...lastConversation.messages, ...messages] : messages;
    }

    const response = await fetch(OPEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxLength,
        temperature,
        top_p: topP,
        presence_penalty: presencePenalty,
        frequency_penalty: frequencyPenalty,
      }),
    });

    const endTime = performance.now();
    const elapsedTime = endTime - startTime;

    const data = await response.json(); // Return the generated text
    if (data.error) {
      throw data.error;
    } else {
      console.log('openai response: ', data);
      const result = data.choices[0].message.content;
      const usage = data.usage;
      messages.push({ role: 'assistant', content: result });

      chrome.runtime.sendMessage({
        type: 'trackEvent',
        eventName: 'API success',
        eventProperties: {
          model,
          temperature,
          maxLength,
          topP,
          frequencyPenalty,
          presencePenalty,
          elapsedTime,
          usage,
        },
      });

      // Save the response along with the prompt text, usage, and timestamp
      await saveResponse(text, selectedPromptType, result, model, temperature, maxLength, topP, frequencyPenalty, presencePenalty, usage, messages);
      return result;
    }
  } catch (error) {
    chrome.runtime.sendMessage({
      type: 'trackEvent',
      eventName: 'API fail',
      eventProperties: {
        error,
        model,
        temperature,
        maxLength,
        topP,
        frequencyPenalty,
        presencePenalty,
      },
    });
    throw error;
  }
}

function estimateTokenUsage(conversation) {
  const promptTokens = conversation.reduce((acc, message) => {
    return acc + message.content.length;
  }, 0);

  // Estimate completion tokens based on the length of the user's last message
  const completionTokens = Math.floor(conversation[conversation.length - 1].content.length * 1.5);

  const totalTokens = promptTokens + completionTokens;

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
  };
}

// Content script code
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getHistory') {
    (async () => {
      try {
        chrome.runtime.sendMessage({
          type: 'trackEvent',
          eventName: 'View History',
        });

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
      const settings = await loadSettings();
      if (settings.apiKey === '') {
        alert('Please set your OpenAI API key by clicking on the WriteGenius icon and the settings button (top right of your browser)');

        chrome.runtime.sendMessage({
          type: 'trackEvent',
          eventName: 'API key not set',
        });

        return;
      }
      const continueConversation = request.menuItemId === 'continue';
      const selection = window.getSelection();
      storedRanges = [];

      if (selection.rangeCount > 0) {
        for (let i = 0; i < selection.rangeCount; i++) {
          storedRanges.push(selection.getRangeAt(i));
        }
      } else {
        // Fallback to create a range from the selected text
        const textarea = document.createElement('textarea');
        textarea.value = request.selectionText;
        document.body.appendChild(textarea);
        textarea.select();
        const range = document.createRange();
        range.selectNodeContents(textarea);
        storedRanges.push(range);
        document.body.removeChild(textarea);
      }
      // Show the loading icon
      const loadingWindow = createFloatingWindow('', true, true);
      const { x, y } = storedRanges[0].getBoundingClientRect();
      positionFloatingWindow(loadingWindow, x, y + 25);

      // Timer and message elements
      const timerElement = loadingWindow.querySelector('.openai-timer');
      const busyMessageElement = loadingWindow.querySelector('.openai-busy-message');

      let timerSeconds = 0;
      const updateTimer = () => {
        timerElement.textContent = `${timerSeconds}s`;
        if (timerSeconds >= 5) {
          timerElement.style.color = 'red';
          busyMessageElement.textContent = 'OpenAI servers busy... please wait';
        }
        timerSeconds++;
      };

      const timerInterval = setInterval(updateTimer, 1000);

      const cancelRequest = new Promise((_, reject) => {
        // Add a click event listener to the cancel button to cancel the fetch request
        const cancelButton = loadingWindow.querySelector('#openai-floating-cancel');
        cancelButton.addEventListener('click', () => {
          clearInterval(timerInterval);
          reject(new Error('Cancelled'));
        });
      });

      try {
        const result = await Promise.race([processTextWithOpenAI({ ...settings, continueConversation }, request.selectionText, continueConversation ? '' : request.menuItemId), cancelRequest]);
        clearInterval(timerInterval);
        removeFloatingWindow(loadingWindow); // Remove the loading window
        const formattedResult = formatResponseToHtml(result);
        const floatingWindow = createFloatingWindow(formattedResult);
        const { x, y } = storedRanges[0].getBoundingClientRect();
        positionFloatingWindow(floatingWindow, x, y + 25);
      } catch (error) {
        // console.error('Error:', error);
        clearInterval(timerInterval);
        if (error.message === 'Cancelled') {
          console.log('Fetch request cancelled');
        } else {
          if (typeof error === 'object') {
            error = JSON.stringify(error);
          }
          removeFloatingWindow(loadingWindow); // Remove the loading window
          const errorWindow = createFloatingWindow('Error: ' + error, true);
          positionFloatingWindow(errorWindow, x, y + 25);
        }
      }

      // Add a click event listener to the cancel button to abort the fetch request
      const cancelButton = loadingWindow.querySelector('#openai-floating-cancel');
      cancelButton.addEventListener('click', () => {
        // Dispatch the custom abortRequest event
        loadingWindow.dispatchEvent(new CustomEvent('abortRequest'));
        removeFloatingWindow(loadingWindow);
      });
    })();
  }
});
