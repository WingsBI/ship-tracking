import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 30_000,
		},
	},
})

const theme = createTheme({
    palette: {
        mode: 'light',
        // Deep blue header like the screenshot
        primary: {
            main: '#183e8a',
            light: '#2a59b8',
            dark: '#102a5e',
            contrastText: '#ffffff',
        },
        // Lighter blue accent for indicators and highlights
        secondary: {
            main: '#43b0f1',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f3f6fb',
            paper: '#ffffff',
        },
        divider: 'rgba(2, 6, 23, 0.08)',
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'].join(','),
        h4: { fontWeight: 800 },
        h5: { fontWeight: 800 },
        h6: { fontWeight: 800 },
        button: { fontWeight: 700 },
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#183e8a',
                    color: '#ffffff',
                    boxShadow: 'none',
                },
            },
        },
        MuiToolbar: {
            styleOverrides: {
                root: { minHeight: 64 },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: '1px solid rgba(2, 6, 23, 0.06)',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: { height: 3, borderRadius: 3, backgroundColor: '#ffffff' },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#ffffff',
                    minHeight: 48,
                    opacity: 0.9,
                    transition: 'background-color 120ms ease, opacity 120ms ease',
                    '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
                    '&.Mui-selected': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 8 },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: { borderRadius: 10, backgroundColor: '#ffffff' },
            },
        },
        MuiAccordion: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: '1px solid rgba(2, 6, 23, 0.08)',
                    borderRadius: 12,
                    overflow: 'hidden',
                },
            },
        },
        MuiDataGrid: {
            styleOverrides: {
                columnHeaders: { backgroundColor: 'rgba(24,62,138,0.06)' },
                footerContainer: { backgroundColor: 'transparent' },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 10 },
            },
        },
    },
})

export function AppProviders({ children }: PropsWithChildren) {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</ThemeProvider>
	)
}


