function saveAPIKey(apiKey) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ apiKey }, () => {
      resolve();
    });
  });
}

document.getElementById('save-api-key').addEventListener('click', () => {
  const apiKey = document.getElementById('api-key').value;
  saveAPIKey(apiKey).then(() => {
    alert('API Key saved successfully.');
  });
});

document.getElementById('view-history-btn').addEventListener('click', () => {
  const historyContainer = document.getElementById('history-container');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'getHistory' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
        historyContainer.innerHTML = '<p>Error loading history.</p>';
        return;
      }

      if (response && response.success) {
        historyContainer.innerHTML = response.historyHtml;
      } else {
        console.error('Error displaying history:', response ? response.error : 'No response received');
        historyContainer.innerHTML = '<p>Error loading history.</p>';
      }
    });
  });
});
