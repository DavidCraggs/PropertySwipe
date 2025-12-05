import React from 'react';
import type { ConversationType } from '../../types';

interface ConversationSelectorProps {
    activeConversation: ConversationType;
    onSelectConversation: (type: ConversationType) => void;
    landlordUnreadCount: number;
    agencyUnreadCount: number;
    hasAgency: boolean;
}

/**
 * ConversationSelector - Tab switcher for landlord vs agency conversations
 * 
 * Features:
 * - Switches between 'landlord' and 'agency' conversation threads
 * - Shows unread badges for each conversation
 * - Conditionally shows agency tab only when property has managing agency
 * - Accessible with keyboard navigation
 */
export const ConversationSelector: React.FC<ConversationSelectorProps> = ({
    activeConversation,
    onSelectConversation,
    landlordUnreadCount,
    agencyUnreadCount,
    hasAgency,
}) => {
    return (
        <div className="flex border-b border-neutral-200 bg-white">
            {/* Landlord Tab */}
            <button
                onClick={() => onSelectConversation('landlord')}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeConversation === 'landlord'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                aria-label="View landlord conversation"
                aria-current={activeConversation === 'landlord' ? 'page' : undefined}
            >
                <span className="flex items-center justify-center gap-2">
                    Landlord
                    {landlordUnreadCount > 0 && (
                        <span
                            className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-danger-500 rounded-full"
                            aria-label={`${landlordUnreadCount} unread messages`}
                        >
                            {landlordUnreadCount}
                        </span>
                    )}
                </span>
            </button>

            {/* Agency Tab - Only shown if property has managing agency */}
            {hasAgency && (
                <button
                    onClick={() => onSelectConversation('agency')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeConversation === 'agency'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                        }`}
                    aria-label="View agency conversation"
                    aria-current={activeConversation === 'agency' ? 'page' : undefined}
                >
                    <span className="flex items-center justify-center gap-2">
                        Managing Agency
                        {agencyUnreadCount > 0 && (
                            <span
                                className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-danger-500 rounded-full"
                                aria-label={`${agencyUnreadCount} unread messages`}
                            >
                                {agencyUnreadCount}
                            </span>
                        )}
                    </span>
                </button>
            )}
        </div>
    );
};
