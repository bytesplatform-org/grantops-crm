// Simulated lead discovery and email content for the Leads inbox. Everything
// here is fictional demo data: no scraping happens and no email is sent.
import type { EmailMessage, Lead, PendingReply, ReplyKind, TeamMember } from "../types";
import { isoFromNow, uid } from "../utils";

export const FIRM_ADDRESS = "1500 Example Plaza, Suite 400, Washington, DC 20001";

const firstName = (name: string) => name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.)\s+/, "").split(/\s+/)[0];
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

// ------------------------------------------------------------ templates

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "intro",
    name: "Introduction",
    subject: "Federal funding for {{company}}",
    body: `Hi {{firstName}},

I came across {{company}} while researching organizations working on {{fundingFocus}}. Our team helps groups like yours find and win federal grants — from identifying the right opportunities to managing the application through submission.

Based on what's public about your work, there may be a few open federal programs worth a look. Would you be open to a 20-minute call next week to compare notes?

Best,
{{senderName}}`,
  },
  {
    id: "followup",
    name: "Follow-up",
    subject: "Following up — funding options for {{company}}",
    body: `Hi {{firstName}},

Just following up on my earlier note. We recently helped a similar organization secure funding for a comparable project, and I'd be glad to share what worked.

If now isn't the right time, no problem — just let me know.

Best,
{{senderName}}`,
  },
  {
    id: "opportunity",
    name: "Share an opportunity",
    subject: "An open federal program that may fit {{company}}",
    body: `Hi {{firstName}},

A federal funding opportunity just posted that lines up well with your goal to {{fundingFocus}}. Eligibility and the cost-share terms look workable for an organization like {{company}}, though we'd want to confirm details against the full notice.

Want me to send a one-page summary?

Best,
{{senderName}}`,
  },
  {
    id: "call",
    name: "Schedule a discovery call",
    subject: "Discovery call — {{company}}",
    body: `Hi {{firstName}},

Thanks for the conversation so far. Could we set up a discovery call to walk through your priorities, timeline and any past awards? I have openings Tuesday or Thursday afternoon.

Best,
{{senderName}}`,
  },
];

export function fillTemplate(text: string, lead: Lead, senderName: string) {
  const focus = lead.fundingNeed.charAt(0).toLowerCase() + lead.fundingNeed.slice(1);
  return text
    .replaceAll("{{firstName}}", firstName(lead.contactName))
    .replaceAll("{{company}}", lead.company)
    .replaceAll("{{fundingFocus}}", focus)
    .replaceAll("{{senderName}}", senderName);
}

/** Appended to every outbound email (sender identification + opt-out). */
export function emailFooter(firmName: string) {
  return `—\n${firmName} · ${FIRM_ADDRESS}\nNot interested? Reply "unsubscribe" and we won't email you again.`;
}

// ------------------------------------------------------- simulated replies

export function replyBody(kind: ReplyKind, lead: Lead): string {
  const sign = `\n\n${lead.contactName}\n${lead.contactTitle}, ${lead.company}`;
  switch (kind) {
    case "interested":
      return `Thanks for reaching out — the timing is good. We've been trying to figure out how to fund our plan to ${lead.fundingNeed.charAt(0).toLowerCase() + lead.fundingNeed.slice(1)}, and we don't have anyone in-house who knows federal grants.\n\nCould we set up a call next week? Tuesday or Wednesday afternoon works best.${sign}`;
    case "question":
      return `Appreciate the note. Before we schedule anything — how do you usually structure fees? Is it a flat rate per application, a retainer, or a percentage of the award? Our board will want to know up front.${sign}`;
    case "not-now":
      return `Thanks for thinking of us. We're in the middle of our fiscal year and don't have capacity for a new application right now. Could you check back with us in about three months?${sign}`;
    case "opt-out":
      return `Please remove us from your mailing list. We're not interested at this time.${sign}`;
  }
}

