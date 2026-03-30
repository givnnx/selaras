import { createManifest } from '@bedframe/core'
import { baseManifest } from './base.manifest'

const { options_page, ...rest } = baseManifest

const updatedFirefoxManifest = {
  ...rest,
  background: {
    scripts: [baseManifest.background.service_worker],
  },
  browser_specific_settings: {
    gecko: {
      id: baseManifest.author.email,
      // ^^^ https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings#id
    },
  },
  options_ui: {
    page: options_page,
  },
}

export const firefox = createManifest(updatedFirefoxManifest, 'firefox')
