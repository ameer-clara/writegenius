function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => {
      resolve();
    });
  });
}

function loadSettings() {
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
}

document.getElementById('save-settings').addEventListener('click', () => {
  const model = document.getElementById('model').value;
  const apiKey = document.getElementById('api-key').value;
  const temperature = parseFloat(document.getElementById('temperature').value);
  const maxLength = parseInt(document.getElementById('max-length').value, 10);
  const topP = parseFloat(document.getElementById('top-p').value);
  const frequencyPenalty = parseFloat(document.getElementById('frequency-penalty').value);
  const presencePenalty = parseFloat(document.getElementById('presence-penalty').value);

  saveSettings({ model, apiKey, temperature, maxLength, topP, frequencyPenalty, presencePenalty }).then(() => {
    alert('Settings saved successfully.');
  });
});

loadSettings().then((settings) => {
  document.getElementById('model').value = settings.model;
  document.getElementById('api-key').value = settings.apiKey;
  document.getElementById('temperature').value = settings.temperature;
  document.getElementById('temperature-number').value = settings.temperature;
  document.getElementById('max-length').value = settings.maxLength;
  document.getElementById('max-length-number').value = settings.maxLength;
  document.getElementById('top-p').value = settings.topP;
  document.getElementById('top-p-number').value = settings.topP;
  document.getElementById('frequency-penalty').value = settings.frequencyPenalty;
  document.getElementById('frequency-penalty-number').value = settings.frequencyPenalty;
  document.getElementById('presence-penalty').value = settings.presencePenalty;
  document.getElementById('presence-penalty-number').value = settings.presencePenalty;
});

function syncInputValues(rangeInput, numberInput) {
  rangeInput.addEventListener('input', () => {
    numberInput.value = rangeInput.value;
  });

  numberInput.addEventListener('input', () => {
    rangeInput.value = numberInput.value;
  });
}

syncInputValues(document.getElementById('temperature'), document.getElementById('temperature-number'));
syncInputValues(document.getElementById('max-length'), document.getElementById('max-length-number'));
syncInputValues(document.getElementById('top-p'), document.getElementById('top-p-number'));
syncInputValues(document.getElementById('frequency-penalty'), document.getElementById('frequency-penalty-number'));
syncInputValues(document.getElementById('presence-penalty'), document.getElementById('presence-penalty-number'));
