# Gary AI Project Plan

## Notes
- User requested to finish all scaffolding per implementation plan.
- Scaffolding includes repo setup, Composer, NPM/Vite, autoloader, CI/CD, plugin stub, and constants.
- Reference: docs/implementation-plan.md (Phase 1: Foundations).
- Initial scaffolding pushed to remote GitHub repository (https://github.com/StuntmanDaver/Gary-ai-Contextual-api-Wordpress-Widget.git)
- Full project successfully pushed to remote repository with user-provided token

## Task List
- [x] Set up Git repository structure (main, develop, release/*)
- [ ] Initialize Composer and require dependencies
- [x] Scaffold NPM/Vite toolchain with ESLint, Prettier, Jest, Playwright
- [ ] Implement PHP autoloader (PSR-4) in includes/class-autoloader.php
- [ ] Create CI/CD skeleton (GitHub Actions: ci.yml, release.yml, deploy-wporg.yml)
- [ ] Stub main plugin file (gary-ai.php) with activation hook, text domain, default options
- [ ] Define constants (GARY_AI_VERSION, endpoints, secrets via wp_config.php)

## Current Goal
Complete project scaffolding