//renderer process
//renders UI and handles user interactions
//where the filing cabinet will live
//UI logic
const channelNameInput = document.getElementById('channelName');
const channelLinkInput = document.getElementById('channelLink');
const channelCategoryInput = document.getElementById('channelCategory');
const addChannelBtn = document.getElementById('addChannelBtn');
const categoriesContainer = document.getElementById('categoriesContainer');

//window controls:
const exitbtn = document.getElementById("exit-btn");
const minbtn = document.getElementById("min-btn");
const searchbtn = document.getElementById("search-btn");

const searchForm = document.querySelector(".search-form");

let channels = []; //in-memory array ot hold channel data

//window controls fucntions
//min button
minbtn.addEventListener('click',()=>{
    window.electronAPI.minimizeWindow();
});
//exit button
exitbtn.addEventListener('click', ()=>{
    window.electronAPI.exitApp();
});

//make a unique ID for each channel entry
function generateUniqueId(){
    //edit later
    return '-'+Math.random().toString(36).substr(2,9);
}

//render channels based on categories
async function renderChannels(){
    //to fill later with channels data:
    categoriesContainer.innerHTML='';//clear anything in there

    //group channels by category
    const categorizedChannels =  channels.reduce((account,channel) =>{
        const category = channel.category.trim() || 'Uncategorized';
        if(!account[category]){
            account[category] =[];
        }
        account[category].push(channel);
        return account;
    },{});

    //sort categories alphabetically
    const sortedCategories = Object.keys(categorizedChannels).sort();

    sortedCategories.forEach(category =>{
        const categoryFolder = document.createElement('div');
        categoryFolder.classList.add('category-folder');

        const categoryHeader = document.createElement('h3');
        categoryHeader.textContent = category;
        categoryHeader.addEventListener('click', ()=>{
            const channelList = categoryFolder.querySelector('.channel-list');
            if (channelList) {
                channelList.classList.toggle('expanded');
            }
        });
        categoryFolder.appendChild(categoryHeader);

        const channelList = document.createElement('ul');
        channelList.classList.add('channel-list'); // hidden at first

        //sort channels within each cateogry by name (alphbetic)
        const sortedChannelsInCategory = categorizedChannels[category].sort((a, b) => a.name.localeCompare(b.name));

        sortedChannelsInCategory.forEach(channel =>{
            //channel item after being sorted
            const channelItem = document.createElement('li');
            channelItem.classList.add('channel-item');

            //link to channel after sorted
            const channelLink = document.createElement('a');
            channelLink.href = channel.link;
            channelLink.textContent = channel.name;
            channelLink.target = '_blank'; // Open link in default browser
            channelItem.appendChild(channelLink);

            //in case user wants to delete channel from filing cabinet
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            //notice async because we have to wait for user to do anything
            deleteButton.addEventListener('click', async () => {
                channels = channels.filter(c => c.id !== channel.id);
                await window.electronAPI.saveChannels(channels);
                renderChannels();
            });
            channelItem.appendChild(deleteButton);

            channelList.appendChild(channelItem);
        });

        categoryFolder.appendChild(channelList);
        categoriesContainer.appendChild(categoryFolder);
    });
}

//load channels on startup of app
async function loadChannels() {
    //when the window for app loads, we get the channels
    channels = await window.electronAPI.loadChannels();
    renderChannels();
}

//add channel button event handler (if user needs more channels)
addChannelBtn.addEventListener('click', async()=>{
    const name = channelNameInput.value.trim();
    const link = channelLinkInput.value.trim();
    const category = channelCategoryInput.value.trim();

    //check if name, link, category exist
    if (name && link && category) {
        //if so push onto stack
        channels.push({
            id: generateUniqueId(), // Assign unique ID//go for uuid for production level apps with massive data
            name: name,
            link: link,
            category: category
        });

        //electron saves the channel data to json for persistence
        await window.electronAPI.saveChannels(channels); // Save to JSON
        renderChannels(); // Re-render UI with new data

        // Clear form fields when done in case we need more 
        channelNameInput.value = '';
        channelLinkInput.value = '';
        channelCategoryInput.value = '';
    } else {
        alert('Please fill in all fields.');
    }
});

searchbtn.addEventListener('click',()=>{
    //if the style of the search form is display none
    /* if (searchForm.style.display ==='none' || searchForm.style.display === '' ){
        searchForm.style.display = 'block';
    }
    else{
        searchForm.style.display = 'none';
    } */

    searchForm.classList.toggle('is-visible');//adds /removes this
});

//load initially when app opens up'
loadChannels();