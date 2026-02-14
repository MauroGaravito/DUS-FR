import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBar, Box, IconButton, Stack, Toolbar, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { APP_BAR_HEIGHT, DRAWER_WIDTH } from "./layoutConfig";
import LanguageSwitcher from "./LanguageSwitcher";

function TopBar({ onMenuClick, onLogout, userName }) {
  const { t } = useTranslation();

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` }
      }}
    >
      <Toolbar sx={{ minHeight: APP_BAR_HEIGHT }}>
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
          {t("fieldReport")}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <LanguageSwitcher />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="body2" color="text.secondary">
              {userName || t("engineer")}
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
