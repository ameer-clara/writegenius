chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'chrome-chatgpt',
    title: 'ChatGPT',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: '',
    title: 'Prompt',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'rephrase:',
    title: 'Reprhase',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'rephrase with British humor:',
    title: 'Reprhase (funny)',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  chrome.tabs.sendMessage(tabs.id, info);
});
