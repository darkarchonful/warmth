# Static media server for activity card art (images + looping videos).
# Files are baked in (they live in git at api/public/activities) so each replica
# is fully self-contained — 2+ replicas across nodes give active-active HA with
# no shared volume. Rebuild + rollout to add/replace clips (batch them).
FROM nginx:1.27-alpine
COPY *.jpg *.mp4 /usr/share/nginx/html/images/activities/
