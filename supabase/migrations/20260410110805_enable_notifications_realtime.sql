/*
  # Enable Realtime for Notifications Table

  ## Summary
  Enables Supabase Realtime (PostgreSQL logical replication) on the notifications table
  so the frontend can receive live push notifications via WebSockets when new notifications
  are inserted.

  ## Changes
  - Adds the `notifications` table to the `supabase_realtime` publication
    so INSERT events are broadcast to subscribed clients in real-time
*/

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
