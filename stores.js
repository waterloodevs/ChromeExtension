chrome.storage.local.get(['stores'], function (result) {
    let stores = result['stores'];
    document.getElementById("featured-stores").textContent = stores;
});

