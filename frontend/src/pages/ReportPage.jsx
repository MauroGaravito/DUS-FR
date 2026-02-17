import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext, useParams } from "react-router-dom";
import ReportViewerWorkspace from "../components/reports/ReportViewerWorkspace";
import {
  generateAIReport,
  generateReport,
  getEntries,
  getLatestReport,
  getVisit,
  updateReportContent
} from "../services/api";

const EMPTY_AI_CONTENT = {
  executiveSummary: "",
  observations: [""],
  findings: [],
  limitations: "",
  conclusion: ""
};

function normalizeAIContent(value) {
  const fallback = { ...EMPTY_AI_CONTENT };
  if (!value || typeof value !== "object") {
    return fallback;
  }
  return {
    executiveSummary:
      typeof value.executiveSummary === "string" ? value.executiveSummary : "",
    observations: Array.isArray(value.observations)
      ? value.observations.map((item) => String(item ?? ""))
      : [""],
    findings: Array.isArray(value.findings)
      ? value.findings.map((item) => ({
          title: typeof item?.title === "string" ? item.title : "",
          severity:
            item?.severity === "high" || item?.severity === "medium" || item?.severity === "low"
              ? item.severity
              : "low",
          evidence: typeof item?.evidence === "string" ? item.evidence : "",
          recommendation: typeof item?.recommendation === "string" ? item.recommendation : ""
        }))
      : [],
    limitations: typeof value.limitations === "string" ? value.limitations : "",
    conclusion: typeof value.conclusion === "string" ? value.conclusion : ""
  };
}

function parseAIReportContent(content) {
  if (!content || typeof content !== "string") {
    return { ...EMPTY_AI_CONTENT };
  }
  try {
    const parsed = JSON.parse(content);
    return normalizeAIContent(parsed);
  } catch {
    return { ...EMPTY_AI_CONTENT };
  }
}

function comparableJsonString(value) {
  try {
    return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value);
  } catch {
    return "";
  }
}

function pickPreferredReport(classicReport, aiReport) {
  if (!classicReport && !aiReport) return null;
  if (classicReport && !aiReport) return classicReport;
  if (!classicReport && aiReport) return aiReport;

  const classicDate = new Date(classicReport.generatedAt || 0).getTime();
  const aiDate = new Date(aiReport.generatedAt || 0).getTime();
  return aiDate >= classicDate ? aiReport : classicReport;
}

function ReportSkeleton() {
  return (
    <Stack spacing={2} sx={{ maxWidth: 900, mx: "auto", width: "100%" }}>
      <Skeleton variant="rounded" height={48} />
      <Skeleton variant="rounded" height={560} />
    </Stack>
  );
}

