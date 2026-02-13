import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Dialog, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import VisitForm from "../components/visits/VisitForm";
import VisitList from "../components/visits/VisitList";
import { createVisit, getVisits } from "../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const { user, showMessage } = useOutletContext();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [savingVisit, setSavingVisit] = useState(false);

  useEffect(() => {
    async function loadVisits() {
      setLoading(true);
      try {
        const data = await getVisits();
        setVisits(data.visits || []);
      } catch (err) {
        showMessage(err.message || "Could not load visits", "error");
      } finally {
        setLoading(false);
      }
    }
    loadVisits();
  }, [showMessage]);

  const handleCreateVisit = async (payload) => {
    setSavingVisit(true);
    try {
      const data = await createVisit(payload);
      setVisits((prev) => [data.visit, ...prev]);
      showMessage("Visit created", "success");
      setCreateOpen(false);
    } catch (err) {
      showMessage(err.message || "Could not create visit", "error");
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          gap: 2,
          alignItems: { xs: "flex-start", sm: "center" }
        }}
      >
        <Box>
          <Typography variant="h5">Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome {user?.name || "Engineer"}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Create Visit
        </Button>
      </Box>

      <VisitList visits={visits} loading={loading} onOpenVisit={(visit) => navigate(`/visits/${visit._id}`)} />

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <VisitForm loading={savingVisit} onCancel={() => setCreateOpen(false)} onSubmit={handleCreateVisit} />
      </Dialog>
    </Stack>
  );
}

export default Dashboard;
