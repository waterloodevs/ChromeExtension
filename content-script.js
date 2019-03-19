function getStores(callback){
    chrome.storage.local.get('stores', function (result) {
        if (typeof result['stores'] == 'undefined') {
            const apiRoot = 'http://127.0.0.1:5000'
            var stores;
            var url = apiRoot + '/stores';
            fetch(url, {
                method: 'get',
                headers: {
                    "Content-type": "application/json"
                }})
                .then(function(response) {
                    if (response.status !== 200) {
                        console.log('Looks like there was a problem. Status Code: ' + response.status);
                        throw "Unable to fetch stores";
                    }
                    // Examine the text in the response
                    response.json().then(function(data) {
                        stores = data['stores'];
                        chrome.storage.local.set({'stores': stores}, function () {
                            callback(stores);
                        });
                    });
                })
                .catch(function(err) {
                    console.log('Fetch Error :-S', err);
                    throw "Unable to fetch stores";
                });
        }else{
            callback(result['stores']);
        }
    });
}



function showNotification(host) {
    getStores(function(stores) {
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
                    chrome.runtime.sendMessage({name: "notificationClicked", url: host});
                }

                //TODO: look at lolli source code for styling, make it better

                document.body.appendChild(div);
                div.appendChild(close);
                div.appendChild(button);

            }
        }
    }).fail(function(err){
        throw "Could not fetch stores";
    });
}

function init(){
    chrome.storage.local.get('activated', function (result) {
        var urls = result['activated'];
        var host = window.location.host;
        if (urls.includes(host)) {
            alert("already activated");
        } else {
            showNotification(host);
        }
    });
}

window.onload = function () {
    init();
};
