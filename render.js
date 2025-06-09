//renderer process
//renders UI and handles user interactions
//where the filing cabinet will live
//UI logic
const channelNameInput = document.getElementById('channelName');
const channelLinkInput = document.getElementById('channelLink');
const channelCategoryInput = document.getElementById('channelCategory');
const addChannelBtn = document.getElementById('addChannelBtn');
const categoriesContainer = document.getElementById('categoriesContainer');

let channels = []; //in-memory array ot hold channel data

//make a unique ID for each channel entry
function generateUniqueId(){
    //edit later
    return '-'+Math.random().toString(36).substr(2,9);
}