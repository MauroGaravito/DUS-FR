import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

function AIReportSection({ aiReport }) {
  const parsed = useMemo(() => {
    if (!aiReport?.content) return null;
    try {
      return JSON.parse(aiReport.content);
    } catch {
      return null;
    }
  }, [aiReport]);

  if (!aiReport) {
    return null;
  }

  if (!parsed) {
    return <Alert severity="warning">AI report exists but could not be parsed.</Alert>;
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h6">AI Report Summary</Typography>
        <Typography variant="body1">{parsed.executiveSummary || "No summary available."}</Typography>
        <Divider />
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Observations
          </Typography>
          <List dense disablePadding>
            {(parsed.observations || []).map((observation, index) => (
              <ListItem key={`${observation}-${index}`} disableGutters>
                <ListItemText primary={observation} />
              </ListItem>
            ))}
          </List>
        </Box>
        <Divider />
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Findings
          </Typography>
          <Stack spacing={1.5}>
            {(parsed.findings || []).map((finding, index) => (
              <Paper key={`${finding.title || "finding"}-${index}`} variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body1" fontWeight={700}>
                      {finding.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={finding.severity || "n/a"}
                      color={
                        finding.severity === "high"
                          ? "error"
                          : finding.severity === "medium"
                          ? "warning"
                          : "success"
                      }
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Evidence: {finding.evidence || "Not specified"}
                  </Typography>
                  <Typography variant="body2">Recommendation: {finding.recommendation || "Not specified"}</Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
        <Divider />
        <Typography variant="body2" color="text.secondary">
          Limitations: {parsed.limitations || "Not specified"}
        </Typography>
        <Typography variant="body1">Conclusion: {parsed.conclusion || "Not specified"}</Typography>
      </Stack>
    </Paper>
  );
}

function MarkdownSection({ report }) {
  if (!report?.content) {
    return <Typography color="text.secondary">No generated report yet.</Typography>;
  }

  return (
    <Paper sx={{ p: 2.5 }}>
      <ReactMarkdown>{report.content}</ReactMarkdown>
    </Paper>
  );
}

function ReportViewer({
  report,
  aiReport,
  hasAcceptedEntries,
  generatingReport,
  generatingAIReport,
  onGenerateReport,
  onGenerateAIReport
}) {
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="contained"
          disabled={!hasAcceptedEntries || generatingReport}
          onClick={onGenerateReport}
        >
          {generatingReport ? "Generating..." : "Generate Report"}
        </Button>
        <Button
          variant="outlined"
          disabled={!hasAcceptedEntries || generatingAIReport}
          onClick={onGenerateAIReport}
        >
          {generatingAIReport ? "Generating AI..." : "Generate AI Report"}
        </Button>
      </Stack>

      {!hasAcceptedEntries && (
        <Alert severity="info">Accepted entries are required before generating reports.</Alert>
      )}

      <MarkdownSection report={report} />
      <AIReportSection aiReport={aiReport} />
    </Stack>
  );
}

export default ReportViewer;
