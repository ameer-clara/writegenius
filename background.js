chrome.runtime.onInstalled.addListener(() => {
  // updated context menu
  chrome.contextMenus.create({
    id: 'chrome-chatgpt',
    title: 'WriteGenius',
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
    id: 'rephrase with humor:',
    title: 'Reprhase (funny)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'rephrase professionaly:',
    title: 'Reprhase (professional)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'summarize in one line:',
    title: 'Summarize (one liner)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'summarize in 5 points:',
    title: 'Summarize (5 points)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: '',
    title: 'Prompt',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  info.type = 'contextMenu';
  chrome.tabs.sendMessage(tabs.id, info);
});
