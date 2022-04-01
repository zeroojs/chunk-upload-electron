/*
 * @Descripttion: your project
 * @version: 0.0.0
 * @Author: Minyoung
 * @Date: 2022-03-13 15:04:33
 * @LastEditors: Minyoung
 * @LastEditTime: 2022-04-02 00:40:28
 */
import { app, BrowserWindow, Tray, Menu, dialog, ipcMain } from 'electron'
import { resolve } from 'path'
import '../renderer/store'
import server from './server'

const IS_BUILD = process.env.NODE_ENV === 'production'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (!IS_BUILD) {
    BrowserWindow.addDevToolsExtension('node_modules/vue-devtools/vender')
  }

  mainWindow.loadURL(winURL)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

let isQuit = false
// 创建托盘小图标
function initTrayIcon() {
  const tray = new Tray(IS_BUILD ? resolve(process.cwd(), './resources/static/icons/icon.ico') : resolve('static/icons/icon.ico'));
  const trayContextMenu = Menu.buildFromTemplate([
      {
        label: '打开',
        click: () => {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      {
        label: '退出',
        click: () => {
          isQuit = true
          app.quit();
        }
      }
  ]);
  tray.setToolTip('ZUpload');

  tray.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  tray.on('right-click', () => {
    tray.popUpContextMenu(trayContextMenu);
  });
  mainWindow.on('close', (e) => {
    !isQuit && e.preventDefault();
    // mainWindow.hide();
    hideOrQuitDialog()
  })
}

// 关闭主窗口是后台运行还是退出应用
function hideOrQuitDialog() {
  dialog.showMessageBox(mainWindow, {
    message: '后台运行还是直接退出？',
    buttons: ['后台运行', '直接退出']
  }, (bIndex) => {
    if (bIndex === 1) {
      isQuit = true
      app.quit()
    }
    if (isQuit) return
    isQuit = false
    mainWindow.hide();
  })
}

app.on('ready', () => {
  createWindow()
  initTrayIcon()
  server.run()
    .then(url => {
      ipcMain.on('asynchronous-message', (event, arg) => {
        event.sender.send('asynchronous-reply', { url })
      })
    })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
