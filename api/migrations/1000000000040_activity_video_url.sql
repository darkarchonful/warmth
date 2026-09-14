-- Optional looping-video art for an activity, shown on the plan detail page.
-- Mirrors image_url: '/images/activities/<id>.mp4' when a clip exists, else NULL.
-- Cards without a clip fall back to the still image (Ken Burns drift) in the app.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS video_url text;
