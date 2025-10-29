import { useState } from 'react';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { useAppStore } from '../hooks';
import { formatPrice, formatRelativeTime } from '../utils/formatters';
import { Badge } from '../components/atoms/Badge';

export const MatchesPage: React.FC = () => {
  const { matches } = useAppStore();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  // Sort matches by most recent
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={48} className="text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No Matches Yet</h2>
          <p className="text-neutral-600 mb-6">
            Keep swiping! When you like a property and the seller is interested, you'll see your
            matches here.
          </p>
          <div className="bg-success-50 border border-success-200 rounded-xl p-4">
            <p className="text-sm text-success-700">
              💡 <strong>Tip:</strong> You have a 30% chance of matching when you like a property!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-neutral-900">Matches</h1>
          <p className="text-neutral-600 mt-1">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} waiting for you
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Match Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMatches.map((match) => {
            const unreadCount = match.unreadCount || 0;
            const lastMessage = match.messages[match.messages.length - 1];

            return (
              <div
                key={match.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setSelectedMatch(match.id)}
              >
                {/* Property Image */}
                <div className="relative h-48 bg-neutral-200">
                  <img
                    src={match.property.images[0]}
                    alt={match.property.address.street}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-danger-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {unreadCount}
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="success" size="sm">
                      ✨ Match!
                    </Badge>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <div className="text-2xl font-bold text-neutral-900 mb-1">
                    {formatPrice(match.property.price)}
                  </div>
                  <div className="flex items-start gap-2 text-neutral-600 mb-3">
                    <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{match.property.address.street}</span>
                  </div>

                  {/* Last Message Preview */}
                  {lastMessage && (
                    <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-neutral-500 mb-1">
                        {lastMessage.senderType === 'seller' ? 'Seller' : 'You'}
                      </p>
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {lastMessage.content}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {formatRelativeTime(lastMessage.timestamp)}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMatch(match.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                  >
                    <MessageCircle size={18} />
                    {unreadCount > 0 ? `${unreadCount} New Messages` : 'View Conversation'}
                  </button>
                </div>

                {/* Match Info Footer */}
                <div className="px-4 pb-4 text-center">
                  <p className="text-xs text-neutral-500">
                    Matched {formatRelativeTime(match.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-primary-50 border border-primary-200 rounded-xl p-6">
          <h3 className="font-bold text-neutral-900 mb-2">What happens next?</h3>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>✅ Click on a match to start a conversation</li>
            <li>✅ Ask questions about the property</li>
            <li>✅ Arrange a viewing if you're interested</li>
            <li>✅ The seller will respond to your messages</li>
          </ul>
        </div>
      </main>

      {/* Simple modal placeholder for conversation view */}
      {selectedMatch && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Conversation View</h3>
            <p className="text-neutral-600 mb-4">
              Full messaging interface will be implemented in the next section!
            </p>
            <button
              onClick={() => setSelectedMatch(null)}
              className="w-full bg-primary-500 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
