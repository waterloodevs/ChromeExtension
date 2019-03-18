function Stores(){
    chrome.storage.local.get(['stores'], function (result) {
        let stores = result['stores'];
        document.getElementById("featured-stores").textContent = stores;
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
  title.textContent = cityName;

  // Call the necessary javascript functions for the tab about to be shown
  if (Name == 'Stores'){
        Stores();
  } else if (Name == 'Wallet'){
    Wallet();
  } else if (Name == 'Home'){

  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = "block";
}

window.onload = function () {
    document.getElementById('tablinks-1').addEventListener('click', openTab('Home'), false);
    document.getElementById('tablinks-2').addEventListener('click', openTab('Stores'), false);
    document.getElementById('tablinks-3').addEventListener('click', openTab('Wallet'), false);

    document.getElementById('settings-right').addEventListener('click', openSettings(), false);

    // Get the element with id="defaultOpen" and click on it
    document.getElementById("defaultOpen").click();
};