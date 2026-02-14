import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_BAR_HEIGHT, DRAWER_WIDTH } from "./layoutConfig";

function SideNav({ mobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const visitId = useMemo(() => {
    const match = location.pathname.match(/^\/visits\/([^/]+)/);
    return match?.[1] || null;
  }, [location.pathname]);

  const items = [
    { label: t("dashboard"), icon: <DashboardIcon />, path: "/dashboard" },
    ...(visitId
      ? [
          { label: t("visitDetail"), icon: <AssessmentIcon />, path: `/visits/${visitId}` },
          { label: t("report"), icon: <DescriptionIcon />, path: `/visits/${visitId}/report` }
        ]
      : [])
  ];

  const content = (
    <>
      <Toolbar sx={{ minHeight: APP_BAR_HEIGHT }} />
      <List sx={{ px: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            sx={{ mb: 0.5, minHeight: 52, borderRadius: 1.5 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH }
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH
          }
        }}
      >
        {content}
      </Drawer>
    </>
  );
}

export default SideNav;
