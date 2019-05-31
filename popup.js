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

// Retrieve Firebase Messaging object for FCM
const messaging = firebase.messaging();

// Add the public key generated from the console here.
messaging.usePublicVapidKey('BJRkoCi2Qzx5jYe_qxL1hD2OkWAibd9xxxrRHz6Sn2IhUR2r1wNXK_YIBwy9GsQ58tPwpuI4wQVQhxZIvgRaXuU');

const BASE_URL = 'http://134b1ba0.ngrok.io';
const REGISTER_ROUTE = '/register';
const FCM_TOKEN_ROUTE = '/update_fcm_token';
const STORES_ROUTE = '/stores';
const BALANCE_ROUTE = '/balance';
const GIFTCARD_ROUTE = '/buy_giftcard';
const WITHDRAW_ROUTE = '/withdraw';

async function sendWithdrawRequestToServer(publicAddress){
    console.log('Sending withdraw request to server...');
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + WITHDRAW_ROUTE, {
            method: 'post',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            },
            body: JSON.stringify({
                "public_address": publicAddress
            })
        }).then(function (response) {
            if (response.status !== 201) {
                console.log('Withdraw Request Failed response. Status Code: ' + response.status);
                reject(Error("sendOrderToServer"));
            } else {
                console.log("Withdraw request was sent successfully!")
                resolve("Success");
            }
        }).catch(function (err) {
            reject(Error("sendWithdrawRequestToServer"));
        });
    })
}

async function withdrawKin(){
    const publicAddress = document.getElementById("publicAddress").value;
    if (publicAddress === ''){
        document.getElementById("modal-text").textContent = 'Please enter a public address.';
        $('#MyModal').modal('show');
        return;
    }
    try {
        await sendWithdrawRequestToServer(publicAddress);
        document.getElementById("modal-text").textContent = 'Success! We sent your Kin to the specified public address.';
    } catch (err){
        document.getElementById("modal-text").textContent = 'Request failed. Please try again later.';
    }
    $('#MyModal').modal('show');
}

async function sendOrderToServer(type_, email, amount, quantity, total){
    console.log('Sending order to server...');
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + GIFTCARD_ROUTE, {
            method: 'post',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            },
            body: JSON.stringify({
                "type_": type_,
                "email": email,
                "amount": amount,
                "quantity": quantity,
                "total": total
            })
        }).then(function (response) {
            if (response.status !== 201) {
                console.log('Failed order response. Status Code: ' + response.status);
                reject(Error("sendOrderToServer"));
            } else {
                console.log("Order was sent successfully!")
                resolve("Success");
            }
        }).catch(function (err) {
            reject(Error("sendOrderToServer"));
        });
    })
}

async function buyGiftcard(){
    const type_ = "Amazon";
    const email = document.getElementById("recipient").value;
    if (email === ''){
        document.getElementById("modal-text").textContent = 'Please enter an email address.';
        $('#MyModal').modal('show');
        return;
    }
    const amountStr = document.getElementById("amount").value;
    const amount = amountStr.replace("$", "");
    const quantity = document.getElementById("quantity").value;
    const total = 10000 * amount.valueOf() * quantity.valueOf();
    const balance = await getBalance();
    if (total > balance){
        document.getElementById("modal-text").textContent = 'Sorry, you do not have enough Kin.';
        $('#MyModal').modal('show');
        return;
    }
    try {
        await sendOrderToServer(type_, email, amount, quantity, total);
        document.getElementById("modal-text").textContent = 'Thank you! Your order has been received.';
    } catch (err){
        document.getElementById("modal-text").textContent = 'Order failed. Please try again later.';
    }
    $('#MyModal').modal('show');
}


