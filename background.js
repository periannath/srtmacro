// Service worker for SRT Macro extension

// Set up the offscreen document for audio playback
async function setupOffscreenDocument() {
  // Check if we already have an offscreen document open
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  }).catch(() => []);

  if (existingContexts.length > 0) {
    return;
  }

  // Create an offscreen document for audio playback
  await chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'Playing notification sound when ticket is available'
  }).catch(error => console.error(error));
}

// Play sound via the offscreen document
async function playSound() {
  await setupOffscreenDocument();
  chrome.runtime.sendMessage({
    type: 'play-sound'
  });
}

// Send message to Telegram
async function sendMessageToTelegram() {
  // Get bot token and chat ID from storage
  const result = await chrome.storage.local.get(['botToken', 'chatId']);
  const botToken = result.botToken;
  const chatId = result.chatId;

  if (botToken && chatId) {
    const msg = encodeURI('Macro has been stopped. Please check your reservation status.');
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${msg}`;

    try {
      await fetch(url);
    } catch (error) {
      console.error('Error sending Telegram message:', error);
    }
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'playSound') {
    playSound();
    sendMessageToTelegram();
    sendResponse(true);
    return true; // Required for async sendResponse
  }
});