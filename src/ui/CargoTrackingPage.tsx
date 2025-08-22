import { useEffect, useMemo, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { Api } from "../lib/api";
import type { Cargo, CargoTrackingDetailResponse, Terminal } from "../lib/api";

function useTerminals() {
  return useQuery({ queryKey: ["terminals"], queryFn: Api.getTerminals });
}

export default function CargoTrackingPage() {
  const { data: terminals } = useTerminals();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));

  // Get zoom level for dynamic sizing
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleZoom = () => {
      const zoom = window.visualViewport?.scale || window.devicePixelRatio || 1;
      setZoomLevel(zoom);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleZoom);
    }
    handleZoom();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleZoom);
      }
    };
  }, []);

  const [selectedTerminalCode, setSelectedTerminalCode] = useState<string | "">(
    ""
  );

  const [selectedCargoId, setSelectedCargoId] = useState<string | null>(null);
  const [searchString, setSearchString] = useState<string>("");
  const [debouncedSearchString, setDebouncedSearchString] =
    useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Debounce search input
  useEffect(() => {
    if (searchString !== debouncedSearchString) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchString(searchString);
      setIsSearching(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchString, debouncedSearchString]);

  const cargoQuery = useQuery({
    queryKey: ["cargo", selectedTerminalCode || "all", debouncedSearchString],
    queryFn: async () => {
      // If there's a specific search term, use the API search endpoint
      if (debouncedSearchString.trim()) {
        // Check if search term is numeric (likely a cargo ID)
        const isNumeric = /^\d+$/.test(debouncedSearchString.trim());

        if (isNumeric) {
          // Search by cargo ID first using API
          try {
            const apiResults = await Api.searchCargo({
              searchString: debouncedSearchString,
              operator: "Equals",
              terminalCode:
                !selectedTerminalCode || selectedTerminalCode === "ALL"
                  ? undefined
                  : selectedTerminalCode,
            });
            if (apiResults.length > 0) {
              return apiResults;
            }
          } catch (error) {
            console.log("API search failed, falling back to client search");
          }
        }

        // Fallback to client-side search for other fields
        let allCargo = [];
        if (!selectedTerminalCode || selectedTerminalCode === "ALL") {
          allCargo = await Api.getCargoByTerminal();
        } else {
          allCargo = await Api.getCargoByTerminal(selectedTerminalCode);
        }

        const searchLower = debouncedSearchString.toLowerCase().trim();
        return allCargo.filter((cargo) => {
          return (
            cargo.blNumber?.toLowerCase().includes(searchLower) ||
            cargo.cargoID.toString().includes(searchLower) ||
            cargo.containerID?.toLowerCase().includes(searchLower) ||
            cargo.mvvin?.toLowerCase().includes(searchLower) ||
            cargo.terminal?.toLowerCase().includes(searchLower) ||
            cargo.cargoType?.toLowerCase().includes(searchLower)
          );
        });
      }

      // No search term - load all cargo
      if (!selectedTerminalCode || selectedTerminalCode === "ALL") {
        return Api.getCargoByTerminal();
      } else {
        return Api.getCargoByTerminal(selectedTerminalCode);
      }
    },
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes (renamed from cacheTime in newer versions)
  });

  const trackingQuery = useQuery({
    queryKey: ["cargo-tracking", selectedCargoId ?? "none"],
    queryFn: async () => {
      console.log("Fetching tracking for cargoId:", selectedCargoId);
      const result = await Api.getCargoTracking(Number(selectedCargoId));
      console.log("Tracking data received:", result);
      return result;
    },
    enabled: Boolean(selectedCargoId),
  });

  useEffect(() => {
    if (!selectedTerminalCode && terminals && terminals.length > 0) {
      const allTerminal = terminals.find((t) => t.terminalCode === "ALL");
      const defaultCode = allTerminal ? "ALL" : "";
      console.log("Setting default cargo terminal to:", defaultCode);
      setSelectedTerminalCode(defaultCode);
    }
  }, [selectedTerminalCode, terminals]);

     // Default bottom grid to first cargo of the top grid when available
   useEffect(() => {
     if (
       cargoQuery.data &&
       Array.isArray(cargoQuery.data) &&
       cargoQuery.data.length > 0
     ) {
       // Always select the first cargo when data changes, or if no cargo is selected
       if (!selectedCargoId) {
         const firstCargoId = cargoQuery.data[0].cargoID.toString();
         console.log("Auto-selecting first cargo:", firstCargoId);
         setSelectedCargoId(firstCargoId);
       }
     } else {
       // Clear selected cargo when there are no rows
       if (selectedCargoId) {
         console.log("Clearing selected cargo - no rows available");
         setSelectedCargoId(null);
       }
     }
   }, [cargoQuery.data, selectedCargoId]);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "blNumber",
        headerName: "BL Number",
        flex: 1.1,
        minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(120 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "cargoType",
        headerName: "Type",
        flex: 0.7,
        minWidth: Math.round((isMobile ? 60 : 90) * zoomLevel),
        maxWidth: isMobile ? Math.round(80 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "terminal",
        headerName: "Terminal",
        flex: 0.9,
        minWidth: Math.round((isMobile ? 70 : 90) * zoomLevel),
        maxWidth: isMobile ? Math.round(90 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "qtyOrdered",
        headerName: "Qty Ordered",
        flex: 0.9,
        minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
        type: "number",
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "totalQtyHandled",
        headerName: "Qty Handled",
        flex: 0.9,
        minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
        type: "number",
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "containerID",
        headerName: "Container ID",
        flex: 1.1,
        minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(120 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "mvvin",
        headerName: "MV VIN",
        flex: 1.0,
        minWidth: Math.round((isMobile ? 70 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
        hideable: true,
      },
      {
        field: "gcmarks",
        headerName: "GC Marks",
        flex: 1.0,
        minWidth: Math.round((isMobile ? 70 : 110) * zoomLevel),
        maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
        align: "center",
        headerAlign: "center",
        valueGetter: (_v, row) => (row as any)?.gcmarks || "",
        hideable: true,
      },
    ],
    [isMobile, zoomLevel]
  );

  const rowH = Math.round((isMobile ? 24 : isTablet ? 28 : 32) * zoomLevel);
  const headerH = Math.round((isMobile ? 28 : isTablet ? 32 : 36) * zoomLevel);
  const baseRem = `${Math.max(0.625, Math.min(0.875, 0.75 * zoomLevel))}rem`;

  const rawColumns: GridColDef[] = [
    {
      field: "blNumber",
      headerName: "BL Number",
      flex: 1.1,
      minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(120 * zoomLevel) : undefined,
    },
    {
      field: "cargoType",
      headerName: "Type",
      flex: 0.7,
      minWidth: Math.round((isMobile ? 60 : 90) * zoomLevel),
      maxWidth: isMobile ? Math.round(80 * zoomLevel) : undefined,
      hideable: true,
    },
    {
      field: "terminal",
      headerName: "Terminal",
      flex: 0.9,
      minWidth: Math.round((isMobile ? 70 : 90) * zoomLevel),
      maxWidth: isMobile ? Math.round(90 * zoomLevel) : undefined,
      hideable: true,
    },
    {
      field: "qtyOrdered",
      headerName: "Qty Ordered",
      flex: 0.9,
      minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
      type: "number",
      hideable: true,
    },
    {
      field: "totalQtyHandled",
      headerName: "Qty Handled",
      flex: 0.9,
      minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
      type: "number",
      hideable: true,
    },
    {
      field: "containerID",
      headerName: "Container ID",
      flex: 1.1,
      minWidth: Math.round((isMobile ? 80 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(120 * zoomLevel) : undefined,
      hideable: true,
    },
    {
      field: "mvvin",
      headerName: "MV VIN",
      flex: 1.0,
      minWidth: Math.round((isMobile ? 70 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
      hideable: true,
    },
    {
      field: "gcmarks",
      headerName: "GC Marks",
      flex: 1.0,
      minWidth: Math.round((isMobile ? 70 : 110) * zoomLevel),
      maxWidth: isMobile ? Math.round(100 * zoomLevel) : undefined,
      valueGetter: (_v, row) => (row as any)?.gcmarks || "",
      hideable: true,
    },
  ];

  // const columns: GridColDef[] = useMemo(
  //   () => rawColumns.map((c) => ({ ...c, align: "left", headerAlign: "left" })),
  //   [isMobile, zoomLevel]
  // );

  return (
    <Stack
      gap={{ xs: 1, sm: 1.5, md: 2 }}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        height: "100%",
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
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Cargo Tracking
          </Typography>
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={{ xs: 0.75, sm: 1 }}
            sx={{ width: "100%", maxWidth: { xs: "100%", md: 680 } }}
          >
            <FormControl
              size="small"
              sx={{
                minWidth: { xs: "100%", sm: 180, md: 200 },
                maxWidth: { xs: "100%", sm: "none" },
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
            <TextField
              size="small"
              label="Search"
              placeholder={
                isMobile
                  ? "Search cargo..."
                  : "Search by BL Number, Cargo ID, Container ID, VIN, Terminal"
              }
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchString && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchString("")}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          height: "100%",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <DataGrid
          rows={
            Array.isArray(cargoQuery.data)
              ? cargoQuery.data.map((c: Cargo) => ({ ...c, id: c.cargoID }))
              : []
          }
          loading={cargoQuery.isLoading || isSearching}
          columns={columns}
          hideFooter
          density="compact"
          rowHeight={rowH}
          columnHeaderHeight={headerH}
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={(params) =>
            setSelectedCargoId(params.row.cargoID.toString())
          }
          getRowClassName={(params) =>
            params.row.cargoID.toString() === selectedCargoId
              ? "cargo-row-selected"
              : ""
          }
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  fontSize: baseRem,
                  color: "text.secondary",
                }}
              >
                No records found
              </Box>
            ),
          }}
          sx={{
            fontSize: baseRem,
            height: "100% !important",
            width: "100% !important",
            border: "none",
            borderRadius: "8px 8px 8px 8px",
            overflow: "hidden",

            // hide scrollbars on the grid and descendants
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
            "& *": {
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important",
              "&::-webkit-scrollbar": { display: "none !important" },
            },

            // Root & main can be hidden; the scroller must be scrollable
            "& .MuiDataGrid-root": {
              height: "100% !important",
              overflow: "hidden !important",
              borderRadius: "8px 8px 8px 8px",
            },
            "& .MuiDataGrid-main": {
              height: "100% !important",
              overflow: "hidden !important",
              borderRadius: "8px 8px 8px 8px",
            },

            // ✅ allow scrolling here; hide only the bars
            "& .MuiDataGrid-virtualScroller": {
              height: `calc(100% - ${headerH}px) !important`,
              maxHeight: `calc(100% - ${headerH}px) !important`,
              overflow: "auto !important",
              scrollbarWidth: "none !important",
              msOverflowStyle: "none !important",
              "&::-webkit-scrollbar": { display: "none !important" },
            },

            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              minHeight: `${headerH}px !important`,
              maxHeight: `${headerH}px !important`,
              fontSize: `${Math.max(0.75, Math.min(1, 0.875 * zoomLevel))}rem`,
              borderBottom: "none !important",
              display: "flex",
              alignItems: "center",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
            },

            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 800,
              padding: `${Math.round(2 * zoomLevel)}px ${Math.round(
                4 * zoomLevel
              )}px`,
              borderRight: "none !important",
              borderBottom: "none !important",
              // ⛔️ no justifyContent center here — lets headerAlign: "left" work
            },

            "& .MuiDataGrid-columnSeparator": { display: "none !important" },

            "& .MuiDataGrid-cell": {
              backgroundColor: "#ffffff !important",
              color: "#000000",
              border: "none !important",
              fontSize: baseRem,
              padding: `${Math.round(2 * zoomLevel)}px ${Math.round(
                4 * zoomLevel
              )}px`,
              // left alignment comes from column defs
            },

            "& .MuiDataGrid-row": {
              backgroundColor: "#ffffff !important",
              minHeight: `${rowH}px !important`,
              maxHeight: `${rowH}px !important`,
              "&:hover": {
                backgroundColor: "#f0f8ff !important",
                "& .MuiDataGrid-cell": {
                  backgroundColor: "#f0f8ff !important",
                },
              },
            },

            // keep your selected-row highlight with the left accent bar
            "& .cargo-row-selected": {
              backgroundColor: "rgba(24,62,138,0.15) !important",
              boxShadow: "inset 4px 0 0 #183e8a !important",
              minHeight: `${rowH}px !important`,
              maxHeight: `${rowH}px !important`,
              "& .MuiDataGrid-cell": {
                backgroundColor: "transparent !important",
                fontWeight: "600 !important",
              },
              "&:hover": {
                backgroundColor: "rgba(24,62,138,0.2) !important",
              },
            },

            "& .MuiDataGrid-footerContainer": { display: "none !important" },

            // Ensure last row has proper bottom border radius
            "& .MuiDataGrid-row:last-child": {
              "& .MuiDataGrid-cell:first-of-type": {
                borderBottomLeftRadius: "8px",
              },
              "& .MuiDataGrid-cell:last-of-type": {
                borderBottomRightRadius: "8px",
              },
            },
          }}
        />
      </Box>

             {selectedCargoId && Array.isArray(cargoQuery.data) && cargoQuery.data.length > 0 && (
         <Paper
           variant="outlined"
           sx={{
             p: { xs: 0.5, sm: 0.75 },
             minHeight: { xs: "170px", sm: "190px", md: "217px" },
             height: { xs: "170px", sm: "190px", md: "217px" },
             maxHeight: { xs: "170px", sm: "190px", md: "217px" },
             overflow: "hidden",
           }}
         >
          <Typography
            variant="subtitle1"
            fontWeight={800}
            sx={{
              mb: { xs: 0.75, sm: 1 },
              fontSize: { xs: "0.875rem", sm: "1rem" },
              ml: { xs: 0.5, sm: 1 },
            }}
          >
            Shipment Progress
            {selectedCargoId && (
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                sx={{
                  ml: { xs: 0.5, sm: 1 },
                  fontSize: { xs: "0.625rem", sm: "0.75rem" },
                }}
              >
                (Cargo ID: {selectedCargoId})
              </Typography>
            )}
          </Typography>
          <Box
            sx={{
              height: "calc(100% - 40px)",
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollbarWidth: "none",
              "-ms-overflow-style": "none",
              "&::-webkit-scrollbar": {
                width: "0px",
                height: "0px",
                display: "none",
              },
            }}
          >
            {trackingQuery.isLoading && (
              <Typography
                color="text.secondary"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Loading tracking data...
              </Typography>
            )}
            {trackingQuery.error && (
              <Typography
                color="error"
                sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
              >
                Error loading tracking data. Please try selecting another cargo.
              </Typography>
            )}
            {!trackingQuery.isLoading &&
              !trackingQuery.error &&
              !trackingQuery.data && (
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  Select a cargo to see tracking
                </Typography>
              )}
            {trackingQuery.data &&
              trackingQuery.data.trackingDetails &&
              trackingQuery.data.trackingDetails.length > 0 && (
                <Box sx={{ width: "100%", height: "100%" }}>
                  <ShipmentStepper
                    events={trackingQuery.data.trackingDetails}
                  />
                </Box>
              )}
            {trackingQuery.data &&
              (!trackingQuery.data.trackingDetails ||
                trackingQuery.data.trackingDetails.length === 0) && (
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  No tracking data available for this cargo.
                </Typography>
              )}
          </Box>
        </Paper>
      )}
    </Stack>
  );
}

const QConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark"
        ? theme.palette.grey[800]
        : "rgba(24,62,138,0.2)",
    borderRadius: 1,
  },
}));

