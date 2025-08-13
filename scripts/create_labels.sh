#!/bin/bash
# scripts/create_labels.sh
# Requires GH CLI installed and authenticated

REPO="redroostertech/Actions.txt"

LABELS=(
  "next steps::#0366d6"
  "documentation::#0075ca"
  "spec update::#5319e7"
  "examples::#0e8a16"
  "scripts::#d93f0b"
  "enhancement::#84b6eb"
  "bug::#d73a4a"
)

echo "Creating labels in $REPO..."

for LABEL in "${LABELS[@]}"; do
  NAME="${LABEL%%::*}"
  COLOR="${LABEL##*::}"
  echo "Creating label: $NAME ($COLOR)"
  gh label create "$NAME" --color "$COLOR" --repo "$REPO" --force
done

echo "✅ Labels created successfully."
