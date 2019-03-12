// document.addEventListener('DOMContentLoaded', function () {
//     let tabButtonsArray = document.getElementsByClassName("tab-button");
//     [].forEach.call(tabButtonsArray, function (button) {
//         button.addEventListener("click", function () {
//             selectTab(button.id);
//         });
//     });
// }, false);
//
//
// function selectTab(id) {
//     // Hide all tabs
//     let i, tabPagesArray;
//     tabPagesArray = document.getElementsByClassName("tab-page");
//     for (i = 0; i < tabPagesArray.length; i++) {
//         tabPagesArray[i].style.display = "none";
//     }
//     //Show the Selected Tab
//     document.getElementById(id + "-page").style.display = "block";
// }


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

function sendUser(user) {
    url = apiRoot + '/register';
    user.getIdToken().then(function(idToken) {
        var idToken = idToken;
        fetch(url, {
        method: 'post',
        headers: {
            "Content-type": "application/json",
            "Authorization": "Token " + idToken
        }})
        .then(function(response) {
            if (response.status !== 201) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }
            // Examine the text in the response
            response.json().then(function(data) {
                console.log(data);
            });
        }
        )
        .catch(function(err) {
            console.log('Fetch Error :-S', err);
        });
    }).catch(function(error) {
       console.log('Unable to get idToken of current user', error)
    });
}


function getData(user) {
    url = apiRoot + '/data';
    user.getIdToken().then(function(idToken) {
        var idToken = idToken;
        fetch(url, {
        method: 'get',
        headers: {
            "Content-type": "application/json",
            "Authorization": "Token " + idToken
        }})
        .then(function(response) {
            if (response.status !== 201) {
                console.log('Looks like there was a problem. Status Code: ' + response.status);
                return;
            }
            // Examine the text in the response
            response.json().then(function(data) {
                console.log(data);
                return data;
            });
        }
        )
        .catch(function(err) {
            console.log('Fetch Error :-S', err);
        });
    }).catch(function(error) {
       console.log('Unable to get idToken of current user', error)
    });
}


/**
 * Handles the sign in button press.
 */
function toggleSignIn() {
    if (firebase.auth().currentUser) {
        // [START signout]
        firebase.auth().signOut();
        // [END signout]
    } else {
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
        // [START authwithemail]
        firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
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
        // [END authwithemail]
    }
    document.getElementById('quickstart-sign-in').disabled = true;
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

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // Send new user details to backend
            sendUser(user);
            //window.location.href = 'home.html';
        }});

    // Sign in with email and pass.
    // [START createwithemail]
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function (error) {
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

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {
    // Listening for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function (user) {
        // [START_EXCLUDE silent]
        document.getElementById('quickstart-verify-email').disabled = true;
        // [END_EXCLUDE]
        if (user) {

            // When a user logs in -
            // Get list of featured stores, balance and transactions from backend
            // Store in chrome storage
            var data = getData(user);
            var stores = data['stores'];
            var balance = data['balance'];
            var transactions = data['transactions'];
            chrome.storage.local.set({'stores': stores, 'balance': balance, 'transactions': transactions}, function () {
            });

            // User is signed in.
            var displayName = user.displayName;
            //var email = user.email;
            var emailVerified = user.emailVerified;
            var photoURL = user.photoURL;
            var isAnonymous = user.isAnonymous;
            //var uid = user.uid;
            var providerData = user.providerData;
            // [START_EXCLUDE]
            document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
            document.getElementById('quickstart-sign-in').textContent = 'Sign out';
            document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
            if (!emailVerified) {
                document.getElementById('quickstart-verify-email').disabled = false;
            }
            // [END_EXCLUDE]

            window.location.href = 'home.html';

        } else {
            // User is signed out.
            // [START_EXCLUDE]
            document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
            document.getElementById('quickstart-sign-in').textContent = 'Sign in';
            document.getElementById('quickstart-account-details').textContent = 'null';
            // [END_EXCLUDE]
        }
        // [START_EXCLUDE silent]
        document.getElementById('quickstart-sign-in').disabled = false;
        // [END_EXCLUDE]
    });
    // [END authstatelistener]

    document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
    document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
    document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
    document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
}

window.onload = function () {
    initApp();
};