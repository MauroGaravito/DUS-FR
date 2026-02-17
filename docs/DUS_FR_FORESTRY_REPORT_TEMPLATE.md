# DUS Forestry Report Template Reference

This file documents the forestry markdown template used for deterministic report rendering.

Notes:

- AI reports are stored as structured JSON and rendered through the AI workspace UI.
- Image annexes for AI report view are rendered by frontend components, not by this template file.

Runtime template source:

- `frontend/src/templates/forestryReportTemplate.md`

Canonical template content:

```md
# Forestry Field Inspection Report
**Report ID:** {{reportId}}
**Project / Site:** {{visit.projectName}}
**Location:** {{visit.location}}
**Inspection Date:** {{visit.createdAt}}
**Report Date:** {{report.generatedAt}}
**Prepared For:** {{clientName}}
**Prepared By:** {{inspectorName}}

---

## Site & Visit Details
**Site:** {{visit.projectName}}
**Location:** {{visit.location}}
**Inspection Type:** {{inspectionType}}
**Weather Conditions:** {{weatherConditions}}
**Access Conditions:** {{accessConditions}}
**Personnel Present:** {{personnelPresent}}
**Notes:** {{visitNotes}}

---

## Executive Summary
{{executiveSummary}}

---

## Site Observations
{{#each observations}}
- {{this}}
{{/each}}

---

## Findings Requiring Attention
{{#each findings}}
### {{title}}
**Severity:** {{severity}}
**Evidence:** {{evidence}}
**Recommended Action:** {{recommendation}}
{{/each}}

---

## Recommended Actions Summary
{{#each findings}}
- **{{title}} ({{severity}}):** {{recommendation}}
{{/each}}

---

## Inspection Limitations
{{limitations}}

---

## Conclusion
{{conclusion}}

---

## Annexes (Media & References)
{{#each annexes}}
- {{this}}
{{/each}}
```
