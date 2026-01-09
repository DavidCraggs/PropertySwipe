import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import type { Issue, IssueStatus, PropertyWithDetails } from '../../types';
import { getIssuesForProperty, updateIssueStatus } from '../../lib/storage';
import { IssueDetailsModal } from './IssueDetailsModal';
import { useToastStore } from './toastUtils';

interface PropertyIssuesPanelProps {
  property: PropertyWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onIssuesUpdated?: () => void;
}

type IssueFilter = 'all' | 'open' | 'resolved';

const statusConfig: Record<IssueStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Open' },
  acknowledged: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Acknowledged' },
  in_progress: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'In Progress' },
  awaiting_parts: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Awaiting Parts' },
  awaiting_access: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Awaiting Access' },
  scheduled: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Scheduled' },
  resolved: { bg: 'bg-success-100', text: 'text-success-700', label: 'Resolved' },
  closed: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Closed' },
};

const priorityConfig = {
  emergency: { bg: 'bg-danger-500', text: 'text-white', label: 'Emergency' },
  urgent: { bg: 'bg-warning-500', text: 'text-white', label: 'Urgent' },
  routine: { bg: 'bg-primary-500', text: 'text-white', label: 'Routine' },
  low: { bg: 'bg-neutral-400', text: 'text-white', label: 'Low' },
};

/**
 * PropertyIssuesPanel - Modal panel for viewing and managing property issues
 * Allows landlords to view, filter, and update status of maintenance issues
 */
export function PropertyIssuesPanel({
  property,
  isOpen,
  onClose,
  onIssuesUpdated,
}: PropertyIssuesPanelProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IssueFilter>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const { addToast } = useToastStore();

  // Fetch issues when panel opens
  useEffect(() => {
    if (isOpen && property?.id) {
      loadIssues();
    }
  }, [isOpen, property?.id]);

  const loadIssues = async () => {
    if (!property?.id) return;
    setLoading(true);
    try {
      const propertyIssues = await getIssuesForProperty(property.id);
      setIssues(propertyIssues);
    } catch (error) {
      console.error('[PropertyIssuesPanel] Failed to load issues:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load issues',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (issueId: string, newStatus: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus);
      // Update local state
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      setSelectedIssue(null);
      addToast({
        type: 'success',
        title: 'Status Updated',
        message: `Issue marked as ${statusConfig[newStatus].label}`,
      });
      onIssuesUpdated?.();
    } catch (error) {
      console.error('[PropertyIssuesPanel] Failed to update issue status:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update issue status',
      });
    }
  };

  // Filter issues
  const filteredIssues = issues.filter((issue) => {
    switch (filter) {
      case 'open':
        return !['resolved', 'closed'].includes(issue.status);
      case 'resolved':
        return ['resolved', 'closed'].includes(issue.status);
      default:
        return true;
    }
  });

  const openIssuesCount = issues.filter(
    (i) => !['resolved', 'closed'].includes(i.status)
  ).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-neutral-900">Property Issues</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Close panel"
            >
              <X className="h-5 w-5 text-neutral-500" />
            </button>
          </div>
          <p className="text-sm text-neutral-500">{property.address.street}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-neutral-900">{issues.length}</span>
              <span className="text-neutral-500">Total</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-medium ${openIssuesCount > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                {openIssuesCount}
              </span>
              <span className="text-neutral-500">Open</span>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mt-4">
            <Filter className="h-4 w-4 text-neutral-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as IssueFilter)}
              className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Issues</option>
              <option value="open">Open Issues</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-success-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                {filter === 'all' ? 'No Issues' : 'No Matching Issues'}
              </h3>
              <p className="text-neutral-500">
                {filter === 'all'
                  ? 'This property has no reported issues'
                  : 'Try adjusting your filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={() => setSelectedIssue(issue)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Details Modal */}
      <IssueDetailsModal
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onStatusUpdate={handleStatusUpdate}
        showStatusActions={true}
      />
    </>
  );
}

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

function IssueCard({ issue, onClick }: IssueCardProps) {
  const status = statusConfig[issue.status];
  const priority = priorityConfig[issue.priority];

  const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const isOpen = !['resolved', 'closed'].includes(issue.status);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        isOpen
          ? 'bg-white border-warning-200 hover:border-warning-400'
          : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOpen ? (
              <AlertTriangle className="h-4 w-4 text-warning-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" />
            )}
            <h4 className="font-semibold text-neutral-900 truncate">{issue.subject}</h4>
          </div>

          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
            {issue.description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priority.bg} ${priority.text}`}>
              {priority.label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              {formatDate(issue.raisedAt)}
            </span>
            {issue.isOverdue && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-danger-100 text-danger-700">
                Overdue
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
