import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Button, Divider, IconButton, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function EditableAIReport({ editableContent, setEditableContent, disabled }) {
  const { t } = useTranslation();
  const updateField = (field, value) => {
    setEditableContent((prev) => ({ ...prev, [field]: value }));
  };

  const updateObservation = (index, value) => {
    setEditableContent((prev) => ({
      ...prev,
      observations: prev.observations.map((item, idx) => (idx === index ? value : item))
    }));
  };

  const addObservation = () => {
    setEditableContent((prev) => ({ ...prev, observations: [...prev.observations, ""] }));
  };

  const removeObservation = (index) => {
    setEditableContent((prev) => ({
      ...prev,
      observations: prev.observations.filter((_item, idx) => idx !== index)
    }));
  };

  const updateFinding = (index, field, value) => {
    setEditableContent((prev) => ({
      ...prev,
      findings: prev.findings.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    }));
  };

  const addFinding = () => {
    setEditableContent((prev) => ({
      ...prev,
      findings: [
        ...prev.findings,
        {
          title: "",
          severity: "low",
          evidence: "",
          recommendation: ""
        }
      ]
    }));
  };

  const removeFinding = (index) => {
    setEditableContent((prev) => ({
      ...prev,
      findings: prev.findings.filter((_item, idx) => idx !== index)
    }));
  };

  return (
    <Stack spacing={3}>
      <TextField
        label={t("executiveSummary")}
        multiline
        minRows={4}
        value={editableContent.executiveSummary}
        onChange={(event) => updateField("executiveSummary", event.target.value)}
        disabled={disabled}
      />

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="h6">{t("observations")}</Typography>
        {editableContent.observations.map((observation, index) => (
          <Stack key={`observation-${index}`} direction="row" spacing={1} alignItems="flex-start">
            <TextField
              label={`${t("observation")} ${index + 1}`}
              multiline
              minRows={2}
              value={observation}
              onChange={(event) => updateObservation(index, event.target.value)}
              disabled={disabled}
            />
            <IconButton
              aria-label="remove observation"
              onClick={() => removeObservation(index)}
              disabled={disabled}
              sx={{ mt: 0.5 }}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addObservation} disabled={disabled}>
          {t("addObservation")}
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={1.5}>
        <Typography variant="h6">{t("findings")}</Typography>
        {editableContent.findings.map((finding, index) => (
          <Paper key={`finding-${index}`} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">{t("finding")} {index + 1}</Typography>
                <IconButton
                  aria-label="remove finding"
                  onClick={() => removeFinding(index)}
                  disabled={disabled}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
              <TextField
                label={t("title")}
                value={finding.title}
                onChange={(event) => updateFinding(index, "title", event.target.value)}
                disabled={disabled}
              />
              <TextField
                select
                label={t("severity")}
                value={finding.severity || "low"}
                onChange={(event) => updateFinding(index, "severity", event.target.value)}
                disabled={disabled}
              >
                <MenuItem value="low">{t("low")}</MenuItem>
                <MenuItem value="medium">{t("medium")}</MenuItem>
                <MenuItem value="high">{t("high")}</MenuItem>
              </TextField>
              <TextField
                label={t("evidence")}
                multiline
                minRows={2}
                value={finding.evidence}
                onChange={(event) => updateFinding(index, "evidence", event.target.value)}
                disabled={disabled}
              />
              <TextField
                label={t("recommendation")}
                multiline
                minRows={2}
                value={finding.recommendation}
                onChange={(event) => updateFinding(index, "recommendation", event.target.value)}
                disabled={disabled}
              />
            </Stack>
          </Paper>
        ))}
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addFinding} disabled={disabled}>
          {t("addFinding")}
        </Button>
      </Stack>

      <Divider />

      <TextField
        label={t("limitations")}
        multiline
        minRows={3}
        value={editableContent.limitations}
        onChange={(event) => updateField("limitations", event.target.value)}
        disabled={disabled}
      />
      <TextField
        label={t("conclusion")}
        multiline
        minRows={3}
        value={editableContent.conclusion}
        onChange={(event) => updateField("conclusion", event.target.value)}
        disabled={disabled}
      />
    </Stack>
  );
}

export default EditableAIReport;
