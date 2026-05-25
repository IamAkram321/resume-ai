#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter @resume-ai/db push
