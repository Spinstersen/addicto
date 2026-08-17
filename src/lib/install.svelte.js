export const install = $state({
  deferred: null,
  standalone: false,
  supported: false
})

export function setupInstall() {
  if (typeof window === 'undefined') return
  install.standalone =
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  install.supported = 'onbeforeinstallprompt' in window
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    install.deferred = e
  })
  window.addEventListener('appinstalled', () => {
    install.deferred = null
    install.standalone = true
  })
}

export async function promptInstall() {
  if (install.deferred) {
    install.deferred.prompt()
    await install.deferred.userChoice
    install.deferred = null
    return true
  }
  return false
}
