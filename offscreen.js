// This file handles audio playback in the offscreen document

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'play-sound') {
    playSound();
  }
});

function playSound() {
  const audio = document.createElement('audio');
  document.body.appendChild(audio);
  audio.autoplay = true;
  audio.src = chrome.runtime.getURL('assets/tada.mp3');
  audio.play();
}