// popup asks if the current website is a partner,
// has an offer or if the offer has been activated already
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.type === "getOffer") {
            getOffer().then(function(result){
                sendResponse(result);
            });
            return true;
        }
    }
);

async function getOffer(){
    return new Promise(async function(resolve, reject) {
        let host = window.location.host;
        const onPartnered = await onPartneredStore(host);
        const isActivated = await isActivatedAlready(host);
        if (onPartnered && isActivated){
            resolve("Offer is activated.");
        } else if (onPartnered && !isActivated){
            resolve("Offer is not activated. Activate here!");
        } else {
            resolve("You are not currently at a partnered store.");
        }
    });
}

function showLoginNotification() {
    // Show notification banner
    // chrome extensions inject custom ui
    let div = document.createElement("div");
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

    let close = document.createElement("close");
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
    };

    document.body.appendChild(div);
    div.appendChild(close);
}

function showActivateNotification(host) {
    // Show notification banner
    // chrome extensions inject custom ui
    let div = document.createElement("div");
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

    let close = document.createElement("close");
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
    };

    let button = document.createElement('button');
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
        chrome.runtime.sendMessage({type: "notificationClicked", url: host}, function(response){
            handleNotificationClickedResponse(host, response);
        });
        //this.parentNode.style.display = "none";
    };

    //TODO: look at lolli source code for styling, make it better

    document.body.appendChild(div);
    div.appendChild(close);
    div.appendChild(button);
}

function handleNotificationClickedResponse(host, response){
    if (response.status === 'success'){
        // Redirect to affiliate link
        chrome.tabs.update(sender.tab.id, {url: response.message}, function(){});
        // Add link to activated list
        addHostToActivated(host);
    } else if (response.status === 'failed'){
        if (response.message === 'login'){
            //Show banner to login because user is not logged in
            showLoginNotification();
        } else {
            // Could not fetch url, try again
            alert('Could not fetch url');
        }
    } else {
        // Something went wrong, try again
        alert('Something unexpected went wrong');
    }
}

function addHostToActivated(url){
    chrome.storage.local.get('activated', function (result) {
        let urls;
        const date = new Date();
        const expiryDate = date.setDate(date.getDate() + 7);
        if (typeof result['activated'] === 'undefined') {
            urls = {url: expiryDate};
        }else{
            urls = result['activated'];
            urls[url] = expiryDate;
        }
        chrome.storage.local.set({'activated': urls}, function () {});
    });
}

function getStores() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['stores'], function(result) {
            if (typeof result.stores !== 'undefined'){
                resolve(result.stores);
            } else {
                reject(Error('getStores'));
            }
        });
    });
}

function getActivatedStores(){
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['activated'], function(result) {
            if (typeof result.activated !== 'undefined'){
                resolve(result.activated);
            } else {
                reject(Error('getActivatedStores'));
            }
        });
    });
}


function onPartneredStore(host){
    return new Promise(async function(resolve, reject) {
        try {
            let stores = await getStores();
            resolve(stores.includes(host));
        } catch (err){
            //TODO: handle this error
            resolve(false);
        }
    });
}

function isActivatedAlready(host){
    return new Promise(async function(resolve, reject) {
        try {
            const activatedStores = await getActivatedStores();
            // If host in activatedStores and current date is not greater than expiry date
            if (host in activatedStores){
                const expiryDate = activatedStores[host];
                const currentDate = new Date();
                if (currentDate < expiryDate){
                    resolve(true);
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        } catch (err){
            //TODO: handle this error
            resolve(false);
        }
    });
}

async function init(){
    let host = window.location.host;
    const onPartnered = await onPartneredStore(host);
    const isActivated = await isActivatedAlready(host);
    if (onPartnered && !isActivated){
        showActivateNotification(host);
    }
}

window.onload = function () {
    init();
};