function ReportPage() {
  const { t } = useTranslation();
  const { visitId } = useParams();
  const { showMessage } = useOutletContext();
  const documentRef = useRef(null);

  const [visit, setVisit] = useState(null);
  const [report, setReport] = useState(null);
  const [hasAcceptedEntries, setHasAcceptedEntries] = useState(false);
  const [annexImages, setAnnexImages] = useState([]);
  const [editableContent, setEditableContent] = useState({ ...EMPTY_AI_CONTENT });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingGenerationType, setPendingGenerationType] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedIndustry] = useState("forestry");

  useEffect(() => {
    async function loadReportWorkspace() {
      setLoading(true);
      try {
        const [visitData, entriesData, classicResult, aiResult] = await Promise.all([
          getVisit(visitId),
          getEntries(visitId),
          getLatestReport(visitId).catch((error) => (error.status === 404 ? null : Promise.reject(error))),
          getLatestReport(visitId, "ai").catch((error) =>
            error.status === 404 ? null : Promise.reject(error)
          )
        ]);

        const selectedReport = pickPreferredReport(classicResult?.report, aiResult?.report);
        setVisit(visitData.visit || null);
        setReport(selectedReport);
        setHasAcceptedEntries(
          (entriesData.entries || []).some((entry) => entry.status === "accepted" && !entry.deleted)
        );
        setAnnexImages(
          (entriesData.entries || [])
            .filter((entry) => entry.status === "accepted" && !entry.deleted && entry.type === "photo")
            .map((entry) => ({
              url: entry.fileUrl || "",
              note: entry.text || ""
            }))
        );

        if (selectedReport?.type === "ai") {
          setEditableContent(parseAIReportContent(selectedReport.content));
        } else {
          setEditableContent({ ...EMPTY_AI_CONTENT });
        }
      } catch (error) {
        showMessage(error.message || t("reportWorkspaceLoadError"), "error");
      } finally {
        setLoading(false);
      }
    }

    loadReportWorkspace();
  }, [visitId, showMessage, t]);

  const hasUnsavedChanges = useMemo(() => {
    if (!report || report.type !== "ai") {
      return false;
    }
    const originalComparable = comparableJsonString(report.content);
    const editableComparable = comparableJsonString(editableContent);
    return originalComparable !== editableComparable;
  }, [report, editableContent]);

  const executeGeneration = async (type) => {
    setProcessing(true);
    try {
      const response =
        type === "ai"
          ? await generateAIReport(visitId, {
              industry: selectedIndustry,
              language: selectedLanguage
            })
          : await generateReport(visitId);
      const nextReport = response.report || null;
      setReport(nextReport);
      if (nextReport?.type === "ai") {
        setEditableContent(parseAIReportContent(nextReport.content));
      } else {
        setEditableContent({ ...EMPTY_AI_CONTENT });
      }
      showMessage(type === "ai" ? t("reportGeneratedAI") : t("reportGeneratedClassic"), "success");
    } catch (error) {
      showMessage(error.message || t("generateReportError"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const requestGeneration = (type) => {
    if (report || hasUnsavedChanges) {
      setPendingGenerationType(type);
      setConfirmOpen(true);
      return;
    }
    executeGeneration(type);
  };

  const handleSaveChanges = async () => {
    if (!report || report.type !== "ai") {
      return;
    }

    const normalized = normalizeAIContent(editableContent);
    const content = JSON.stringify(normalized, null, 2);

    setSavingChanges(true);
    try {
      const response = await updateReportContent(report._id, content);
      setReport(response.report || null);
      setEditableContent(normalized);
      showMessage(t("saveAIChangesSuccess"), "success");
    } catch (error) {
      showMessage(error.message || t("saveAIChangesError"), "error");
    } finally {
      setSavingChanges(false);
    }
  };

  const handleExportPdf = async () => {
    if (!documentRef.current) {
      showMessage(t("reportContentNotReady"), "error");
      return;
    }

    setExportingPdf(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let positionY = margin;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, positionY, imgWidth, imgHeight);
      remainingHeight -= pageHeight - margin * 2;

      while (remainingHeight > 0) {
        positionY -= pageHeight - margin * 2;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", margin, positionY, imgWidth, imgHeight);
        remainingHeight -= pageHeight - margin * 2;
      }

      const safeProjectName = (visit?.projectName || "report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const reportType = report?.type === "ai" ? "ai" : "classic";
      pdf.save(`${safeProjectName}-${reportType}-report.pdf`);
      showMessage(t("exportPdfSuccess"), "success");
    } catch (error) {
      showMessage(error.message || t("exportPdfError"), "error");
    } finally {
      setExportingPdf(false);
    }
  };

  const confirmRegeneration = () => {
    const nextType = pendingGenerationType;
    setConfirmOpen(false);
    setPendingGenerationType("");
    if (nextType) {
      executeGeneration(nextType);
    }
  };

  if (loading) {
    return <ReportSkeleton />;
  }

  return (
    <>
      <Stack spacing={2}>
        <FormControl size="small" sx={{ maxWidth: 260, ml: "auto" }}>
          <InputLabel id="report-language-label">{t("reportLanguage")}</InputLabel>
          <Select
            labelId="report-language-label"
            label={t("reportLanguage")}
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value)}
          >
            <MenuItem value="en">{t("english")}</MenuItem>
            <MenuItem value="es">{t("spanish")}</MenuItem>
            <MenuItem value="pt">{t("portuguese")}</MenuItem>
          </Select>
        </FormControl>

        <ReportViewerWorkspace
        documentRef={documentRef}
        visit={visit}
        report={report}
        annexImages={annexImages}
        loading={processing}
        hasAcceptedEntries={hasAcceptedEntries}
        editableContent={editableContent}
        setEditableContent={setEditableContent}
        hasUnsavedChanges={hasUnsavedChanges}
        savingChanges={savingChanges}
        exportingPdf={exportingPdf}
        onGenerateClassic={() => requestGeneration("classic")}
        onGenerateAI={() => requestGeneration("ai")}
        onSave={handleSaveChanges}
        onExport={handleExportPdf}
        />
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t("regenerateReportTitle")}</DialogTitle>
        <DialogContent>
          {t("regenerateReportMessage")}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit" disabled={processing}>
            {t("cancel")}
          </Button>
          <Button onClick={confirmRegeneration} variant="contained" disabled={processing}>
            {t("continue")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ReportPage;
