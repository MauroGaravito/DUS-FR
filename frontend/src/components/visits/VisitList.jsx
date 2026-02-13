import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import VisitCard from "./VisitCard";

function VisitList({ visits, loading, onOpenVisit }) {
  if (loading) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visits.length) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="text.secondary">No visits created yet.</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {visits.map((visit) => (
        <Grid key={visit._id} item xs={12} sm={6} lg={4}>
          <VisitCard visit={visit} onOpen={onOpenVisit} />
        </Grid>
      ))}
    </Grid>
  );
}

export default VisitList;
