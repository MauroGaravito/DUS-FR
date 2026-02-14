import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PlaceIcon from "@mui/icons-material/Place";
import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function VisitCard({ visit, onOpen }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">{visit.projectName}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlaceIcon color="action" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              {visit.location}
            </Typography>
          </Stack>
          <Chip
            size="small"
            label={visit.status}
            color={visit.status === "final" ? "success" : "default"}
            sx={{ width: "fit-content", textTransform: "capitalize" }}
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button fullWidth variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => onOpen(visit)}>
          {t("openVisit")}
        </Button>
      </CardActions>
    </Card>
  );
}

export default VisitCard;
