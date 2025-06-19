//renderer process
//renders UI and handles user interactions
//where the filing cabinet will live

//need it for fuzzy search
// const Fuse = require('fuse.js');//weird nesting issue potentially messing with search stuff
const FuseModule = require('fuse.js');
const Fuse = FuseModule.default || FuseModule;

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

const exitSearchBtn = document.getElementById("exit-search-btn");
const searchChannels = document.getElementById("searchChannelshBtn");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResultsContainer");
const searchForm = document.querySelector(".search-form");

let channels = []; //in-memory array ot hold channel data

//---WINDOW CONTROLS FUNCTIONS ---///
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

//--- ASYNC FUNCITONS ---//
//render channels based on categories
async function renderChannels(){
    //to fill later with channels data:
    categoriesContainer.innerHTML='';//clear anything in there
    categoriesContainer.style.display = 'block';//displays by default

    
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
            const channelItem = document.createElement('li');//search result list
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
    channels = await window.electronAPI.loadChannels();//the data of channels inputed in by user.
    initializeFuse();//initizlie fuse after channels are loaded
    renderChannels();
}


//---SCREEN BUTTONS FUNCTIONALITY ---//
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
        //pass the channel data into render
        await window.electronAPI.saveChannels(channels); // Save to JSON
        console.log('Channels after save:', channels);
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

exitSearchBtn.addEventListener('click', ()=>{
    searchForm.classList.remove('is-visible');
    //clear any searches and re-render categories as needed back to default
    searchInput.value = ''; //clear search input back to default
    categoriesContainer.style.display = 'block'; // Show main categories again
    renderChannels(); //re-render all channels
});

//search channels button
searchChannels.addEventListener('click', ()=>{
    performSearch(searchInput.value);
});
//Live search as the user types
/* searchInput.addEventListener('input', () => {
    performSearch(searchInput.value);
}) */


//--- PERFORM SEARCH ---///
const fuseOptions = {
    //key to use when searching each channel object
    keys: [
        {name: 'name', weight: 0.7},//people search by name more usually so bigger weight means bigger priority
        {name: 'category', weight: 0.3}//searching by category as a plan b, but has less priority
    ],
    threshold:0.3,//how fuzzy the match is(0.0 is exact match to 1.0 is super fuzzy)
    ignoreLocation: true, //we don't care about the posiiton of the match (any category or where it is in the name)
    findAllMatches:true,//we find anything that remotely looks like a match (not just the first one that pops up)
    includeScore: true,//the score of how good the match is good for ranking the matches and debugging in case this goes horribly wrong
    //includeMatches: true//hilighting matched text (way more of a hassle)
};
let fuse; //declare fuse instance where channels array scope is 
//function to initizlie Fuse.js (call this whenenver channels array data changes)
function initializeFuse(){
    fuse = new Fuse(channels, fuseOptions);
}
//actually do the search and render results
function performSearch(query){
    searchResults.innerHTML = '';//clear any existing search results if there are any

    //if query is empty basically
    if(!query.trim()){
        renderChannels();
        return;
    }

    //if there is no fuse yet
    //but loadchannels should load fine so this doesn't happen
    if(!fuse){
        //failsafe
        initializeFuse();
    }

    const results = fuse.search(query);//fuse will search through the query that is the channel data
    console.log('Search results: ', results);//DEBUG

    let searchResultList;//will account for change in list content probably
    if(results.length > 0){//is there any result that exists after search
        //display search results:
        searchResultList = document.createElement('ul');
        searchResultList.classList.add('channel-list','expanded');//styles already there

        results.forEach(result=>{
            const channel = result.item;//the channel object itself

            const channelItem = document.createElement('li');//for the search result list
            channelItem.classList.add('channel-item');//for styling

            const channelLink = document.createElement('a');//create link for search results
            channelLink.href = channel.link;//where is each link in search result gonna go?
            channelLink.textContent = `${channel.name} (Category: ${channel.category})`; // display name and category
            channelLink.target = '_blank';// to open link in new tab or something
            
            console.log('channel link: ',channelLink);//deubug
            channelItem.appendChild(channelLink);//add the channel link to channel item in list

            console.log('channel, item: ',channelItem);//debug

            const deleteButton = document.createElement('button');//delete any search results if desired 
            deleteButton.textContent = 'Delete';//for the delete channel button in search list
            deleteButton.addEventListener('click', async () => {
                //what happens in the delete channel button when clicked
                //we wait for channels to be loaded in by user of course
                channels = channels.filter(c => c.id !== channel.id);//filter channels by id if needed
                await window.electronAPI.saveChannels(channels);
                initializeFuse(); // Re-initialize Fuse after data changes
                performSearch(searchInput.value.trim()); // Re-run search with updated data
            });
            channelItem.appendChild(deleteButton);//add the delete channel button to channel list in search results

            console.log('State of searchResultList before append: ', searchResultList);//debug
            //issue line here:
            searchResultList.appendChild(channelItem);//add each channel item meant for search result to search list
            console.log('searchresults after append: ', searchResultList);//debug
        });
 

        /* for (const result of results) { // Loop through each search result of seach Results
            const channel = result.item; // Get the original channel object

            const channelItem = document.createElement('li'); // Create list item for the channel
            channelItem.classList.add('channel-item'); // Add styling class

            const channelLink = document.createElement('a'); // Create the link element
            channelLink.href = channel.link; // Set the link URL
            channelLink.textContent = `${channel.name} (Category: ${channel.category})`; // Display name and category
            channelLink.target = '_blank'; // Open link in default browser
            channelItem.appendChild(channelLink); // Add link to the list item

            const deleteButton = document.createElement('button'); // Create delete button
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', async () => {
                // Filter out the deleted channel and save updated list
                channels = channels.filter(c => c.id !== channel.id);
                await window.electronAPI.saveChannels(channels);
                initializeFuse(); // Re-initialize Fuse after data changes
                performSearch(searchInput.value.trim()); // Re-run search to update display
            });
            channelItem.appendChild(deleteButton); // Add delete button to list item

            // This line should now work correctly as searchResultList is directly accessible
            console.log('State of searchResultList before append (for-of):', searchResultList); // Keep this log for now
            searchResultsList.appendChild(channelItem); // Append the channel item to the search results list
        }      */

        searchResults.appendChild(searchResultList);//add the search results list to the container for search results
        //hide the categories when displaying search results for cleaner look
        categoriesContainer.style.display = 'none';
    }
    else{
        //what if nothing matches the search query???
        searchResults.innerHTML = '<p>No channels found matching your search.</p>';
        //hide the categories whether found channels in search or not
        categoriesContainer.style.display = 'none';
    }
}

//load initially when app opens up'
loadChannels();