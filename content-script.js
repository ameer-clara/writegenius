const OPENAI_API_KEY = '';
const OPEN_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

function createFloatingWindow(content) {
  const floatingWindow = document.createElement('div');
  floatingWindow.classList.add('openai-floating-window');
  floatingWindow.innerHTML = content;
  document.body.appendChild(floatingWindow);
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
      max_tokens: 10,
    }),
  });

  const data = await response.json();
  console.log('got response: ', data);
  return data.choices[0].message.content; // Return the generated text
}

chrome.runtime.onMessage.addListener(async (message) => {
  const result = await processTextWithOpenAI(message.selectionText, message.menuItemId);
  const formattedResult = formatResponseToHtml(result);
  const floatingWindow = createFloatingWindow(formattedResult);
  const { x, y } = window.getSelection().getRangeAt(0).getBoundingClientRect();
  positionFloatingWindow(floatingWindow, x, y + 25);
  setTimeout(() => removeFloatingWindow(floatingWindow), 15000);
});
