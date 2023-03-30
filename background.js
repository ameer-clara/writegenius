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

  // Add separator
  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'separator',
    type: 'separator',
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
    id: 'continue',
    title: 'Continue Prompt',
    contexts: ['selection'],
  });
  chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
    console.log('customContextMenuItems', customContextMenuItems);
    if (customContextMenuItems) {
      createCustomContextMenuItems(customContextMenuItems);
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  info.type = 'contextMenu';
  chrome.tabs.sendMessage(tabs.id, info);
});

function createCustomContextMenuItems(items) {
  items.forEach(({ id, parentId, title, position }) => {
    chrome.contextMenus.create({
      id: id,
      parentId: parentId,
      title: title,
      contexts: ['selection'],
    });
  });
}

function createCustomContextMenuItem({ id, parentId, title, position }) {
  chrome.contextMenus.create({
    id: id,
    parentId: parentId,
    title: title,
    contexts: ['selection'],
  });
}

function compareById(obj1, obj2) {
  return obj1.id === obj2.id;
}

function getFirstDiff(array1, array2) {
  return array2.find((item2) => !array1.some((item1) => compareById(item1, item2)));
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  console.log('onChanged', changes, areaName);
  if (areaName === 'sync' && changes.customContextMenuItems) {
    let item = {};
    const newValues = changes.customContextMenuItems.newValue;
    const oldValues = changes.customContextMenuItems.oldValue;
    if (newValues.length > oldValues.length) {
      // add item
      item = newValues[newValues.length - 1];
      createCustomContextMenuItem(item);
    } else {
      // remove item
      item = getFirstDiff(newValues, oldValues);
      chrome.contextMenus.remove(item.id);
    }
  }
});
