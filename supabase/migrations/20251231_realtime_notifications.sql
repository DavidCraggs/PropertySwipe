-- Real-Time Features and Notifications for PropertySwipe
-- Phase 6: Real-Time Communication System

-- =====================================================
-- CHAT MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('renter', 'landlord', 'agency')),
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'system')),
  metadata JSONB,
  read_by TEXT[] DEFAULT ARRAY[]::TEXT[],
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_match ON chat_messages(match_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- =====================================================
-- MARK MESSAGE AS READ FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION mark_message_read(p_message_id UUID, p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE chat_messages
  SET
    read_by = CASE
      WHEN NOT (p_user_id = ANY(read_by)) THEN array_append(read_by, p_user_id)
      ELSE read_by
    END,
    read_at = COALESCE(read_at, NOW()),
    updated_at = NOW()
  WHERE id = p_message_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'new_match', 'new_message', 'viewing_request', 'viewing_confirmed',
    'viewing_reminder', 'document_request', 'document_received',
    'payment_due', 'payment_received', 'maintenance_update',
    'verification_complete', 'system'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  channels JSONB DEFAULT '{"push": true, "email": true, "sms": false}'::JSONB,
  types JSONB DEFAULT '{
    "new_match": true,
    "new_message": true,
    "viewing_request": true,
    "viewing_confirmed": true,
    "viewing_reminder": true,
    "document_request": true,
    "document_received": true,
    "payment_due": true,
    "payment_received": true,
    "maintenance_update": true,
    "verification_complete": true,
    "system": true
  }'::JSONB,
  quiet_hours JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- =====================================================
-- PUSH SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

-- =====================================================
-- TYPING INDICATORS (TRANSIENT - MEMORY ONLY)
-- =====================================================
-- Typing indicators are handled via Supabase Realtime broadcast
-- No persistent storage needed

-- =====================================================
-- PRESENCE TRACKING (TRANSIENT)
-- =====================================================
-- Presence is handled via Supabase Realtime presence feature
-- No persistent storage needed, but we track last seen

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_presence_user ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Chat Messages: Users can see messages in matches they're part of
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view messages in their matches" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their matches" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

CREATE POLICY "Users can view messages in their matches" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id::text = chat_messages.match_id
      AND (matches.renter_id = auth.uid() OR matches.landlord_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their matches" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE matches.id::text = chat_messages.match_id
      AND (matches.renter_id = auth.uid() OR matches.landlord_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (sender_id = auth.uid()::text);

-- Notifications: Users can only see their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid()::text);

-- Notification Preferences: Users can manage their own
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;

CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own preferences" ON notification_preferences
  FOR ALL USING (user_id = auth.uid()::text);

-- Push Subscriptions: Users can manage their own
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view own subscriptions" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid()::text);

-- User Presence: Public read, own write
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view presence" ON user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON user_presence;

CREATE POLICY "Anyone can view presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON user_presence
  FOR ALL USING (user_id = auth.uid()::text);

-- =====================================================
-- AUTO-DELETE OLD NOTIFICATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE (expires_at IS NOT NULL AND expires_at < NOW())
     OR (expires_at IS NULL AND created_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE chat_messages IS 'Real-time chat messages between matched users';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON TABLE notification_preferences IS 'User notification settings';
COMMENT ON TABLE push_subscriptions IS 'Web Push API subscriptions';
COMMENT ON TABLE user_presence IS 'User online status tracking';
