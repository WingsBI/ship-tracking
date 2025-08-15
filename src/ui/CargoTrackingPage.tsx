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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";
import { Api } from "../lib/api";
import type { Cargo, CargoTrackingDetailResponse, Terminal } from "../lib/api";
import { useTerminalStore } from "../store/terminalStore";

function useTerminals() {
  return useQuery({ queryKey: ["terminals"], queryFn: Api.getTerminals });
}

export default function CargoTrackingPage() {
  const { data: terminals } = useTerminals();
  const selectedTerminalId = useTerminalStore((s) => s.selectedTerminalId);
  const setSelectedTerminalId = useTerminalStore(
    (s) => s.setSelectedTerminalId
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
    queryKey: ["cargo", selectedTerminalId ?? "none", debouncedSearchString],
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
                selectedTerminalId === "all" || selectedTerminalId === "ALL"
                  ? undefined
                  : selectedTerminalId,
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
        if (selectedTerminalId === "all" || selectedTerminalId === "ALL") {
          allCargo = await Api.getCargoByTerminal();
        } else {
          allCargo = await Api.getCargoByTerminal(
            selectedTerminalId || undefined
          );
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
      if (selectedTerminalId === "all" || selectedTerminalId === "ALL") {
        return Api.getCargoByTerminal();
      } else {
        return Api.getCargoByTerminal(selectedTerminalId || undefined);
      }
    },
    enabled: Boolean(selectedTerminalId),
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
    if (!selectedTerminalId && terminals && terminals.length > 0) {
      // Always prefer "ALL" terminal if available, otherwise default to "all"
      const allTerminal = terminals.find((t) => t.terminalCode === "ALL");
      const defaultTerminal = allTerminal ? "ALL" : "all";
      console.log("Setting default terminal to:", defaultTerminal);
      setSelectedTerminalId(defaultTerminal);
    }
  }, [selectedTerminalId, terminals, setSelectedTerminalId]);

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
    }
  }, [cargoQuery.data, selectedCargoId]);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "blNumber",
        headerName: "BL Number",
        flex: 1.3,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "cargoType",
        headerName: "Type",
        flex: 0.8,
        minWidth: 100,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "terminal",
        headerName: "Terminal",
        flex: 1.1,
        minWidth: 100,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "qtyOrdered",
        headerName: "Qty Ordered",
        flex: 1.1,
        minWidth: 130,
        type: "number",
        align: "center",
        headerAlign: "center",
      },
      {
        field: "totalQtyHandled",
        headerName: "Qty Handled",
        flex: 1.2,
        minWidth: 130,
        type: "number",
        align: "center",
        headerAlign: "center",
      },
      {
        field: "containerID",
        headerName: "Container ID",
        flex: 1.3,
        minWidth: 125,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "mvvin",
        headerName: "VIN",
        flex: 1.2,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "cargoID",
        headerName: "Cargo ID",
        flex: 1,
        minWidth: 100,
        type: "number",
        align: "center",
        headerAlign: "center",
      },
    ],
    []
  );

  return (
    <Stack gap={3}>
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Cargo Tracking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Search cargo and view live tracking status
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            gap={1.5}
            sx={{ width: "100%", maxWidth: 760 }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="terminal-label">Terminal</InputLabel>
              <Select
                labelId="terminal-label"
                label="Terminal"
                value={selectedTerminalId ?? ""}
                onChange={(e) => setSelectedTerminalId(e.target.value)}
              >
                {/* Only show manual "All" option if API doesn't provide one */}
                {!(terminals ?? []).some((t) => t.terminalCode === "ALL") && (
                  <MenuItem key="all" value="all">
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
              placeholder="Search by BL Number, Cargo ID, Container ID, VIN, Terminal"
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

      <Box sx={{ height: 440, width: "100%" }}>
        <DataGrid
          rows={
            Array.isArray(cargoQuery.data)
              ? cargoQuery.data.map((c: Cargo) => ({ ...c, id: c.cargoID }))
              : []
          }
          loading={cargoQuery.isLoading || isSearching}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          onRowClick={(params) => {
            setSelectedCargoId(params.row.cargoID.toString());
            console.log(
              "Selected cargo:",
              params.row.cargoID,
              "BL:",
              params.row.blNumber
            );
          }}
          getRowClassName={(params) => {
            const isSelected =
              params.row.cargoID.toString() === selectedCargoId;
            return isSelected ? "cargo-row-selected" : "";
          }}
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
            "& .cargo-row-selected": {
              backgroundColor: "rgba(24,62,138,0.15) !important",
              borderLeft: "4px solid #183e8a !important",
              "& .MuiDataGrid-cell": {
                backgroundColor: "rgba(24,62,138,0.15) !important",
                fontWeight: "600 !important",
              },
            },
            "& .cargo-row-selected:hover": {
              backgroundColor: "rgba(24,62,138,0.2) !important",
            },
          }}
        />
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Shipment Progress
          {selectedCargoId && (
            <Typography
              variant="body2"
              color="text.secondary"
              component="span"
              sx={{ ml: 2 }}
            >
              (Cargo ID: {selectedCargoId})
            </Typography>
          )}
        </Typography>
        {trackingQuery.isLoading && (
          <Typography color="text.secondary">
            Loading tracking data...
          </Typography>
        )}
        {trackingQuery.error && (
          <Typography color="error">
            Error loading tracking data. Please try selecting another cargo.
          </Typography>
        )}
        {!trackingQuery.isLoading &&
          !trackingQuery.error &&
          !trackingQuery.data && (
            <Typography color="text.secondary">
              Select a cargo to see tracking
            </Typography>
          )}
        {trackingQuery.data &&
          trackingQuery.data.trackingDetails &&
          trackingQuery.data.trackingDetails.length > 0 && (
            <ShipmentStepper events={trackingQuery.data.trackingDetails} />
          )}
        {trackingQuery.data &&
          (!trackingQuery.data.trackingDetails ||
            trackingQuery.data.trackingDetails.length === 0) && (
            <Typography color="text.secondary">
              No tracking data available for this cargo.
            </Typography>
          )}
      </Paper>
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
  if (!events || events.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
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
      date: eventDate.toLocaleDateString(),
      time: eventDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      fullDescription: event.eventDescription,
      eventNo: event.eventNo,
    };
  });

  const activeStep = steps.length - 1; // All events are considered completed
  const minWidth = Math.max(1000, steps.length * 280);

  return (
    <Box sx={{ overflowX: "auto", pb: 2 }}>
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        connector={<QConnector />}
        sx={{ minWidth, px: 1 }}
      >
        {steps.map((step) => (
          <Step key={step.eventNo} completed={true}>
            <StepLabel>
              <Box sx={{ textAlign: "center", maxWidth: 250 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, mb: 0.5 }}
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
                      mb: 0.5,
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
                      mb: 0.5,
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
                  }}
                >
                  {step.date} • {step.time}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "text.disabled",
                    mt: 0.5,
                    fontSize: "0.7rem",
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
