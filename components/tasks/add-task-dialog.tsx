"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addTask, useAppData } from "@/lib/data-service";
import type { TaskPriority, TaskType } from "@/lib/types";
import { isoFromNow } from "@/lib/utils";

const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const TYPES: TaskType[] = ["Writing", "Documents", "Review", "Client", "Submission", "Research"];

export function AddTaskDialog() {
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [appId, setAppId] = useState("");
  const [clientId, setClientId] = useState("");
  const [owner, setOwner] = useState(data.settings.currentUserId);
  const [due, setDue] = useState(isoFromNow(3).slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [type, setType] = useState<TaskType>("Writing");

  const reset = () => {
    setTitle("");
    setAppId("");
    setClientId("");
    setOwner(data.settings.currentUserId);
    setDue(isoFromNow(3).slice(0, 10));
    setPriority("Medium");
    setType("Writing");
  };

  const save = () => {
    const app = data.applications.find((a) => a.id === appId);
    addTask({
      title: title.trim(),
      applicationId: appId || undefined,
      clientId: app?.clientId ?? (clientId || undefined),
      ownerId: owner,
      dueDate: new Date(due + "T17:00:00").toISOString(),
      priority,
      status: "To Do",
      type,
    });
    toast.success("Task created", { description: title.trim() });
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>Assign work to your team or to the client.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) save();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Task</Label>
            <Input id="task-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Draft evaluation plan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Application</Label>
              <Select value={appId} onChange={(e) => { setAppId(e.target.value); const a = data.applications.find((x) => x.id === e.target.value); if (a) setClientId(a.clientId); }}>
                <option value="">None</option>
                {data.applications.map((a) => (
                  <option key={a.id} value={a.id}>{data.opportunities.find((o) => o.id === a.opportunityId)?.title}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={!!appId}>
                <option value="">None</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
                {data.team.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                <option value="client">Client</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
                {TYPES.map((p) => <option key={p}>{p}</option>)}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()}>Create task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
