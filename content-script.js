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
            var div = document.createElement("div");
            div.style.borderRadius = "4px";
            div.style.letterSpacing = "normal";
            div.style.boxSizing = "border-box";
            div.style.display = "block";
            div.style.zIndex = "9000000000000000000";
            div.style.position = "fixed";
            div.style.visibility = "visible";
            div.style.opacity = "1";
            div.style.top = "10px";
            div.style.right = "10px";
            div.style.width = "379px";
            div.style.height = "104px";
            div.style.backgroundColor = "rgb(163, 104, 255)";
            div.style.backgroundSize = "379px 104px";
            div.style.boxShadow = "rgba(0, 0, 0, 0.25) 0px 1px 2px 0px";
            div.style.padding = "25px";
            div.style.backgroundImage = "url('')";

            var close = document.createElement("div");
            close.style.position = "absolute";
            close.style.width = "12px";
            close.style.height = "12px";
            close.style.top = "8px";
            close.style.right = "8px";
            close.style.backgroundSize = "12px 12px";
            close.style.cursor = "pointer";
            close.style.backgroundImage = "url('https://image.flaticon.com/icons/png/512/53/53804.png')";
            close.onclick = function (){
                this.parentNode.style.display = "none";
            }

            var button = document.createElement('button');
            button.style.letterSpacing = "normal";
            button.style.display = "inline-block";
            button.style.verticalAlign = "middle";
            button.style.fontStyle = "normal";
            button.style.fontWeight = "normal";
            button.style.fontVariantLigatures = "none";
            button.style.position = "absolute";
            button.style.width = "100%";
            button.style.top = "50%";
            button.style.left = "50%";
            button.style.transform = "translate(-50%, -50%)";
            button.style.margin = "0px";
            button.style.lineHeight = "normal";
            button.style.fontSize = "13px";
            button.style.fontFamily = "TTNorms-Bold";
            button.textContent = "Activate";
            button.onclick = function() {
                //this.parentNode.style.display = "none";
                chrome.runtime.sendMessage({name: "notificationClicked"});
            }

            //TODO: look at lolli source code, make it better

            document.body.appendChild(div);
            div.appendChild(close);
            div.appendChild(button);

        }
    }
}

window.onload = function () {
    showNotification();
};