function calcTotal(){
    const amountStr = document.getElementById("amount").value;
    const amount = amountStr.replace("$", "");
    const quantity = document.getElementById("quantity").value;
    const total = 10000 * amount.valueOf() * quantity.valueOf();
    document.getElementById("total").textContent = total.toString() + " Kin";
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

async function fetchBalanceFromServer(){
    console.log('Fetching balance from server...');
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + BALANCE_ROUTE, {
            method: 'get',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            }
        }).then(function (response) {
            if (response.status !== 200) {
                console.log('Failed response. Status Code: ' + response.status);
                reject(Error('fetchBalanceFromServer'));
            } else {
                response.json().then(function(data) {
                    console.log("Fetched balance from server successfully!");
                    const obj = JSON.stringify(data, null, 2);
                    const json = JSON.parse(obj);
                    resolve(json.balance);
                });
            }
        }).catch(function (err) {
            console.log('Fetch Error: ', err);
            reject(Error('fetchBalanceFromServer'));
        });
    });
}

async function setStores(){
    try{
        const stores = await fetchStoresFromServer();
        chrome.storage.local.set({'stores': stores}, function(){});
    } catch (err){
        console.log("Unable to fetch stores: " + err);
    }
}

async function setBalance(){
    try{
        const balance = await fetchBalanceFromServer();
        chrome.storage.local.set({'balance': balance}, function(){});
    } catch (err) {
        console.log("Unable to fetch balance: " + err);
    }
}

function getBalance() {
    return new Promise(function(resolve, reject) {
        chrome.storage.local.get(['balance'], function(result) {
            if (typeof result.balance !== 'undefined'){
                resolve(result.balance);
            } else {
                reject(Error('getBalance'));
            }
        });
    });
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

function requestPermission() {
    console.log('Requesting permission...');
    messaging.requestPermission().then(function () {
        console.log('Notification permission granted.');
        setFCMToken();
    }).catch(function (err) {
        console.log('Unable to get permission to notify.', err);
    });
}

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

// Send the Instance ID token your application server, so that it can:
// - send messages back to this app
// - subscribe/unsubscribe the token from topics
function setFCMToken() {
    // Get Instance ID token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    console.log('Getting fcm token...');
    messaging.getToken().then(function(currentToken) {
        if (currentToken) {
            sendFcmTokenToServer(currentToken);
        } else {
            // Show permission request.
            requestPermission();
            console.log('No FCM token available. Request permission to generate one.');
        }
    }).catch(function (err) {
        console.log('An error occurred while retrieving fcm token. ', err);
    });
}

function deleteToken() {
    // Delete FCM token.
    console.log("Deleting FCM token");
    messaging.getToken().then(function(currentToken) {
        messaging.deleteToken(currentToken).then(function() {
            console.log('Token deleted.');
        }).catch(function(err) {
            console.log('Unable to delete token. ', err);
        });
    }).catch(function(err) {
        console.log('Error retrieving Instance ID token. ', err);
    });
}

function deleteActivatedStores(){
    chrome.storage.local.remove('activated', function(){});
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

function Home() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {type: "getOffer"}, function (offer){
            if (typeof offer === 'undefined') {
                if (chrome.runtime.lastError) {
                    // If couldn't make contact with content script, try again?
                }
            } else {
                document.getElementById("offer").textContent = offer;
                if (offer === "Offer is activated."){
                    document.getElementById("status-img").className = "far fa-thumbs-up p-2 pt-3 fa-2x";
                } else if (offer === "Offer is not activated. Refresh the store page to activate."){
                    document.getElementById("status-img").className = "far fa-thumbs-down p-2 pt-3 fa-2x";
                } else if (offer === "You are not at a participating store."){
                    document.getElementById("status-img").className = "fas fa-map-marked-alt p-2 pt-3 fa-2x";
                }
            }
        });
    });
}

function Redeem() {
    // chrome.storage.local.get(['stores'], function (result) {
    //     var names = new Array();
    //     var stores = result['stores'];
    //     var length = stores.length;
    //     for (var i = 0; i < length; i++) {
    //         var name = stores[i].name;
    //         names.push(name);
    //     }
    //     document.getElementById("featured-stores").textContent = names;
    // });
    document.getElementById("GiftcardButton").addEventListener('click', function () {
        openTab("GiftcardButton", "Giftcard");
    }, false);
}

