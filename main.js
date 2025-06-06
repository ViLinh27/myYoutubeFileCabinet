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