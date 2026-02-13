import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from "@mui/material";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 260;

function SideNav({ mobileOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const visitId = useMemo(() => {
    const match = location.pathname.match(/^\/visits\/([^/]+)/);
    return match?.[1] || null;
  }, [location.pathname]);

  const items = [
    { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    ...(visitId
      ? [
          { label: "Visit Detail", icon: <AssessmentIcon />, path: `/visits/${visitId}` },
          { label: "Report", icon: <DescriptionIcon />, path: `/visits/${visitId}/report` }
        ]
      : [])
  ];

  const content = (
    <>
      <Toolbar />
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
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
        }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
        }}
      >
        {content}
      </Drawer>
    </>
  );
}

export { drawerWidth };
export default SideNav;
