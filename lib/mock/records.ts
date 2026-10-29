import type { Activity, AppNotification, DocumentItem, DocumentRequest, Task } from "../types";
import { isoFromNow } from "../utils";

type DocSeed = [
  name: string,
  category: DocumentItem["category"],
  scope: DocumentItem["scope"],
  clientId: string | undefined,
  applicationId: string | undefined,
  status: DocumentItem["status"],
  updatedDaysAgo: number,
  sizeKb: number,
  expiresInDays?: number,
  uploadedBy?: DocumentItem["uploadedBy"],
];

const DOCS: DocSeed[] = [
  // Horizon Fleet Services
  ["Horizon_Capability_Statement.pdf", "Capability Statement", "client", "c-horizon", undefined, "Approved", 12, 842],
  ["2025_Operating_Budget.xlsx", "Budget", "client", "c-horizon", "a-003", "Received", 0, 186, undefined, "client"],
  ["Cheyenne_Brooks_Bio.docx", "Resume", "client", "c-horizon", "a-003", "Approved", 9, 64],
  ["Organization_Chart.pdf", "Organization Chart", "client", "c-horizon", "a-003", "Approved", 14, 412],
  ["Past_Performance_Transportation.pdf", "Past Performance", "client", "c-horizon", undefined, "Received", 6, 1290],
  ["Letter_of_Support_City.pdf", "Letter of Support", "application", "c-horizon", "a-003", "Received", 3, 220, undefined, "client"],
  ["Letter_of_Support_TarrantCollege.pdf", "Letter of Support", "application", "c-horizon", "a-003", "Received", 2, 198, undefined, "client"],
  ["Letter_of_Support_FleetPartner.pdf", "Letter of Support", "application", "c-horizon", "a-003", "Requested", 1, 0],
  ["2025_Financial_Statements.pdf", "Financial Statement", "client", "c-horizon", "a-003", "Overdue", 7, 0],
  ["WOSB_Certification.pdf", "Certification", "client", "c-horizon", undefined, "Expiring", 200, 310, 21],
  ["Vendor_Quotes_Charging.pdf", "Budget", "application", "c-horizon", "a-003", "Received", 5, 1540],
  ["Facility_Lease_Summary.pdf", "Other", "application", "c-horizon", "a-003", "Received", 10, 380],
  ["Horizon_DOE_Project_Narrative_v3.docx", "Narrative", "application", "c-horizon", "a-003", "Draft", 0, 96, undefined, "u-maria"],
  ["Horizon_Budget_Draft.xlsx", "Budget", "application", "c-horizon", "a-003", "Draft", 1, 142, undefined, "u-david"],
  // NorthStar
  ["NorthStar_Capability_Statement.pdf", "Capability Statement", "client", "c-northstar", undefined, "Approved", 30, 756],
  ["NorthStar_FY2025_Audit.pdf", "Financial Statement", "client", "c-northstar", "a-001", "Approved", 25, 2310],
  ["NorthStar_Negotiated_Indirect_Rate.pdf", "Policy", "client", "c-northstar", "a-001", "Approved", 40, 180],
  ["Letter_of_Support_ColumbusPD.pdf", "Letter of Support", "application", "c-northstar", "a-001", "Approved", 9, 205],
  ["NorthStar_Project_Narrative_Final.pdf", "Narrative", "application", "c-northstar", "a-001", "Approved", 2, 640],
  ["SF424_NorthStar.pdf", "Federal Form", "application", "c-northstar", "a-001", "Approved", 2, 150],
  // GreenBridge
  ["GreenBridge_Rural_Eligibility_Map.pdf", "Other", "application", "c-greenbridge", "a-002", "Received", 8, 2900],
  ["GreenBridge_2024_Tax_Return_Summary.pdf", "Financial Statement", "client", "c-greenbridge", "a-002", "Received", 18, 520],
  ["Tom_Halvorsen_Resume.pdf", "Resume", "client", "c-greenbridge", "a-002", "Approved", 20, 88],
  ["Letter_of_Support_IowaStateExtension.pdf", "Letter of Support", "application", "c-greenbridge", "a-002", "Received", 6, 230],
  // Cascade
  ["Cascade_Service_Area_Map.pdf", "Other", "application", "c-cascade", "a-005", "Received", 9, 1800],
  ["Cascade_Sliding_Fee_Schedule.pdf", "Policy", "client", "c-cascade", "a-005", "Approved", 60, 140],
  ["Cascade_Staffing_Plan.xlsx", "Other", "application", "c-cascade", "a-005", "Requested", 3, 0],
  ["Cascade_Audited_Financials_2025.pdf", "Financial Statement", "client", "c-cascade", "a-005", "Received", 15, 3100],
  // Atlas
  ["Atlas_Capability_Statement.pdf", "Capability Statement", "client", "c-atlas", undefined, "Approved", 22, 690],
  ["MOU_Maricopa_Workforce_Board.pdf", "Letter of Support", "application", "c-atlas", "a-006", "Approved", 11, 410],
  ["Atlas_Placement_Outcomes_2025.xlsx", "Past Performance", "application", "c-atlas", "a-006", "Received", 1, 96, undefined, "client"],
  // Others
  ["Ironworks_Employer_Partner_Letters.pdf", "Letter of Support", "application", "c-ironworks", "a-014", "Requested", 4, 0],
  ["Ironworks_Registered_Apprenticeship_Standards.pdf", "Certification", "client", "c-ironworks", undefined, "Approved", 90, 760],
  ["Meridian_Pilot_Line_Specs.pdf", "Other", "client", "c-meridian", "a-009", "Approved", 30, 4200],
  ["BlueMesa_Tribal_Council_Resolution.pdf", "Other", "application", "c-bluemesa", "a-007", "Requested", 2, 0],
  ["BlueMesa_SAM_Renewal_Confirmation.pdf", "Certification", "client", "c-bluemesa", "a-007", "Overdue", 5, 0],
  ["Riverbend_Member_Producer_List.xlsx", "Other", "application", "c-riverbend", "a-008", "Received", 7, 72],
  ["Pinecrest_Board_Resolution_Draft.docx", "Other", "application", "c-pinecrest", "a-015", "Draft", 3, 54, undefined, "u-james"],
  // Templates
  ["Template_Letter_of_Support.docx", "Template", "template", undefined, undefined, "Approved", 45, 38],
  ["Template_Budget_Workbook_SF424A.xlsx", "Template", "template", undefined, undefined, "Approved", 60, 120],
  ["Template_Logic_Model.docx", "Template", "template", undefined, undefined, "Approved", 80, 44],
  ["Template_Key_Personnel_Resume.docx", "Template", "template", undefined, undefined, "Approved", 90, 32],
  ["Template_Project_Timeline_Gantt.xlsx", "Template", "template", undefined, undefined, "Approved", 35, 58],
  ["Template_Cost_Share_Commitment_Letter.docx", "Template", "template", undefined, undefined, "Approved", 50, 30],
  ["Template_Data_Management_Plan.docx", "Template", "template", undefined, undefined, "Approved", 120, 41],
];

