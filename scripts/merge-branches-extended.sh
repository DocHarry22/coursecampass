#!/bin/bash
# merge-branches-extended.sh
# Merges all local and remote branches into the current branch with safety checks

TARGET_BRANCH=$(git branch --show-current)
BACKUP_BRANCH="${TARGET_BRANCH}-backup-$(date +%Y%m%d%H%M%S)"

if [ -z "$TARGET_BRANCH" ]; then
  echo "❌ Error: No active Git branch found. Please checkout your main branch first."
  exit 1
fi

# Step 1: Create a backup branch before merging
echo "🛡️ Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
git checkout "$TARGET_BRANCH"

# Step 2: Fetch and prune remote branches
echo "🌐 Fetching remote branches..."
git fetch --prune

# Step 3: List all local branches (excluding current)
LOCAL_BRANCHES=$(git branch | grep -v "\*" | sed 's/^[ *]*//')

# Step 4: List all remote branches (excluding HEAD and origin/main)
REMOTE_BRANCHES=$(git branch -r | grep -vE "HEAD|origin/$TARGET_BRANCH" | sed 's/^  *origin\///')

# Step 5: Merge local branches
for branch in $LOCAL_BRANCHES; do
  echo "🔄 Merging local branch: $branch"
  git merge "$branch" --no-edit || {
    echo "⚠️ Merge conflict in local branch: $branch. Resolve manually."
    exit 1
  }
done

# Step 6: Merge remote branches
for branch in $REMOTE_BRANCHES; do
  echo "🔄 Merging remote branch: origin/$branch"
  git merge "origin/$branch" --no-edit || {
    echo "⚠️ Merge conflict in remote branch: $branch. Resolve manually."
    exit 1
  }
done

# Step 7: Push changes
echo "🚀 Pushing merged $TARGET_BRANCH to remote"
git push origin "$TARGET_BRANCH"

# Step 8: Delete merged branches remotely (GitHub CLI required)
echo "🧹 Checking for remote branches to delete (merged)..."
for branch in $REMOTE_BRANCHES; do
  git branch -r --merged | grep "origin/$branch" > /dev/null && {
    echo "🗑️ Deleting merged remote branch: $branch"
    gh api -X DELETE "/repos/:owner/:repo/git/refs/heads/$branch" || echo "⚠️ GitHub CLI failed to delete $branch"
  }
done

echo "✅ All merges complete. Backup created: $BACKUP_BRANCH"
echo "🔒 Remember: your original state is preserved on $BACKUP_BRANCH"
