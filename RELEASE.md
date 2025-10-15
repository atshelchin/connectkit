# Release Process

This document describes how to release packages for ConnectKit.

## Overview

ConnectKit uses an automated release process with two types of releases:

1. **Dev Releases** - Published automatically on every commit to `main` branch
2. **Production Releases** - Published when you create a git tag

## Dev Releases (Automated)

Every commit to `main` automatically publishes a dev release to npm.

**Note:** Version bump commits (created by `npm version`) are automatically skipped to prevent double publishing.

### What Happens

1. GitHub Actions builds and tests the code
2. Creates a version like `0.0.1-dev.20250115120000.abc1234`
   - Base version from `package.json`
   - Timestamp (YYYYMMDDHHmmss)
   - Short commit SHA
3. Publishes to npm with `dev` tag

### Installation

```bash
# Install latest dev version
npm install @shelchin/connectkit@dev

# Or with bun
bun add @shelchin/connectkit@dev

# Install specific dev version
npm install @shelchin/connectkit@0.0.1-dev.20250115120000.abc1234
```

### When to Use

- Testing latest changes before release
- CI/CD pipelines tracking latest development
- Early adopters wanting cutting-edge features

## Production Releases (Manual)

Production releases are created by pushing a git tag.

### Steps to Release

1. **Update version and create tag**

   ```bash
   # For patch release (0.0.1 → 0.0.2)
   npm version patch

   # For minor release (0.0.1 → 0.1.0)
   npm version minor

   # For major release (0.0.1 → 1.0.0)
   npm version major

   # Or set specific version
   npm version 1.2.3
   ```

   **What this does:**
   - ✏️ Updates `package.json` version
   - 📝 Creates a git commit (message: "v1.0.0")
   - 🏷️ Creates a git tag (tag: "v1.0.0")

2. **Push both commit and tag**

   ```bash
   git push origin main
   git push origin --tags
   ```

   **Important:** The version bump commit will NOT trigger a dev release (automatically skipped)

3. **Wait for GitHub Actions**
   - Builds and tests the code
   - Publishes to npm with `latest` tag
   - Creates a GitHub Release

### What Happens

1. GitHub Actions detects the tag (e.g., `v1.0.0`)
2. Runs full test suite
3. Builds the package
4. Publishes to npm as `@shelchin/connectkit@1.0.0`
5. Creates GitHub Release with notes

### Installation

```bash
# Install latest stable version
npm install @shelchin/connectkit

# Or with bun
bun add @shelchin/connectkit

# Install specific version
npm install @shelchin/connectkit@1.0.0
```

## NPM Tags Explained

| Tag      | Description               | Auto-updated?       |
| -------- | ------------------------- | ------------------- |
| `latest` | Stable production release | Yes, on tag push    |
| `dev`    | Latest development build  | Yes, on main commit |

## Requirements

### GitHub Secrets

You need to configure the following secret in your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add `NPM_TOKEN`:
   - Create token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Select "Automation" token type
   - Copy and paste into GitHub secret

### NPM Access

Package must be published as **public** (configured in workflows):

```bash
npm publish --access public
```

## Workflow Files

- [`.github/workflows/publish-dev.yml`](.github/workflows/publish-dev.yml) - Dev releases on main
- [`.github/workflows/publish-release.yml`](.github/workflows/publish-release.yml) - Production releases on tags

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version (1.0.0 → 2.0.0): Breaking changes
- **MINOR** version (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** version (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Dev Version Format

```
<base-version>-dev.<timestamp>.<commit-sha>

Example: 0.0.1-dev.20250115120000.abc1234
         │   │   │               │
         │   │   │               └─ Short commit SHA
         │   │   └─ Timestamp (YYYYMMDDHHmmss)
         │   └─ Dev identifier
         └─ Base version from package.json
```

## Troubleshooting

### Publish Failed

1. **Check NPM_TOKEN secret** - Make sure it's set correctly
2. **Verify npm token permissions** - Token must have publish access
3. **Check package name** - `@shelchin/connectkit` must be available or you must own it
4. **Review workflow logs** - Check GitHub Actions for detailed errors

### Version Conflict

If a version already exists on npm:

- Dev releases: GitHub Actions will fail, check logs
- Production releases: Don't reuse tag names, create a new version

### Tests Failing

Both workflows run the full test suite. Fix failing tests before releases will succeed.

## Best Practices

1. **Always test dev releases** before creating production tags
2. **Update CHANGELOG.md** before production releases
3. **Use conventional commits** for clear release notes
4. **Don't skip versions** - Follow semver strictly
5. **Test locally first**:
   ```bash
   npm run check
   npm run lint
   npm run test
   npm run prepack
   ```

## Examples

### Releasing a Bug Fix

```bash
# 1. Fix bug and commit to main
git add .
git commit -m "fix: resolve connection timeout issue"
git push origin main

# 2. Dev release publishes automatically as 0.0.1-dev.20250115120000.abc1234

# 3. Test the dev release
npm install @shelchin/connectkit@dev

# 4. When ready, create production release
npm version patch  # 0.0.1 → 0.0.2
git push origin main --tags

# 5. Production release publishes automatically
```

### Releasing a New Feature

```bash
# 1. Develop feature and commit to main
git add .
git commit -m "feat: add dark mode support"
git push origin main

# 2. Test dev release
npm install @shelchin/connectkit@dev

# 3. Create minor version release
npm version minor  # 0.0.2 → 0.1.0
git push origin main --tags
```

## Support

For issues with the release process:

- Check [GitHub Actions](https://github.com/atshelchin/connectkit/actions) logs
- Review this document
- Open an issue on GitHub
