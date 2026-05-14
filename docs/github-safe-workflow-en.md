# Safe GitHub Workflow Guide

This document describes a safe, repeatable Git workflow suitable for team collaboration and reusable across multiple projects.

## 1. Goals of This Workflow

- Never code directly on `main`
- Never push unchecked local changes to the main branch
- Easy to pull, review, merge, and roll back if something goes wrong
- Minimize conflicts with teammates
- Keep the repo clean — avoid accidentally committing junk files or personal environment changes

## 2. Core Principles

- Always pull the latest version of the base branch before starting work
- Always create a separate working branch from the base branch
- Every change should have a clear commit message
- Only merge into the main branch after everything has been verified
- Do not commit local-only files such as `.DS_Store`, `.env`, cache files, or personal IDE settings unless the team shares them

## 3. Choosing the Right Base Branch

Not every repo uses the same base branch.

### Case A: Team Uses `dev`

This is the more common and safer flow for larger teams:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/short-name
```

After finishing:

- push your branch
- open a PR from your branch into `dev`
- the team then merges `dev` into `main`

### Case B: Repo Only Uses `main`

If the current repo has no `dev` branch, the base branch will be `main`:

```bash
git checkout main
git pull origin main
git checkout -b nguyen
```

Or if the team wants a more descriptive branch name:

```bash
git checkout main
git pull origin main
git checkout -b feature/nguyen-default-cover
```

## 4. Standard Workflow

### Step 1: Sync the Base Branch

If the repo uses `main`:

```bash
git checkout main
git pull origin main
```

If the repo uses `dev`:

```bash
git checkout dev
git pull origin dev
```

### Step 2: Create a Separate Working Branch

```bash
git checkout -b nguyen
```

Or:

```bash
git checkout -b feature/nguyen-task-name
```

### Step 3: Code and Verify

While working:

- commit in logical, reasonably sized groups
- do not lump multiple unrelated bug fixes into a single commit
- prefer small commits that are easy to review

Example:

```bash
git add .
git commit -m "fix(frontend): show default image for campaigns without cover"
```

### Step 4: Push Your Branch to Remote

```bash
git push origin nguyen
```

Or:

```bash
git push origin feature/nguyen-task-name
```

### Step 5: Merge Safely

There are 2 approaches:

#### Approach 1: Safest for Teams

- push your branch
- open a PR
- merge only after review is complete

#### Approach 2: Merge via Git (if the team agrees)

Only do this when:

- you are confident the branch is stable
- your teammates agree
- you have already updated `main` or `dev` to the latest

Example — merging `nguyen` into `main`:

```bash
git checkout main
git pull --ff-only origin main
git merge --ff-only nguyen
git push origin main
```

What this means:

- `--ff-only` keeps history clean by only allowing fast-forward merges
- if fast-forward is not possible, Git will stop instead of merging blindly

## 5. When to Use a PR

Use a PR when:

- working in a team
- changes affect many files
- changes involve the backend or database
- changes affect auth, permissions, payments, donations, or volunteer flows
- you want a clear, auditable review history

A PR is the place to:

- let teammates view the diff
- check for logic conflicts
- confirm that changes have been tested
- merge with control

## 6. Pre-Merge Checklist

Short checklist:

- base branch has been pulled to the latest
- code runs correctly
- no junk files are staged
- no `.env`, secrets, or tokens have been committed
- `package-lock.json` is only committed if there are real dependency changes
- no personal/unintentional changes have slipped into the commit

Useful commands:

```bash
git status
git diff
git log --oneline -n 5
```

## 7. Handling New Commits on `main` While You Are Working

### If Your Branch Has Not Been Pushed or Merged Yet

On your working branch:

```bash
git fetch origin
git rebase origin/main
```

Or if the team uses `dev`:

```bash
git fetch origin
git rebase origin/dev
```

Then:

- resolve any conflicts
- retest
- push your branch again

If you had already pushed the branch before rebasing:

```bash
git push --force-with-lease origin nguyen
```

Notes:

- use `--force-with-lease`, not `--force` carelessly
- only do this on your own branch, never on `main`

## 8. When to Use `stash`

`git stash` temporarily stores uncommitted local changes so your working tree is clean.

Example:

```bash
git stash push -m "tmp-before-merge"
```

Restore:

```bash
git stash pop
```

View the list:

```bash
git stash list
```

When to use it:

- you need to `checkout`, `pull`, or `merge` but have local changes you are not ready to commit
- you want to temporarily set aside personal files like `.DS_Store`

When you do not necessarily need it:

- the local changes do not block the Git operation
- you can commit cleanly right away
- the file should be discarded entirely rather than stashed

## 9. Why `.gitignore` Is Set Up But Files Still Cause Issues

`.gitignore` only prevents files that have never been tracked by Git.

If a file was committed into the repo previously — for example `.DS_Store` — then:

- Git continues to track it
- even if it is listed in `.gitignore`
- you may still get blocked when pulling or merging

To fix this permanently:

```bash
git rm --cached .DS_Store
git commit -m "chore(git): stop tracking ds store"
git push origin nguyen
```

Once this commit is merged into the main branch, `.gitignore` will actually take effect for that file.

## 10. Rules for `package-lock.json`

If you have not intentionally:

- installed a new package
- removed a package
- upgraded a package version

then you generally should not commit changes to `package-lock.json`.

For example, a change like:

```json
"peer": true
```

is usually just metadata caused by a different `npm` version or by running `npm install`.

Practical conclusion:

- if there are no real dependency changes, discard changes to `package-lock.json`
- only commit the lockfile when dependency changes are intentional

## 11. Concise Daily Workflow

If the repo uses `main`:

```bash
git checkout main
git pull origin main
git checkout -b nguyen
```

After finishing work:

```bash
git add .
git commit -m "feat: short message"
git push origin nguyen
```

Safe merge:

```bash
git checkout main
git pull --ff-only origin main
git merge --ff-only nguyen
git push origin main
```

If the repo uses `dev`, replace `main` with `dev` for the day-to-day steps, and only merge into `main` following the team's release process.

## 12. Long-Term Recommended Workflow

If the team is small and the repo only has `main`:

- work on a personal branch
- test thoroughly
- open a PR or do a controlled fast-forward merge

If the team is larger:

- use `dev` as the integration branch
- each person works on their own branch off `dev`
- merge into `dev` via PR
- only release from `dev` to `main`

## 13. Reusable Commit Message Templates

```bash
feat(frontend): add default cover image for campaigns
fix(backend): normalize escaped newlines in autofill output
fix(frontend): preserve default public image paths
chore(git): stop tracking ds store
docs(workflow): add safe github workflow guide
```

## 14. Self-Check Template Before Pushing

Ask yourself these 5 questions:

1. Am I on my own branch, not on the base branch?
2. Have I pulled the latest version of the base branch?
3. Did I accidentally commit any personal files?
4. Do I understand the changes in `package-lock.json`?
5. If a teammate pulls this branch, will they be negatively affected?

Only push if all 5 answers are fine.

## 15. Summary

The safest flow to remember:

- pull the base branch
- create a personal branch
- write clean commits
- push your personal branch
- review or open a PR
- update the base branch to latest before merging
- merge with control

If you had to pick one single rule to remember forever:

`Never code directly on main, and never merge when your working tree is dirty and you do not fully understand why.`
