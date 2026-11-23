# Contributing

## Branches

| Branch | Owner |
|--------|-------|
| `main` | Protected. Changes land only through a pull request with 1 approval and green CI (lint + build). No force-push, no deletion. |
| `Suhayl` | Suhayl's working branch |
| `Haaziq` | Haaziq's working branch |
| `Aaron` | Aaron's working branch |

## Workflow

```bash
git checkout <YourName>
git pull origin main          # stay current with main before you start
# ...work, commit small...
git push origin <YourName>
gh pr create --base main      # ask a teammate to review
```

After your PR merges, run `git pull origin main` on your branch again before you continue.

## Commit messages

Use `type: summary`, where type is one of `feat`, `fix`, `docs`, `chore`, `test` or `refactor`. Put the rule ID in the summary when there is one, for example `feat: NR-03 construction-period check`.

## API changes

The API is owned by [veri-tax](https://github.com/MSD786c/veri-tax). If a screen needs a new field or endpoint, open the PR there first. Then refresh `docs/openapi.json` with `curl localhost:8000/openapi.json > docs/openapi.json` and update the types in that app's `src/lib/api.ts`.

## Avoiding conflicts

The two apps are independent. Prefer splitting work by app or by page, and keep changes to root files (`package.json`, `pnpm-lock.yaml`, CI) in their own small PRs.
