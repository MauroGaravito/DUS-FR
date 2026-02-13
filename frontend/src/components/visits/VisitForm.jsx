import { Button, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";

function VisitForm({ loading, onCancel, onSubmit }) {
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
      <DialogTitle>Create Visit</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Project Name"
            value={form.projectName}
            onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))}
            required
          />
          <TextField
            label="Location"
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Visit"}
        </Button>
      </DialogActions>
    </form>
  );
}

export default VisitForm;
