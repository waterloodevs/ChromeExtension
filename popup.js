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

// Retrieve Firebase Messaging object.
const messaging = firebase.messaging();

// Add the public key generated from the console here.
messaging.usePublicVapidKey('BJRkoCi2Qzx5jYe_qxL1hD2OkWAibd9xxxrRHz6Sn2IhUR2r1wNXK_YIBwy9GsQ58tPwpuI4wQVQhxZIvgRaXuU');


function requestPermission() {
    console.log('Requesting permission...');
    messaging.requestPermission().then(function() {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
    }).catch(function(err) {
      console.log('Unable to get permission to notify.', err);
    });
}

// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function sendFcmTokenToServer(user) {
    requestPermission();
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    messaging.getToken().then(function(currentToken) {
        if (currentToken) {
            console.log('Sending token to server...');
            var url = apiRoot + '/update_fcm_token';
            user.getIdToken().then(function(idToken) {
                fetch(url, {
                    method: 'post',
                    headers: {
                        "Content-type": "application/json",
                        "Authorization": "Token " + idToken
                    },
                    body: JSON.stringify({
                        'fcm_token': currentToken
                    })
                })
                .then(function(response) {
                    if (response.status !== 201) {
                        console.log('Looks like there was a problem. Status Code: ' + response.status);
                        throw "Problem sending FCMToken to server";
                    }
                })
                .catch(function(err) {
                    console.log('Fetch Error :-S', err);
                    throw "Problem sending user to server";
                });
            }).catch(function(error) {
               console.log('Unable to get idToken of current user', error);
               throw 'Unable to get idToken of current user';
            });
        } else {
            // Show permission request.
            console.log('No Instance ID token available. Request permission to generate one.');
            throw 'No Instance ID token available. Request permission to generate one';
        }
    }).catch(function(err) {
        console.log('An error occurred while retrieving token. ', err);
    });
}

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

const apiRoot = 'http://127.0.0.1:5000'

function sendUserToServer(user) {
    var url = apiRoot + '/register';
    user.getIdToken().then(function(idToken) {
        fetch(url, {
        method: 'post',
        headers: {
            "Content-type": "application/json",
            "Authorization": "Token " + idToken
        }})
        .then(function(response) {
            if (response.status !== 201) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                throw 'Problem sending user to server';
            }
        })
        .catch(function(err) {
            console.log('Fetch Error :-S', err);
            throw 'Problem sending user to server';
        });
    }).catch(function(error) {
       console.log('Unable to get idToken of current user', error);
       throw 'Unable to get idToken of current user';
    });
}

function updateDataFromServer(user) {
    var url = apiRoot + '/user_data';
    user.getIdToken().then(function(idToken) {
        fetch(url, {
        method: 'get',
        headers: {
            "Content-type": "application/json",
            "Authorization": "Token " + idToken
        }})
        .then(function(response) {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                throw 'Unable to fetch data from server';
            }
            // Examine the text in the response
            response.json().then(function(data) {
                console.log(data);
                var stores = data['stores'];
                var balance = data['balance'];
                var transactions = data['transactions'];
                chrome.storage.local.set({'stores': stores, 'balance': balance, 'transactions': transactions}, function () {
                });
            });
        }
        )
        .catch(function(err) {
            console.log('Fetch Error :-S', err);
            throw 'Unable to fetch data from server';
        });
    }).catch(function(error) {
       console.log('Unable to get idToken of current user', error);
       throw 'Unable to get idToken of current user';
    });
}


/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
//function initApp() {
//    // Listening for auth state changes.
//    // [START authstatelistener]
//    firebase.auth().onAuthStateChanged(function (user) {
//        alert('hey');
//        // [START_EXCLUDE silent]
//        document.getElementById('quickstart-verify-email').disabled = true;
//        // [END_EXCLUDE]
//        if (user) {
//            // User is signed in.
//            var displayName = user.displayName;
//            //var email = user.email;
//            var emailVerified = user.emailVerified;
//            var photoURL = user.photoURL;
//            var isAnonymous = user.isAnonymous;
//            //var uid = user.uid;
//            var providerData = user.providerData;
//            // [START_EXCLUDE]
//            document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
//            document.getElementById('quickstart-sign-in').textContent = 'Sign out';
//            document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
//            if (!emailVerified) {
//                document.getElementById('quickstart-verify-email').disabled = false;
//            }
//            // [END_EXCLUDE]
//
//            window.location.href = 'example.html';
//
//        } else {
//            // User is signed out.
//            // [START_EXCLUDE]
//            document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
//            document.getElementById('quickstart-sign-in').textContent = 'Sign in';
//            document.getElementById('quickstart-account-details').textContent = 'null';
//            // [END_EXCLUDE]
//        }
//        // [START_EXCLUDE silent]
//        document.getElementById('quickstart-sign-in').disabled = false;
//        // [END_EXCLUDE]
//    });
//    // [END authstatelistener]
//
//    document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
//    document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
//    document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
//    document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
//}
function Stores(){
    chrome.storage.local.get(['stores'], function (result) {
        var names = Array();
        var stores = result['stores'];
        var length = stores.length;
        for (var i = 0; i < length; i++) {
            var name = stores[i].name;
            names.push(name);
        }
        document.getElementById("featured-stores").textContent = names;
    });
}

function Wallet(){
    chrome.storage.local.get(['balance'], function (result) {
        let balance = result['balance'];
        document.getElementById('balance').textContent = balance;
    });
    // Get transactions as well
}

