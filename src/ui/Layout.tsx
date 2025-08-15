import { Suspense, useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Avatar, Box, Container, CssBaseline, Tab, Tabs, Toolbar } from '@mui/material'

const tabs = [
	{ label: 'Vessel Tracking', to: '/vessels' },
	{ label: 'Cargo Tracking', to: '/cargo' },
]

export default function Layout() {
	const location = useLocation()
	const navigate = useNavigate()
	const currentIndex = useMemo(() => {
		if (location.pathname.startsWith('/cargo')) return 1
		return 0
	}, [location.pathname])

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
            <CssBaseline />
            <AppBar position="sticky" color="primary">
                <Toolbar sx={{ gap: 2, justifyContent: 'flex-start' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32, fontSize: 16 }}>ST</Avatar>
                    <Tabs
                        value={currentIndex}
                        textColor="inherit"
                        onChange={(_, idx) => navigate(tabs[idx].to)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        {tabs.map((t) => (
                            <Tab key={t.to} label={t.label} component={Link} to={t.to} />
                        ))}
                    </Tabs>
                </Toolbar>
            </AppBar>
            <Container maxWidth={false} sx={{ py: 4, px: 3 }}>
                <Suspense fallback={<div>Loading...</div>}>
                    <Outlet />
                </Suspense>
            </Container>
        </Box>
    )
}


