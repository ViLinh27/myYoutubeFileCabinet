//2 modules imported:
//app: controls app's even lifecycle
//BrowserWindow, creates and manages app windows
const { app, BrowserWindow, nativeImage, ipcMain } = require('electron')//import needed modules
const path=require('path');
const fs = require('fs');

const CHANNEL_DATA = path.join(app.getPath('userData'), 'channels.json');//store channel data in json for persistence

function registerIpcHandlers(){//ipc handlers will go here to go off before creating Browser window
  // IPC handlers (main process) ---
  ipcMain.handle('load-channels', async ()=>{
    try{
      if(fs.existsSync(CHANNEL_DATA)){
        const data = await fs.promises.readFile(CHANNEL_DATA, 'utf-8');
        // console.log('Loading channels:', data);
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
      // console.log('Saving channels:', channels);
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
  let iconFileName;
  if (process.platform === 'darwin') { //macOS
    iconFileName = 'icon-youtubefiling.icns';
  } else if (process.platform === 'win32') { //Windows
    iconFileName = 'icon-youtubefiling.ico';
  } else { //Linux/Other
    iconFileName = 'icon-youtubefiling.png'; //Using PNG for Linux/fallback
  }

  const iconPath = path.join(__dirname, 'assets','icons',iconFileName);//build the path to the icon
  let appIcon = null;//null FOR NOW

   try {
      appIcon = nativeImage.createFromPath(iconPath);//create the path with the image
      if (appIcon.isEmpty()) {
        console.warn(`Failed to load icon from: ${iconPath}. It might be empty or invalid.`);
      }
    } catch (error) {
      console.error(`Error loading icon from ${iconPath}:`, error);
    }

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: appIcon,//windowicon nativeimage isntance

    webPreferences:{
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, //for secuirty
      nodeIntegration: false // for security
    }
  });

  ipcMain.on('minimize-window', ()=>{
    win.minimize();
  })

  ipcMain.on('close-window', ()=>{
    win.close();
  })

  ipcMain.on('exit-app',()=>{
    app.quit()
  })

  win.loadFile('index.html')

  //for devtools
  //win.webContents.openDevTools();
}

//calls createWindow when app is ready
//whenReeady looks like an async emitter thing
app.whenReady().then(() => {

  registerIpcHandlers();//register ipc handlers first and foremost
  // console.log('CHANNEL_DATA path:', CHANNEL_DATA);
  createWindow();//create the browser window

  // For macOS: Set the dock icon explicitly during development//when building for prdduction this is gonna be handled anyway
  if (process.platform === 'darwin') {//notice how darwin here means specifically for macOS
    const iconPathMac = path.join(__dirname, 'assets', 'icons', 'icon-youtubefiling.icns');
    try {//similar to the other try catch for icons but specifically for dock
      const dockIcon = nativeImage.createFromPath(iconPathMac);
      if (!dockIcon.isEmpty()) {
        app.dock.setIcon(dockIcon);
      } else {
        console.warn(`Failed to load dock icon from: ${iconPathMac}. It might be empty or invalid.`);
      }
    } catch (error) {
      console.error(`Error loading dock icon from ${iconPathMac}:`, error);
    }
  }

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