export function buildDocuments(): DocumentItem[] {
  return DOCS.map(([name, category, scope, clientId, applicationId, status, updatedDaysAgo, sizeKb, expiresInDays, uploadedBy], i) => ({
    id: `d-${String(i + 1).padStart(3, "0")}`,
    name,
    fileType: name.split(".").pop()!.toUpperCase(),
    category,
    scope,
    clientId,
    applicationId,
    sizeBytes: sizeKb * 1024,
    updatedAt: isoFromNow(-updatedDaysAgo, 9 + (i % 8)),
    expiresAt: expiresInDays !== undefined ? isoFromNow(expiresInDays) : category === "Certification" ? isoFromNow(240) : undefined,
    status,
    uploadedBy: uploadedBy ?? (status === "Requested" || status === "Overdue" ? "client" : scope === "template" ? "u-priya" : "client"),
    version: status === "Draft" ? 3 : 1,
  }));
}

export function buildDocumentRequests(): DocumentRequest[] {
  return [
    {
      id: "dr-1",
      applicationId: "a-003",
      clientId: "c-horizon",
      contactId: "ct-1",
      items: [
        { id: "dri-1", name: "2025 operating budget", category: "Budget", status: "Received" },
        { id: "dri-2", name: "Most recent financial statements", category: "Financial Statement", status: "Overdue" },
        { id: "dri-3", name: "Third letter of support (fleet partner)", category: "Letter of Support", status: "Requested" },
      ],
      message: "Hi Cheyenne — to keep the DOE Clean Energy Fleet application on schedule, please upload the items below to the shared folder.",
      status: "Partially Received",
      createdAt: isoFromNow(-8, 10),
      sentAt: isoFromNow(-8, 10, 15),
      dueDate: isoFromNow(-1, 17),
    },
    {
      id: "dr-2",
      applicationId: "a-007",
      clientId: "c-bluemesa",
      contactId: "ct-12",
      items: [
        { id: "dri-4", name: "SAM.gov renewal confirmation", category: "Certification", status: "Overdue" },
        { id: "dri-5", name: "Tribal council resolution authorizing application", category: "Other", status: "Requested" },
      ],
      message: "Daniel — these two items are required before we can confirm eligibility for the DOE program.",
      status: "Overdue",
      createdAt: isoFromNow(-6, 9),
      sentAt: isoFromNow(-6, 9, 30),
      dueDate: isoFromNow(-2, 17),
    },
    {
      id: "dr-3",
      applicationId: "a-014",
      clientId: "c-ironworks",
      contactId: "ct-10",
      items: [{ id: "dri-6", name: "Employer partner letters (10 total)", category: "Letter of Support", status: "Requested" }],
      message: "Frank — please collect the remaining employer partner letters using the attached template.",
      status: "Sent",
      createdAt: isoFromNow(-4, 14),
      sentAt: isoFromNow(-4, 14, 10),
      dueDate: isoFromNow(6, 17),
    },
    {
      id: "dr-4",
      applicationId: "a-005",
      clientId: "c-cascade",
      contactId: "ct-8",
      items: [
        { id: "dri-7", name: "Staffing plan for mobile units", category: "Other", status: "Requested" },
        { id: "dri-8", name: "Audited financial statements", category: "Financial Statement", status: "Received" },
      ],
      message: "Linda — two items remain for the HRSA application.",
      status: "Partially Received",
      createdAt: isoFromNow(-5, 11),
      sentAt: isoFromNow(-5, 11, 5),
      dueDate: isoFromNow(3, 17),
    },
  ];
}

