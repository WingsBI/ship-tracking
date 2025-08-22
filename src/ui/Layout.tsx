import { Suspense, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";

const tabs = [
  { label: "Vessel Tracking", to: "/vessels" },
  { label: "Cargo Tracking", to: "/cargo" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentIndex = useMemo(() => {
    if (location.pathname.startsWith("/cargo")) return 1;
    return 0;
  }, [location.pathname]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "background.default",
        overflow: "hidden",
        width: "100%",
        maxWidth: "100vw",
      }}
    >
      <CssBaseline />
      <AppBar position="sticky" color="primary">
        <Toolbar
          sx={{
            gap: { xs: 0.5, sm: 1 },
            justifyContent: "flex-start",
            minHeight: { xs: "44px", sm: "48px", md: "56px" },
            padding: { xs: "5px 8px", sm: "8px 12px", md: "11px 15px" },
          }}
        >
          <Avatar
            sx={{
              bgcolor: "secondary.main",
              width: { xs: 24, sm: 28, md: 32 },
              height: { xs: 24, sm: 28, md: 32 },
              fontSize: { xs: 12, sm: 14, md: 16 },
            }}
          >
            ST
          </Avatar>
          <Tabs
            value={currentIndex}
            textColor="inherit"
            onChange={(_, idx) => navigate(tabs[idx].to)}
            variant={isMobile ? "fullWidth" : "scrollable"}
            scrollButtons={isMobile ? false : "auto"}
            sx={{
              minHeight: { xs: "32px", sm: "36px" },
              "& .MuiTab-root": {
                minHeight: { xs: "32px", sm: "36px" },
                fontSize: { xs: "0.7rem", sm: "0.8rem" },
                padding: { xs: "4px 6px", sm: "6px 10px" },
              },
            }}
          >
            {tabs.map((t) => (
              <Tab
                key={t.to}
                label={t.label}
                component={Link}
                to={t.to}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  minWidth: { xs: "auto", sm: "100px" },
                }}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 1, sm: 1.5, md: 2 },
          px: { xs: 1, sm: 1.5, md: 2 },
          flex: 1,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              Loading...
            </Box>
          }
        >
          <Outlet />
        </Suspense>
      </Container>
    </Box>
  );
}
