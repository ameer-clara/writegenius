chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'rephrase-with-chatgpt',
    title: 'Reprhase with ChatGPT',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  console.log('context menu clicked');
  console.log(info);
  console.log(tabs);
  chrome.tabs.sendMessage(tabs.id, info.selectionText);
});
