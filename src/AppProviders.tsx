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
        h4: { 
            fontWeight: 800,
            fontSize: 'clamp(1.5rem, 4vw, 2.125rem)',
        },
        h5: { 
            fontWeight: 800,
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
        },
        h6: { 
            fontWeight: 800,
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
        },
        subtitle1: {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
        },
        subtitle2: {
            fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
        },
        body1: {
            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
        },
        body2: {
            fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
        },
        caption: {
            fontSize: 'clamp(0.5rem, 1vw, 0.75rem)',
        },
        button: { 
            fontWeight: 700,
            fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
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
                root: { 
                    minHeight: 'clamp(48px, 8vh, 64px)',
                    padding: 'clamp(8px, 1.5vw, 16px)',
                },
            },
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: '1px solid rgba(2, 6, 23, 0.06)',
                    borderRadius: 'clamp(8px, 1.5vw, 12px)',
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: { 
                    height: 'clamp(2px, 0.4vh, 3px)', 
                    borderRadius: 3, 
                    backgroundColor: '#ffffff' 
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 700,
                    color: '#ffffff',
                    minHeight: 'clamp(40px, 6vh, 48px)',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    padding: 'clamp(8px, 1.5vw, 12px)',
                    opacity: 0.9,
                    transition: 'background-color 120ms ease, opacity 120ms ease',
                    '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8 },
                    '&.Mui-selected': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 8 },
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: { 
                    borderRadius: 'clamp(6px, 1vw, 10px)', 
                    backgroundColor: '#ffffff',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                },
            },
        },
        MuiAccordion: {
            defaultProps: { elevation: 0 },
            styleOverrides: {
                root: {
                    border: '1px solid rgba(2, 6, 23, 0.08)',
                    borderRadius: 'clamp(8px, 1.5vw, 12px)',
                    overflow: 'hidden',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: { 
                    borderRadius: 'clamp(6px, 1vw, 10px)',
                    fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
                    padding: 'clamp(6px, 1vw, 8px) clamp(12px, 2vw, 16px)',
                },
            },
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    padding: 'clamp(16px, 3vw, 24px)',
                    maxWidth: '100% !important',
                },
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: {
                    margin: 'clamp(8px, 2vw, 16px)',
                    maxWidth: 'calc(100vw - clamp(16px, 4vw, 32px))',
                    maxHeight: 'calc(100vh - clamp(16px, 4vw, 32px))',
                },
            },
        },
        MuiStepper: {
            styleOverrides: {
                root: {
                    '& .MuiStepLabel-label': {
                        fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
                    },
                    '& .MuiStepLabel-labelContainer': {
                        fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
                    },
                },
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


