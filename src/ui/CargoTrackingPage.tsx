import { useEffect, useMemo, useState, useCallback } from "react";
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
  Tooltip,
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

  // Debounce search input with faster response
  useEffect(() => {
    if (searchString !== debouncedSearchString) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchString(searchString);
      setIsSearching(false);
    }, 300); // Reduced to 300ms for faster response

    return () => clearTimeout(timer);
  }, [searchString, debouncedSearchString]);

  const cargoQuery = useQuery({
    queryKey: ["cargo", selectedTerminalCode || "all"],
    queryFn: async () => {
      console.log("🔄 Cargo API called with:", { selectedTerminalCode });
      
      // Always load terminal-specific cargo (no API search)
      const result = !selectedTerminalCode || selectedTerminalCode === "ALL"
        ? await Api.getCargoByTerminal()
        : await Api.getCargoByTerminal(selectedTerminalCode);
      
      console.log("✅ Terminal cargo loaded:", result.length, "records");
      return result;
    },
    enabled: Boolean(selectedTerminalCode), // Only enable when terminal is selected
    staleTime: 300000, // 5 minutes cache
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Reduce retry attempts
  });

  const trackingQuery = useQuery({
    queryKey: ["cargo-tracking", selectedCargoId ?? "none"],
    queryFn: async () => {
      console.log("🔄 Tracking API called for cargoId:", selectedCargoId);
      const result = await Api.getCargoTracking(Number(selectedCargoId));
      console.log("✅ Tracking data received:", result?.trackingDetails?.length || 0, "events");
      return result;
    },
    enabled: Boolean(selectedCargoId),
    staleTime: 120000, // Cache tracking data for 2 minutes
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  useEffect(() => {
    if (!selectedTerminalCode && terminals && terminals.length > 0) {
      const allTerminal = terminals.find((t) => t.terminalCode === "ALL");
      const defaultCode = allTerminal ? "ALL" : "";
      console.log("Setting default cargo terminal to:", defaultCode);
      setSelectedTerminalCode(defaultCode);
    }
  }, [selectedTerminalCode, terminals]);

  // Clear selected cargo when terminal changes
  useEffect(() => {
    console.log("Terminal changed to:", selectedTerminalCode, "- clearing selected cargo");
    setSelectedCargoId(null);
  }, [selectedTerminalCode]);

  // Memoize processed rows with client-side filtering
  const processedRows = useMemo(() => {
    if (!Array.isArray(cargoQuery.data)) return [];
    
    let filteredData = cargoQuery.data;
    
    // Apply client-side search filtering
    if (debouncedSearchString.trim()) {
      const searchTerm = debouncedSearchString.trim().toLowerCase();
      console.log("🔍 Client-side filtering with:", searchTerm);
      
      filteredData = cargoQuery.data.filter((cargo: Cargo) => {
        // Search in all relevant fields
        const searchableFields = [
          cargo.blNumber,
          cargo.cargoType,
          cargo.terminal,
          cargo.containerID,
          cargo.mvvin,
          cargo.gcmarks,
          cargo.cargoID?.toString(),
          cargo.qtyOrdered?.toString(),
          cargo.totalQtyHandled?.toString(),
        ];
        
        // Check if search term matches any field (case-insensitive)
        return searchableFields.some(field => 
          field && field.toString().toLowerCase().includes(searchTerm)
        );
      });
      
      console.log("✅ Filtered results:", filteredData.length, "records");
    }
    
    return filteredData.map((c: Cargo) => ({ ...c, id: c.cargoID }));
  }, [cargoQuery.data, debouncedSearchString]);

  // Default bottom grid to first cargo of the processed/filtered rows
  useEffect(() => {
    if (processedRows && processedRows.length > 0) {
      // Always auto-select the first cargo from processed/filtered data
      const firstCargoId = processedRows[0].cargoID.toString();
      console.log("Auto-selecting first cargo from filtered data:", firstCargoId);
      setSelectedCargoId(firstCargoId);
    } else {
      // Clear selected cargo when there are no rows
      if (selectedCargoId) {
        console.log("Clearing selected cargo - no filtered data available");
        setSelectedCargoId(null);
      }
    }
  }, [processedRows]); // This will trigger when filtered data changes

  // Memoize row click handler
  const handleRowClick = useCallback((params: any) => {
    setSelectedCargoId(params.row.cargoID.toString());
  }, []);

  // Memoize row class name function
  const getRowClassName = useCallback((params: any) => {
    return params.row.cargoID.toString() === selectedCargoId
      ? "cargo-row-selected"
      : "";
  }, [selectedCargoId]);

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
  const headerH = Math.round((isMobile ? 36 : isTablet ? 42 : 48) * zoomLevel);
  const baseRem = `${Math.max(0.625, Math.min(0.875, 0.75 * zoomLevel))}rem`;

  return (
    <Stack
      gap={{ xs: 0.5, sm: 0.75, md: 1 }}
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
          flex: 1,
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
          minHeight: 0, // Allow flex to control height
          maxHeight: "calc(100vh - 350px)", // Limit height to ensure shipment progress is visible
          borderRadius: "8px",
          "& > .MuiDataGrid-root": {
            borderRadius: "8px !important",
            border: "none !important",
            "& .MuiDataGrid-main": {
              borderRadius: "8px !important",
            },
            "& .MuiDataGrid-virtualScroller": {
              borderRadius: "0 0 8px 8px !important",
            },
            "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": {
              borderBottom: "none !important",
            },
            "& .MuiDataGrid-row:last-child .MuiDataGrid-cell:first-of-type": {
              borderBottomLeftRadius: "8px !important",
            },
            "& .MuiDataGrid-row:last-child .MuiDataGrid-cell:last-of-type": {
              borderBottomRightRadius: "8px !important",
            },
          },
        }}
      >
        <StyledDataGrid
          rows={processedRows}
          loading={cargoQuery.isLoading || isSearching}
          columns={columns}
          hideFooter={!cargoQuery.data || cargoQuery.data.length <= 50}
          density="compact"
          rowHeight={rowH}
          columnHeaderHeight={headerH}
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={handleRowClick}
          getRowClassName={getRowClassName}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 50 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
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
            height: "100%",
            width: "100%",
            border: "none",
            borderRadius: "8px",
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
              borderRadius: "8px !important",
              border: "none !important",
            },
            "& .MuiDataGrid-main": {
              height: "100% !important",
              overflow: "hidden !important",
              borderRadius: "8px !important",
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

            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaderTitle": {
              backgroundColor: "#0b1f4b",
              color: "#ffffff",
              fontWeight: 700,
              padding: `${Math.round(6 * zoomLevel)}px ${Math.round(
                10 * zoomLevel
              )}px`,
              borderRight: "1px solid rgba(255,255,255,0.1) !important",
              borderBottom: "1px solid #183e8a !important",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: `${Math.max(0.6, Math.min(0.8, 0.775 * zoomLevel))}rem`,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              position: "sticky",
              top: 0,
              zIndex: 10,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "#183e8a",
                transform: "translateY(-1px)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              },
            },

            "& .MuiDataGrid-columnSeparator": { display: "none !important" },

            "& .MuiDataGrid-cell": {
              backgroundColor: "#ffffff !important",
              color: "#000000",
              border: "none !important",
              fontSize: baseRem,
              padding: `${Math.round(4 * zoomLevel)}px ${Math.round(
                6 * zoomLevel
              )}px`,
              // left alignment comes from column defs
              "&:focus": {
                outline: "none !important",
                border: "none !important",
              },
              "&:focus-within": {
                outline: "none !important",
                border: "none !important",
              },
            },

            "& .MuiDataGrid-row": {
              backgroundColor: "#ffffff !important",
              minHeight: `${rowH}px !important`,
              maxHeight: `${rowH}px !important`,
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
              "& .MuiDataGrid-cell": {
                borderBottom: "none !important",
              },
              "& .MuiDataGrid-cell:first-of-type": {
                borderBottomLeftRadius: "8px !important",
              },
              "& .MuiDataGrid-cell:last-of-type": {
                borderBottomRightRadius: "8px !important",
              },
            },
            
            // Ensure the virtual scroller and viewport have proper border radius
            "& .MuiDataGrid-virtualScrollerContent": {
              borderRadius: "0 0 8px 8px !important",
            },
            "& .MuiDataGrid-virtualScrollerRenderZone": {
              borderRadius: "0 0 8px 8px !important",
            },
            
            // Override any global DataGrid styles
            "&.MuiDataGrid-root": {
              borderRadius: "8px !important",
              border: "none !important",
              overflow: "hidden !important",
            },
          }}
        />
      </Box>

      {selectedCargoId &&
        Array.isArray(cargoQuery.data) &&
        cargoQuery.data.length > 0 && (
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
                  Error loading tracking data. Please try selecting another
                  cargo.
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

const StyledDataGrid = styled(DataGrid)(() => ({
  borderRadius: "8px !important",
  border: "none !important",
  overflow: "hidden !important",
  "& .MuiDataGrid-main": {
    borderRadius: "8px !important",
  },
  "& .MuiDataGrid-virtualScroller": {
    borderRadius: "0 0 8px 8px !important",
  },
  "& .MuiDataGrid-row:last-child .MuiDataGrid-cell": {
    borderBottom: "none !important",
    "&:first-of-type": {
      borderBottomLeftRadius: "8px !important",
    },
    "&:last-of-type": {
      borderBottomRightRadius: "8px !important",
    },
  },
}));

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


  // Extract transportation type from description dynamically
  const getTransportType = (desc: string) => {
    // Look for patterns like "Vessel call", "Truck call", "OwnDrive call", etc.
    const callMatch = desc.match(/([A-Za-z]+)\s+call/i);
    if (callMatch) {
      return callMatch[1]; // Return the first word before "call"
    }
    
    // Look for patterns like "MV VESSELNAME", "SPIL VESSELNAME", etc.
    const vesselMatch = desc.match(/\b(MV|SPIL)\s+([A-Za-z0-9]+)/i);
    if (vesselMatch) {
      return 'Vessel';
    }
    
    // Look for patterns like "Truck [ID]", "Trailer [ID]", etc.
    const truckMatch = desc.match(/\b(Truck|Trailer|Vehicle|Transport)\b/i);
    if (truckMatch) {
      return truckMatch[1];
    }
    
    // Look for patterns like "Ship [NAME]", "Boat [NAME]", etc.
    const shipMatch = desc.match(/\b(Ship|Boat|Vessel)\b/i);
    if (shipMatch) {
      return shipMatch[1];
    }
    
    // Look for any word that might be a transportation type at the beginning
    const words = desc.split(' ');
    if (words.length > 0) {
      const firstWord = words[0];
      // Check if it's a potential transportation type (capitalized word)
      if (firstWord.match(/^[A-Z][a-z]+$/)) {
        return firstWord;
      }
    }
    
    return null;
  };

  // Detect transportation mode from event description dynamically
  const getTransportationMode = (description: string | null) => {
    if (!description) return null;
    
    const transportType = getTransportType(description);
    if (!transportType) return null;
    
    const lowerType = transportType.toLowerCase();
    
    // Categorize transportation types
    if (lowerType.includes('vessel') || 
        lowerType.includes('ship') || 
        lowerType.includes('boat') ||
        lowerType.includes('mv') ||
        lowerType.includes('spil') ||
        lowerType.includes('maritime')) {
      return 'vessel';
    }
    
    if (lowerType.includes('truck') || 
        lowerType.includes('trailer') || 
        lowerType.includes('owndrive') ||
        lowerType.includes('vehicle') ||
        lowerType.includes('transport') ||
        lowerType.includes('drive')) {
      return 'truck';
    }
    
    return null;
  };


  // Get main label from event description
  const getEventLabel = (description: string | null) => {
    if (!description) return "Event Pending";


    // Extract action from description
    const getAction = (desc: string) => {
      const lowerDesc = desc.toLowerCase();
      
      if (lowerDesc.includes('expected to arrive')) return 'Expected to Arrive';
      if (lowerDesc.includes('expected to depart')) return 'Expected to Depart';
      if (lowerDesc.includes('was created')) return 'Call Created';
      if (lowerDesc.includes('arrived')) return 'Arrived';
      if (lowerDesc.includes('departed')) return 'Departed';
      if (lowerDesc.includes('was received')) return 'Received';
      if (lowerDesc.includes('loaded')) return 'Loaded';
      if (lowerDesc.includes('discharged')) return 'Discharged';
      if (lowerDesc.includes('delivered')) return 'Delivered';
      if (lowerDesc.includes('customs')) return 'Customs Processing';
      
      return null;
    };

    // Extract order type for order-related events
    const getOrderType = (desc: string) => {
      if (desc.includes('Inward Transfer Order')) return 'Inward Transfer Order';
      if (desc.includes('Outward Transfer Order')) return 'Outward Transfer Order';
      if (desc.includes('Reception Order')) return 'Reception Order';
      if (desc.includes('Loading Order')) return 'Loading Order';
      if (desc.includes('Discharge Order')) return 'Discharge Order';
      if (desc.includes('Delivery Order')) return 'Delivery Order';
      
      return null;
    };

    const transportType = getTransportType(description);
    const action = getAction(description);
    const orderType = getOrderType(description);

    // Build dynamic label based on what's found
    if (orderType && description.includes('was created')) {
      return `${orderType} Created`;
    }
    
    if (transportType && action) {
      return `${transportType} ${action}`;
    }
    
    if (action) {
      return action;
    }

    // Fallback: extract the main action from the beginning
    const words = description.split(" ");
    if (words.length >= 2) {
      return words.slice(0, 3).join(" ");
    }
    return description;
  };

  const steps = sortedEvents.map((event) => {
    const eventDate = new Date(event.eventDate);
    const isValidDate = eventDate.getFullYear() > 1900;

    // Check if event has no valid data
    const hasNoData = !event.eventDescription || 
                     event.eventDescription.trim() === "" ||
                     event.eventDescription.toLowerCase() === "null";

    if (hasNoData) {
      return {
        label: "No Details Found",
        reference: null,
        order: null,
        date: null,
        time: null,
        fullDescription: null,
        eventNo: event.eventNo,
        hasNoData: true,
      };
    }

    const eventLabel = getEventLabel(event.eventDescription);
    const transportMode = getTransportationMode(event.eventDescription);

    return {
      label: eventLabel, // Keep the black bold step label
      reference: null,
      order: null,
      date: isValidDate ? eventDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) : null,
      time: isValidDate ? eventDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }) : null,
      fullDescription: event.eventDescription,
      eventNo: event.eventNo,
      transportMode: transportMode,
      hasNoData: false,
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
                {step.hasNoData ? (
                  // Show "No Details Found" for events with no data
                  <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                        mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" },
                        color: "text.secondary",
                    }}
                  >
                    {step.label}
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
                  </>
                ) : (
                  // Show full description for events with data
                  <>
                  

                    {/* Black bold step label */}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: { xs: 0.25, sm: 0.5 },
                        fontSize: { xs: "0.625rem", sm: "0.75rem", md: "0.875rem" },
                        color: "text.primary",
                      }}
                    >
                      {step.label}
                    </Typography>

                    {/* Complete description in blue */}
                    <Tooltip 
                      title={step.fullDescription || ""} 
                      arrow 
                      placement="top"
                      enterDelay={300}
                    >
                  <Typography
                    variant="caption"
                     sx={{
                       fontWeight: 600,
                       color: "primary.main",
                       mb: { xs: 0.25, sm: 0.5 },
                       fontSize: { xs: "0.5rem", sm: "0.625rem", md: "0.75rem" },
                       maxWidth: { xs: 150, sm: 180, md: 200 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: 1.2,
                        }}
                      >
                        {step.fullDescription}
                  </Typography>
                    </Tooltip>

                    {(step.date && step.time) && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.secondary",
                    fontWeight: 500,
                          mb: { xs: 0.25, sm: 0.5 },
                    fontSize: { xs: "0.5rem", sm: "0.625rem", md: "0.75rem" },
                  }}
                >
                  {step.date} • {step.time}
                </Typography>
                    )}

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
                  </>
                )}
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
