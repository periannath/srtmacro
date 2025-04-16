var defaultBotToken = 'Set your telegram bot token';
var defaultChatId = 'Set your telegram chat id';

function save_options() {
  const botToken = document.getElementById('bot_token').value;
  const chatId = document.getElementById('chat_id').value;

  // Save to chrome.storage.local
  chrome.storage.local.set({
    'botToken': botToken,
    'chatId': chatId
  });

  // Test the Telegram bot connection
  var url = 'https://api.telegram.org/bot' + botToken + '/sendMessage?chat_id=' + chatId + '&text=' + encodeURI('Bot connected.');

  fetch(url)
    .then(response => {
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 750);
    })
    .catch(error => {
      const status = document.getElementById('status');
      status.textContent = 'Error: Could not connect to Telegram.';
      console.error('Error:', error);
      setTimeout(() => {
        status.textContent = '';
      }, 2000);
    });
}

function restore_options() {
  chrome.storage.local.get(['botToken', 'chatId'], (result) => {
    let botToken = result.botToken;
    let chatId = result.chatId;

    if (!botToken) botToken = defaultBotToken;
    if (!chatId) chatId = defaultChatId;

    document.getElementById('bot_token').value = botToken;
    document.getElementById('chat_id').value = chatId;
  });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
