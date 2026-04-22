import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  send: (channel, data) => {
    // Güvenli kanallar
    const validChannels = ['login-success', 'logout']
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  receive: (channel, func) => {
    const validChannels = ['from-main']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
