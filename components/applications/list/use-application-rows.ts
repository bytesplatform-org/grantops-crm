"use client";
import { useMemo } from "react";
import type { AppData, Application, Client, Opportunity } from "@/lib/types";
import { applicationCompletion, missingDocumentsCount } from "@/lib/selectors";

export interface AppRow {
  app: Application;
  opp?: Opportunity;
  client?: Client;
  completion: number;
  missingDocs: number;
}

export function useApplicationRows(data: AppData): AppRow[] {
  return useMemo(
    () =>
      data.applications.map((app) => ({
        app,
        opp: data.opportunities.find((o) => o.id === app.opportunityId),
        client: data.clients.find((c) => c.id === app.clientId),
        completion: applicationCompletion(app),
        missingDocs: missingDocumentsCount(app),
      })),
    [data],
  );
}
