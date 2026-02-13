import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, IconButton, Stack, Toolbar, Typography } from "@mui/material";

function TopBar({ onMenuClick, onLogout, userName }) {
  return (
    <AppBar position="fixed" color="inherit" elevation={1}>
      <Toolbar sx={{ minHeight: 72 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" }, mr: 1 }}
          aria-label="open navigation"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Field Report
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" color="text.secondary">
              {userName || "Engineer"}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={onLogout} aria-label="logout">
            <LogoutIcon />
          </IconButton>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
