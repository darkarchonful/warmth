#!/usr/bin/env bash
# Set activities.image_url / video_url for every activity that now has a card
# media file present in api/public/activities/<id>.jpg (still) or <id>.mp4
# (looping video). Idempotent (only touches rows whose column is still NULL).
# Run AFTER the media is in the deployed API image.
#
# Workflow: generate art (see docs/CARD_IMAGE_TODO.md) -> name <id>.jpg / <id>.mp4
# -> drop in api/public/activities/ -> build+deploy API -> run this script.
cd "$(dirname "$(readlink -f "$0")")/.." || exit 1   # repo root, robust to cwd

DIR=api/public/activities

img_ids=$(ls "$DIR"/*.jpg 2>/dev/null | sed 's#.*/##; s/\.jpg$//' | grep -E '^[0-9]+$' | sort -n | paste -sd,)
vid_ids=$(ls "$DIR"/*.mp4 2>/dev/null | sed 's#.*/##; s/\.mp4$//' | grep -E '^[0-9]+$' | sort -n | paste -sd,)

if [ -z "$img_ids" ] && [ -z "$vid_ids" ]; then
  echo "no <id>.jpg or <id>.mp4 files found in $DIR"; exit 1
fi
echo "image files present for ids: ${img_ids:-none}"
echo "video files present for ids: ${vid_ids:-none}"

# Build the SQL: only include a clause for a media type that actually has files,
# so an empty IN () is never generated.
sql=""
[ -n "$img_ids" ] && sql="$sql UPDATE activities SET image_url='/images/activities/'||id||'.jpg' WHERE id IN ($img_ids) AND image_url IS NULL;"
[ -n "$vid_ids" ] && sql="$sql UPDATE activities SET video_url='/images/activities/'||id||'.mp4' WHERE id IN ($vid_ids) AND video_url IS NULL;"
sql="$sql SELECT count(*) FILTER (WHERE image_url IS NOT NULL) AS with_image, count(*) FILTER (WHERE video_url IS NOT NULL) AS with_video FROM activities;"

kubectl -n warmth exec postgres-warmth-0 -- sh -c \
  "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U warmth -d warmth -c \"$sql\""
echo "done. (cards only render if the matching <id>.jpg/.mp4 is in the DEPLOYED API image)"
