// Store original alert for debugging if needed
window._originalAlert = window.alert;

// Replace alert with function that sends notification
window.alert = function(message) {
    console.log('Alert intercepted:', message);

    // Send message to content script using postMessage
    window.postMessage({
        source: 'srt-macro-alert-override',
        type: 'showNotification',
        title: 'SRT Page Message',
        message: message
    }, '*');

    return undefined;
};
