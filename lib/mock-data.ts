// Seed data for the demo workspace. Dates are generated relative to the moment
// of seeding so deadlines always look current. All opportunities are fictional
// sample data (flagged with `isDemo: true`).
import type { AppData, NOFOAnalysis } from "./types";
import { buildNofoAnalysis } from "./content-library";
import { buildClients, buildContacts, team } from "./mock/clients";
import { buildOpportunities } from "./mock/opportunities";
import { buildApplications, buildReviews } from "./mock/applications";
import { buildMatches } from "./mock/matches";
import { buildLeads } from "./mock/leads";
import { buildLeadEmails } from "./mock/lead-outreach";
import { buildActivities, buildDocumentRequests, buildDocuments, buildNotifications, buildTasks } from "./mock/records";

// Bump when the stored shape changes; older saved workspaces are reseeded.
export const DATA_VERSION = 2;

const FIRM_NAME = "Capitol Ridge Grant Partners";

export function buildSeedData(): AppData {
  const clients = buildClients();
  const opportunities = buildOpportunities();
  const applications = buildApplications(clients, opportunities);
  const matches = buildMatches(clients, opportunities);
  const leads = buildLeads();
  const { emails, pendingReplies } = buildLeadEmails(leads, team, FIRM_NAME);

  // Opportunities with an application in progress have already been analyzed.
  // The Clean Transportation Infrastructure Program is left un-analyzed for the demo flow.
  const nofoAnalyses: Record<string, NOFOAnalysis> = {};
  for (const app of applications) {
    const opp = opportunities.find((o) => o.id === app.opportunityId);
    if (opp) {
      const a = buildNofoAnalysis(opp);
      nofoAnalyses[opp.id] = { ...a, analyzedAt: app.createdAt };
    }
  }

  return {
    version: DATA_VERSION,
    seededAt: new Date().toISOString(),
    team,
    leads,
    emails,
    pendingReplies,
    leadDiscovery: { lastRunAt: new Date(Date.now() - 3 * 3_600_000).toISOString(), discoveredKeys: [] },
    clients,
    contacts: buildContacts(),
    opportunities,
    nofoAnalyses,
    matches,
    applications,
    documents: buildDocuments(),
    documentRequests: buildDocumentRequests(),
    tasks: buildTasks(),
    activities: buildActivities(),
    notifications: buildNotifications(),
    reviews: buildReviews(applications),
    settings: {
      firmName: FIRM_NAME,
      currentUserId: "u-sarah",
      defaultApplicationView: "kanban",
      compactTables: false,
      notificationPrefs: {
        newMatches: true,
        documentUploads: true,
        deadlineReminders: true,
        reviewUpdates: true,
        weeklyDigest: false,
      },
      deadlineReminderDays: 7,
    },
  };
}
