//2 modules imported:
//app: controls app's even lifecycle
//BrowserWindow, creates and manages app windows
const { app, BrowserWindow, ipcMain } = require('electron')//import needed modules
const path=require('path');
const fs = require('fs');

const CHANNEL_DATA = path.join(app.getPath('userData'), 'channels.json');//store channel data in json for persistence

function registerIpcHandlers(){//ipc handlers will go here to go off before creating Browser window
  // IPC handlers (main process) ---
  ipcMain.handle('load-channels', async ()=>{
    try{
      if(fs.existsSync(CHANNEL_DATA)){
        const data = await fs.promises.readFile(CHANNEL_DATA, 'utf-8');
        return JSON.parse(data);
      }
      return []; //return empty arra if file doesn't exist
    }catch(error){
      console.error("Error loading channels: ", error);
      return[];
    }
  });

  ipcMain.handle('save-channels', async (event, channels) => {
    try {
      await fs.promises.writeFile(CHANNEL_DATA, JSON.stringify(channels, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Error saving channels:', error);
      return { success: false, error: error.message };
    }
  });
}

//reusable function to insantiate windows
//loads web page into new BrowserWindow instance
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,

    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, //for secuirty
      nodeIntegration: false // for security
    }
  });

  win.loadFile('index.html')

  //for devtools
  //win.webContents.openDevTools();
}

//calls createWindow when app is ready
//whenReeady looks like an async emitter thing
app.whenReady().then(() => {

  registerIpcHandlers();//register ipc handlers first and foremost

  createWindow();//create the browser window

  app.on('activate',() =>{
    if(BrowserWindow.getAllWindows().length===0) createWindow();
  });
});

//for quitting app when all windows closed to cater to linux and windows
app.on('window-all-closed',()=>{
  if(process.platform !== 'darwin') app.quit()
})

//in mac, there's a weird issue of apps continuing to run even with no windows open.
//so we're going to have the app open when no windows available
//windows cannot be created before the ready eent, listen to activate events after app initizliaed
/* app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}) */
