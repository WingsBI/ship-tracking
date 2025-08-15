import { useEffect, useState } from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { useQuery } from "@tanstack/react-query";
import { Api } from "../lib/api";
import type { Terminal, Vessel } from "../lib/api";
import { useTerminalStore } from "../store/terminalStore";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";

function useTerminals() {
  return useQuery({ queryKey: ["terminals"], queryFn: Api.getTerminals });
}

function useVesselList(
  queryKey: string[],
  fetcher: (terminalCode: string) => Promise<Vessel[]>,
  terminalCode: string | null
) {
  return useQuery({
    queryKey: queryKey.concat(terminalCode ?? "none"),
    queryFn: async () => {
      if (terminalCode === "all" || terminalCode === "ALL") {
        // For "all", we'll need to get all vessels across all terminals
        // For now, return empty array since the API doesn't support this directly
        return [];
      }
      return fetcher(terminalCode as string);
    },
    enabled: Boolean(terminalCode),
  });
}

export default function VesselTrackingPage() {
  const [maximized, setMaximized] = useState<
    null | "arrivals" | "departures" | "port" | "anchorage"
  >(null);
  const { data: terminals } = useTerminals();
  const selectedTerminalId = useTerminalStore((s) => s.selectedTerminalId);
  const setSelectedTerminalId = useTerminalStore(
    (s) => s.setSelectedTerminalId
  );

  const expectedArrivals = useVesselList(
    ["vessels", "expected-arrivals"],
    Api.getVesselsByTerminal,
    selectedTerminalId
  );
  const imports = useVesselList(
    ["vessels", "imports"],
    Api.getVesselsByTerminal,
    selectedTerminalId
  );
  const departures = useVesselList(
    ["vessels", "expected-departures"],
    Api.getVesselsByTerminal,
    selectedTerminalId
  );
  const anchored = useVesselList(
    ["vessels", "anchored"],
    Api.getVesselsByTerminal,
    selectedTerminalId
  );

  useEffect(() => {
    if (!selectedTerminalId && terminals && terminals.length > 0) {
      // Always prefer "ALL" terminal if available, otherwise default to "all"
      const allTerminal = terminals.find(t => t.terminalCode === 'ALL')
      const defaultTerminal = allTerminal ? 'ALL' : 'all'
      setSelectedTerminalId(defaultTerminal)
    }
  }, [selectedTerminalId, terminals, setSelectedTerminalId]);

  return (
    <Stack gap={3}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Typography variant="h6" fontWeight={800}>
            Vessel Tracking
          </Typography>
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel id="terminal-label">Terminal</InputLabel>
            <Select
              labelId="terminal-label"
              label="Terminal"
              value={selectedTerminalId ?? ""}
              onChange={(e) => setSelectedTerminalId(e.target.value)}
            >
              {/* Only show manual "All" option if API doesn't provide one */}
              {!(terminals ?? []).some(t => t.terminalCode === 'ALL') && (
                <MenuItem key="all" value="all">
                  All
                </MenuItem>
              )}
              {(terminals ?? []).map((t: Terminal) => (
                <MenuItem key={t.terminalCode || t.terminalID} value={t.terminalCode || ''}>
                  {t.terminalName || 'Unknown Terminal'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          width: "100%",
          overflowX: "hidden",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <VesselPanel
            title="Expected Arrivals"
            color="#1e4b87"
            onMax={() => setMaximized("arrivals")}
          >
            <VesselTable
              items={expectedArrivals.data}
              loading={expectedArrivals.isLoading}
              height={300}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <VesselPanel
            title="Expected Departures"
            color="#6b3a1f"
            onMax={() => setMaximized("departures")}
          >
            <VesselTable
              items={departures.data}
              loading={departures.isLoading}
              height={300}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <VesselPanel
            title="Ships in Port"
            color="#49a6e9"
            onMax={() => setMaximized("port")}
          >
            <VesselTable
              items={imports.data}
              loading={imports.isLoading}
              height={300}
            />
          </VesselPanel>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <VesselPanel
            title="Ships in Anchorage"
            color="#148f5c"
            onMax={() => setMaximized("anchorage")}
          >
            <VesselTable
              items={anchored.data}
              loading={anchored.isLoading}
              height={300}
            />
          </VesselPanel>
        </Box>
      </Box>

      <Dialog
        fullScreen
        open={Boolean(maximized)}
        onClose={() => setMaximized(null)}
      >
        <AppBar color="primary" sx={{ position: "sticky" }}>
          <Toolbar>
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
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent>
          {maximized === "arrivals" && (
            <VesselTable
              items={expectedArrivals.data}
              loading={expectedArrivals.isLoading}
              height={640}
            />
          )}
          {maximized === "departures" && (
            <VesselTable
              items={departures.data}
              loading={departures.isLoading}
              height={640}
            />
          )}
          {maximized === "port" && (
            <VesselTable
              items={imports.data}
              loading={imports.isLoading}
              height={640}
            />
          )}
          {maximized === "anchorage" && (
            <VesselTable
              items={anchored.data}
              loading={anchored.isLoading}
              height={640}
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
  return (
    <Paper variant="outlined" sx={{ p: 0, overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1,
          bgcolor: color,
          color: "#fff",
        }}
      >
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
        <Tooltip title="Maximize">
          <IconButton onClick={onMax} size="small" sx={{ color: "#fff" }}>
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Paper>
  );
}

function VesselTable({
  items,
  loading,
  height = 380,
}: {
  items?: Vessel[];
  loading: boolean;
  height?: number;
}) {
  const columns: GridColDef[] = [
    { field: "vesselName", headerName: "Vessel Name", flex: 1, minWidth: 160 },
    { field: "vesselId", headerName: "Vessel ID", width: 120 },
    { field: "arrivalDate", headerName: "Arrival Date", width: 180, 
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '' },
    { field: "departureDate", headerName: "Departure Date", width: 180,
      valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '' },
  ];
  return (
    <Box
      sx={{
        height,
        width: "100%",
        "& .even": { bgcolor: "action.hover" },
        overflowX: "hidden",
        "& .MuiDataGrid-root": {
          "& .MuiDataGrid-virtualScroller": {
            "&::-webkit-scrollbar": { display: "none" },
            "-ms-overflow-style": "none",
            scrollbarWidth: "none",
          },
          "& .MuiDataGrid-virtualScrollerContent": {
            "&::-webkit-scrollbar": { display: "none" },
            "-ms-overflow-style": "none",
            scrollbarWidth: "none",
          },
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            "&::-webkit-scrollbar": { display: "none" },
            "-ms-overflow-style": "none",
            scrollbarWidth: "none",
          },
        },
        "& .MuiDataGrid-virtualScroller": {
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          scrollbarWidth: "none",
        },
        "& .MuiDataGrid-virtualScrollerContent": {
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          scrollbarWidth: "none",
        },
        "& .MuiDataGrid-virtualScrollerRenderZone": {
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          scrollbarWidth: "none",
        },
      }}
    >
      <DataGrid
        rows={(items ?? []).map((v) => ({ ...v, id: v.vesselId }))}
        loading={loading}
        columns={columns}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        disableColumnMenu
                  sx={{
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              minHeight: "40px !important",
              maxHeight: "40px !important",
            },
            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.875rem",
              padding: "8px 16px",
            },
            "& .MuiDataGrid-columnSeparator": {
              color: "rgba(255,255,255,0.25)",
            },
            "& .MuiDataGrid-virtualScroller": {
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-virtualScrollerContent": {
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-virtualScrollerRenderZone": {
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-main": {
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-root": {
              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-cell": {
              backgroundColor: "#ffffff !important",
              color: "#000000",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#ffffff !important",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#f5f5f5 !important",
            },
            "& .even": {
              backgroundColor: "#ffffff !important",
            },
            "& .odd": {
              backgroundColor: "#ffffff !important",
            },
          }}
      />
    </Box>
  );
}