function Wallet() {
    chrome.storage.local.get(['balance'], function(result) {
        if (typeof result.balance !== 'undefined') {
            document.getElementById("balance").textContent = result.balance + " Kin";
        }
    });

    // Add listener to the earned button
    document.getElementById("earned-btn").addEventListener("click", function(){
        document.getElementById("spent-btn").className = document.getElementById("spent-btn").className.replace(" active", "");
        document.getElementById("earned-btn").className += " active";
    });

    document.getElementById("spent-btn").addEventListener("click", function(){
        document.getElementById("earned-btn").className = document.getElementById("earned-btn").className.replace(" active", "");
        document.getElementById("spent-btn").className += " active";
    });
}

function Giftcard(){

    // Add listener to the confirm button
    document.getElementById("Confirm").addEventListener("click", buyGiftcard);

    // Add listener to the option changes
    document.getElementById("amount").addEventListener("change", calcTotal);

    // Add listener to the option changes
    document.getElementById("quantity").addEventListener("change", calcTotal);

    // Hide the nav bar
    let tab = document.getElementsByClassName("bottomnavbar");
    tab[0].style.visibility = 'hidden';

    // Hide the profile button
    document.getElementById("settings-right").style.visibility = "hidden";

    // Make back button visible and add listener
    document.getElementById("settings-left").style.visibility = "visible";

    document.getElementById("settings-left").addEventListener('click', function () {
        // Send back to redeem page
        openTab("RedeemButton", "Redeem");
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.visibility = 'visible';
        // Show the profile button
        document.getElementById("settings-right").style.visibility = "visible";
        // Show the title text
        document.getElementById("title").style.visibility = "visible";
    }, false);

    // Hide the title text
    document.getElementById("title").style.visibility = "hidden";
}

function Withdraw() {

    // Add listener to the confirm button
    document.getElementById("Confirm1").addEventListener("click", withdrawKin, false);

    // Hide the nav bar
    let tab = document.getElementsByClassName("bottomnavbar");
    tab[0].style.visibility = 'hidden';

    // Hide the profile button
    document.getElementById("settings-right").style.visibility = "hidden";

    // Make back button visible and add listener
    document.getElementById("settings-left").style.visibility = "visible";

    document.getElementById("settings-left").addEventListener('click', function () {
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.visibility = 'visible';
        // Show the profile button
        document.getElementById("settings-right").style.visibility = "visible";
        // Show the title text
        document.getElementById("title").style.visibility = "visible";
        // Send back to settings page
        openTab("settings-right", "Settings");
    }, false);

    // Hide the title text
    document.getElementById("title").style.visibility = "hidden";

}

function Settings() {

    // Set the user details
    document.getElementById("userEmail").textContent = firebase.auth().currentUser.email;

    // Hide the nav bar
    let tab = document.getElementsByClassName("bottomnavbar");
    tab[0].style.visibility = 'hidden';

    // Hide the profile button
    document.getElementById("settings-right").style.visibility = "hidden";

    // Make back button visible and add listener
    document.getElementById("settings-left").style.visibility = "visible";
    document.getElementById("settings-left").addEventListener('click', function () {
        // Send back to home page
        openTab("HomeButton", "Home");
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.visibility = 'visible';
        // Show the profile button
        document.getElementById("settings-right").style.visibility = "visible";
    }, false);

    // Add listener to the withdraw button
    document.getElementById("withdrawButton").addEventListener('click', function () {
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.visibility = 'visible';
        // Show the profile button
        document.getElementById("settings-right").style.visibility = "visible";
        // Send to withdraw page
        openTab("withdrawButton", "Withdraw");
    }, false);

    // Add listener for the logout button
    document.getElementById("LogoutButton").addEventListener('click', function () {
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar
        tab[0].style.visibility = 'visible';
        // Show the profile button
        document.getElementById("settings-right").style.visibility = "visible";
        // sign out the user
        firebase.auth().signOut();
        // Delete the fcm token, this should disable push notifications
        deleteToken();
        // Delete activated list of stores
        deleteActivatedStores();
    }, false);
}

