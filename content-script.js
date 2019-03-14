function showNotification() {
    var stores = [
        {'name': 'Amazon', 'url': 'amazon.com'},
        {'name': 'Walmart', 'url': 'walmart.com'},
        {'name': 'Ebay', 'url': 'ebay.com'},
        {'name': 'Stackoverflow', 'url': 'stackoverflow.com'}
    ]
    var host = window.location.host;
    var i;
    for (i = 0; i < stores.length; i++) {
        if (host.includes(stores[i].url)) {
            // Show notification banner
          //chrome extensions inject custom ui
            var iframe = document.createElement('iframe');
            iframe.style.background = "green";
            iframe.style.height = "120px";
            iframe.style.width = "300px";
            iframe.style.position = "fixed";
            iframe.style.top = "50px";
            iframe.style.right = "0px";
            iframe.style.zIndex = "9000000000000000000";
            iframe.frameBorder = "none";
            //iframe.src = chrome.extension.getURL("popup.html");

            var button = document.createElement('button');
            var t = document.createTextNode("Activate");
            button.appendChild(t);
            //button.style.background = "black";
            button.style.borderStyle = "none";
            button.style.color = "white";
            //button.style.padding =  "15px 32px";
            //button.style."text-align" = "center";
            //button.style.text-decoration = none;
            //button.style.display =  "inline-block";
            //button.style.fontSize = "16px";
            button.style.height = "20px";
            //button.style.width = "50px";
            button.style.position = "fixed";
            button.style.top = "100px";
            button.style.right = "0px";
            button.style.zIndex = "9000000000000000009";
            //button.frameBorder = "none";
            //button.textContent = 'Activate';
            button.onclick = function() {
                //iframe.style.display = "none";
                //button.style.display = "none";
                chrome.runtime.sendMessage(
                    {name: "notificationClicked"},
                    function(response) {});
            }
            document.body.appendChild(iframe);
            document.body.appendChild(button);

        }
    }
}

window.onload = function () {
    showNotification();
};