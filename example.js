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

function openSettings(){

}

function openTab(Name) {
  // Declare all variables
  var i, tabcontent, tablinks;

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

  //Call the necessary javascript functions for the tab about to be shown
  if (Name == 'Stores'){
        Stores();
  } else if (Name == 'Wallet'){
        Wallet();
  } else if (Name == 'Home'){

  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(Name).style.display = "block";
}

function initApp(){
    document.getElementById("HomeButton").addEventListener('click', function(){ openTab('Home'); }, false);
    document.getElementById("StoresButton").addEventListener('click', function(){ openTab('Stores'); }, false);
    document.getElementById("WalletButton").addEventListener('click', function(){ openTab('Wallet'); }, false);

    document.getElementById('settings-right').addEventListener('click', openSettings, false);

    // click on default tab
    document.getElementById("HomeButton").click();
}

window.onload = function () {
    initApp();
};