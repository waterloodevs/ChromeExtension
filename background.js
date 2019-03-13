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

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      if (request.name == 'showNotification'){

          //chrome extensions inject custom ui


          notificationId = 'notify'
          chrome.notifications.create('reminder', {
              type: 'basic',
              iconUrl: 'https://img.icons8.com/material/4ac144/256/twitter.png',
              title: 'title',
              message: 'message',
              requireInteraction: true
          });
          chrome.notifications.onClicked.addListener(function () {
              alert('clicked');
              var user = firebase.auth().currentUser;
              if (user) {
                    // when banner clicked, get api call for affiliate url
                    // Show activated page briefly
                    // Redirect to url page
              }else {
                    // when banner clicked, open popup for login
                    // after login, the popup home tab will show the details of the affiliate
                    // website you are on along with the activate button if not already activated
              }
              chrome.notifications.clear(notificationId);
          });
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
  firebase.auth().onAuthStateChanged(function(user) {
    console.log('User state change detected from the Background script of the Chrome Extension:', user);
  });
}

window.onload = function() {
  initApp();
};