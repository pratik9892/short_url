# Contributing

How every fix, feature and chore gets from idea to `main`.

## 1. `main` is the source of truth

- `main` is what is deployed. Local `main` and GitHub `main` must always match.
- Never commit or push directly to `main`; every change lands through a pull request.
- `main` must always pass CI (server tests + client build) and be deployable.

## 2. One branch per task, cut from a fresh `main`

```bash
git checkout main
git pull
git checkout -b <type>/<short-name>
```

| Type        | Use for                                   | Example                     |
|-------------|-------------------------------------------|-----------------------------|
| `feat/`     | New user-facing behaviour                 | `feat/custom-short-codes`   |
| `fix/`      | Bug fixes                                 | `fix/cors-trailing-slash`   |
| `chore/`    | Tooling, deps, CI, deploy config          | `chore/bump-bullmq`         |
| `docs/`     | Documentation only                        | `docs/workflow-rules`       |
| `refactor/` | Code changes with no behaviour change     | `refactor/link-service`     |

A branch does one thing. Don't mix an unrelated fix into a feature branch; open a second branch instead.

## 3. Commit messages

Format: `type(scope): what changed`, in the imperative and lower case.

```
fix(analytics): parse user-agent into browser, os and device type
feat(link): Redis cache-aside for redirects
chore(ci): cache npm dependencies
```

- `type` is one of the branch types above (`feat`, `fix`, `chore`, `docs`, `refactor`), or `test`.
- `scope` is the area touched: `link`, `analytics`, `user`, `ai`, `client`, `ci`, ...
- Use the body to explain *why* when it isn't obvious.
- No throwaway messages (`f`, `wip`, `update`).

## 4. Before opening a PR

```bash
npm test --prefix server          # always
npm run build --prefix client     # if client/ changed
```

- Add or update tests for server logic you change.
- The PR description says what changed and why, and how it was checked.
- Update `server/.env.example` and the README when you add an env var or change setup.

## 5. Merging and cleanup

- Merge only when CI is green.
- After merging, delete the branch on GitHub and locally, then return to `main`:

```bash
git checkout main
git pull
git branch -d <type>/<short-name>
git fetch --prune
```

After cleanup, `git branch -a` should show only `main` and `origin/main`.

## Branch protection

GitHub enforces the rules above on `main`: changes must come through a pull request, and the
`Server tests` and `Client build` checks must pass before merging. Force pushes and deleting `main` are blocked.
