import { AppMessagesListener } from '@/messages/AppMessagesListener'
import { type FrameConfig, mountFrame, unmountIframe } from './iframe.config'
import { initFormTracker, restoreFormFromDraft } from '@/content/formTracker'
import { initOfflineNavigation } from '@/content/domSnapshot'
import { initSyncManager } from '@/content/syncManager'
import { SyncOverlay } from '@/components/SyncOverlay'
import { createRoot } from 'react-dom/client'
import React from 'react'

export const frameConfig: FrameConfig = {
  iframe: {
    id: `__${chrome.runtime.getManifest().name.replace(/[^A-Z0-9]/gi, '_')}__frame__`,
    src: chrome.runtime.getURL('pages/main.html'),
  },
  iframeBg: {
    id: `__${chrome.runtime.getManifest().name.replace(/[^A-Z0-9]/gi, '_')}__overlay__`,
  },
}

export function mountOrUnmountIframe(): void {
  const FrameId = (frameConfig.iframe as { id: string }).id
  if (document.getElementById(FrameId) === null) {
    mountFrame()
  } else {
    unmountIframe()
  }
}

export function openOrCloseExtension(): void {
  mountOrUnmountIframe()
}

// start listening for messages from (React) App
chrome.runtime.onMessage.addListener(AppMessagesListener)

// start listening for messages from iframe
// https://developer.mozilla.org/en-US/docs/Web/API/Window/message_event
window.addEventListener('message', (event) => {
  if (event.data.action === 'open-or-close-extension') {
    openOrCloseExtension()
  }
})

// =============================================
// Inisialisasi Logika Offline (berjalan di halaman web, bukan iframe)
// =============================================
initFormTracker()
restoreFormFromDraft()
initOfflineNavigation()
initSyncManager()

// Inject SyncOverlay (notifikasi offline/sinkronisasi) langsung ke DOM halaman
const mountSyncOverlay = () => {
  const container = document.createElement('div')
  container.id = 'selaras-offline-overlay-root'
  document.body.appendChild(container)
  createRoot(container).render(React.createElement(SyncOverlay))
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountSyncOverlay)
} else {
  mountSyncOverlay()
}
