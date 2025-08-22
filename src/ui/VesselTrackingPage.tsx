import { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useQuery } from "@tanstack/react-query";
import { Api } from "../lib/api";
import type { Terminal, VesselTrackingDto } from "../lib/api";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

function useTerminals() {
  return useQuery({ queryKey: ["terminals"], queryFn: Api.getTerminals });
}

function useVesselTracking(terminalCode: string | null) {
  return useQuery({
    queryKey: ["vessels", "tracking", terminalCode ?? "ALL"],
    queryFn: async () => {
      const codeToUse =
        !terminalCode || terminalCode.toUpperCase() === "ALL"
          ? null
          : terminalCode;
      return Api.getVesselTrackingByTerminal(codeToUse);
    },
    enabled: true,
  });
}

export default function VesselTrackingPage() {
  const [maximized, setMaximized] = useState<
    null | "arrivals" | "departures" | "port" | "anchorage"
  >(null);
  const { data: terminals } = useTerminals();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));

  // Separate terminal selection for Vessel page
  const [selectedTerminalCode, setSelectedTerminalCode] = useState<string | "">(
    ""
  );

  const tracking = useVesselTracking(selectedTerminalCode || "ALL");
  const tileCategories = tracking.data?.tileCategories ?? [];
  const getVessels = (name: string): VesselTrackingDto[] =>
    tileCategories.find(
      (t) => (t.tileCategory || "").toLowerCase() === name.toLowerCase()
    )?.vessels ?? [];

  useEffect(() => {
    if (!selectedTerminalCode && terminals && terminals.length > 0) {
      const hasAll = terminals.some((t) => t.terminalCode === "ALL");
      const defaultCode = hasAll ? "ALL" : "";
      setSelectedTerminalCode(defaultCode);
    }
  }, [selectedTerminalCode, terminals]);

  return (
    <Stack
      gap={{ xs: 0.5, sm: 0.75, md: 1 }}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        height: "calc(100vh - 120px)",
        justifyContent: "flex-start",
      }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 0.5, sm: 0.75 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={{ xs: 1, sm: 1.5 }}
          sx={{
            width: "100%",
            padding: { xs: "4px", sm: "6px" },
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{
              fontSize: { xs: "0.875rem", sm: "1rem" },
              textAlign: { xs: "center", sm: "left" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Vessel Tracking
          </Typography>
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 200, md: 220 },
              maxWidth: { xs: "100%", sm: "none" },
              "& .MuiOutlinedInput-root": {
                borderRadius: "6px",
                backgroundColor: "#ffffff",
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#183e8a",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#183e8a",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#666666",
                fontSize: "0.875rem",
              },
            }}
          >
            <InputLabel id="terminal-label">Terminal</InputLabel>
            <Select
              labelId="terminal-label"
              label="Terminal"
              value={selectedTerminalCode}
              onChange={(e) => setSelectedTerminalCode(e.target.value)}
            >
              {/* Only show manual "All" option if API doesn't provide one */}
              {!(terminals ?? []).some((t) => t.terminalCode === "ALL") && (
                <MenuItem key="all" value="">
                  All
                </MenuItem>
              )}
              {(terminals ?? []).map((t: Terminal) => (
                <MenuItem
                  key={t.terminalCode || t.terminalID}
                  value={t.terminalCode || ""}
                >
                  {t.terminalName || "Unknown Terminal"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr",
            lg: "1fr 1fr",
            xl: "1fr 1fr",
          },
          gridTemplateRows: {
            xs: `repeat(4, 1fr)`,
            sm: `repeat(2, 1fr)`,
            md: `repeat(2, 1fr)`,
            lg: `repeat(2, 1fr)`,
            xl: `repeat(2, 1fr)`,
          },
          gap: { xs: 0.5, sm: 0.75, md: 1 },
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          height: "100%",
        }}
      >
        <Box sx={{ minWidth: 0, width: "100%", height: "100%" }}>
          <VesselPanel
            title="Expected Arrivals"
            color="#1e4b87"
            onMax={() => setMaximized("arrivals")}
          >
            <VesselTable
              items={getVessels("Expected Arrivals")}
              loading={tracking.isLoading}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0, width: "100%", height: "100%" }}>
          <VesselPanel
            title="Expected Departures"
            color="#6b3a1f"
            onMax={() => setMaximized("departures")}
          >
            <VesselTable
              items={getVessels("Expected Departures")}
              loading={tracking.isLoading}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0, width: "100%", height: "100%" }}>
          <VesselPanel
            title="Ships in Port"
            color="#49a6e9"
            onMax={() => setMaximized("port")}
          >
            <VesselTable
              items={getVessels("Ships in Port")}
              loading={tracking.isLoading}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0, width: "100%", height: "100%" }}>
          <VesselPanel
            title="Ships in Anchorage"
            color="#148f5c"
            onMax={() => setMaximized("anchorage")}
          >
            <VesselTable
              items={getVessels("Ships in Anchorage")}
              loading={tracking.isLoading}
            />
          </VesselPanel>
        </Box>
      </Box>

      <Dialog
        fullScreen
        open={Boolean(maximized)}
        onClose={() => setMaximized(null)}
        sx={{
          "& .MuiDialog-paper": {
            margin: 0,
            maxWidth: "100vw",
            maxHeight: "100vh",
          },
        }}
      >
        <AppBar color="primary" sx={{ position: "sticky" }}>
          <Toolbar
            sx={{
              minHeight: { xs: "48px", sm: "56px", md: "64px" },
              padding: { xs: "8px 12px", sm: "12px 16px", md: "16px 24px" },
            }}
          >
            <Typography sx={{ flex: 1 }} variant="h6">
              {maximized === "arrivals"
                ? "Expected Arrivals"
                : maximized === "departures"
                ? "Expected Departures"
                : maximized === "port"
                ? "Ships in Port"
                : "Ships in Anchorage"}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setMaximized(null)}
              aria-label="close"
              size={isMobile ? "small" : "medium"}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent
          sx={{
            padding: { xs: 1, sm: 2, md: 3 },
            height: "calc(100vh - 64px)",
            overflow: "hidden",
          }}
        >
          {maximized === "arrivals" && (
            <VesselTable
              items={getVessels("Expected Arrivals")}
              loading={tracking.isLoading}
              isMaximized={true}
            />
          )}
          {maximized === "departures" && (
            <VesselTable
              items={getVessels("Expected Departures")}
              loading={tracking.isLoading}
              isMaximized={true}
            />
          )}
          {maximized === "port" && (
            <VesselTable
              items={getVessels("Ships in Port")}
              loading={tracking.isLoading}
              isMaximized={true}
            />
          )}
          {maximized === "anchorage" && (
            <VesselTable
              items={getVessels("Ships in Anchorage")}
              loading={tracking.isLoading}
              isMaximized={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function VesselPanel({
  title,
  color,
  onMax,
  children,
}: {
  title: string;
  color: string;
  onMax: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 0,
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 0.5, sm: 0.75, md: 1 },
          py: { xs: 0.25, sm: 0.5 },
          bgcolor: color,
          color: "#fff",
          minHeight: { xs: "32px", sm: "36px", md: "40px" },
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{
            fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
          }}
        >
          {title}
        </Typography>
        <Tooltip title="Maximize">
          <IconButton
            onClick={onMax}
            size={isMobile ? "small" : "medium"}
            sx={{
              color: "#fff",
              padding: { xs: "2px", sm: "4px" },
            }}
          >
            <OpenInFullIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

function VesselTable({
  items,
  loading,
  isMaximized = false,
}: {
  items?: VesselTrackingDto[];
  loading: boolean;
  isMaximized?: boolean;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Calculate responsive sizes based on zoom and screen size
  const getResponsiveSizes = () => {
    const baseRowHeight = isMobile ? 28 : isTablet ? 32 : 36;
    const baseHeaderHeight = isMobile ? 32 : isTablet ? 36 : 40;
    const baseFontSize = isMobile ? 0.7 : isTablet ? 0.75 : 0.8;

    return {
      rowHeight: Math.max(24, Math.round(baseRowHeight)),
      headerHeight: Math.max(28, Math.round(baseHeaderHeight)),
      fontSize: Math.max(0.6, Math.min(0.9, baseFontSize)),
    };
  };

  const sizes = getResponsiveSizes();

  const columns: GridColDef[] = [
    {
      field: "vesselName",
      headerName: "Vessel Name",
      flex: 1,
      minWidth: isMobile ? 120 : 160,
      maxWidth: isMobile ? 200 : undefined,
    },
    {
      field: "imo",
      headerName: "IMO",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "calluid",
      headerName: "Call UID",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "terminal",
      headerName: "Terminal",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "voyageIn",
      headerName: "Voy-In",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "voyageOut",
      headerName: "Voy-Out",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "berth",
      headerName: "Berth",
      width: isMobile ? 60 : 80,
      hideable: true,
    },
    {
      field: "callStatus",
      headerName: "Status",
      width: isMobile ? 80 : 100,
      hideable: true,
    },
    {
      field: "eta",
      headerName: "ETA",
      width: isMobile ? 120 : 150,
      valueFormatter: (value) =>
        value
          ? new Date(value)
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", " ")
          : "",
      hideable: true,
    },
    {
      field: "etd",
      headerName: "ETD",
      width: isMobile ? 120 : 150,
      valueFormatter: (value) =>
        value
          ? new Date(value)
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", " ")
          : "",
      hideable: true,
    },
    {
      field: "ata",
      headerName: "ATA",
      width: isMobile ? 120 : 150,
      valueFormatter: (value) =>
        value
          ? new Date(value)
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", " ")
          : "",
      hideable: true,
    },
    {
      field: "atd",
      headerName: "ATD",
      width: isMobile ? 120 : 150,
      valueFormatter: (value) =>
        value
          ? new Date(value)
              .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
              .replace(",", " ")
          : "",
      hideable: true,
    },
  ];

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        p: { xs: 0.5, sm: 0.75, md: 1 },
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
        "&::-webkit-scrollbar": {
          display: "none", // Webkit
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: { xs: 4, sm: 6, md: 8 },
          left: { xs: 4, sm: 6, md: 8 },
          right: { xs: 4, sm: 6, md: 8 },
          bottom: { xs: 4, sm: 6, md: 8 },
          overflow: "hidden",
          scrollbarWidth: "none", // Firefox - hide scrollbar
          msOverflowStyle: "none", // IE/Edge - hide scrollbar
          "&::-webkit-scrollbar": {
            display: "none", // Webkit - hide scrollbar
          },
        }}
      >
        <DataGrid
          rows={(items ?? []).map((v, idx) => ({
            ...v,
            id: (v as any).callId ?? idx,
          }))}
          loading={loading}
          columns={columns}
          hideFooter
          density="compact"
          rowHeight={sizes.rowHeight}
          columnHeaderHeight={sizes.headerHeight}
          disableRowSelectionOnClick
          disableColumnMenu
          disableVirtualization={false}
          autoHeight={false}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
          }
          sx={{
            border: "none",
            height: "100% !important",
            width: "100% !important",
            fontSize: `${sizes.fontSize}rem`,
            // Hide all possible scrollbars globally
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge  
            "&::-webkit-scrollbar": {
              display: "none !important", // Webkit
            },
            "& *": {
              scrollbarWidth: "none !important", // Firefox - all children
              msOverflowStyle: "none !important", // IE/Edge - all children
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit - all children
              },
            },
            "& .MuiDataGrid-root": {
              height: "100% !important",
              overflow: "hidden !important",
              scrollbarWidth: "none !important", // Firefox
              msOverflowStyle: "none !important", // IE/Edge
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit
              },
            },
            "& .MuiDataGrid-main": {
              height: "100% !important",
              overflow: "hidden !important",
              scrollbarWidth: "none !important", // Firefox
              msOverflowStyle: "none !important", // IE/Edge
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit
              },
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              minHeight: `${sizes.headerHeight}px !important`,
              maxHeight: `${sizes.headerHeight}px !important`,
              fontSize: `${sizes.fontSize}rem`,
              borderBottom: "none !important",
            },
            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: `${sizes.fontSize}rem`,
              padding: "4px 8px",
              borderRight: "none !important",
              borderBottom: "none !important",
            },
            "& .MuiDataGrid-columnSeparator": {
              display: "none !important",
            },
            "& .MuiDataGrid-cell": {
              fontSize: `${sizes.fontSize}rem`,
              padding: "4px 8px",
              backgroundColor: "#ffffff !important",
              color: "#000000",
              border: "none !important",
              borderBottom: "none !important",
              borderRight: "none !important",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#ffffff !important",
              minHeight: `${sizes.rowHeight}px !important`,
              maxHeight: `${sizes.rowHeight}px !important`,
              border: "none !important",
              "&:hover": {
                backgroundColor: "#f0f8ff !important",
                "& .MuiDataGrid-cell": {
                  backgroundColor: "#f0f8ff !important",
                },
              },
            },
            "& .MuiDataGrid-virtualScroller": {
              height: "calc(100% - ${sizes.headerHeight}px) !important",
              maxHeight: "calc(100% - ${sizes.headerHeight}px) !important",
              overflow: "auto !important",
              scrollbarWidth: "none !important", // Firefox
              msOverflowStyle: "none !important", // IE/Edge
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit
              },
            },
            "& .MuiDataGrid-virtualScrollerContent": {
              height: "auto !important",
              minHeight: "auto !important",
              scrollbarWidth: "none !important", // Firefox
              msOverflowStyle: "none !important", // IE/Edge
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit
              },
            },
            "& .MuiDataGrid-virtualScrollerRenderZone": {
              height: "auto !important",
              minHeight: "auto !important",
              scrollbarWidth: "none !important", // Firefox
              msOverflowStyle: "none !important", // IE/Edge
              "&::-webkit-scrollbar": {
                display: "none !important", // Webkit
              },
            },
            "& .MuiDataGrid-footerContainer": {
              display: "none !important",
            },
            // Additional MUI DataGrid scrollable elements
            "& .MuiDataGrid-window": {
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important", 
              "&::-webkit-scrollbar": {
                display: "none !important",
              },
            },
            "& .MuiDataGrid-viewport": {
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important", 
              "&::-webkit-scrollbar": {
                display: "none !important",
              },
            },
            "& .MuiDataGrid-overlay": {
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important", 
              "&::-webkit-scrollbar": {
                display: "none !important",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}