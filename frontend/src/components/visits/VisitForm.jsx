import { Button, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function VisitForm({ loading, onCancel, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ projectName: "", location: "" });

  useEffect(() => {
    setForm({ projectName: "", location: "" });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogTitle>{t("createVisit")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("projectName")}
            value={form.projectName}
            onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))}
            required
          />
          <TextField
            label={t("location")}
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {t("cancel")}
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? t("saving") : t("saveVisit")}
        </Button>
      </DialogActions>
    </form>
  );
}

export default VisitForm;
