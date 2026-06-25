#!/usr/bin/env bash
# Set activities.image_url for every activity that now has a card image file
# present in api/public/activities/<id>.jpg. Idempotent (only touches rows whose
# image_url is still NULL). Run AFTER the images are in the deployed API image.
#
# Workflow: generate art (see docs/CARD_IMAGE_PROMPTS.md) -> name <id>.jpg ->
# drop in api/public/activities/ -> build+deploy API -> run this script.
cd "$(dirname "$0")/.." || exit 1

DIR=api/public/activities
ids=$(ls "$DIR"/*.jpg 2>/dev/null | sed 's#.*/##; s/\.jpg$//' | grep -E '^[0-9]+$' | sort -n | paste -sd,)
if [ -z "$ids" ]; then echo "no <id>.jpg files found in $DIR"; exit 1; fi
echo "image files present for ids: $ids"

kubectl -n warmth exec postgres-warmth-0 -- sh -c \
  "PGPASSWORD=\"\$POSTGRES_PASSWORD\" psql -U warmth -d warmth -c \
   \"UPDATE activities SET image_url='/images/activities/'||id||'.jpg' WHERE id IN ($ids) AND image_url IS NULL; \
     SELECT count(*) AS total_with_image FROM activities WHERE image_url IS NOT NULL;\""
echo "done. (cards only render if the matching <id>.jpg is in the DEPLOYED API image)"