function Settings(){

    // Set the user details
    document.getElementById("userEmail").textContent = firebase.auth().currentUser.email;
    // Hide the nav bar
    tab = document.getElementsByClassName("tab");
    tab[0].style.display = "none";

    // Make back button visible and add listener
    document.getElementById("settings-left").style.visibility = "visible";
    document.getElementById("settings-left").addEventListener('click', function(){
        // Send back to home page
        openTab("HomeButton", "Home");
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.display = "block";
        }, false);

    // Add listener for the logout button
    document.getElementById("LogoutButton").addEventListener('click', function(){
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.display = "block";
        // sign out the user
        firebase.auth().signOut();
    }, false);
}

function openTab(buttonId, tabId) {
  // Declare all variables
  var i, tabcontent, tablinks;

  //Call the necessary javascript functions for the tab about to be shown
  if (tabId == 'Stores'){
        Stores();
  } else if (tabId == 'Wallet'){
        Wallet();
  } else if (tabId == 'Home'){

  } else if (tabId == 'Settings'){
      Settings();
  }

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Replace the title text
  var title = document.getElementById("title").firstChild;
  title.textContent = tabId;

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabId).style.display = "block";
  document.getElementById(buttonId).className += " active";
}


function mainPage(){
    //Show the main page
    document.getElementById("mainPage").style.display = "block";
    // Set listeners to all the buttons on the main page
    document.getElementById("HomeButton").addEventListener('click', function(){ openTab("HomeButton", "Home"); }, false);
    document.getElementById("StoresButton").addEventListener('click', function(){ openTab("StoresButton", "Stores"); }, false);
    document.getElementById("WalletButton").addEventListener('click', function(){ openTab("WalletButton", "Wallet"); }, false);
    document.getElementById("settings-right").addEventListener('click', function(){ openTab("settings-right", "Settings"); }, false);

    document.getElementById("stores-text-link").addEventListener('click', function(){ openTab("stores-text-link", "Stores"); }, false);

    // Click on default tab
    document.getElementById("HomeButton").click();
}


/**
 * Handles the sign in button press.
 */
function toggleSignIn() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    if (email.length < 4) {
        alert('Please enter an email address.');
        return;
    }
    if (password.length < 4) {
        alert('Please enter a password.');
        return;
    }

    // TODO, no need for listeners for signin and signout, modify the code below to use
    //  .then before .catch -> have only one listener in initapp

    // Sign in with email and pass.
    // [START authwithemail]
    firebase.auth().signInWithEmailAndPassword(email, password).then(function(){
        // When a user logs in -
        // Get list of featured stores, balance and transactions from backend
        // Store in chrome storage
        var user = firebase.auth().currentUser;
        // Send FCM token to backend in case it was
        // refreshed while the user was not logged in
        sendFcmTokenToServer(user);
        // Get and store data into local storage in case the
        // client was notified when the user was not logged in
        updateDataFromServer(user);

        // If successfully signed in, auth state change listener in initApp() will be called.
        //window.location.href = 'example.html';

    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;1
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode === 'auth/wrong-password') {
            alert('Wrong password.');
        } else {
            alert(errorMessage);
        }
        console.log(error);
        document.getElementById('quickstart-sign-in').disabled = false;
        // [END_EXCLUDE]
    });
}

/**
 * Handles the sign up button press.
 */
function handleSignUp() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
    if (email.length < 4) {
        alert('Please enter an email address.');
        return;
    }
    if (password.length < 4) {
        alert('Please enter a password.');
        return;
    }

    // Sign in with email and pass.
    // [START createwithemail]
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function () {
        var user = firebase.auth().currentUser;
        // Send new user details to backend
        sendUserToServer(user);
        // Send FCM token to backend
        sendFcmTokenToServer(user);
        // Get and store data into local storage
        updateDataFromServer(user);
        // If successfully signed up, auth state change listener in initApp() will be called.
        //window.location.href = 'example.html';
    })
    .catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/weak-password') {
            alert('The password is too weak.');
        } else {
            alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
    });
    // [END createwithemail]
}

/**
 * Sends an email verification to the user.
 */
function sendEmailVerification() {
    // [START sendemailverification]
    firebase.auth().currentUser.sendEmailVerification().then(function () {
        // Email Verification sent!
        // [START_EXCLUDE]
        alert('Email Verification Sent!');
        // [END_EXCLUDE]
    });
    // [END sendemailverification]
}

function sendPasswordReset() {
    var email = document.getElementById('email').value;
    // [START sendpasswordemail]
    firebase.auth().sendPasswordResetEmail(email).then(function () {
        // Password Reset Email Sent!
        // [START_EXCLUDE]
        alert('Password Reset Email Sent!');
        // [END_EXCLUDE]
    }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // [START_EXCLUDE]
        if (errorCode == 'auth/invalid-email') {
            alert(errorMessage);
        } else if (errorCode == 'auth/user-not-found') {
            alert(errorMessage);
        }
        console.log(error);
        // [END_EXCLUDE]
    });
    // [END sendpasswordemail];
}


function loginPage(){
    // Show the login page
    document.getElementById('loginPage').style.display = "block";
    // Set listeners to all the buttons on the login page.
    document.getElementById('signInButton').addEventListener('click', toggleSignIn, false);
    document.getElementById('signUpButton').addEventListener('click', handleSignUp, false);
    document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
    document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
}


function initApp(){
    // Gets called when popup opens, and while the popup is open,
    // when the user signs in or signs out.
    firebase.auth().onAuthStateChanged(function (user){
        // Hide the login page and the main page
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("mainPage").style.display = "none";
        if (user) {
            mainPage();
        } else {
            loginPage();
        }
    });
}

window.onload = function () {
    initApp();
};