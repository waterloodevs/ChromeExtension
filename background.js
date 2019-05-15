// TODO(DEVELOPER): Change the values below using values from the initialization snippet: Firebase Console > Overview > Add Firebase to your web app.
// Initialize Firebase
var config = {
    apiKey: "AIzaSyD8BV1qrn_vgin_DlxfIdVsdmk8FPnqmeY",
    authDomain: "kino-extension.firebaseapp.com",
    databaseURL: "https://kino-extension.firebaseio.com",
    projectId: "kino-extension",
    storageBucket: "kino-extension.appspot.com",
    messagingSenderId: "883319920768"
};
firebase.initializeApp(config);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

const BASE_URL = 'http://12fe9075.ngrok.io';
const FCM_TOKEN_ROUTE = '/update_fcm_token';
const STORES_ROUTE = '/stores';
const AFFILIATE_LINK_ROUTE = '/affiliate_link';

function getIdToken() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['token'], function(result) {
            if (typeof result.token !== 'undefined'){
                resolve(result.token);
            } else {
                reject(Error('getIdToken'));
            }
        });
    });
}

async function fetchStoresFromServer(){
    console.log('Fetching stores from server...');
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + STORES_ROUTE, {
            method: 'get',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            }
        }).then(function (response) {
            if (response.status !== 200) {
                console.log('Failed response. Status Code: ' + response.status);
                reject(Error('fetchStoresFromServer'));
            } else {
                response.json().then(function(data) {
                    console.log("Fetched stores from server successfully!");
                    const obj = JSON.stringify(data, null, 2);
                    const json = JSON.parse(obj);
                    resolve(json.stores);
                });
            }
        }).catch(function (err) {
            console.log('Fetch Error: ', err);
            reject(Error('fetchStoresFromServer'));
        });
    });
}

async function setStores(){
    const stores = await fetchStoresFromServer();
    chrome.storage.local.set({'stores': stores}, function () {});
}

// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.setBackgroundMessageHandler` handler.
//TODO: does this still fire when browser is closed?
messaging.onMessage(function (payload) {
    const obj = JSON.stringify(payload, null, 2);
    const json = JSON.parse(obj);
    const data = json.data;
    chrome.notifications.create(
        'notificationid',
        {
            type: 'basic',
            iconUrl: 'images/logo.png',
            title: data.title,
            message: data.body
        },
        function(){}
    );
    // If the notification is about fetching the stores list
    if (typeof data.new_stores !== 'undefined'){
        setStores();
    }
});

async function sendFcmTokenToServer(fcmToken){
    console.log('Sending token to server...');
    const idToken = await getIdToken();
    fetch(BASE_URL + FCM_TOKEN_ROUTE, {
        method: 'post',
        headers: {
            "Content-type": "application/json",
            "Authorization": "Token " + idToken
        },
        body: JSON.stringify({
            'web_fcm_token': fcmToken
        })
    }).then(function (response) {
        if (response.status !== 201) {
            console.log('Failed response. Status Code: ' + response.status);
        } else {
            console.log("Sent fcm token to server succesfully!")
        }
    }).catch(function (err) {
        console.log('Fetch Error: ', err);
    });
}

// Called when the fcm token is refreshed
messaging.onTokenRefresh(function() {
    messaging.getToken().then(function(refreshedToken) {
        console.log('Token refreshed.');
        const user = firebase.auth().currentUser;
        // This may get called when the token is deleted upon logging out,
        // so we check to see if the user is logged in
        if (user){
            sendFcmTokenToServer(refreshedToken);
        }
    }).catch(function(err) {
        console.log('Unable to retrieve refreshed token ', err);
    });
});

async function fetchAffiliateLink(host){
    console.log('Fetching affiliate link from server...');
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + AFFILIATE_LINK_ROUTE, {
            method: 'GET',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            }
        }).then(function (response) {
            if (response.status !== 200) {
                console.log('Failed response. Status Code: ' + response.status);
                reject(Error('fetchAffiliateLink'));
            } else {
                response.json().then(function(data) {
                    console.log("Fetched stores from server successfully!");
                    const obj = JSON.stringify(data, null, 2);
                    const json = JSON.parse(obj);
                    resolve(json.url);
                });
            }
        }).catch(function (err) {
            console.log('Fetch Error: ', err);
            reject(Error('fetchAffiliateLink'));
        });
    });
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.type === 'notificationClicked') {
            const user = firebase.auth().currentUser;
            if (user) {
                fetchAffiliateLink(request.url)
                    .then(function(result){
                        sendResponse({'status': 'success', 'message': result});
                    }).catch(function (err){
                        sendResponse({'status': 'failed', 'message': "Unable to fetch affiliate link"});
                });
            } else {
                //TODO: show login banner
                sendResponse({'status': 'failed', 'message': "login"});
            }
            return true;
        }
    }
        //
        //         // when banner clicked, get api call for affiliate url
        //         // Show activated page briefly
        //         // Redirect to url page
        //         var url = apiRoot + '/url';
        //         user.getIdToken().then(function (idToken) {
        //             fetch(url, {
        //                 method: 'get',
        //                 headers: {
        //                     "Content-type": "application/json",
        //                     "Authorization": "Token " + idToken
        //                 }
        //             }).then(function (response) {
        //                 if (response.status !== 200) {
        //                     console.log('Looks like there was a problem. Status Code: ' + response.status);
        //                     throw "Request to fetch affiliate link failed";
        //                 }
        //                 // Examine the url in the response
        //                 response.json().then(function (data) {
        //                     // redirect to new url
        //                     chrome.tabs.update(sender.tab.id, {url: data.url}, function(){
        //                         chrome.tabs.onUpdated.addListener(notificationActivated(request.url));
        //                     });
        //                 });
        //             }).catch(function (err) {
        //                 console.log('Fetch Error :-S', err);
        //                 throw "Unable to fetch affiliate link";
        //             });
        //         }).catch(function (error) {
        //             console.log('Unable to get idToken of current user', error)
        //             throw "Unable to get idToken of current user";
        //         });
        //     } else {
        //         // when banner clicked, open popup for login
        //         // after login, the popup home tab will show the details of the affiliate
        //         // website you are on along with the activate button if not already activated
        //
        //     }
        // }
);

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function init() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {
        console.log('User state change detected from the Background script of the Chrome Extension:', user);
    });
}

window.onload = function () {
    init();
};