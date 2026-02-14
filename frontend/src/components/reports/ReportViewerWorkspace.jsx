import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import EditableAIReport from "./EditableAIReport";

function formatDate(dateValue) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

function ReportViewerWorkspace({
  documentRef,
  visit,
  report,
  loading,
  hasAcceptedEntries,
  editableContent,
  setEditableContent,
  hasUnsavedChanges,
  savingChanges,
  exportingPdf,
  onGenerateClassic,
  onGenerateAI,
  onSave,
  onExport
}) {
  const { t } = useTranslation();
  const reportTypeLabel = report?.type === "ai" ? t("aiType") : t("classicType");
  const isAIReport = report?.type === "ai";

  return (
    <Stack spacing={2.5}>
      {!exportingPdf && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Button
            variant="outlined"
            disabled={loading || !hasAcceptedEntries}
            onClick={onGenerateClassic}
          >
            {loading ? t("processing") : t("generateClassic")}
          </Button>
          <Button
            variant="contained"
            disabled={loading || !hasAcceptedEntries}
            onClick={onGenerateAI}
          >
            {loading ? t("processing") : t("generateAI")}
          </Button>
          {isAIReport && (
            <Button
              variant="outlined"
              disabled={savingChanges || loading || !hasUnsavedChanges}
              onClick={onSave}
            >
              {savingChanges ? t("saving") : t("saveChanges")}
            </Button>
          )}
          <Button variant="outlined" disabled={exportingPdf || loading} onClick={onExport}>
            {exportingPdf ? t("exporting") : t("exportPDF")}
          </Button>
        </Stack>
      )}

      {!hasAcceptedEntries && (
        <Alert severity="info">
          {t("acceptedEntriesRequired")}
        </Alert>
      )}

      <Paper
        ref={documentRef}
        sx={{
          maxWidth: 900,
          width: "100%",
          mx: "auto",
          bgcolor: "background.paper",
          boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
          border: "1px solid",
          borderColor: "divider"
        }}
      >
        <Box sx={{ p: { xs: 2.5, md: 5 } }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
              <Box>
                <Typography variant="h5">{visit?.projectName || t("untitledProject")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {visit?.location || t("locationNotAvailable")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={t("typeLabel", { type: reportTypeLabel })} size="small" />
              </Stack>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Typography variant="body2" color="text.secondary">
                {t("generated", { date: formatDate(report?.generatedAt) })}
              </Typography>
            </Stack>
            <Divider />

            {!report && (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {t("noReport")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("generateWorkspaceHint")}
                </Typography>
              </Box>
            )}

            {report && report.type === "ai" && editableContent && (
              <EditableAIReport
                editableContent={editableContent}
                setEditableContent={setEditableContent}
                disabled={savingChanges || loading}
              />
            )}

            {report && report.type !== "ai" && (
              <Box sx={{ "& p": { lineHeight: 1.7 } }}>
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </Box>
            )}
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
}

export default ReportViewerWorkspace;
