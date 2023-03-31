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

// event listeners
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
document.getElementById('reset-to-defaults').addEventListener('click', resetToDefaultValues);

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

function resetToDefaultValues() {
  console.log('setting reset to default values');
  saveSettings({
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxLength: 256,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
  }).then(() => {
    // Update input fields to show the default values
    document.getElementById('model').value = 'gpt-3.5-turbo';
    document.getElementById('temperature').value = 0.7;
    document.getElementById('temperature-number').value = 0.7;
    document.getElementById('max-length').value = 256;
    document.getElementById('max-length-number').value = 256;
    document.getElementById('top-p').value = 1;
    document.getElementById('top-p-number').value = 1;
    document.getElementById('frequency-penalty').value = 0;
    document.getElementById('frequency-penalty-number').value = 0;
    document.getElementById('presence-penalty').value = 0;
    document.getElementById('presence-penalty-number').value = 0;
    alert('Settings reset to default values.');
  });
}

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

function createCustomContextMenuItem(id, formattedContent, title) {
  return new Promise((resolve) => {
    chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
      customContextMenuItems = customContextMenuItems || [];
      customContextMenuItems.push({ id, formattedContent, title });
      chrome.storage.sync.set({ customContextMenuItems }, resolve);
    });
  });
}

function deleteCustomContextMenuItem(index) {
  return new Promise((resolve) => {
    chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
      customContextMenuItems.splice(index, 1);
      chrome.storage.sync.set({ customContextMenuItems }, resolve);
    });
  });
}

function loadExistingContextMenuItems() {
  chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
    const tbody = document.getElementById('context-menu-items-tbody');
    tbody.innerHTML = '';

    if (customContextMenuItems && customContextMenuItems.length > 0) {
      document.getElementById('existing-context-menu-items').style.display = 'block';

      customContextMenuItems.forEach(({ formattedContent, title }, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="column-title">${title}</td>
          <td class="column-id">${formattedContent}</td>
          <td class="column-delete"><button class="delete-menu-item" data-index="${index}">Delete</button></td>
          `;
        tbody.appendChild(tr);
      });
    } else {
      document.getElementById('existing-context-menu-items').style.display = 'none';
    }
  });
}

document.getElementById('create-menu-item').addEventListener('click', () => {
  //   let id = document.getElementById('menu-id').value;
  let id = document.getElementById('menu-id').innerText;
  const formattedContent = document.getElementById('menu-id').innerHTML;
  const title = document.getElementById('menu-title').value;

  console.log('prompt: ', id);
  console.log('formatted prompt: ', formattedContent);

  if (!id || !title) {
    alert('Title and Prompt are required fields.');
    return;
  }
  id += ':';

  createCustomContextMenuItem(id, formattedContent, title).then(() => {
    alert('Custom context menu item created successfully.');
    loadExistingContextMenuItems();
  });
});

document.getElementById('context-menu-items-tbody').addEventListener('click', (event) => {
  if (event.target.classList.contains('delete-menu-item')) {
    const index = parseInt(event.target.dataset.index, 10);
    const confirmDelete = confirm('Are you sure you want to delete this context menu item?');

    if (confirmDelete) {
      deleteCustomContextMenuItem(index).then(() => {
        loadExistingContextMenuItems();
      });
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadExistingContextMenuItems();
});
