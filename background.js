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
// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.setBackgroundMessageHandler` handler.
messaging.onMessage(function (payload) {
    console.log('Message received. ', payload);
    var user = firebase.auth().currentUser;
    if (user) {
        updateDataFromServer(user);
    }
});


//TODO: does this still fire when browser is closed?
// Callback fired if Instance ID token is updated.
messaging.onTokenRefresh(function () {
    messaging.getToken().then(function (refreshedToken) {
        console.log('Token refreshed.');
        var user = firebase.auth().currentUser;
        if (user) {
            sendFcmTokenToServer(user);
        }
    }).catch(function (err) {
        console.log('Unable to retrieve refreshed token ', err);
    });
});


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.name == 'notificationClicked') {
            alert('clicked');
            var user = firebase.auth().currentUser;
            if (user) {
                // when banner clicked, get api call for affiliate url
                // Show activated page briefly
                // Redirect to url page
                var url = apiRoot + '/url';
                user.getIdToken().then(function (idToken) {
                    fetch(url, {
                        method: 'get',
                        headers: {
                            "Content-type": "application/json",
                            "Authorization": "Token " + idToken
                        }
                    }).then(function (response) {
                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' + response.status);
                        }
                        // Examine the url in the response
                        response.json().then(function (data) {
                            console.log(data);
                        });
                    }).catch(function (err) {
                        console.log('Fetch Error :-S', err);
                    });
                }).catch(function (error) {
                    console.log('Unable to get idToken of current user', error)
                });
            } else {
                // when banner clicked, open popup for login
                // after login, the popup home tab will show the details of the affiliate
                // website you are on along with the activate button if not already activated

            }
        }
    });

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
function initApp() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {
        console.log('User state change detected from the Background script of the Chrome Extension:', user);
    });
}

window.onload = function () {
    initApp();
};