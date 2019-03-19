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

    // Hide the nav bar
    tab = document.getElementsByClassName("tab");
    tab[0].style.display = "none";

    // Make back button visible and add listener
    document.getElementById("settings-left").style.visibility = "visible";
    document.getElementById("settings-left").addEventListener('click', function(){
        // Send back to home page
        openTab('Home');
        // Hide the back button
        document.getElementById("settings-left").style.visibility = "hidden";
        // Show the navigation bar again
        tab[0].style.display = "block";
        }, false);

    // Add listener for the logout button
    document.getElementById("LogoutButton").addEventListener('click', function(){
        alert('logout');
        firebase.auth().signOut();
    }, false);
}

function openTab(Name) {
  // Declare all variables
  var i, tabcontent, tablinks;

  //Call the necessary javascript functions for the tab about to be shown
  if (Name == 'Stores'){
        Stores();
  } else if (Name == 'Wallet'){
        Wallet();
  } else if (Name == 'Home'){

  } else if (Name == 'Settings'){
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
  title.textContent = Name;

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(Name).style.display = "block";
  event.target.className += " active";
}

function initApp(){
    document.getElementById("HomeButton").addEventListener('click', function(){ openTab('Home'); }, false);
    document.getElementById("StoresButton").addEventListener('click', function(){ openTab('Stores'); }, false);
    document.getElementById("WalletButton").addEventListener('click', function(){ openTab('Wallet'); }, false);
    document.getElementById('settings-right').addEventListener('click', function(){ openTab('Settings'); }, false);

    document.getElementById("stores-text-link").addEventListener('click', function(){ openTab('Stores'); }, false);

    // click on default tab
    document.getElementById("HomeButton").click();
}

window.onload = function () {
    initApp();
};