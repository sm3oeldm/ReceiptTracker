# Mobile Repository Guide

## Understanding the Structure

The `backend/mobile` directory is a **separate git repository** nested inside the main ReceiptTracker repository. This is why you see it as "modified" in VSCode source control.

## Current Structure

```
ReceiptTracker/ (main repo)
└── backend/
    └── mobile/ (separate repo with its own .git/)
```

## Why This Happens

This nested repository structure can occur when:
1. You initialized git inside `backend/mobile` separately
2. You cloned a repository into `backend/mobile`
3. The mobile app was developed as a separate project and placed here

## How to Handle This

### Option 1: Keep as Separate Repository (Recommended)

If the mobile app should remain a separate repository:

```bash
# To commit/push mobile changes:
cd backend/mobile
git add .
git commit -m "Your mobile changes"
git push origin master  # or whatever branch you're using

# Then go back to main repo:
cd ../..
git add .
git commit -m "Main repo changes"
git push origin main
```

**Pros**:
- Mobile and backend can have separate version histories
- Can be developed independently
- Easier to manage if they're truly separate projects

**Cons**:
- Need to manage two repositories
- VSCode shows both as modified

### Option 2: Convert to Submodule

If you want to keep them linked but as proper git submodules:

```bash
# Remove the nested .git directory
rm -rf backend/mobile/.git

# Add as submodule
git submodule add <mobile-repo-url> backend/mobile
git commit -m "Convert mobile to submodule"
```

**Pros**:
- Proper git structure
- Main repo tracks which commit of mobile to use
- Single point of cloning

**Cons**:
- More complex workflow
- Need to learn submodule commands

### Option 3: Merge into Single Repository

If they should be one repository:

```bash
# Remove the nested .git directory
rm -rf backend/mobile/.git

# Add files to main repo
git add backend/mobile
git commit -m "Merge mobile into main repository"
```

**Pros**:
- Single repository to manage
- Simpler workflow
- All changes in one place

**Cons**:
- Loses mobile's git history
- Can't easily separate later

## Current Status

### Mobile Repository
- **Location**: `backend/mobile/`
- **Branch**: master
- **Modified files**:
  - App.js
  - app.json
  - package-lock.json
  - package.json
- **Untracked**: README.md, src/

### Main Repository
- **Location**: Project root
- **Branch**: main
- **Status**: Up to date with origin/main

## Recommendation

Based on the project structure (backend server + mobile app), I recommend:

**Option 1: Keep as Separate Repositories**

This makes sense because:
1. Backend (Node.js/Express) and Mobile (React Native/Expo) are different tech stacks
2. They might have different release cycles
3. They can be developed independently
4. You might want to deploy them separately

## Working with Nested Repositories in VSCode

### To ignore the nested repo in VSCode:

1. Open VSCode Settings
2. Search for `git.ignoredRepositories`
3. Add:
   ```json
   "git.ignoredRepositories": [
       "backend/mobile"
   ]
   ```

This will hide the nested repository from VSCode's source control view.

### Or use workspace settings:

Create `.vscode/settings.json`:
```json
{
    "git.ignoredRepositories": ["backend/mobile"]
}
```

## Committing Changes

### For Mobile App:
```bash
cd backend/mobile
git add App.js app.json package-lock.json package.json
git commit -m "Update mobile app configuration"
git push origin master
```

### For Backend/Main Repo:
```bash
cd ..
# (back at project root)
git add FINAL_SECURITY_REPORT.md SECURITY_AUDIT.md
git commit -m "Add security documentation"
git push origin main
```

## Summary

The `backend/mobile` directory being a separate git repository is **not a problem** - it's actually a valid approach for managing a full-stack project with distinct frontend and backend components. You just need to commit/push to both repositories separately.

If you'd like me to help convert this to a submodule or merge it into the main repository, just let me know which approach you prefer!