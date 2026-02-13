import { Alert, Box, CircularProgress, Container, Snackbar, Toolbar } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { getMe } from "../../services/api";
import { clearToken } from "../../services/auth";
import SideNav, { drawerWidth } from "./SideNav";
import TopBar from "./TopBar";

function MainLayout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: ""
  });

  const showMessage = useCallback((message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getMe();
        setUser(data.user || null);
      } catch {
        handleLogout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [handleLogout]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <TopBar
        onMenuClick={() => setMobileOpen(true)}
        onLogout={handleLogout}
        userName={user?.name}
      />
      <SideNav mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
          <Outlet context={{ user, showMessage }} />
        </Container>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default MainLayout;
