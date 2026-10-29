"use client";
import { useMemo } from "react";
import { useAppData } from "@/lib/data-service";
import type { AppData, Application, Client, NOFOAnalysis, Opportunity, Review } from "@/lib/types";

export interface AppContext {
  data: AppData;
  app: Application;
  opp?: Opportunity;
  client?: Client;
  reviews: Review[];
  analysis?: NOFOAnalysis;
}

export function useApplication(id: string): AppContext | undefined {
  const data = useAppData();
  return useMemo(() => {
    const app = data.applications.find((a) => a.id === id);
    if (!app) return undefined;
    return {
      data,
      app,
      opp: data.opportunities.find((o) => o.id === app.opportunityId),
      client: data.clients.find((c) => c.id === app.clientId),
      reviews: data.reviews.filter((r) => r.applicationId === app.id),
      analysis: data.nofoAnalyses[app.opportunityId],
    };
  }, [data, id]);
}
