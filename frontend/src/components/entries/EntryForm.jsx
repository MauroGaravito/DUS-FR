import AttachFileIcon from "@mui/icons-material/AttachFile";
import { Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const ACCEPTED_FILE_TYPES = {
  audio: "audio/mpeg,audio/mp3,audio/wav,audio/webm",
  photo: "image/jpeg,image/png"
};

function EntryForm({ loading, onSubmit }) {
  const { t } = useTranslation();
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
          label={t("entryType")}
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
          <MenuItem value="text">{t("text")}</MenuItem>
          <MenuItem value="audio">{t("audio")}</MenuItem>
          <MenuItem value="photo">{t("photo")}</MenuItem>
        </TextField>
        {isTextType ? (
          <TextField
            label={t("details")}
            multiline
            minRows={3}
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
            {form.file ? form.file.name : t("selectFile", { type: t(form.type) })}
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
          label={t("markAsFinding")}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? t("saving") : t("addEntry")}
        </Button>
      </Stack>
    </Box>
  );
}

export default EntryForm;
