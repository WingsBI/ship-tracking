import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { AppProviders } from './AppProviders'
// import { enableApiMocks } from './lib/mock'

// Disabled mock data to use real API
// if (import.meta.env.DEV) {
//     enableApiMocks()
// }

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AppProviders>
			<RouterProvider router={router} />
		</AppProviders>
	</StrictMode>,
)
