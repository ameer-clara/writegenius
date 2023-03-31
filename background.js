const extensionName = 'WriteGenius';
const extensionSysName = 'Core';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'chrome-chatgpt',
    title: extensionName,
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
    title: 'Continue prompt',
    contexts: ['selection'],
  });

  // Add separator
  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'separator2',
    type: 'separator',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Rephrase:',
    title: 'Reprhase',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Rephrase with wit:',
    title: 'Reprhase (funny)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Rephrase professionaly:',
    title: 'Reprhase (professional)',
    contexts: ['selection'],
  });

  // Add separator
  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'separator3',
    type: 'separator',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Summarize:',
    title: 'Summarize',
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Summarize in one line:',
    title: 'Summarize (one liner)',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    parentId: 'chrome-chatgpt',
    id: 'Summarize in 5 points:',
    title: 'Summarize (5 points)',
    contexts: ['selection'],
  });

  chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
    if (customContextMenuItems && customContextMenuItems.length > 0) {
      updateRootContextMenu(extensionSysName);
      isCustomMenuVisibile(true);
      createCustomContextMenuItems(customContextMenuItems);
    }
  });
});

function updateRootContextMenu(title) {
  chrome.contextMenus.update('chrome-chatgpt', {
    title: title,
  });
}

function isCustomMenuVisibile(isTrue) {
  if (isTrue) {
    updateRootContextMenu(extensionSysName);
    chrome.contextMenus.create({
      id: 'separator0',
      type: 'separator',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'chrome-chatgpt-custom',
      title: 'Custom',
      contexts: ['selection'],
    });
  } else {
    updateRootContextMenu(extensionName);
    chrome.contextMenus.remove('separator0');
    chrome.contextMenus.remove('chrome-chatgpt-custom');
  }
}

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  if (info.menuItemId === 'chrome-chatgpt') {
    return;
  }
  info.type = 'contextMenu';
  chrome.tabs.sendMessage(tabs.id, info);
});

function createCustomContextMenuItems(items) {
  items.forEach(({ id, title }) => {
    chrome.contextMenus.create({
      id: id,
      parentId: 'chrome-chatgpt-custom',
      title: title,
      contexts: ['selection'],
    });
  });
}

function createCustomContextMenuItem({ id, title }) {
  chrome.contextMenus.create({
    id: id,
    parentId: 'chrome-chatgpt-custom',
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
      if (newValues.length === 1) {
        isCustomMenuVisibile(true);
      }
      item = newValues[newValues.length - 1];
      createCustomContextMenuItem(item);
    } else {
      // remove item
      item = getFirstDiff(newValues, oldValues);
      chrome.contextMenus.remove(item.id);
    }

    if (newValues.length === 0) {
      isCustomMenuVisibile(false);
    }
  }
});
