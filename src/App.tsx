import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders'
import { ResponsiveWrapper } from './ui/ResponsiveWrapper'
import { router } from './routes'

export default function App() {
  return (
    <AppProviders>
      <ResponsiveWrapper>
        <RouterProvider router={router} />
      </ResponsiveWrapper>
    </AppProviders>
  )
}
