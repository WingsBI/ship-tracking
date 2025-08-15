import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'

const Layout = lazy(() => import('./ui/Layout'))
const VesselTrackingPage = lazy(() => import('./ui/VesselTrackingPage'))
const CargoTrackingPage = lazy(() => import('./ui/CargoTrackingPage'))

export const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout />,
		children: [
			{ index: true, element: <VesselTrackingPage /> },
			{ path: 'vessels', element: <VesselTrackingPage /> },
			{ path: 'cargo', element: <CargoTrackingPage /> },
		],
	},
])


