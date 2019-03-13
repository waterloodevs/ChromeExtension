function showNotification() {
    var stores = [
        {'name': 'Amazon', 'url': 'amazon.com'},
        {'name': 'Walmart', 'url': 'walmart.com'},
        {'name': 'Ebay', 'url': 'ebay.com'}
    ]
    var host = window.location.host;
    var i;
    for (i = 0; i < stores.length; i++) {
        if (host.includes(stores[i].url)) {
            // Show notification banner
            chrome.runtime.sendMessage({name: "showNotification"}, function(response) {});
        }
    }
}

window.onload = function () {
    showNotification();
};