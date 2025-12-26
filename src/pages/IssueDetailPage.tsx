import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    AlertTriangle,
    MessageSquare,
    User,
    Calendar,
    TrendingUp
} from 'lucide-react';
import { Button } from '../components/atoms/Button';
import { useAuthStore } from '../hooks/useAuthStore';
import type { Issue, IssueMessage, IssueStatus, RenterProfile, LandlordProfile, AgencyProfile } from '../types';
import { getIssue, updateIssueStatus } from '../lib/storage';
import { useToastStore } from '../components/organisms/Toast';

/**
 * IssueDetailPage - Detailed view of a single issue
 * Shows full issue information, timeline, messages, and actions
 * Accessible by renters, landlords, and agencies
 */
export function IssueDetailPage() {
    const { issueId } = useParams<{ issueId: string }>();
    const navigate = useNavigate();
    const { currentUser, userType } = useAuthStore();
    const { addToast } = useToastStore();

    const [issue, setIssue] = useState<Issue | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [newStatus, setNewStatus] = useState<string>('');

    useEffect(() => {
        const fetchIssue = async () => {
            if (!issueId) {
                navigate('/');
                return;
            }

            try {
                setIsLoading(true);
                const fetchedIssue = await getIssue(issueId);

                if (!fetchedIssue) {
                    addToast({
                        type: 'error',
                        title: 'Issue Not Found',
                        message: 'The requested issue could not be found.',
                        duration: 4000,
                    });
                    navigate('/');
                    return;
                }

                setIssue(fetchedIssue);
                setNewStatus(fetchedIssue.status);
            } catch (error) {
                console.error('Failed to fetch issue:', error);
                addToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to load issue details.',
                    duration: 4000,
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchIssue();
    }, [issueId, navigate, addToast]);

    const handleStatusUpdate = async () => {
        if (!issue || newStatus === issue.status) return;

        try {
            setIsUpdating(true);
            await updateIssueStatus(issue.id, newStatus);

            setIssue({ ...issue, status: newStatus as IssueStatus });

            addToast({
                type: 'success',
                title: 'Status Updated',
                message: `Issue status changed to ${newStatus.replace('_', ' ')}`,
                duration: 3000,
            });
        } catch (error) {
            console.error('Failed to update status:', error);
            addToast({
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update issue status.',
                duration: 4000,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!issue || !newMessage.trim() || !currentUser) return;

        try {
            const senderName =
              userType === 'agency'
                ? (currentUser as AgencyProfile).companyName
                : (currentUser as RenterProfile | LandlordProfile).names || 'User';

            const message: IssueMessage = {
                id: `msg-${Date.now()}`,
                senderId: currentUser.id,
                senderType: userType || 'renter',
                senderName,
                content: newMessage.trim(),
                timestamp: new Date(),
                isInternal: false,
            };

            // Add message to issue
            const updatedMessages = [...(issue.messages || []), message];
            setIssue({ ...issue, messages: updatedMessages });
            setNewMessage('');

            addToast({
                type: 'success',
                title: 'Message Sent',
                message: 'Your message has been added to the issue.',
                duration: 3000,
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            addToast({
                type: 'error',
                title: 'Send Failed',
                message: 'Failed to send message.',
                duration: 4000,
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading issue details...</p>
                </div>
            </div>
        );
    }

    if (!issue) {
        return null;
    }

    const priorityColors = {
        emergency: { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-500' },
        urgent: { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-500' },
        routine: { bg: 'bg-success-100', text: 'text-success-700', border: 'border-success-300' },
        low: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-300' },
    };

    const statusIcons = {
        open: <Clock size={20} className="text-warning-600" />,
        acknowledged: <MessageSquare size={20} className="text-primary-600" />,
        in_progress: <TrendingUp size={20} className="text-primary-600" />,
        awaiting_parts: <Clock size={20} className="text-warning-600" />,
        awaiting_access: <Clock size={20} className="text-warning-600" />,
        resolved: <CheckCircle2 size={20} className="text-success-600" />,
        closed: <CheckCircle2 size={20} className="text-neutral-600" />,
    };

    const colors = priorityColors[issue.priority];
    const isOverdue = issue.isOverdue && issue.status !== 'resolved' && issue.status !== 'closed';
    const canUpdateStatus = userType === 'estate_agent' || userType === 'management_agency' || userType === 'landlord';

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">{issue.subject}</h1>
                            <p className="text-neutral-600 mt-1">Issue #{issue.id.substring(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 ${colors.bg} ${colors.text} text-sm font-bold rounded uppercase`}>
                                {issue.priority}
                            </span>
                            {isOverdue && (
                                <span className="px-3 py-1 bg-danger-500 text-white text-sm font-bold rounded animate-pulse">
                                    OVERDUE
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Issue Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">Description</h2>
                            <p className="text-neutral-700 whitespace-pre-wrap">{issue.description}</p>

                            {issue.images && issue.images.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Images</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {issue.images.map((image, index) => (
                                            <img
                                                key={index}
                                                src={image}
                                                alt={`Issue image ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline/Status History */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">Timeline</h2>
                            <div className="space-y-4">
                                {issue.statusHistory && issue.statusHistory.length > 0 ? (
                                    issue.statusHistory.map((entry, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    {statusIcons[entry.status]}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-neutral-900 capitalize">
                                                        {entry.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-sm text-neutral-500">
                                                        {new Date(entry.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                                {entry.notes && (
                                                    <p className="text-sm text-neutral-600 mt-1">{entry.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <AlertTriangle size={20} className="text-primary-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-neutral-900">Issue Reported</span>
                                                <span className="text-sm text-neutral-500">
                                                    {new Date(issue.raisedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages/Communication */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">Messages</h2>

                            <div className="space-y-4 mb-6">
                                {issue.messages && issue.messages.length > 0 ? (
                                    issue.messages.map((message) => (
                                        <div key={message.id} className="border border-neutral-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                    <User size={20} className="text-primary-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-neutral-900">{message.senderName}</span>
                                                        <span className="text-xs text-neutral-500">
                                                            {new Date(message.timestamp).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-neutral-700">{message.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-neutral-500 text-center py-8">No messages yet</p>
                                )}
                            </div>

                            {/* New Message Input */}
                            <div className="border-t border-neutral-200 pt-4">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                />
                                <div className="flex justify-end mt-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon={<MessageSquare size={18} />}
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim()}
                                    >
                                        Send Message
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4">Status</h3>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {statusIcons[issue.status]}
                                    <span className="font-semibold text-neutral-900 capitalize">
                                        {issue.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {canUpdateStatus && (
                                    <>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        >
                                            <option value="open">Open</option>
                                            <option value="acknowledged">Acknowledged</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="awaiting_parts">Awaiting Parts</option>
                                            <option value="awaiting_access">Awaiting Access</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleStatusUpdate}
                                            disabled={newStatus === issue.status || isUpdating}
                                            isLoading={isUpdating}
                                            className="w-full"
                                        >
                                            Update Status
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-neutral-900 mb-4">Details</h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 text-neutral-600">
                                    <AlertTriangle size={16} />
                                    <span className="font-medium">Category:</span>
                                    <span className="capitalize">{issue.category}</span>
                                </div>

                                <div className="flex items-center gap-2 text-neutral-600">
                                    <Calendar size={16} />
                                    <span className="font-medium">Reported:</span>
                                    <span>{new Date(issue.raisedAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-2 text-neutral-600">
                                    <Clock size={16} />
                                    <span className="font-medium">SLA Deadline:</span>
                                    <span>{new Date(issue.slaDeadline).toLocaleDateString()}</span>
                                </div>

                                {issue.resolvedAt && (
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <CheckCircle2 size={16} />
                                        <span className="font-medium">Resolved:</span>
                                        <span>{new Date(issue.resolvedAt).toLocaleDateString()}</span>
                                    </div>
                                )}

                                {issue.responseTimeHours && (
                                    <div className="flex items-center gap-2 text-neutral-600">
                                        <TrendingUp size={16} />
                                        <span className="font-medium">Response Time:</span>
                                        <span>{issue.responseTimeHours}h</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SLA Warning */}
                        {isOverdue && (
                            <div className="bg-danger-50 border-2 border-danger-500 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-danger-600 flex-shrink-0" size={24} />
                                    <div>
                                        <h4 className="font-bold text-danger-900 mb-1">SLA Overdue</h4>
                                        <p className="text-sm text-danger-700">
                                            This issue has exceeded its SLA deadline and requires immediate attention.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