type TaskSeed = [title: string, appId: string | undefined, clientId: string | undefined, owner: Task["ownerId"], dueDays: number, priority: Task["priority"], status: Task["status"], type: Task["type"]];

const TASKS: TaskSeed[] = [
  ["Draft Statement of Need", "a-003", "c-horizon", "u-maria", 1, "High", "In Progress", "Writing"],
  ["Request financial statements", "a-003", "c-horizon", "u-david", 0, "Urgent", "To Do", "Documents"],
  ["Review project budget", "a-003", "c-horizon", "u-david", 3, "High", "To Do", "Review"],
  ["Client approval call", "a-003", "c-horizon", "u-sarah", 5, "Medium", "To Do", "Client"],
  ["Complete compliance check", "a-001", "c-northstar", "u-priya", 0, "Urgent", "In Progress", "Review"],
  ["Final submission review", "a-001", "c-northstar", "u-sarah", 1, "Urgent", "To Do", "Submission"],
  ["Confirm AOR availability for submission", "a-001", "c-northstar", "u-david", 1, "High", "Done", "Client"],
  ["Resolve internal review comments", "a-002", "c-greenbridge", "u-elena", 2, "High", "In Progress", "Writing"],
  ["Reconcile SF-424A with budget narrative", "a-002", "c-greenbridge", "u-david", 2, "High", "To Do", "Review"],
  ["Draft evaluation plan", "a-002", "c-greenbridge", "u-elena", 3, "Medium", "To Do", "Writing"],
  ["Draft sustainability plan", "a-005", "c-cascade", "u-maria", 6, "Medium", "To Do", "Writing"],
  ["Collect mobile unit staffing plan", "a-005", "c-cascade", "client", 3, "Medium", "To Do", "Documents"],
  ["Client sign-off on final narrative", "a-006", "c-atlas", "client", 4, "High", "In Progress", "Client"],
  ["Update placement outcome figures", "a-006", "c-atlas", "u-elena", 2, "Medium", "To Do", "Writing"],
  ["Confirm SAM.gov renewal", "a-007", "c-bluemesa", "u-james", -1, "Urgent", "To Do", "Documents"],
  ["NOFO deep-dive: Energy Efficiency Demonstration", "a-007", "c-bluemesa", "u-james", 4, "Medium", "In Progress", "Research"],
  ["Confirm 50% match source", "a-008", "c-riverbend", "u-david", 7, "Medium", "To Do", "Client"],
  ["Secure employer partner letters", "a-014", "c-ironworks", "client", 6, "High", "In Progress", "Documents"],
  ["Draft project description", "a-014", "c-ironworks", "u-elena", 8, "Medium", "In Progress", "Writing"],
  ["Prepare board approval memo", "a-015", "c-pinecrest", "u-james", 5, "Medium", "To Do", "Client"],
  ["Monitor agency clarification requests", "a-009", "c-meridian", "u-sarah", 10, "Low", "To Do", "Submission"],
  ["Post-award kickoff meeting", "a-010", "c-harborlight", "u-sarah", 9, "Medium", "To Do", "Client"],
  ["Request reviewer debrief", "a-013", "c-coastal", "u-maria", 12, "Low", "To Do", "Client"],
  ["Run NOFO analysis: Clean Transportation Infrastructure", undefined, "c-horizon", "u-james", 2, "High", "To Do", "Research"],
  ["Go/No-Go review: Tribal Community Energy Resilience", undefined, "c-bluemesa", "u-david", 3, "Medium", "To Do", "Research"],
  ["Evaluate Rural Behavioral Health match (closing in 48h)", undefined, "c-cascade", "u-sarah", 0, "Urgent", "To Do", "Research"],
  ["Scope project for SBA capacity application", "a-004", "c-horizon", "u-elena", 4, "Medium", "In Progress", "Writing"],
  ["Weekly pipeline review", undefined, undefined, "u-sarah", 2, "Low", "To Do", "Review"],
  ["Update quarterly performance report", "a-012", "c-ironworks", "u-david", 14, "Low", "To Do", "Submission"],
  ["Draft goals & objectives with baselines", "a-003", "c-horizon", "u-maria", 2, "High", "To Do", "Writing"],
];

