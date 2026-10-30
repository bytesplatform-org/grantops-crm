"use client";
import { useState } from "react";
import { Bell, Database, RotateCcw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { resetDemo, updateSettings, useAppData } from "@/lib/data-service";
import { STORAGE_KEY } from "@/lib/storage";
import type { Settings } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";

const NOTIF_LABELS: { key: keyof Settings["notificationPrefs"]; label: string; description: string }[] = [
  { key: "newMatches", label: "New funding matches", description: "When an opportunity is matched to one of your clients." },
  { key: "documentUploads", label: "Client document uploads", description: "When a client uploads a requested document." },
  { key: "deadlineReminders", label: "Deadline reminders", description: "Reminders ahead of internal and submission deadlines." },
  { key: "reviewUpdates", label: "Review updates", description: "Comments, approvals, and change requests on reviews." },
  { key: "weeklyDigest", label: "Weekly pipeline digest", description: "A Monday summary of pipeline, deadlines, and risks." },
];

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const data = useAppData();
  const s = data.settings;
  const [confirm, setConfirm] = useState(false);
  const [firmName, setFirmName] = useState(s.firmName);

  const counts: [string, number][] = [
    ["Clients", data.clients.length],
    ["Leads", data.leads.length],
    ["Opportunities", data.opportunities.length],
    ["Matches", data.matches.length],
    ["Applications", data.applications.length],
    ["Documents", data.documents.length],
    ["Tasks", data.tasks.length],
    ["Activity records", data.activities.length],
    ["Notifications", data.notifications.length],
    ["Reviews", data.reviews.length],
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Manage demo data, workspace preferences, and notifications." />
      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">
            <Database /> Demo Data
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SlidersHorizontal /> Preferences
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell /> Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Demo workspace</CardTitle>
                <CardDescription>All data is stored locally in this browser. Changes persist across refreshes.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Storage key</dt>
                  <dd className="mt-1 font-mono text-[13px]">{STORAGE_KEY}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Seeded</dt>
                  <dd className="mt-1 font-medium">{formatDateTime(data.seededAt)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Data version</dt>
                  <dd className="mt-1 font-medium">v{data.version}</dd>
                </div>
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {counts.map(([label, n]) => (
                  <div key={label} className="rounded-md border border-border bg-muted/40 px-3 py-2">
                    <div className="text-lg font-semibold tabular">{n}</div>
                    <div className="text-[11px] text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Opportunities in this workspace are fictional sample data and do not represent currently available federal funding.</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardHeader>
              <div>
                <CardTitle>Reset Demo Workspace</CardTitle>
                <CardDescription>Restore every client, application, document, and task to the original sample data. This cannot be undone.</CardDescription>
              </div>
              <Button variant="destructive" onClick={() => setConfirm(true)}>
                <RotateCcw /> Reset Demo Workspace
              </Button>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardContent className="pt-1">
              <Row label="Firm name" description="Shown in the sidebar workspace card.">
                <div className="flex gap-2">
                  <Input value={firmName} onChange={(e) => setFirmName(e.target.value)} className="w-64" aria-label="Firm name" />
                  <Button
                    variant="outline"
                    disabled={!firmName.trim() || firmName === s.firmName}
                    onClick={() => {
                      updateSettings({ firmName: firmName.trim() });
                      toast.success("Firm name updated");
                    }}
                  >
                    Save
                  </Button>
                </div>
              </Row>
              <Row label="Default applications view" description="How the Applications page opens.">
                <Select
                  className="w-40"
                  aria-label="Default applications view"
                  value={s.defaultApplicationView}
                  onChange={(e) => {
                    updateSettings({ defaultApplicationView: e.target.value as Settings["defaultApplicationView"] });
                    toast.success("Preference saved");
                  }}
                >
                  <option value="kanban">Board</option>
                  <option value="table">Table</option>
                </Select>
              </Row>
              <Row label="Compact tables" description="Reduce row height in data tables.">
                <Switch checked={s.compactTables} onCheckedChange={(v) => updateSettings({ compactTables: v })} aria-label="Compact tables" />
              </Row>
              <Row label="Signed in as" description="Demo session — no real authentication.">
                <span className="text-sm text-muted-foreground">demo@grantos.local</span>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardContent className="pt-1">
              {NOTIF_LABELS.map((n) => (
                <Row key={n.key} label={n.label} description={n.description}>
                  <Switch
                    checked={s.notificationPrefs[n.key]}
                    aria-label={n.label}
                    onCheckedChange={(v) => updateSettings({ notificationPrefs: { ...s.notificationPrefs, [n.key]: v } })}
                  />
                </Row>
              ))}
              <Row label="Deadline reminder lead time" description="Days before a deadline to send reminders.">
                <Select
                  className="w-32"
                  aria-label="Deadline reminder lead time"
                  value={String(s.deadlineReminderDays)}
                  onChange={(e) => updateSettings({ deadlineReminderDays: Number(e.target.value) })}
                >
                  {[3, 5, 7, 14, 21].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </Select>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset demo workspace?</DialogTitle>
            <DialogDescription>All changes made in this browser — new leads, edits, writing, uploads, and statuses — will be replaced with the original sample data.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground">This affects only local browser storage ({STORAGE_KEY}).</Label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDemo();
                setConfirm(false);
                setFirmName("Capitol Ridge Grant Partners");
                toast.success("Demo workspace reset", { description: "All sample data has been restored." });
              }}
            >
              <RotateCcw /> Reset workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
