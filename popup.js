document.addEventListener('DOMContentLoaded', function () {
    let tabButtonsArray = document.getElementsByClassName("tab-button");
    [].forEach.call(tabButtonsArray, function (button) {
        button.addEventListener("click", function () {
            selectTab(button.id);
        });
    });
}, false);


function selectTab(id) {
    // Hide all tabs
    let i, tabPagesArray;
    tabPagesArray = document.getElementsByClassName("tab-page");
    for (i = 0; i < tabPagesArray.length; i++) {
        tabPagesArray[i].style.display = "none";
    }
    //Show the Selected Tab
    document.getElementById(id + "-page").style.display = "block";
}