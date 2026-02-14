import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useParams } from "react-router-dom";
import EntryForm from "../components/entries/EntryForm";
import EntryList from "../components/entries/EntryList";
import ReportViewerLegacy from "../components/reports/ReportViewerLegacy";
import {
  createFileEntry,
  createTextEntry,
  generateAIReport,
  generateReport,
  getEntries,
  getLatestReport,
  getVisit,
  transcribeEntry,
  updateEntry
} from "../services/api";

function getErrorMessage(err, fallback) {
  return err?.message || fallback;
}

function VisitDetail({ defaultTab = 0 }) {
  const { t } = useTranslation();
  const { visitId } = useParams();
  const { showMessage } = useOutletContext();

  const [tabValue, setTabValue] = useState(defaultTab);
  const [visit, setVisit] = useState(null);
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [aiReport, setAiReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [savingEntry, setSavingEntry] = useState(false);
  const [updatingEntryId, setUpdatingEntryId] = useState("");
  const [transcribingIds, setTranscribingIds] = useState(new Set());
  const [generatingReportState, setGeneratingReportState] = useState(false);
  const [generatingAIState, setGeneratingAIState] = useState(false);

  useEffect(() => {
    setTabValue(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    async function loadVisitData() {
      setLoading(true);
      try {
        const [visitData, entriesData] = await Promise.all([getVisit(visitId), getEntries(visitId)]);
        setVisit(visitData.visit || null);
        setEntries((entriesData.entries || []).filter((entry) => !entry.deleted));

        try {
          const latestReport = await getLatestReport(visitId);
          if (latestReport.report?.type === "ai") {
            setAiReport(latestReport.report);
            setReport(null);
          } else {
            setReport(latestReport.report || null);
          }
        } catch (err) {
          if (err.status !== 404) {
            showMessage(getErrorMessage(err, t("fetchReportError")), "error");
          }
        }
      } catch (err) {
        showMessage(getErrorMessage(err, t("loadVisitError")), "error");
      } finally {
        setLoading(false);
      }
    }

    loadVisitData();
  }, [visitId, showMessage, t]);

  const orderedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [entries]
  );

  const hasAcceptedEntries = useMemo(
    () => entries.some((entry) => entry.status === "accepted" && !entry.deleted),
    [entries]
  );

  const handleAddEntry = async (payload) => {
    setSavingEntry(true);
    try {
      const data =
        payload.type === "text"
          ? await createTextEntry(visitId, payload)
          : await createFileEntry(visitId, payload);
      setEntries((prev) => [data.entry, ...prev]);
      showMessage(t("entryAdded"), "success");
    } catch (err) {
      showMessage(getErrorMessage(err, t("addEntryError")), "error");
      throw err;
    } finally {
      setSavingEntry(false);
    }
  };

  const handleChangeStatus = async (entryId, status) => {
    setUpdatingEntryId(entryId);
    try {
      const data = await updateEntry(entryId, { status });
      setEntries((prev) => prev.map((entry) => (entry._id === entryId ? data.entry : entry)));
      showMessage(t("entryUpdated"), "success");
    } catch (err) {
      showMessage(getErrorMessage(err, t("updateEntryError")), "error");
    } finally {
      setUpdatingEntryId("");
    }
  };

  const handleTranscribe = async (entryId) => {
    setTranscribingIds((prev) => {
      const next = new Set(prev);
      next.add(entryId);
      return next;
    });
    try {
      const data = await transcribeEntry(entryId);
      setEntries((prev) => prev.map((entry) => (entry._id === entryId ? data.entry : entry)));
      showMessage(t("transcriptionCompleted"), "success");
    } catch (err) {
      showMessage(getErrorMessage(err, t("transcriptionFailed")), "error");
    } finally {
      setTranscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReportState(true);
    try {
      const data = await generateReport(visitId);
      setReport(data.report || null);
      showMessage(t("reportGeneratedClassic"), "success");
    } catch (err) {
      showMessage(getErrorMessage(err, t("generateReportError")), "error");
    } finally {
      setGeneratingReportState(false);
    }
  };

  const handleGenerateAIReport = async () => {
    setGeneratingAIState(true);
    try {
      const data = await generateAIReport(visitId);
      setAiReport(data.report || null);
      showMessage(t("reportGeneratedAI"), "success");
    } catch (err) {
      showMessage(getErrorMessage(err, t("generateAIError")), "error");
    } finally {
      setGeneratingAIState(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!visit) {
    return <Alert severity="error">{t("visitNotFound")}</Alert>;
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.5 }}>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h5">{visit.projectName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t("location")}: {visit.location}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
              {t("status")}: {visit.status}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Tabs value={tabValue} onChange={(_event, value) => setTabValue(value)} variant="fullWidth">
          <Tab label={t("entries")} />
          <Tab label={t("report")} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t("addEntry")}
              </Typography>
              <EntryForm loading={savingEntry} onSubmit={handleAddEntry} />
            </CardContent>
          </Card>
          <EntryList
            entries={orderedEntries}
            onChangeStatus={handleChangeStatus}
            onTranscribe={handleTranscribe}
            transcribingIds={transcribingIds}
            updatingEntryId={updatingEntryId}
          />
        </Stack>
      )}

      {tabValue === 1 && (
        <ReportViewerLegacy
          report={report}
          aiReport={aiReport}
          hasAcceptedEntries={hasAcceptedEntries}
          generatingReport={generatingReportState}
          generatingAIReport={generatingAIState}
          onGenerateReport={handleGenerateReport}
          onGenerateAIReport={handleGenerateAIReport}
        />
      )}
    </Stack>
  );
}

export default VisitDetail;
