import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, CheckCircle, User, Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react';
import type { Issue, IssueStatus, IssuePriority } from '../../types';
import { IconButton } from '../atoms/IconButton';
import { Button } from '../atoms/Button';

interface IssueDetailsModalProps {
  issue: Issue | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (issueId: string, newStatus: IssueStatus) => void;
  showStatusActions?: boolean;
}

const priorityConfig: Record<IssuePriority, { bg: string; text: string; label: string }> = {
  emergency: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Emergency' },
  urgent: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Urgent' },
  routine: { bg: 'bg-success-100', text: 'text-success-700', label: 'Routine' },
  low: { bg: 'bg-neutral-100', text: 'text-neutral-700', label: 'Low' },
};

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

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * IssueDetailsModal component
 * Displays detailed information about a maintenance issue/ticket
 * Features:
 * - Issue details (subject, description, priority, status)
 * - Timeline/history
 * - Photos if available
 * - Status update actions for landlords/agents
 */
export const IssueDetailsModal: React.FC<IssueDetailsModalProps> = ({
  issue,
  isOpen,
  onClose,
  onStatusUpdate,
  showStatusActions = true,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!issue) return null;

  const priority = priorityConfig[issue.priority];
  const status = statusConfig[issue.status];

  const handleStatusUpdate = (newStatus: IssueStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(issue.id, newStatus);
    }
  };

  // Determine available status transitions
  const getAvailableStatusTransitions = (): IssueStatus[] => {
    switch (issue.status) {
      case 'open':
        return ['acknowledged', 'in_progress'];
      case 'acknowledged':
        return ['in_progress', 'scheduled'];
      case 'in_progress':
        return ['awaiting_parts', 'scheduled', 'resolved'];
      case 'awaiting_parts':
        return ['in_progress', 'scheduled'];
      case 'scheduled':
        return ['in_progress', 'resolved'];
      case 'resolved':
        return ['closed'];
      case 'closed':
        return [];
      default:
        return [];
    }
  };

  const availableTransitions = getAvailableStatusTransitions();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <h2 className="text-xl font-bold text-neutral-900 truncate">
                  Issue Details
                </h2>
                <p className="text-sm text-neutral-600">
                  {issue.category.charAt(0).toUpperCase() + issue.category.slice(1).replace('_', ' ')} Issue
                </p>
              </div>
              <IconButton
                icon={<X size={24} />}
                variant="ghost"
                size="md"
                ariaLabel="Close details"
                onClick={onClose}
              />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Subject and Badges */}
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    {issue.subject}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${priority.bg} ${priority.text}`}>
                      {priority.label} Priority
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    {issue.isOverdue && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-danger-100 text-danger-700">
                        <AlertTriangle size={14} className="inline mr-1" />
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Dates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Calendar size={18} className="text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">Raised</div>
                      <div className="text-sm font-medium text-neutral-900">
                        {formatDate(issue.raisedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={18} className="text-neutral-500 mt-0.5" />
                    <div>
                      <div className="text-xs text-neutral-500">SLA Deadline</div>
                      <div className={`text-sm font-medium ${issue.isOverdue ? 'text-danger-700' : 'text-neutral-900'}`}>
                        {formatDate(issue.slaDeadline)}
                      </div>
                    </div>
                  </div>
                  {issue.acknowledgedAt && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-success-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-neutral-500">Acknowledged</div>
                        <div className="text-sm font-medium text-neutral-900">
                          {formatDate(issue.acknowledgedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                  {issue.resolvedAt && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={18} className="text-success-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-neutral-500">Resolved</div>
                        <div className="text-sm font-medium text-neutral-900">
                          {formatDate(issue.resolvedAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <section>
                  <h4 className="text-lg font-bold text-neutral-900 mb-3">Description</h4>
                  <p className="text-neutral-700 leading-relaxed whitespace-pre-line">
                    {issue.description}
                  </p>
                </section>

                {/* Photos */}
                {issue.images && issue.images.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-3 flex items-center gap-2">
                      <ImageIcon size={20} />
                      Photos ({issue.images.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {issue.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-xl overflow-hidden bg-neutral-200"
                        >
                          <img
                            src={image}
                            alt={`Issue photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Status History */}
                {issue.statusHistory && issue.statusHistory.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-3">Status History</h4>
                    <div className="space-y-3">
                      {issue.statusHistory.map((entry, index) => {
                        const entryStatus = statusConfig[entry.status];
                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${entryStatus.bg.replace('100', '500')}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${entryStatus.text}`}>
                                  {entryStatus.label}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {formatDate(entry.timestamp)}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-sm text-neutral-600 mt-1">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Messages Thread */}
                {issue.messages && issue.messages.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-3 flex items-center gap-2">
                      <MessageSquare size={20} />
                      Messages ({issue.messages.length})
                    </h4>
                    <div className="space-y-3">
                      {issue.messages.map((message, index) => (
                        <div key={index} className="p-3 bg-neutral-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <User size={16} className="text-neutral-500" />
                            <span className="text-sm font-medium text-neutral-900">
                              {message.senderName}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {formatDate(message.timestamp)}
                            </span>
                            {message.isInternal && (
                              <span className="text-xs px-2 py-0.5 bg-warning-100 text-warning-700 rounded-full">
                                Internal
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-700">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Resolution Summary */}
                {issue.resolutionSummary && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-3">Resolution</h4>
                    <div className="p-4 bg-success-50 rounded-lg border border-success-200">
                      <p className="text-neutral-700">{issue.resolutionSummary}</p>
                      {issue.resolutionCost !== undefined && issue.resolutionCost > 0 && (
                        <p className="text-sm text-neutral-600 mt-2">
                          Resolution cost: £{issue.resolutionCost.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Status Update Actions */}
                {showStatusActions && onStatusUpdate && availableTransitions.length > 0 && (
                  <section>
                    <h4 className="text-lg font-bold text-neutral-900 mb-3">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((newStatus) => {
                        const statusInfo = statusConfig[newStatus];
                        return (
                          <Button
                            key={newStatus}
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusUpdate(newStatus)}
                          >
                            Mark as {statusInfo.label}
                          </Button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