export function buildTasks(): Task[] {
  return TASKS.map(([title, applicationId, clientId, ownerId, dueDays, priority, status, type], i) => ({
    id: `t-${String(i + 1).padStart(3, "0")}`,
    title,
    applicationId,
    clientId,
    ownerId,
    dueDate: isoFromNow(dueDays, 17),
    priority,
    status,
    type,
    createdAt: isoFromNow(-(5 + (i % 9)), 9),
    completedAt: status === "Done" ? isoFromNow(0, 8) : undefined,
  }));
}

type ActSeed = [type: Activity["type"], message: string, actor: Activity["actorId"], minsAgo: number, clientId?: string, applicationId?: string, opportunityId?: string];

const ACTS: ActSeed[] = [
  ["eligibility", "Maria completed eligibility review for DOJ Community Safety Partnership Grant.", "u-maria", 35, "c-northstar", "a-001", "o-dojcs"],
  ["document", "Client uploaded 2025 operating budget.", "client", 70, "c-horizon", "a-003"],
  ["review", "Project narrative moved to Internal Review.", "u-elena", 140, "c-greenbridge", "a-002"],
  ["match", "New funding opportunity matched to Horizon Fleet Services.", "system", 190, "c-horizon", undefined, "o-ctip"],
  ["budget", "Budget narrative updated.", "u-david", 260, "c-horizon", "a-003"],
  ["status", "Application marked Ready to Submit.", "u-sarah", 380, "c-northstar", "a-001"],
  ["writing", "Statement of Need draft v3 submitted for review.", "u-maria", 520, "c-horizon", "a-003"],
  ["document", "Client uploaded Letter of Support (Tarrant County College).", "client", 1500, "c-horizon", "a-003"],
  ["review", "Client review started on Digital Skills Workforce Initiative narrative.", "u-elena", 1620, "c-atlas", "a-006"],
  ["match", "Tribal Community Energy Resilience Program matched to Blue Mesa (93%).", "system", 1700, "c-bluemesa", undefined, "o-tribalenergy"],
  ["analysis", "NOFO analysis completed for Clean Energy Fleet Deployment Initiative.", "u-james", 2900, "c-horizon", "a-003", "o-cefi"],
  ["task", "Compliance check started for NorthStar submission package.", "u-priya", 3100, "c-northstar", "a-001"],
  ["document", "Document request sent to Blue Mesa Tribal Enterprises.", "u-james", 8600, "c-bluemesa", "a-007"],
  ["client", "Blue Mesa Tribal Enterprises onboarding kickoff completed.", "u-david", 9000, "c-bluemesa"],
  ["status", "Application started: SBA Small Business Innovation Capacity Program.", "u-elena", 12900, "c-horizon", "a-004", "o-sbicp"],
  ["submission", "Advanced Manufacturing Innovation Partnership submitted via Grants.gov (tracking GRANT-DEMO-14082317).", "u-sarah", 17280, "c-meridian", "a-009", "o-mfg"],
  ["eligibility", "Go/No-Go approved: Brownfields Assessment & Cleanup Grant (9/10).", "u-david", 14400, "c-pinecrest", "a-015", "o-brownfield"],
  ["writing", "Organizational Capacity section marked Complete.", "u-maria", 4300, "c-horizon", "a-003"],
  ["lead", "New inquiry received from Urban Roots Initiative.", "system", 400, undefined],
  ["lead", "Engagement proposal sent to BrightPath Youth Foundation.", "u-sarah", 2880, undefined],
  ["status", "Award notice recorded: Economic Adjustment Assistance ($750,000).", "u-david", 89280, "c-pinecrest", "a-011", "o-econ"],
  ["status", "Award notice recorded: Apprenticeship Pathways Expansion Grant ($500,000).", "u-david", 79200, "c-ironworks", "a-012", "o-apprentice"],
  ["status", "Award notice recorded: Youth Mentoring & Opportunity Program ($500,000).", "u-sarah", 57600, "c-harborlight", "a-010", "o-youth"],
  ["review", "Internal review comments added to GreenBridge evaluation plan.", "u-sarah", 2950, "c-greenbridge", "a-002"],
  ["document", "Cascade Valley uploaded audited financial statements.", "client", 7200, "c-cascade", "a-005"],
  ["client", "Funding profile updated for Horizon Fleet Services.", "u-david", 10100, "c-horizon"],
];