function openTab(buttonId, tabId) {
    // Declare all variables
    let i, tabcontent, tablinks;

    //Call the necessary javascript functions for the tab about to be shown
    if (tabId === 'Redeem') {
        Redeem();
    } else if (tabId === 'Wallet') {
        Wallet();
    } else if (tabId === 'Home') {
        Home();
    } else if (tabId === 'Settings') {
        Settings();
    } else if (tabId === 'Giftcard'){
        Giftcard();
    } else if (tabId === 'Withdraw'){
        Withdraw();
    }

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display= 'none';
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Replace the title text
    let title = document.getElementById("title").firstChild;
    title.textContent = tabId;

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabId).style.display= 'block';
    document.getElementById(buttonId).className += " active";
}

async function signInTasks(email, password) {
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        await setIdToken();
        init();
    } catch (err) {
        if (err.message === 'setIdToken') {
            document.getElementById("modal-text").textContent = 'Sign In failed. Please try again later.';
        } else if (err.code === 'auth/invalid-email') {
            document.getElementById("modal-text").textContent = 'The email address is not valid.';
        } else if (err.code === 'auth/user-disabled') {
            document.getElementById("modal-text").textContent = 'The user corresponding to the given email has been disabled.';
        } else if (err.code === 'auth/user-not-found') {
            document.getElementById("modal-text").textContent = 'There is no user corresponding to the given email.';
        } else if (err.code === 'auth/wrong-password') {
            document.getElementById("modal-text").textContent = 'Incorrect Password.';
        } else {
            document.getElementById("modal-text").textContent = 'Sign In failed. Please try again later.';
        }
        console.log(err.message);
        $('#MyModal').modal('show');
        return;
    }
    setBalance();
    setStores();
    setFCMToken();
}

function toggleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (email.length <= 0) {
        document.getElementById("modal-text").textContent = 'Please enter an email address.';
        $('#MyModal').modal('show');
        return;
    }
    if (password.length <= 0) {
        document.getElementById("modal-text").textContent = 'Please enter a password.';
        $('#MyModal').modal('show');
        return;
    }
    // TODO, no need for listeners for signin and signout, modify the code below to use
    //  .then before .catch -> have only one listener in initapp
    signInTasks(email, password);
    // Sign in with email and pass.
    // firebase.auth().signInWithEmailAndPassword(email, password).then(function(){
    //     // When a user logs in -
    //     // Get list of featured stores, balance and transactions from backend
    //     // Store in chrome storage
    //     var user = firebase.auth().currentUser;
    //     // Send FCM token to backend in case it was
    //     // refreshed while the user was not logged in
    //     sendFcmTokenToServer(user);
    //     // Get and store data into local storage in case the
    //     // client was notified when the user was not logged in
    //     updateDataFromServer(user);
    //
    //     // If successfully signed in, auth state change listener in initApp() will be called.
    //     //window.location.href = 'example.html';
    //
    // }).catch(function (error) {
    //     // Handle Errors here.
    //     var errorCode = error.code;
    //     var errorMessage = error.message;
    //     if (errorCode === 'auth/wrong-password') {
    //         alert('Wrong password.');
    //     } else {
    //         alert(errorMessage);
    //     }
    //     console.log(error);
    // });
}

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

function setIdToken() {
    console.log("Setting Id token");
    return new Promise(function(resolve, reject) {
        firebase.auth().currentUser.getIdToken().then(function (token) {
            chrome.storage.local.set({'token': token}, function () {
                resolve('Success');
            });
        }, function (err) {
            reject(Error('setIdToken'));
        });
    });
}

