import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'
import { registerSW } from 'virtual:pwa-register'
import { setupInstall } from './lib/install.svelte.js'

setupInstall()
registerSW({ immediate: true })

const app = mount(App, { target: document.getElementById('app') })

export default app
