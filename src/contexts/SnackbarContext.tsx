"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

// Define Context Type
interface SnackbarContextType {
  showSnackbar: (message: string, severity?: AlertColor) => void;
}

// Create Context
const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
);

// Define Snackbar State Type
interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

// Provider Component Props
interface SnackbarProviderProps {
  children: ReactNode;
}

// Provider Component
export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info", // 'success' | 'error' | 'warning' | 'info'
  });

  // Show Snackbar Function
  const showSnackbar = useCallback(
    (message: string, severity: AlertColor = "info") => {
      setSnackbar({ open: true, message, severity });
    },
    [],
  );

  // Close Snackbar
  const handleClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}

      {/* MUI Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Hook to use Snackbar
export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