async function sendUserToServer() {
    console.log("Sending User to Server");
    const idToken = await getIdToken();
    return new Promise(function(resolve, reject) {
        fetch(BASE_URL + REGISTER_ROUTE, {
            method: 'post',
            headers: {
                "Content-type": "application/json",
                "Authorization": "Token " + idToken
            }
        }).then(function (response) {
            if (response.status !== 201) {
                reject(Error('sendUserToServer'));
            } else{
                console.log('Sent User to server successfully!');
                resolve('Success');
            }
        }).catch(function (err) {
            reject(Error('sendUserToServer'));
        });
    });
}


async function signUpTasks(email, password) {
    try {
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        await setIdToken();
        await sendUserToServer();
        init();
    } catch (err) {
        if (err.message === 'setIdToken' || err.message === 'sendUserToServer') {
            console.log('Deleting user...');
            const user = firebase.auth().currentUser;
            if (user){
                try {
                    await user.delete();
                    console.log('User deleted');
                } catch (err){
                    console.log('Unable to delete user');
                }
            }
            document.getElementById("modal-text").textContent = 'Sign Up failed. Please try again later.';
        } else if (err.code === 'auth/email-already-in-use') {
            document.getElementById("modal-text").textContent = 'There already exists an account with the given email address.';
        } else if (err.code === 'auth/invalid-email') {
            document.getElementById("modal-text").textContent = 'The email address is not valid.';
        } else if (err.code === 'auth/operation-not-allowed') {
            document.getElementById("modal-text").textContent = 'Sorry, we are currently not accepting new users. Please try again later';
        } else if (err.code === 'auth/weak-password') {
            document.getElementById("modal-text").textContent = 'Your password is not strong enough.';
        } else {
            document.getElementById("modal-text").textContent = 'Sign Up failed. Please try again later.';
        }
        console.log(err.message);
        $('#MyModal').modal('show');
        return;
    }
    setBalance();
    setStores();
    setFCMToken();
}

function handleSignUp() {
    const email = document.getElementById('email1').value;
    const password = document.getElementById('password1').value;
    const reEnteredPassword = document.getElementById('reEnteredPassword').value;
    if (email.length <= 0) {
        document.getElementById("modal-text").textContent = 'Please enter an email address.';
        $('#MyModal').modal('show');
        return;
    }
    if (password.length <= 0) {
        document.getElementById("modal-text").textContent = 'Please enter a password.';
        $('#MyModal').modal('show');
        return;
    }
    if (password !== reEnteredPassword) {
        document.getElementById("modal-text").textContent = 'Your passwords do not match.';
        $('#MyModal').modal('show');
        return;
    }
    signUpTasks(email, password);
    // Sign in with email and pass.
    // firebase.auth().createUserWithEmailAndPassword(email, password)
    // .then(function () {
    //     const user = firebase.auth().currentUser;
    //     // Send new user details to backend
    //     sendUserToServer(user);
    //     // Send FCM token to backend
    //     sendFcmTokenToServer(user);
    //     // Get and store data into local storage
    //     updateDataFromServer(user);
    //     // If successfully signed up, auth state change listener in initApp() will be called.
    //     //window.location.href = 'example.html';
    // })
    // .catch(function (error) {
    //     // Handle Errors here.
    //     const errorCode = error.code;
    //     const errorMessage = error.message;
    //     if (errorCode === 'auth/weak-password') {
    //         alert('The password is too weak.');
    //     } else {
    //         alert(errorMessage);
    //     }
    //     console.log(error);
    // });
}

/**
 * Sends an email verification to the user.
 */
//function sendEmailVerification() {
//    // [START sendemailverification]
//    firebase.auth().currentUser.sendEmailVerification().then(function () {
//        // Email Verification sent!
//        // [START_EXCLUDE]
//        alert('Email Verification Sent!');
//        // [END_EXCLUDE]
//    });
//    // [END sendemailverification]
//}

