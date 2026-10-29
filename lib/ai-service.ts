// Simulated AI service. Every function is async and returns predefined,
// context-aware content after a short delay. To connect a real model, replace
// these implementations with fetch() calls to a backend route — the signatures
// are what the UI depends on. No external AI APIs are called.
import type { ApplicationSection, Client, NOFOAnalysis, Opportunity } from "./types";
import {
  buildNofoAnalysis,
  checkRequirement as checkRequirementLocal,
  draftSectionContent,
  improveContent,
  shortenContent,
  type RequirementCheck,
} from "./content-library";
import { sleep } from "./utils";

export interface DraftContext {
  client: Client;
  opportunity: Opportunity;
  amount: number;
}

export const aiService = {
  async analyzeNofo(opportunity: Opportunity, analyzedBy: string): Promise<NOFOAnalysis> {
    await sleep(2200);
    return buildNofoAnalysis(opportunity, analyzedBy);
  },

  async generateDraft(sectionKey: string, ctx: DraftContext): Promise<string> {
    await sleep(1600);
    return draftSectionContent(sectionKey, ctx);
  },

  async improve(text: string, sectionTitle: string): Promise<string> {
    await sleep(1200);
    return improveContent(text, sectionTitle);
  },

  async shorten(text: string): Promise<string> {
    await sleep(1000);
    return shortenContent(text);
  },

  async checkRequirement(section: Pick<ApplicationSection, "title" | "content" | "wordLimit">): Promise<RequirementCheck> {
    await sleep(1100);
    return checkRequirementLocal(section);
  },
};

export type { RequirementCheck };