function ShipmentStepper({
  events,
}: {
  events: CargoTrackingDetailResponse["trackingDetails"];
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  if (!events || events.length === 0) {
    return (
      <Typography
        color="text.secondary"
        sx={{
          textAlign: "center",
          py: { xs: 2, sm: 3, md: 4 },
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
        }}
      >
        No tracking events available
      </Typography>
    );
  }

  // Sort events by eventNo to ensure correct order
  const sortedEvents = [...events].sort((a, b) => a.eventNo - b.eventNo);

  // Extract vessel name from the first event description if available
  const getVesselName = (description: string | null) => {
    if (!description) return null;
    const vesselMatch = description.match(/\[MV\s+([^\]]+)\]/);
    return vesselMatch ? vesselMatch[1].split(":")[0] : null;
  };

  // Get main label from event description
  const getEventLabel = (description: string | null) => {
    if (!description) return "Unknown Event";

    // Extract the main action from the description
    if (description.includes("expected to arrive"))
      return "Vessel Expected to Arrive";
    if (
      description.includes("was created") &&
      description.includes("Vessel call")
    )
      return "Vessel Call Created";
    if (
      description.includes("Reception Order") &&
      description.includes("was created")
    )
      return "Reception Order Created";
    if (
      description.includes("Loading Order") &&
      description.includes("was created")
    )
      return "Loading Order Created";
    if (
      description.includes("Discharge Order") &&
      description.includes("was created")
    )
      return "Discharge Order Created";
    if (
      description.includes("Delivery Order") &&
      description.includes("was created")
    )
      return "Delivery Order Created";
    if (description.includes("arrived")) return "Vessel Arrived";
    if (description.includes("departed")) return "Vessel Departed";
    if (description.includes("customs")) return "Customs Processing";
    if (description.includes("loaded")) return "Cargo Loaded";
    if (description.includes("discharged")) return "Cargo Discharged";
    if (description.includes("delivered")) return "Cargo Delivered";

    // Fallback to first part of description
    return description.split(" ").slice(0, 3).join(" ") + "...";
  };

  // Extract order number if available
  const getOrderNumber = (description: string | null) => {
    if (!description) return null;
    const orderMatch = description.match(/\[([A-Z0-9\/]+)\]/);
    return orderMatch ? orderMatch[1] : null;
  };

  const steps = sortedEvents.map((event) => {
    const vesselName = getVesselName(event.eventDescription);
    const orderNumber = getOrderNumber(event.eventDescription);
    const eventLabel = getEventLabel(event.eventDescription);
    const eventDate = new Date(event.eventDate);

    return {
      label: eventLabel,
      vessel: vesselName,
      order: orderNumber,
      date: eventDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: eventDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      fullDescription: event.eventDescription,
      eventNo: event.eventNo,
    };
  });

  const activeStep = steps.length - 1; // All events are considered completed
  const minWidth = Math.max(
    isMobile ? 600 : isTablet ? 800 : 1000,
    steps.length * (isMobile ? 200 : isTablet ? 240 : 280)
  );

  return (
    <Box
      sx={{
        overflowX: "auto",
        pb: { xs: 1, sm: 2 },
        scrollbarWidth: "none",
        "-ms-overflow-style": "none",
        "&::-webkit-scrollbar": {
          width: "0px",
          height: "0px",
          display: "none",
        },
      }}
    >
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        connector={<QConnector />}
        sx={{
          minWidth,
          px: { xs: 0.5, sm: 1 },
          "& .MuiStepLabel-label": {
            fontSize: { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" },
          },
          "& .MuiStepLabel-labelContainer": {
            fontSize: { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" },
          },
        }}
      >
        {steps.map((step) => (
          <Step key={step.eventNo} completed={true}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-labelContainer": {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  maxWidth: { xs: 180, sm: 220, md: 250 },
                  minWidth: { xs: 150, sm: 180, md: 200 },
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    mb: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" },
                  }}
                >
                  {step.label}
                </Typography>

                {step.vessel && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "primary.main",
                      fontWeight: 600,
                      mb: { xs: 0.25, sm: 0.5 },
                      fontSize: { xs: "0.5rem", sm: "0.625rem", md: "0.75rem" },
                    }}
                  >
                    Vessel: {step.vessel}
                  </Typography>
                )}

                {step.order && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      fontFamily: "monospace",
                      mb: { xs: 0.25, sm: 0.5 },
                      fontSize: { xs: "0.5rem", sm: "0.625rem", md: "0.75rem" },
                    }}
                  >
                    Order: {step.order}
                  </Typography>
                )}

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 500,
                    fontSize: { xs: "0.5rem", sm: "0.625rem", md: "0.75rem" },
                  }}
                >
                  {step.date} • {step.time}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.disabled",
                    mt: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: "0.4rem", sm: "0.5rem", md: "0.7rem" },
                  }}
                >
                  Event #{step.eventNo}
                </Typography>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
