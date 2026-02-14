import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";

function ReportViewerLegacy({
  report,
  aiReport,
  hasAcceptedEntries,
  generatingReport,
  generatingAIReport,
  onGenerateReport,
  onGenerateAIReport
}) {
  const { t } = useTranslation();
  const legacyReport = report || aiReport || null;
  const parsedAI =
    aiReport?.content && aiReport.type === "ai"
      ? (() => {
          try {
            return JSON.parse(aiReport.content);
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="contained"
          disabled={!hasAcceptedEntries || generatingReport}
          onClick={onGenerateReport}
        >
          {generatingReport ? t("processing") : t("generateClassic")}
        </Button>
        <Button
          variant="outlined"
          disabled={!hasAcceptedEntries || generatingAIReport}
          onClick={onGenerateAIReport}
        >
          {generatingAIReport ? t("processing") : t("generateAI")}
        </Button>
      </Stack>

      {!hasAcceptedEntries && (
        <Alert severity="info">{t("acceptedEntriesRequiredLegacy")}</Alert>
      )}

      {!legacyReport?.content && <Typography color="text.secondary">{t("noReport")}</Typography>}

      {report?.content && (
        <Paper sx={{ p: 2.5 }}>
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </Paper>
      )}

      {parsedAI && (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={1}>
            <Typography variant="h6">{t("aiReportSummary")}</Typography>
            <Typography>{parsedAI.executiveSummary || t("noSummaryAvailable")}</Typography>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default ReportViewerLegacy;
