const OPENAI_API_KEY = '';

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

async function processTextWithOpenAI(text) {
  console.log('calling openai: ' + text);
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `rephrase:${text}` }],
    }),
  });

  const data = await response.json();
  console.log('got response: ', data);

  return data.choices[0].message.content; // Return the generated text
}

function processTextWithOpenAI2(text) {
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer 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',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'rephrase: how do i look?' }],
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
}

function getSelectedText() {
  return window.getSelection().toString();
}

// chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
//   if (message.action === 'processSelectedText') {
//     const selectedText = getSelectedText();
//     const result = await processTextWithOpenAI(selectedText);
//     const floatingWindow = createFloatingWindow(result);
//     const { x, y } = window.getSelection().getRangeAt(0).getBoundingClientRect();
//     positionFloatingWindow(floatingWindow, x, y);
//     setTimeout(() => removeFloatingWindow(floatingWindow), 5000);
//   }
// });

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // if (message.action === 'processSelectedText') {
  const selectedText = getSelectedText();
  console.log('from window: ' + selectedText);
  const result = await processTextWithOpenAI(selectedText);
  const floatingWindow = createFloatingWindow(result);
  const { x, y } = window.getSelection().getRangeAt(0).getBoundingClientRect();
  positionFloatingWindow(floatingWindow, x, y + 25);
  setTimeout(() => removeFloatingWindow(floatingWindow), 5000);
  // }
});