//function sendPasswordReset() {
//    var email = document.getElementById('email').value;
//    // [START sendpasswordemail]
//    firebase.auth().sendPasswordResetEmail(email).then(function () {
//        // Password Reset Email Sent!
//        // [START_EXCLUDE]
//        alert('Password Reset Email Sent!');
//        // [END_EXCLUDE]
//    }).catch(function (error) {
//        // Handle Errors here.
//        var errorCode = error.code;
//        var errorMessage = error.message;
//        // [START_EXCLUDE]
//        if (errorCode == 'auth/invalid-email') {
//            alert(errorMessage);
//        } else if (errorCode == 'auth/user-not-found') {
//            alert(errorMessage);
//        }
//        console.log(error);
//        // [END_EXCLUDE]
//    });
//    // [END sendpasswordemail];
//}

function hideAllPages() {
    document.getElementById("loginPage").style.display = 'none';
    document.getElementById("signupPage").style.display = 'none';
    document.getElementById("mainPage").style.display = 'none';
    document.getElementById("resetPage").style.display = 'none';
}

function showMainPage() {
    // Hide the login page, sign up page and the main page
    hideAllPages();
    //Show the main page
    document.getElementById("mainPage").style.display = 'block';
    // Set listeners to all the buttons on the main page
    document.getElementById("HomeButton").addEventListener('click', function () {
        openTab("HomeButton", "Home");
    }, false);
    document.getElementById("RedeemButton").addEventListener('click', function () {
        openTab("RedeemButton", "Redeem");
    }, false);
    document.getElementById("WalletButton").addEventListener('click', function () {
        openTab("WalletButton", "Wallet");
    }, false);
    document.getElementById("settings-right").addEventListener('click', function () {
        openTab("settings-right", "Settings");
    }, false);
    // Click on default tab
    document.getElementById("HomeButton").click();
}

function showSignupPage() {
    // Hide the login page, sign up page and the main page
    hideAllPages();
    // Show the login page
    document.getElementById('signupPage').style.display = 'flex';
    // Set listeners to all the buttons on the sign up page.
    document.getElementById('signUpButton').addEventListener('click', handleSignUp, false);
    document.getElementById('loginLink').addEventListener('click', showLoginPage, false);
}

function showResetPage() {
    // Hide the login page, sign up page and the main page
    hideAllPages();
    // Show the reset page
    document.getElementById('resetPage').style.display = 'flex';
    document.getElementById("back-button").addEventListener('click', showLoginPage, false);

    // Add listener for the send link button
    document.getElementById("SendLink").addEventListener('click', function () {
        const email = document.getElementById('email2').value;
        if (email.length <= 0) {
            document.getElementById("modal-text").textContent = 'Please enter an email address.';
        } else {
            firebase.auth().sendPasswordResetEmail(email).then(function () {
                document.getElementById("modal-text").textContent = "Email was successfully sent";
            }).catch(function (err) {
                document.getElementById("modal-text").textContent = err;
            });
        }
        // Trigger Modal
        $('#MyModal').modal('show');
    }, false);
}

function showLoginPage() {
    // Hide the login page, sign up page and the main page
    hideAllPages();
    // Show the login page
    document.getElementById('loginPage').style.display = 'flex';
    // Set listeners to all the buttons on the login page.
    document.getElementById('signInButton').addEventListener('click', toggleSignIn, false);
    document.getElementById('signupLink').addEventListener('click', showSignupPage, false);
    document.getElementById('ResetPasswordButton').addEventListener('click', showResetPage, false);
    //TODO: password reset and send verification email
}


function init() {
    // Gets called when popup opens, and while the popup is open,
    // when the user signs in or signs out.
    const unsubscribe = firebase.auth().onIdTokenChanged(function (user) {
        if (user) {
            showMainPage();
            setIdToken();
        } else {
            showLoginPage();
            unsubscribe();
        }
    });
}

window.onload = function () {
    init();
};