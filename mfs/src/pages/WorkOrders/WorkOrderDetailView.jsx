import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "react-toastify";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getWorkOrder, updateWorkOrderStatus } from "../../api/workOrders";
import ProtectedImage from "../../components/common/ProtectedImage";

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-US") : "—";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-US") : "—";

const statusLabel = (status) => {
  const map = {
    open: "Open",
    to_do: "To Do",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
    cancelled: "Cancelled",
  };
  return map[status] || status || "—";
};

const statusVariant = (status) => {
  if (status === "completed") return "default";
  if (status === "overdue") return "destructive";
  if (status === "in_progress") return "secondary";
  return "outline";
};

const priorityVariant = (priority) => {
  if (priority === "critical") return "destructive";
  if (priority === "high") return "secondary";
  if (priority === "medium") return "outline";
  return "outline";
};

export default function WorkOrderDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const locationWorkOrder = location.state?.workOrder || null;

  const { data: fetchedWorkOrder, isLoading } = useQuery(
    ["workOrder", id],
    () => getWorkOrder(id),
    {
      initialData: locationWorkOrder,
      staleTime: 30 * 1000,
    }
  );

  const workOrder = fetchedWorkOrder || locationWorkOrder || null;

  const statusMut = useMutation(
    (status) => updateWorkOrderStatus(id, status),
    {
      onSuccess: (updated) => {
        queryClient.setQueryData(["workOrder", id], updated);
        toast.success("Status updated");
      },
      onError: () => toast.error("Failed to update status"),
    }
  );

  const normalized = useMemo(() => {
    if (!workOrder) return null;
    return {
      ...workOrder,
      woNumber: workOrder.woNumber || workOrder.id || "—",
      title: workOrder.title || "Work Order",
      description: workOrder.description || "—",
      status: workOrder.status || "open",
      priority: workOrder.priority || "—",
      category: workOrder.category || workOrder.serviceType || "—",
      dueDate: workOrder.dueDate || workOrder.scheduledDate || null,
      createdAt: workOrder.createdAt || null,
      completedAt: workOrder.completedAt || null,
      locationName:
        workOrder.location?.fullPath ||
        workOrder.location?.name ||
        workOrder.locationName ||
        "—",
      assetName: workOrder.asset?.name || workOrder.assetName || "—",
      assignedToName:
        workOrder.assignedTo?.name ||
        workOrder.assignee?.name ||
        workOrder.assignedTo ||
        "Unassigned",
      assignedToEmail:
        workOrder.assignedTo?.email || workOrder.assignee?.email || "—",
      assignedToPhone:
        workOrder.assignedTo?.phone || workOrder.assignee?.phone || "—",
      assignedToRole: workOrder.assignedTo?.role || workOrder.assignee?.role || null,
      assignedToCertified: Array.isArray(workOrder.assignedTo?.certificates)
        ? workOrder.assignedTo.certificates.length > 0
        : false,
      reportedByName:
        workOrder.reportedBy?.name ||
        workOrder.requestedBy?.name ||
        workOrder.requestedBy ||
        "—",
      photos: [
        ...(Array.isArray(workOrder.photos) ? workOrder.photos : []),
        ...(Array.isArray(workOrder.photoUrls) ? workOrder.photoUrls : []),
        ...(Array.isArray(workOrder.attachments) ? workOrder.attachments : []),
      ]
        .map((item) => (typeof item === "string" ? { url: item } : item))
        .filter((item) => item && item.url),
      comments: (workOrder.comments || []).map((c) => {
        if (c.user || c.text) return c;
        return {
          user: c.user || { name: c.author || "Unknown" },
          text: c.message || "",
          createdAt: c.timestamp || c.createdAt || null,
        };
      }),
    };
  }, [workOrder]);

  const handleStatus = (status) => {
    statusMut.mutate(status);
  };

  if (isLoading && !workOrder) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading work order...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!normalized) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Work order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to work orders
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {normalized.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {normalized.woNumber} • {normalized.category}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={priorityVariant(normalized.priority)}>
            {String(normalized.priority).charAt(0).toUpperCase() +
              String(normalized.priority).slice(1)}{" "}
            Priority
          </Badge>
          <Badge variant={statusVariant(normalized.status)}>
            {statusLabel(normalized.status)}
          </Badge>
          <Button
            onClick={() => handleStatus("in_progress")}
            disabled={
              statusMut.isLoading || normalized.status === "in_progress"
            }
          >
            Start
          </Button>
          <Button
            onClick={() => handleStatus("completed")}
            disabled={statusMut.isLoading || normalized.status === "completed"}
          >
            Complete
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatus("cancelled")}
            disabled={statusMut.isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <ClipboardList className="h-4 w-4" />
              Work Order Summary
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {normalized.description}
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SummaryItem
                icon={<Calendar className="h-4 w-4" />}
                label="Created"
                value={formatDateTime(normalized.createdAt)}
              />
              <SummaryItem
                icon={<Calendar className="h-4 w-4" />}
                label="Due"
                value={formatDateTime(normalized.dueDate)}
              />
              <SummaryItem
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Completed"
                value={formatDateTime(normalized.completedAt)}
              />
              <SummaryItem
                icon={<Tag className="h-4 w-4" />}
                label="Service Type"
                value={normalized.serviceType || "—"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <User className="h-4 w-4" />
              Assignment
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Assigned To
              </p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {normalized.assignedToName}
                </p>
                {normalized.assignedToRole === 'technician' && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    normalized.assignedToCertified
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/60'
                      : 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:bg-amber-950/60'
                  }`}>
                    {normalized.assignedToCertified ? 'Verified' : 'Unverified'}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Email
              </p>
              <p>{normalized.assignedToEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Phone
              </p>
              <p>{normalized.assignedToPhone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Reported By
              </p>
              <p>{normalized.reportedByName}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <MapPin className="h-4 w-4" />
              Location
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {normalized.locationName}
            </p>
            <p className="text-xs text-slate-400">
              Last updated: {formatDate(normalized.updatedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Wrench className="h-4 w-4" />
              Asset
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {normalized.assetName}
            </p>
            <p className="text-xs text-slate-400">
              Category: {normalized.category}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="h-4 w-4" />
              Schedule
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Due {formatDate(normalized.dueDate)}
            </p>
            <p className="text-xs text-slate-400">
              Created {formatDate(normalized.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Attachments
            </div>
          </CardHeader>
          <CardContent>
            {normalized.photos.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {normalized.photos.map((photo, index) => (
                  <motion.div
                    key={`${photo.url}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
                  >
                    <ProtectedImage
                      src={photo.url}
                      alt={`attachment-${index}`}
                      className="h-28 w-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Activity
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {normalized.comments.length === 0 ? (
              <p className="text-sm text-slate-500">No activity yet.</p>
            ) : (
              normalized.comments.map((comment, index) => (
                <div
                  key={`${comment.text}-${index}`}
                  className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {comment.user?.name || "Unknown"}
                    </p>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-slate-400 dark:text-slate-500">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {label}
        </p>
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
    </div>
  );
}