export function buildActivities(): Activity[] {
  return ACTS.map(([type, message, actorId, minsAgo, clientId, applicationId, opportunityId], i) => ({
    id: `act-${String(i + 1).padStart(3, "0")}`,
    type,
    message,
    actorId,
    clientId,
    applicationId,
    opportunityId,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
  }));
}

type NotifSeed = [type: AppNotification["type"], title: string, body: string, href: string, minsAgo: number, read: boolean];

const NOTIFS: NotifSeed[] = [
  ["match", "New grant matched to Horizon Fleet Services", "Clean Transportation Infrastructure Program — 86% potential match.", "/matches?client=c-horizon", 190, false],
  ["document", "Client uploaded requested document", "Horizon Fleet Services uploaded 2025_Operating_Budget.xlsx.", "/documents", 70, false],
  ["deadline", "Deadline approaching in 3 days", "Community Safety Partnership Grant — NorthStar Community Services.", "/applications/a-001", 240, false],
  ["review", "Internal review completed", "GreenBridge Rural Business Modernization — 2 open comments.", "/applications/a-002?tab=reviews", 300, false],
  ["submission", "Application ready for submission", "NorthStar — Community Safety Partnership Grant is Ready to Submit.", "/applications/a-001?tab=submission", 380, false],
  ["deadline", "Opportunity expires in 48 hours", "Rural Behavioral Health Integration Program — matched to Cascade Valley.", "/opportunities/o-behavioral", 420, false],
  ["document", "Document overdue", "2025 financial statements for Horizon Fleet Services are overdue.", "/documents", 600, false],
  ["task", "Task assigned to you", "Final submission review — NorthStar Community Services.", "/tasks", 900, true],
  ["match", "New grant matched to Blue Mesa Tribal Enterprises", "Tribal Community Energy Resilience Program — 93% potential match.", "/matches?client=c-bluemesa", 1700, true],
  ["review", "Client feedback received", "Atlas Digital Learning left 1 comment on the narrative.", "/applications/a-006?tab=reviews", 1500, true],
  ["document", "Client uploaded requested document", "Tarrant County College letter of support received.", "/documents", 1500, true],
  ["deadline", "Internal deadline tomorrow", "GreenBridge internal draft due for Rural Business Modernization.", "/applications/a-002", 2000, true],
  ["match", "New grant matched to Meridian Advanced Materials", "Small Business Technology Research Program — 83% potential match.", "/matches?client=c-meridian", 2880, true],
  ["submission", "Submission confirmed", "Meridian application received by Grants.gov (demo tracking reference).", "/applications/a-009?tab=submission", 17280, true],
  ["award", "Award recorded", "Youth Mentoring & Opportunity Program — $500,000 awarded to Harborlight.", "/applications/a-010", 57600, true],
  ["document", "Document request overdue", "Blue Mesa SAM.gov renewal confirmation is overdue.", "/documents?tab=requests", 2900, true],
  ["task", "Task overdue", "Confirm SAM.gov renewal — Blue Mesa Tribal Enterprises.", "/tasks", 1440, true],
];

export function buildNotifications(): AppNotification[] {
  return NOTIFS.map(([type, title, body, href, minsAgo, read], i) => ({
    id: `nt-${String(i + 1).padStart(3, "0")}`,
    type,
    title,
    body,
    href,
    read,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
  }));
}
