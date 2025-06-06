//2 modules imported:
//app: controls app's even lifecycle
//BrowserWindow, creates and manages app windows
const { app, BrowserWindow } = require('electron')//import needed modules

//reusable function to insantiate windows
//loads web page into new BrowserWindow instance
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html')
}

//calls createWindow when app is ready
//whenReeady looks like an async emitter thing
app.whenReady().then(() => {
  createWindow()
})

//for quitting app when all windows closed to cater to linux and windows
app.on('window-all-closed',()=>{
  if(process.platform !== 'darwin') app.quit()
})

//in mac, there's a weird issue of apps continuing to run even with no windows open.
//so we're going to have the app open when no windows available
//windows cannot be created before the ready eent, listen to activate events after app initizliaed
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})