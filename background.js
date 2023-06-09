importScripts('mixpanel.js');

const extensionName = 'WriteGenius';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const location = await getIP();
    mixpanel.track('Install', {
      ip: location.ip,
    });
  }

  chrome.contextMenus.create({
    id: 'chrome-chatgpt',
    title: 'WriteGenius',
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

  chrome.storage.sync.get('customContextMenuItems', ({ customContextMenuItems }) => {
    if (customContextMenuItems && customContextMenuItems.length > 0) {
      isCustomMenuVisibile(true);
      createCustomContextMenuItems(customContextMenuItems);
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tabs) => {
  const e = info.menuItemId.length > 0 ? info.menuItemId : 'Prompt';
  mixpanel.track(e, {
    url: info.pageUrl,
  });

  info.type = 'contextMenu';
  chrome.tabs.sendMessage(tabs.id, info);
});

function isCustomMenuVisibile(isTrue) {
  if (isTrue) {
    chrome.contextMenus.create({
      parentId: 'chrome-chatgpt',
      id: 'separator0',
      type: 'separator',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: 'chrome-chatgpt-ud',
      parentId: 'chrome-chatgpt',
      title: 'User defined prompts',
      enabled: false,
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      parentId: 'chrome-chatgpt',
      id: 'separator00',
      type: 'separator',
      contexts: ['selection'],
    });
  } else {
    chrome.contextMenus.remove('separator0');
    chrome.contextMenus.remove('separator00');
    chrome.contextMenus.remove('chrome-chatgpt-ud');
  }
}

function createCustomContextMenuItems(items) {
  items.forEach(({ id, title }) => {
    chrome.contextMenus.create({
      id: id,
      parentId: 'chrome-chatgpt',
      title: title,
      contexts: ['selection'],
    });
  });
}

function createCustomContextMenuItem({ id, title }) {
  chrome.contextMenus.create({
    id: id,
    parentId: 'chrome-chatgpt',
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'trackEvent') {
    mixpanel.track(request.eventName, request.eventProperties);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  // console.log('changes', changes);
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
      mixpanel.track('Add menu', {
        item,
      });

      createCustomContextMenuItem(item);
    } else {
      // remove item
      item = getFirstDiff(newValues, oldValues);
      chrome.contextMenus.remove(item.id);
      mixpanel.track('Remove menu', {
        item,
      });
    }

    if (newValues.length === 0) {
      isCustomMenuVisibile(false);
    }
  }
});

async function getIP() {
  try {
    const response = await fetch('http://ip-api.com/json/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      ip: data.query,
    };
  } catch (error) {
    console.error('Error fetching location data:', error);
    return {
      ip: '0.0.0.0',
    };
  }
}
