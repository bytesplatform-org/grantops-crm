"use client";
import { useMemo, useState } from "react";
import { CalendarDays, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SegmentedList, SegmentedTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useAppData } from "@/lib/data-service";
import { daysUntil } from "@/lib/utils";
import { AddTaskDialog } from "./add-task-dialog";
import { TaskCalendar } from "./task-calendar";
import { TaskList } from "./task-list";

export function TasksView() {
  const data = useAppData();
  const [view, setView] = useState("list");
  const [q, setQ] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const tasks = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.tasks.filter((t) => {
      const opp = data.opportunities.find((o) => o.id === data.applications.find((a) => a.id === t.applicationId)?.opportunityId);
      const client = data.clients.find((c) => c.id === t.clientId);
      return (
        (!term || [t.title, opp?.title, client?.name].some((s) => s?.toLowerCase().includes(term))) &&
        (!owner || t.ownerId === owner) &&
        (!priority || t.priority === priority) &&
        (!status || t.status === status)
      );
    });
  }, [data, q, owner, priority, status]);

  const open = data.tasks.filter((t) => t.status !== "Done");
  const overdue = open.filter((t) => daysUntil(t.dueDate) < 0).length;
  const dueWeek = open.filter((t) => daysUntil(t.dueDate) >= 0 && daysUntil(t.dueDate) <= 7).length;
  const doneWeek = data.tasks.filter((t) => t.completedAt && daysUntil(t.completedAt) >= -7).length;

  return (
    <Tabs value={view} onValueChange={setView}>
      <PageHeader
        title="Tasks & Calendar"
        description="Internal work, client deliverables, reviews, and grant deadlines in one place."
        actions={
          <>
            <SegmentedList>
              <SegmentedTrigger value="list"><List /> List</SegmentedTrigger>
              <SegmentedTrigger value="calendar"><CalendarDays /> Calendar</SegmentedTrigger>
            </SegmentedList>
            <AddTaskDialog />
          </>
        }
      />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard highlight label="Open tasks" value={open.length} hint={`${open.filter((t) => t.status === "In Progress").length} in progress`} />
        <StatCard label="Overdue" value={<span className={overdue ? "text-red-600" : undefined}>{overdue}</span>} hint="Needs attention" />
        <StatCard label="Due in 7 days" value={dueWeek} hint="Across all applications" />
        <StatCard label="Completed this week" value={doneWeek} hint="Team throughput" />
      </div>
      <TabsContent value="list" className="pt-0">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, grants, clients…" className="pl-8" />
          </div>
          <Select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-44" aria-label="Filter by owner">
            <option value="">All owners</option>
            {data.team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            <option value="client">Client</option>
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36" aria-label="Filter by priority">
            <option value="">All priorities</option>
            {["Urgent", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36" aria-label="Filter by status">
            <option value="">All statuses</option>
            {["To Do", "In Progress", "Done"].map((p) => <option key={p}>{p}</option>)}
          </Select>
        </div>
        <TaskList tasks={tasks} />
      </TabsContent>
      <TabsContent value="calendar" className="pt-0">
        <TaskCalendar />
      </TabsContent>
    </Tabs>
  );
}