/** Which reply a lead sends back, or null for no reply. Warmer stages reply more. */
export function pickReplyKind(lead: Lead, roll = Math.random()): ReplyKind | null {
  const warm = !["New Lead", "Contacted"].includes(lead.stage);
  const table: [ReplyKind | null, number][] = warm
    ? [["interested", 0.5], ["question", 0.35], ["not-now", 0.15]]
    : [["interested", 0.32], ["question", 0.24], ["not-now", 0.2], ["opt-out", 0.1], [null, 0.14]];
  let acc = 0;
  for (const [kind, w] of table) {
    acc += w;
    if (roll < acc) return kind;
  }
  return null;
}

/** Simulated replies arrive 12–35 seconds after sending, so they show up during a demo. */
export const replyDelayMs = (roll = Math.random()) => 12_000 + Math.round(roll * 23_000);

// ------------------------------------------------------------ seed threads

interface SeedMsg {
  dir: "out" | "in";
  at: string;
  body: string;
  read?: boolean;
}

export function buildLeadEmails(leads: Lead[], team: TeamMember[], firmName: string): { emails: EmailMessage[]; pendingReplies: PendingReply[] } {
  const emails: EmailMessage[] = [];
  const byId = Object.fromEntries(leads.map((l) => [l.id, l]));
  const sender = (id: string) => team.find((t) => t.id === id) ?? team[0];
  const thread = (leadId: string, subject: string, msgs: SeedMsg[]) => {
    const lead = byId[leadId];
    if (!lead) return;
    const threadId = uid("th");
    const me = sender(lead.ownerId);
    msgs.forEach((m, i) => {
      const out = m.dir === "out";
      emails.push({
        id: uid("em"),
        threadId,
        leadId,
        direction: out ? "outbound" : "inbound",
        fromName: out ? me.name : lead.contactName,
        fromEmail: out ? me.email : lead.email,
        toName: out ? lead.contactName : me.name,
        toEmail: out ? lead.email : me.email,
        subject: i === 0 ? subject : `Re: ${subject}`,
        body: out ? `${m.body}\n\n${me.name}\n\n${emailFooter(firmName)}` : m.body,
        sentAt: m.at,
        read: out || m.read !== false,
        senderId: out ? me.id : undefined,
      });
    });
  };

  const intro = (l: string) => `Hi ${firstName(byId[l]?.contactName ?? "")},\n\nI came across ${byId[l]?.company} while researching organizations in your field. Our team helps organizations like yours find and win federal grants. Would you be open to a short call to compare notes?`;
  const reply = (l: string, k: ReplyKind) => (byId[l] ? replyBody(k, byId[l]) : "");

  thread("l-brightpath", "Federal funding for BrightPath Youth Foundation", [
    { dir: "out", at: isoFromNow(-9, 10), body: intro("l-brightpath") },
    { dir: "in", at: isoFromNow(-8, 15), body: reply("l-brightpath", "interested") },
    { dir: "out", at: isoFromNow(-2, 14), body: "Hi Monica,\n\nGreat speaking with you and the team. Attached is our engagement proposal covering the three programs we discussed. Happy to walk your board through it." },
  ]);
  thread("l-cedarpeak", "Federal funding for Cedar Peak Logistics", [
    { dir: "out", at: isoFromNow(-6, 9), body: intro("l-cedarpeak") },
    { dir: "in", at: isoFromNow(-5, 11), body: "Hi — yes, we're exploring funding for depot charging and the timing is good. Tuesday at 2pm Mountain works for us.\n\nBrandon Lee\nVP of Operations, Cedar Peak Logistics" },
    { dir: "out", at: isoFromNow(-5, 13), body: "Hi Brandon,\n\nTuesday at 2pm Mountain is confirmed — calendar invite on its way." },
  ]);
  thread("l-renewcare", "Federal funding for RenewCare Community Health", [
    { dir: "out", at: isoFromNow(-10, 10), body: intro("l-renewcare") },
    { dir: "in", at: isoFromNow(-9, 16), body: reply("l-renewcare", "question") },
    { dir: "out", at: isoFromNow(-8, 9), body: "Hi Samuel,\n\nGood question. Most clients choose a flat fee per application, with a smaller retainer for ongoing opportunity research. We don't take a percentage of awards. Happy to share a sample scope." },
  ]);
  thread("l-nova", "Sector partnership funding — Nova Workforce Alliance", [
    { dir: "out", at: isoFromNow(-12, 10), body: intro("l-nova") },
    { dir: "in", at: isoFromNow(-11, 14), body: reply("l-nova", "interested") },
    { dir: "out", at: isoFromNow(-4, 10), body: "Hi Rachel,\n\nSharing the scope and fee options we discussed. Let me know if your board has questions." },
    { dir: "in", at: hoursAgo(5), read: false, body: "Hi Sarah,\n\nOur board approved moving forward. Could you send a revised scope that adds the digital skills track? We'd like to sign this month.\n\nRachel Kim\nDirector of Partnerships, Nova Workforce Alliance" },
  ]);
  thread("l-precision", "EV technician training — Precision Fleet Solutions", [
    { dir: "out", at: isoFromNow(-4, 11), body: intro("l-precision") },
    { dir: "in", at: hoursAgo(3), read: false, body: reply("l-precision", "question") },
  ]);
  thread("l-lakeshore", "Weatherization funding — Lakeshore Tribal Housing Authority", [
    { dir: "out", at: isoFromNow(-3, 10), body: intro("l-lakeshore") },
    { dir: "in", at: isoFromNow(-2, 13), body: reply("l-lakeshore", "interested") },
  ]);
  thread("l-summitcc", "Federal funding for Summit Valley Community College", [
    { dir: "out", at: isoFromNow(-40, 10), body: intro("l-summitcc") },
    { dir: "in", at: isoFromNow(-39, 12), body: reply("l-summitcc", "interested") },
    { dir: "out", at: isoFromNow(-20, 10), body: "Hi Allison,\n\nThe signed engagement letter is attached. Welcome aboard — we'll kick off with an intake call next week." },
  ]);
  thread("l-mountainview", "Federal funding for Mountain View Water District", [
    { dir: "out", at: isoFromNow(-30, 10), body: intro("l-mountainview") },
    { dir: "in", at: isoFromNow(-29, 9), body: reply("l-mountainview", "opt-out") },
  ]);
  thread("l-silverline", "Efficiency funding — Silverline Manufacturing Co.", [
    { dir: "out", at: isoFromNow(-7, 10), body: intro("l-silverline") },
    { dir: "in", at: isoFromNow(-6, 15), body: reply("l-silverline", "interested") },
    { dir: "out", at: isoFromNow(-1, 11), body: "Hi Nina,\n\nFollowing up with the proposal we discussed for the facility retrofit. Let me know if you'd like to review it together." },
  ]);
  thread("l-heartland", "Federal funding for Heartland Food Bank Network", [{ dir: "out", at: hoursAgo(20), body: intro("l-heartland") }]);

  // Heartland's reply "arrives" about a minute after the demo is first opened.
  const heartlandThread = emails.find((e) => e.leadId === "l-heartland")?.threadId;
  const pendingReplies: PendingReply[] = heartlandThread
    ? [{ id: uid("pr"), leadId: "l-heartland", threadId: heartlandThread, kind: "interested", dueAt: new Date(Date.now() + 60_000).toISOString() }]
    : [];
  return { emails, pendingReplies };
}

