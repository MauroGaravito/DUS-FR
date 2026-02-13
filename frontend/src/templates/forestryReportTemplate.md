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
