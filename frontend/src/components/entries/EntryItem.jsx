import MicIcon from "@mui/icons-material/Mic";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SubjectIcon from "@mui/icons-material/Subject";
import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const statusColorMap = {
  pending: "warning",
  accepted: "success",
  rejected: "error"
};

function EntryItem({
  entry,
  onChangeStatus,
  onTranscribe,
  transcribing,
  updatingStatus
}) {
  const { t } = useTranslation();
  const isAudio = entry.type === "audio";
  const isPhoto = entry.type === "photo";
  const showReviewActions = isAudio && entry.status === "pending";
  const canTranscribe = isAudio && ["idle", "error"].includes(entry.transcriptionStatus || "idle");

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            {entry.type === "text" && <SubjectIcon color="action" />}
            {isAudio && <MicIcon color="action" />}
            {isPhoto && <PhotoCameraIcon color="action" />}
            <Chip
              label={t(entry.type)}
              size="small"
              sx={{ textTransform: "capitalize" }}
              variant="outlined"
            />
            <Chip
              label={entry.status}
              size="small"
              color={statusColorMap[entry.status] || "default"}
              sx={{ textTransform: "capitalize" }}
            />
            {entry.isFinding && <Chip label={t("finding")} size="small" color="secondary" />}
          </Stack>

          {entry.text && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {entry.text}
            </Typography>
          )}

          {entry.fileUrl && (
            <Button href={entry.fileUrl} target="_blank" rel="noreferrer" variant="text" sx={{ px: 0 }}>
              {t("openFile")}
            </Button>
          )}

          {isAudio && entry.fileUrl && (
            <audio controls src={entry.fileUrl} style={{ width: "100%", minHeight: 42 }} />
          )}

          {isPhoto && entry.fileUrl && (
            <img
              src={entry.fileUrl}
              alt="Entry evidence"
              style={{ maxWidth: "100%", borderRadius: 8, maxHeight: 360, objectFit: "cover" }}
            />
          )}

          {isAudio && (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {t("transcriptionStatus", { status: entry.transcriptionStatus || "idle" })}
              </Typography>
              {entry.transcription && (
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {entry.transcription}
                </Typography>
              )}
              {entry.transcriptionError && (
                <Typography variant="body2" color="error.main">
                  {entry.transcriptionError}
                </Typography>
              )}
            </Stack>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {showReviewActions && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  disabled={updatingStatus}
                  onClick={() => onChangeStatus(entry._id, "accepted")}
                >
                  {t("accept")}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={updatingStatus}
                  onClick={() => onChangeStatus(entry._id, "rejected")}
                >
                  {t("reject")}
                </Button>
              </>
            )}
            {isAudio && (
              <Button
                variant="outlined"
                disabled={transcribing || !canTranscribe}
                onClick={() => onTranscribe(entry._id)}
              >
                {transcribing ? t("transcribing") : t("transcribe")}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default EntryItem;
