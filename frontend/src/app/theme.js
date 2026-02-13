import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f3a56"
    },
    secondary: {
      main: "#4f6d7a"
    },
    background: {
      default: "#f4f6f8",
      paper: "#ffffff"
    },
    success: {
      main: "#2e7d32"
    },
    warning: {
      main: "#ed6c02"
    },
    error: {
      main: "#d32f2f"
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 600
    },
    button: {
      textTransform: "none",
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: "large"
      }
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }
      }
    }
  }
});
