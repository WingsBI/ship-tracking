import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import type { BoxProps } from "@mui/material";

interface ResponsiveWrapperProps extends BoxProps {
  children: React.ReactNode;
  minHeight?: string | number;
  maxHeight?: string | number;
  aspectRatio?: string;
  maintainAspectRatio?: boolean;
}

export function ResponsiveWrapper({
  children,
  minHeight = "auto",
  maxHeight = "none",
  aspectRatio,
  maintainAspectRatio = false,
  sx,
  ...props
}: ResponsiveWrapperProps) {
  const [, setZoomLevel] = useState(1);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Calculate zoom level based on device pixel ratio and viewport
      const zoom = window.devicePixelRatio || 1;
      setZoomLevel(zoom);
    };

    const handleZoom = () => {
      // Detect zoom level changes
      const zoom = window.visualViewport?.scale || window.devicePixelRatio || 1;
      setZoomLevel(zoom);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleZoom);
    }

    // Initial call
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleZoom);
      }
    };
  }, []);

  const responsiveSx = {
    width: "100%",
    maxWidth: "100%",
    minHeight,
    maxHeight,
    overflow: "hidden",
    position: "relative" as const,
    ...(aspectRatio && {
      aspectRatio,
    }),
    ...(maintainAspectRatio && {
      aspectRatio: "16/9",
    }),
    // Ensure content fits within viewport
    ...(screenSize.width < 480 && {
      fontSize: "0.875rem",
      "& .MuiTypography-root": {
        fontSize: "inherit",
      },
    }),
    ...(screenSize.width >= 480 &&
      screenSize.width < 768 && {
        fontSize: "0.9375rem",
      }),
    ...(screenSize.width >= 768 &&
      screenSize.width < 1024 && {
        fontSize: "1rem",
      }),
    ...(screenSize.width >= 1024 &&
      screenSize.width < 1440 && {
        fontSize: "1.0625rem",
      }),
    ...(screenSize.width >= 1440 && {
      fontSize: "1.125rem",
    }),
    // Ultra-wide screen support
    ...(screenSize.width >= 2560 && {
      fontSize: "1.25rem",
      maxWidth: "1920px",
      margin: "0 auto",
    }),
    // Mobile-specific adjustments
    ...(screenSize.width < 768 && {
      "& .MuiDataGrid-root": {
        fontSize: "0.75rem",
        "& .MuiDataGrid-cell": {
          padding: "4px 6px",
        },
        "& .MuiDataGrid-columnHeader": {
          padding: "4px 6px",
        },
      },
    }),
    // Tablet-specific adjustments
    ...(screenSize.width >= 768 &&
      screenSize.width < 1024 && {
        "& .MuiDataGrid-root": {
          fontSize: "0.8125rem",
        },
      }),
    // Desktop-specific adjustments
    ...(screenSize.width >= 1024 && {
      "& .MuiDataGrid-root": {
        fontSize: "0.875rem",
      },
    }),
    ...sx,
  };

  return (
    <Box sx={responsiveSx} {...props}>
      {children}
    </Box>
  );
}

// Hook for responsive utilities
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsDesktop(width >= 1024 && width < 1440);
      setIsLargeScreen(width >= 1440);

      const zoom = window.visualViewport?.scale || window.devicePixelRatio || 1;
      setZoomLevel(zoom);
    };

    window.addEventListener("resize", handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    zoomLevel,
    screenSize: {
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    },
  };
}
