-- Add unique constraint for user activities
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_conversation_id_activity_type_key" UNIQUE ("user_id", "conversation_id", "activity_type");
