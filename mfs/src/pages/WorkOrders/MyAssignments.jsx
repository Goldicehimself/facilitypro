// ShadCN + Tailwind (JSX) – My Assignments
// Professional, polished UI with enhanced UX

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, CheckCircle2, AlertCircle, Zap, Calendar, MapPin, Tag } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getWorkOrders, updateWorkOrderStatus } from "@/api/workOrders";

// ---------- helpers ----------
const today = new Date();
const isOverdue = (date, status) => {
  if (!date || status === "completed") return false;
  return new Date(date) < today;
};

// ---------- component ----------
export default function MyAssignments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [visible, setVisible] = useState(6);
  const [workOrders, setWorkOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const isManager = ["admin", "facility_manager"].includes(user?.role);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getWorkOrders();
        if (!active) return;
        const list = Array.isArray(data)
          ? data
          : (data?.workOrders || data?.data || []);
        setWorkOrders(list);
      } catch (error) {
        if (!active) return;
        setWorkOrders([]);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo(() => {
    return workOrders
      .map((wo) => ({
        ...wo,
        overdue: isOverdue(wo.scheduledDate || wo.dueDate, wo.status),
      }))
      .filter((wo) => {
        if (!isManager) {
          const getId = (value) => value?._id || value?.id || value || '';
          const assignedId = getId(wo.assignedTo);
          const teamIds = Array.isArray(wo.team)
            ? wo.team.map((member) => getId(member)).filter(Boolean)
            : [];
          const assignedName =
            wo.assignedTo?.name ||
            wo.assignedTo?.fullName ||
            wo.assignedTo?.email ||
            '';
          const currentUserId = getId(user);
          const currentUserName = user?.name || '';
          const isAssignedToMe =
            (currentUserId &&
              (String(assignedId) === String(currentUserId) ||
                teamIds.some((id) => String(id) === String(currentUserId)))) ||
            (currentUserName && assignedName && assignedName === currentUserName);
          if (!isAssignedToMe) return false;
        }
        if (status !== "all" && wo.status !== status) return false;
        if (priority !== "all" && wo.priority !== priority) return false;
        if (
          search &&
          !wo.title.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      });
  }, [search, status, priority, workOrders, isManager, user]);

  const stats = useMemo(() => {
    const assigned = data.length;
    return {
      assigned,
      inProgress: data.filter((d) => d.status === "in_progress").length,
      completed: data.filter((d) => d.status === "completed").length,
      overdue: data.filter((d) => d.overdue).length,
    };
  }, [data]);

  const managerStats = useMemo(() => {
    const total = workOrders.length;
    const open = workOrders.filter((w) => w.status === "open" || w.status === "to_do").length;
    const inProgress = workOrders.filter((w) => w.status === "in_progress").length;
    const completed = workOrders.filter((w) => w.status === "completed").length;
    const overdue = workOrders.filter((w) => isOverdue(w.scheduledDate || w.dueDate, w.status)).length;

    const currentUserName = user?.name || "";
    const createdByMe = workOrders.filter((w) => {
      const requestedBy =
        w.requestedBy?.name ||
        w.requestedBy ||
        w.reportedBy?.name ||
        w.reportedBy ||
        w.createdBy?.name ||
        w.createdBy ||
        "";
      return requestedBy && requestedBy === currentUserName;
    }).length;

    const reassigned = workOrders.reduce((count, w) => {
      if (Number.isInteger(w.reassignedCount) && w.reassignedCount > 0) return count + 1;
      if (Array.isArray(w.assignmentHistory) && w.assignmentHistory.length > 1) return count + 1;
      return count;
    }, 0);

    const completedWithTimes = workOrders.filter((w) => w.status === "completed" && w.createdAt && w.completedAt);
    const avgCompletionHours = completedWithTimes.length
      ? (completedWithTimes.reduce((sum, w) => {
          const start = new Date(w.createdAt).getTime();
          const end = new Date(w.completedAt).getTime();
          if (Number.isNaN(start) || Number.isNaN(end)) return sum;
          return sum + Math.max(0, (end - start) / (1000 * 60 * 60));
        }, 0) / completedWithTimes.length)
      : null;

    return {
      total,
      open,
      inProgress,
      completed,
      overdue,
      createdByMe,
      reassigned,
      avgCompletionHours,
    };
  }, [workOrders, user]);

  const handleStart = async (id) => {
    setUpdatingId(id);
    try {
      const updated = await updateWorkOrderStatus(id, "in_progress");
      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === id ? { ...wo, ...updated } : wo))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950 rounded-lg p-6 border border-indigo-200 dark:border-indigo-800">
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
          {isManager ? "Assignment Summary" : "My Assignments"}
        </h1>
        <p className="text-indigo-700 dark:text-indigo-300 mt-1">
          {isManager
            ? "High-level overview of assignment status and activity"
            : "Manage and track your assigned work orders"}
        </p>
      </div>

      {!isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Zap className="h-5 w-5" />}
            title="Assigned Today" 
            value={stats.assigned} 
            color="indigo"
            trend="+2 from yesterday"
          />
          <StatCard 
            icon={<Clock className="h-5 w-5" />}
            title="In Progress" 
            value={stats.inProgress} 
            color="amber"
            trend="3 active"
          />
          <StatCard 
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Completed" 
            value={stats.completed} 
            color="emerald"
            trend="This week"
          />
          <StatCard 
            icon={<AlertCircle className="h-5 w-5" />}
            title="Overdue" 
            value={stats.overdue} 
            color="rose"
            trend="Urgent action needed"
          />
        </div>
      )}

      {isManager ? (
        <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Summary Only</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Managers can view assignment totals but not individual assignments.
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-zinc-700 dark:text-zinc-200" onClick={() => navigate("/reports")}>
                View Reports
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Zap className="h-5 w-5" />}
                title="Total Assignments"
                value={managerStats.total}
                color="indigo"
                trend="All work orders"
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
                title="Open / In Progress"
                value={`${managerStats.open} / ${managerStats.inProgress}`}
                color="amber"
                trend="Active workload"
              />
              <StatCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="Completed"
                value={managerStats.completed}
                color="emerald"
                trend="Total completed"
              />
              <StatCard
                icon={<AlertCircle className="h-5 w-5" />}
                title="Overdue"
                value={managerStats.overdue}
                color="rose"
                trend="Needs attention"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Created By Me</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{managerStats.createdByMe}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reassigned</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{managerStats.reassigned}</p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Avg Completion</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {managerStats.avgCompletionHours === null
                    ? "—"
                    : `${managerStats.avgCompletionHours.toFixed(1)}h`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter Section */}
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    className="pl-9 h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    placeholder="Search work orders by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full md:w-[180px] h-10 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                    <SelectValue placeholder="Filter by Priority" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-900 dark:text-zinc-100">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All Status" },
                  { value: "to_do", label: "To Do" },
                  { value: "in_progress", label: "In Progress" },
                  { value: "completed", label: "Completed" },
                ].map((s) => (
                  <Button
                    key={s.value}
                    variant={status === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatus(s.value)}
                    className={status === s.value ? "bg-blue-700 hover:bg-blue-800" : "text-zinc-700 dark:text-zinc-200"}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Orders List */}
          <AnimatePresence>
            <div className="grid grid-cols-1 gap-4">
              {data.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-600 dark:text-zinc-400">No work orders found</p>
                </div>
              ) : (
                data.slice(0, visible).map((wo, idx) => (
                  <motion.div
                    key={wo.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <WorkOrderCard
                      wo={wo}
                      onView={() => navigate(`/work-orders/${wo.id}`, { state: { workOrder: wo } })}
                      onStart={() => handleStart(wo.id)}
                      isUpdating={updatingId === wo.id}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </AnimatePresence>

          {/* Load More */}
          {visible < data.length && (
            <div className="text-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setVisible(v => v + 6)}
                className="px-8 text-zinc-700 dark:text-zinc-200"
              >
                Load More Work Orders
              </Button>
            </div>
          )}

          {data.length > 0 && visible >= data.length && (
            <div className="text-center pt-4 text-sm text-muted-foreground">
              Showing {visible} of {data.length} work orders
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Work Order Card Component ----------
function WorkOrderCard({ wo, onView, onStart, isUpdating }) {
  return (
    <Card className={`border-l-4 transition-all hover:shadow-md ${
      wo.overdue 
        ? 'border-l-rose-500 bg-rose-50/30 dark:bg-rose-950/20' 
        : wo.status === 'completed'
        ? 'border-l-emerald-500'
        : wo.status === 'in_progress'
        ? 'border-l-amber-500'
        : 'border-l-indigo-500'
    }`}>
      <CardContent className="p-5 space-y-4">
        {/* Top Row: ID, Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
              {wo.woNumber}
            </span>
            <Badge variant={priorityVariant(wo.priority)} className="font-medium">
              {wo.priority.charAt(0).toUpperCase() + wo.priority.slice(1)} Priority
            </Badge>
            <Badge variant={statusVariant(wo.status, wo.overdue)} className="font-medium">
              {wo.overdue ? '🔴 Overdue' : statusLabel(wo.status)}
            </Badge>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
            {wo.title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
            {wo.description}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <DetailItem 
            icon={<Calendar className="h-4 w-4" />}
            label={wo.overdue ? 'Due Date' : 'Scheduled'} 
            value={formatDate(wo.scheduledDate)}
            highlight={wo.overdue}
          />
          <DetailItem 
            icon={<MapPin className="h-4 w-4" />}
            label="Location" 
            value={wo.location?.name || 'N/A'}
          />
          <DetailItem 
            icon={<Tag className="h-4 w-4" />}
            label="Category" 
            value={wo.category}
          />
          <DetailItem 
            icon={<Zap className="h-4 w-4" />}
            label="Status" 
            value={wo.status === 'in_progress' ? 'In Progress' : wo.status === 'to_do' ? 'Pending' : 'Done'}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200 dark:border-zinc-700">
          {wo.overdue ? (
            <Button 
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-medium"
              onClick={onStart}
              disabled={isUpdating}
            >
              ⚠️ Start Now
            </Button>
          ) : wo.status === "in_progress" ? (
            <Button 
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium"
              onClick={onStart}
              disabled={isUpdating}
            >
              ▶ Continue
            </Button>
          ) : wo.status === "to_do" ? (
            <Button 
              className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-medium"
              onClick={onStart}
              disabled={isUpdating}
            >
              ▶ Start
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1 text-zinc-700 dark:text-zinc-200"
              onClick={onView}
            >
              ✓ View Details
            </Button>
          )}
          <Button 
            variant="outline" 
            className="flex-1 text-zinc-700 dark:text-zinc-200"
            onClick={onView}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Sub Components ----------
function StatCard({ icon, title, value, color, trend }) {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    amber: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    rose: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  };

  return (
    <Card className={`border ${colorMap[color]}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold opacity-75 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            <p className="text-xs opacity-60 mt-2">{trend}</p>
          </div>
          <div className="opacity-40">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({ icon, label, value, highlight }) {
  return (
    <div className={`flex items-start gap-2 ${highlight ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
      <span className="mt-0.5 opacity-70">{icon}</span>
      <div className="text-xs">
        <p className="opacity-70 uppercase tracking-wide font-medium">{label}</p>
        <p className={`font-semibold ${highlight ? 'font-bold text-sm' : 'text-zinc-900 dark:text-zinc-100'}`}>{value}</p>
      </div>
    </div>
  );
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const statusLabel = (s) => ({
  'to_do': 'To Do',
  'in_progress': 'In Progress',
  'completed': 'Completed',
}[s] || s);

const priorityVariant = (p) => ({
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
}[p] || 'outline');

const statusVariant = (s, overdue) => overdue
  ? 'destructive'
  : s === 'completed'
  ? 'default'
  : 'secondary';

