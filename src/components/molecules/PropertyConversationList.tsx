import React from 'react';
import { ChevronDown, ChevronRight, Home, MessageSquare } from 'lucide-react';
import type { PropertyConversationGroup } from '../../types';

interface PropertyConversationListProps {
    conversations: PropertyConversationGroup[];
    selectedPropertyId: string | null | undefined; // undefined = nothing selected
    onSelectProperty: (propertyId: string | null) => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
    showExpandToggle?: boolean;
}

/**
 * PropertyConversationList
 * Displays a list of property-specific conversation threads
 * with unread badges and last message previews
 */
export const PropertyConversationList: React.FC<PropertyConversationListProps> = ({
    conversations,
    selectedPropertyId,
    onSelectProperty,
    isExpanded = true,
    onToggleExpand,
    showExpandToggle = false,
}) => {
    // Format time relative to now
    const formatRelativeTime = (timestamp: string | undefined) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="flex flex-col">
            {showExpandToggle && onToggleExpand && (
                <button
                    onClick={onToggleExpand}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:text-neutral-700"
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {isExpanded ? 'Collapse' : 'Expand'} properties
                </button>
            )}

            {isExpanded && (
                <div className="flex flex-col">
                    {conversations.map((conv) => {
                        const isSelected = selectedPropertyId === conv.propertyId;
                        const lastMessage = conv.conversation?.messages[conv.conversation.messages.length - 1];
                        const isGeneral = conv.propertyId === null;

                        return (
                            <button
                                key={conv.propertyId ?? 'general'}
                                onClick={() => onSelectProperty(conv.propertyId)}
                                className={`flex items-start gap-2 px-3 py-2 text-left transition-colors ${isSelected
                                    ? 'bg-primary-50 border-l-2 border-primary-500'
                                    : 'hover:bg-neutral-50 border-l-2 border-transparent'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${isGeneral ? 'bg-neutral-100' : 'bg-primary-50'
                                    }`}>
                                    {isGeneral ? (
                                        <MessageSquare size={14} className="text-neutral-500" />
                                    ) : (
                                        <Home size={14} className="text-primary-600" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-sm truncate ${isSelected ? 'font-medium text-primary-700' : 'text-neutral-700'
                                            }`}>
                                            {conv.propertyAddress || 'Unknown Property'}
                                        </span>
                                        {conv.lastMessageAt && (
                                            <span className="text-xs text-neutral-400 shrink-0">
                                                {formatRelativeTime(conv.lastMessageAt)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Last message preview */}
                                    {lastMessage && (
                                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                                            {lastMessage.content}
                                        </p>
                                    )}

                                    {!lastMessage && !conv.conversation && (
                                        <p className="text-xs text-neutral-400 italic mt-0.5">
                                            No messages yet
                                        </p>
                                    )}
                                </div>

                                {/* Unread badge */}
                                {conv.unreadCount > 0 && (
                                    <div className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center shrink-0">
                                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PropertyConversationList;
