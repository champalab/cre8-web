import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'

import { I18nextProvider } from 'react-i18next'
import { store } from './stores'
import i18n from './i18n'
import App from './App'
import { AppProviders } from '@/components/providers/app-providers'
import { ThemedToastContainer } from '@/components/themed-toast-container'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import './assets/css/app.css'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <AppProviders>
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <ThemedToastContainer
            position="top-right"
            limit={5}
            hideProgressBar
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          <App />
        </Provider>
      </I18nextProvider>
    </AppProviders>
  </React.StrictMode>
)
