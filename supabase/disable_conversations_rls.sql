-- Disable RLS on conversations table temporarily for seeding
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- After running this, re-run: npx tsx src/scripts/seedConversationsOnly.ts