// --------------------------------------------------------- discovery pool

export type ProspectSeed = Pick<
  Lead,
  | "company"
  | "contactName"
  | "contactTitle"
  | "email"
  | "phone"
  | "organizationType"
  | "location"
  | "fundingNeed"
  | "estimatedValue"
  | "source"
  | "sourceKind"
  | "website"
  | "foundOn"
  | "emailConfidence"
  | "signals"
  | "fundingGoals"
  | "grantCategories"
> & { key: string };

/** Fictional organizations the simulated scraper "finds", a few per sync. */
export const PROSPECT_POOL: ProspectSeed[] = [
  {
    key: "riverstone-clinic",
    company: "Riverstone Free Clinic",
    contactName: "Dr. Elena Vasquez",
    contactTitle: "Medical Director",
    email: "evasquez@riverstoneclinic.example.org",
    phone: "(505) 555-0182",
    organizationType: "Nonprofit",
    location: "Albuquerque, New Mexico",
    fundingNeed: "Add dental services and extend clinic hours",
    estimatedValue: 480_000,
    source: "ProPublica Nonprofit Explorer — IRS Form 990 filers",
    sourceKind: "Nonprofit registry",
    website: "riverstoneclinic.example.org",
    foundOn: "riverstoneclinic.example.org/our-team",
    emailConfidence: "Verified",
    signals: ["Patient visits up 40% (annual report)", "No federal awards on record yet"],
    fundingGoals: ["Dental services", "Extended hours"],
    grantCategories: ["Health"],
  },
  {
    key: "northgate-transit",
    company: "Northgate Regional Transit",
    contactName: "Marcus Bell",
    contactTitle: "Planning Director",
    email: "mbell@northgatetransit.example.gov",
    phone: "(608) 555-0119",
    organizationType: "Local Government",
    location: "Madison, Wisconsin",
    fundingNeed: "Replace diesel buses with battery-electric models",
    estimatedValue: 2_400_000,
    source: "USAspending.gov — FTA award recipients",
    sourceKind: "Federal award recipients",
    website: "northgatetransit.example.gov",
    foundOn: "northgatetransit.example.gov/contact-us",
    emailConfidence: "Verified",
    signals: ["Prior FTA formula funding recipient", "Fleet plan targets zero-emission buses by 2030"],
    fundingGoals: ["Zero-emission buses", "Charging depot"],
    grantCategories: ["Transportation", "Energy"],
  },
  {
    key: "greenfield-coop",
    company: "Greenfield Growers Cooperative",
    contactName: "Hannah Lindqvist",
    contactTitle: "General Manager",
    email: "hannah@greenfieldgrowers.example.coop",
    phone: "(515) 555-0164",
    organizationType: "Cooperative",
    location: "Ames, Iowa",
    fundingNeed: "Build a shared processing and cold storage facility",
    estimatedValue: 900_000,
    source: "Local news — Iowa farm cooperative expansion story",
    sourceKind: "Local news",
    website: "greenfieldgrowers.example.coop",
    foundOn: "greenfieldgrowers.example.coop/about",
    emailConfidence: "Likely",
    signals: ["Membership grew to 85 farms", "Exploring a value-added processing facility"],
    fundingGoals: ["Processing facility", "Cold storage"],
    grantCategories: ["Agriculture", "Rural Development"],
  },
  {
    key: "bayside-literacy",
    company: "Bayside Literacy Project",
    contactName: "Tom Nguyen",
    contactTitle: "Executive Director",
    email: "tnguyen@baysideliteracy.example.org",
    phone: "(510) 555-0137",
    organizationType: "Nonprofit",
    location: "Oakland, California",
    fundingNeed: "Scale adult literacy and digital skills classes",
    estimatedValue: 350_000,
    source: "California state grant recipient list — adult education",
    sourceKind: "State grant list",
    website: "baysideliteracy.example.org",
    foundOn: "baysideliteracy.example.org/staff",
    emailConfidence: "Verified",
    signals: ["Received a state adult-education grant", "Waitlist of 200 learners"],
    fundingGoals: ["Adult literacy", "Digital skills"],
    grantCategories: ["Education", "Workforce Development"],
  },
  {
    key: "copperline-mfg",
    company: "Copperline Precision Manufacturing",
    contactName: "Sandra Ortiz",
    contactTitle: "Chief Operating Officer",
    email: "sortiz@copperline.example.com",
    phone: "(216) 555-0158",
    organizationType: "Small Business",
    location: "Cleveland, Ohio",
    fundingNeed: "Automate inspection and train machinists on new equipment",
    estimatedValue: 750_000,
    source: "Organization website — expansion announcement",
    sourceKind: "Organization website",
    website: "copperline.example.com",
    foundOn: "copperline.example.com/news/expansion",
    emailConfidence: "Likely",
    signals: ["Announced a 30,000 sq ft expansion", "Hiring 25 machinists"],
    fundingGoals: ["Automation", "Workforce training"],
    grantCategories: ["Manufacturing", "Workforce Development"],
  },
  {
    key: "pine-ridge-fire",
    company: "Pine Ridge Fire Protection District",
    contactName: "Chief Daniel Moreau",
    contactTitle: "Fire Chief",
    email: "dmoreau@pineridgefire.example.gov",
    phone: "(541) 555-0193",
    organizationType: "Local Government",
    location: "Bend, Oregon",
    fundingNeed: "Wildfire mitigation crews and a new brush engine",
    estimatedValue: 620_000,
    source: "USAspending.gov — FEMA preparedness award recipients",
    sourceKind: "Federal award recipients",
    website: "pineridgefire.example.gov",
    foundOn: "pineridgefire.example.gov/leadership",
    emailConfidence: "Verified",
    signals: ["Prior FEMA preparedness award", "Community wildfire plan updated this year"],
    fundingGoals: ["Wildfire mitigation", "Apparatus replacement"],
    grantCategories: ["Public Safety", "Resilience"],
  },
  {
    key: "sunrise-tribal-energy",
    company: "Sunrise Tribal Energy Office",
    contactName: "Leah Whitehorse",
    contactTitle: "Energy Program Manager",
    email: "lwhitehorse@sunriseenergy.example.org",
    phone: "(406) 555-0124",
    organizationType: "Tribal Organization",
    location: "Billings, Montana",
    fundingNeed: "Community solar and battery storage for public buildings",
    estimatedValue: 1_600_000,
    source: "Organization website — energy sovereignty plan",
    sourceKind: "Organization website",
    website: "sunriseenergy.example.org",
    foundOn: "sunriseenergy.example.org/contact",
    emailConfidence: "Likely",
    signals: ["Published a tribal energy plan", "Feasibility study completed"],
    fundingGoals: ["Community solar", "Battery storage"],
    grantCategories: ["Energy", "Tribal Programs"],
  },
  {
    key: "lakeside-cc",
    company: "Lakeside Technical College",
    contactName: "Dr. Priya Raman",
    contactTitle: "VP of Workforce Development",
    email: "praman@lakesidetech.example.edu",
    phone: "(920) 555-0171",
    organizationType: "Institution of Higher Education",
    location: "Green Bay, Wisconsin",
    fundingNeed: "Launch a healthcare apprenticeship pipeline",
    estimatedValue: 1_100_000,
    source: "USAspending.gov — DOL apprenticeship award recipients",
    sourceKind: "Federal award recipients",
    website: "lakesidetech.example.edu",
    foundOn: "lakesidetech.example.edu/workforce/team",
    emailConfidence: "Verified",
    signals: ["Prior DOL apprenticeship expansion award", "Regional hospital partnership announced"],
    fundingGoals: ["Apprenticeships", "Healthcare workforce"],
    grantCategories: ["Workforce Development", "Education"],
  },
  {
    key: "harbor-housing",
    company: "Harbor Point Housing Partners",
    contactName: "Angela Brooks",
    contactTitle: "Director of Development",
    email: "abrooks@harborpointhousing.example.org",
    phone: "(410) 555-0146",
    organizationType: "Nonprofit",
    location: "Baltimore, Maryland",
    fundingNeed: "Energy retrofits for 60 affordable housing units",
    estimatedValue: 840_000,
    source: "ProPublica Nonprofit Explorer — IRS Form 990 filers",
    sourceKind: "Nonprofit registry",
    website: "harborpointhousing.example.org",
    foundOn: "harborpointhousing.example.org/about/staff",
    emailConfidence: "Verified",
    signals: ["Form 990 lists a capital reserve for retrofits", "Owns 4 multifamily properties"],
    fundingGoals: ["Energy retrofits", "Affordable housing"],
    grantCategories: ["Housing", "Energy"],
  },
];
