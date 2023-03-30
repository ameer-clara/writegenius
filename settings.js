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

function createCustomContextMenuItem(id, parentId, title, position) {
  return new Promise((resolve) => {
    chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
      customContextMenuItems = customContextMenuItems || [];
      customContextMenuItems.push({ id, parentId, title, position });
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
    if (customContextMenuItems) {
      const tbody = document.getElementById('context-menu-items-tbody');
      tbody.innerHTML = '';

      customContextMenuItems.forEach(({ id, parentId, title, position }, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${id}</td>
            <td>${parentId || '-'}</td>
            <td>${title}</td>
            <td>${position || '-'}</td>
            <td><button class="delete-menu-item" data-index="${index}">-</button></td> <!-- Add this line -->
          `;
        tbody.appendChild(tr);
      });
    }
  });
}

document.getElementById('create-menu-item').addEventListener('click', () => {
  const id = document.getElementById('menu-id').value;
  const parentId = document.getElementById('menu-parent-id').value || null;
  const title = document.getElementById('menu-title').value;
  const position = parseInt(document.getElementById('menu-position').value, 10) || null;

  createCustomContextMenuItem(id, parentId, title, position).then(() => {
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
        alert('Context menu item deleted successfully.');
        loadExistingContextMenuItems();
      });
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadExistingContextMenuItems();
});
