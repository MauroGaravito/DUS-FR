import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import VisitCard from "./VisitCard";

function VisitList({ visits, loading, onOpenVisit }) {
  const { t } = useTranslation();

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
        <Typography color="text.secondary">{t("noVisitsCreated")}</Typography>
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
