import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { useState } from "react";

const ACCEPTED_FILE_TYPES = {
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/webm",
  photo: "image/jpeg,image/png"
};

function EntryForm({ loading, onSubmit }) {
  const [form, setForm] = useState({
    type: "text",
    text: "",
    isFinding: false,
    file: null
  });

  const isTextType = form.type === "text";

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
    setForm((prev) => ({
      ...prev,
      text: "",
      file: null,
      isFinding: false
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          select
          label="Entry Type"
          value={form.type}
          onChange={(event) =>
            setForm({
              type: event.target.value,
              text: "",
              isFinding: false,
              file: null
            })
          }
        >
          <MenuItem value="text">Text</MenuItem>
          <MenuItem value="audio">Audio</MenuItem>
          <MenuItem value="photo">Photo</MenuItem>
        </TextField>
        {isTextType ? (
          <TextField
            label="Details"
            multiline
            minRows={4}
            value={form.text}
            onChange={(event) => setForm((prev) => ({ ...prev, text: event.target.value }))}
            required
          />
        ) : (
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFileIcon />}
            sx={{ justifyContent: "flex-start", minHeight: 54 }}
          >
            {form.file ? form.file.name : `Select ${form.type} file`}
            <input
              hidden
              type="file"
              accept={ACCEPTED_FILE_TYPES[form.type]}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
              }
              required={!isTextType}
            />
          </Button>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={form.isFinding}
              onChange={(event) => setForm((prev) => ({ ...prev, isFinding: event.target.checked }))}
            />
          }
          label="Mark as finding"
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Saving..." : "Add Entry"}
        </Button>
      </Stack>
    </Box>
  );
}

export default EntryForm;
