chrome.storage.local.get(['balance'], function (result) {
    let balance = result['balance'];
    document.getElementById('balance').textContent = balance;
});

// Get transactions as well