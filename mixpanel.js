(function () {
  const MIXPANEL_TOKEN = 'e09629364fb59356004f6e6720e50907';
  const API_SECRET = 'acd8090c9602480b661faac42614532b';

  function generateClientId() {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    return array.join('.');
  }

  function getClientId() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('aClientId', (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (data.aClientId) {
          resolve(data.aClientId);
        } else {
          const newClientId = generateClientId();
          chrome.storage.local.set({ aClientId: newClientId }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(newClientId);
            }
          });
        }
      });
    });
  }

  async function sendToMixpanel(event, properties) {
    const data = {
      event: event,
      properties: {
        token: MIXPANEL_TOKEN,
        distinct_id: await getClientId(),
        ...properties,
      },
    };

    const encodedData = btoa(JSON.stringify(data));
    fetch('https://api.mixpanel.com/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'data=' + encodedData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Handle successful response here if needed, e.g., response.json()
      })
      .catch((error) => {
        console.log('Error sending event to Mixpanel:', error);
      });
  }

  function sendToMixpanelBulk(event, properties) {
    const events = [
      {
        event: event,
        properties: {
          time: Math.floor(Date.now() / 1000),
          ...properties,
        },
      },
    ];

    fetch('https://api.mixpanel.com/import?strict=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(API_SECRET + ':'),
      },
      body: JSON.stringify(events),
    });
  }

  self.mixpanel = {
    track: (eventName, eventProperties) => sendToMixpanel(eventName, eventProperties),
    trackBulk: (eventName, eventProperties) => sendToMixpanel(eventName, eventProperties),
  };
})();
