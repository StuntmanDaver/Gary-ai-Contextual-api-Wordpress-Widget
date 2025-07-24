# Gary AI Project Plan

## Notes
- Project follows detailed implementation plan in `docs/implementation-plan.md`
- Database migrations and service layer components are now fully implemented
- Next major milestone: REST API endpoints and chat widget implementation
- Repository: https://github.com/StuntmanDaver/Gary-ai-Contextual-api-Wordpress-Widget.git



### Phase 1: Foundations (Weeks 1–2)

#### 1.1 Repositories & Tooling
- [x] Set up Git repository with main, develop, release/* branches (Git Flow)
- [x] Initialize Composer with dependencies (guzzlehttp/guzzle, phpstan/phpstan, phpunit/phpunit)
- [x] Scaffold NPM/Vite toolchain with ESLint, Prettier, Jest, Playwright
- [x] Implement PHP autoloader (PSR-4) in `includes/class-autoloader.php`


#### 1.3 Baseline Code
- [x] Create main plugin file `gary-ai.php` with activation hook, text domain, default options
- [x] Define constants (GARY_AI_VERSION, endpoints, secrets)

### Phase 2: Core Backend (Weeks 3–5)

#### 2.1 Database Migrations
- [x] Implement `class-installer.php` using dbDelta()
- [x] Create conversations table with proper indexes
- [x] Create messages table with foreign key relationships
- [x] Create analytics table for event tracking
- [x] Create settings table for encrypted configuration
- [x] Create rate_limits table for token bucket implementation
- [x] Implement rollback logic on deactivation

#### 2.2 PHP Service Layer
- [x] **ContextualAIClient**: queryAgent(), listDatastores(), createConversation(), sendMessage(), getConversationHistory(), healthCheck()
- [x] **ContextualAIClient**: HTTP retry with exponential back-off
- [x] **WordPressAuth**: issueToken(), verifyToken() with WordPress nonces and 15-min expiry
- [x] **Encryption**: encrypt(), decrypt() with AES-256-GCM, keys in wp_options (salted)
- [x] **RateLimiter**: isAllowed($ip) with token bucket, fallback to transients
- [x] **ConversationManager**: CRUD for conversations/messages with encryption
- [x] **AnalyticsService**: track($metric, $value) writing to gary_ai_analytics

#### 2.3 REST Routes
- [x] Implement namespace `gary-ai/v1`
- [x] Create `/token` (GET) endpoint → WordPress authentication token
- [x] Create `/chat` (POST) endpoint → passes prompt to Contextual AI
- [x] Create `/settings` (CRUD) endpoint – admin-only
- [x] Create `/conversations/{id}` (GET) endpoint → retrieve conversation history
- [x] Create `/health` (GET) endpoint → system health check
- [x] **COMPLETED**: Comprehensive audit and improvement of all REST API endpoints with:
  - Enhanced logging with request/response timing, IP tracking, structured context
  - Robust error handling with proper HTTP status codes and exception catching
  - Security improvements including permission validation and input sanitization
  - Performance monitoring with response time tracking and service health metrics
  - Analytics integration for usage tracking and error monitoring

#### 2.4 Logging & Error Handling
- [x] Create `class-logger.php` with PSR-3 interface
- [x] Implement log levels with debug disabled by default in production
- [x] Integrate comprehensive logging across all REST API endpoints
- [x] Add structured error handling with detailed context and timing metrics

### Phase 3: Chat Widget (Weeks 6–7)

#### 3.1 Front-End Stack
- [x] Set up Vanilla JS (ES2022) build system
- [x] Configure Vite compilation to output `assets/js/chat-widget.js` (39 KB gz)
- [x] Create `chat-widget.css` styles (9 KB, CSS Modules)
- [x] **COMPLETED**: Consolidated all frontend code into `gary-ai/src/` directory structure
- [x] **COMPLETED**: Meticulously verified all files for correctness, imports, and implementation

#### 3.2 Features
- [x] **COMPLETED**: Implemented complete chat widget with all core components:
  - ChatWidget.js (main controller), ChatButton.js (floating button)
  - ChatHeader.js (header with controls), MessageList.js (message display)
  - InputArea.js (input interface), TypingIndicator.js (typing animation)
- [x] **COMPLETED**: Implemented ApiClient.js with WordPress REST API integration
- [x] **COMPLETED**: Implemented Logger.js with structured logging
- [x] **COMPLETED**: Auto-scroll functionality integrated in MessageList component
- [ ] Add Markdown rendering support
- [ ] Create code block copy button
- [x] **COMPLETED**: Typing indicator implemented with accessibility features
- [ ] Add reconnect & session resume via conversation token in sessionStorage

#### 3.3 Accessibility & i18n
- [x] **COMPLETED**: Implement ARIA roles (dialog, log, textbox, status, banner, contentinfo)
- [x] **COMPLETED**: Full accessibility compliance with keyboard navigation, focus management
- [x] **COMPLETED**: Screen reader support with ARIA live regions and announcements


#### 3.4 Unit & e2e Tests
- [ ] Create Jest DOM snapshots
- [ ] Write Playwright script: open WP test site, start chat, validate response

### Phase 4: Admin UI & Settings (Weeks 8–9)

#### 4.1 React Settings Page
- [ ] Create tabbed interface: General · API Keys · Roles · Analytics
- [ ] Integrate WordPress components (@wordpress/components)
- [ ] Implement real-time validation and error toasts

#### 4.2 Role/Capability Mapping
- [ ] Implement `gary_ai_manage_settings` capability (Administrator)
- [ ] Implement `gary_ai_view_analytics` capability (Editor+)

#### 4.3 Data Privacy
- [ ] Add "Save transcripts?" toggle (YES/NO, default YES)
- [ ] Implement GDPR export/erase hooks

### Phase 5: Testing & Hardening (Weeks 10–11)

#### 5.1 Unit Testing
- [ ] Achieve ≥90% class coverage with PHPUnit 10 + Mockery
- [ ] Create comprehensive test suite for all service classes

#### 5.2 Integration Testing
- [ ] Set up Guzzle Mock + Testcontainers for MySQL
- [ ] Test all REST endpoints functionality

#### 5.3 Security Testing
- [ ] Run WPScan security analysis
- [ ] Configure PHPStan at maximum level
- [ ] Set up SonarCloud analysis
- [ ] Achieve zero critical/high security issues

#### 5.4 Performance Testing
- [ ] Set up k6.io scripted testing (1k RPS, 100 chats/sec)
- [ ] Achieve p95 latency ≤800ms

#### 5.5 Accessibility Testing
- [ ] Run axe-core accessibility tests
- [ ] Perform Lighthouse audits
- [ ] Achieve WCAG 2.1 AA compliance

#### 5.6 Documentation
- [ ] Create `SECURITY.md` with vulnerability report process
- [ ] Create `CODE_OF_CONDUCT.md`

### Phase 6: Beta Release (Week 12)
- [ ] Tag v0.9.0-beta release
- [ ] Deploy to staging site (beta.example.com)
- [ ] Send call-for-testers email
- [ ] Collect feedback and create GitHub issues

### Phase 7: Marketplace Prep (Weeks 13–14)

#### 7.1 WordPress.org Requirements
- [ ] Ensure GPLv2 license headers in all files
- [ ] Create WordPress standard `README.txt` (Changelog, FAQ, Screenshots)
- [ ] Create assets: banner 1544×500, icon 256×256, up to 3 screenshots

#### 7.2 Final QA Checklist
- [ ] Verify PHP 7.4 & 8.2 compatibility
- [ ] Test WP 5.0 – 6.4 compatibility matrix
- [ ] Test upgrade path: deactivate old plugin gracefully

#### 7.3 Security Review
- [ ] Run third-party library audit (`composer audit`, `npm audit`)
- [ ] Complete penetration test and attach summary to release notes

### Phase 8: GA Launch (Week 15)
- [ ] Increment version to 1.0.0 and update changelog
- [ ] Merge release/1.0.0 → main and push tag
- [ ] Verify GitHub Action auto-builds ZIP
- [ ] Manual push to WordPress SVN
- [ ] Publish blog post and social announcement
- [ ] Open support forum on WordPress.org with two-day response SLA

### Post-Launch (Ongoing)
- [ ] Set up telemetry dashboard (Matomo or GA4 + BigQuery)
- [ ] Establish monthly patch cycle with semantic versioning
- [ ] Plan roadmap for next features: streaming responses, file upload to datastore, voice input

## Final Deliverables Checklist
- [x] `gary-ai.php` main loader
- [x] Composer updated & locked
- [ ] Vendor libraries bundled (no dev-deps)
- [ ] All REST routes documented in `/docs/endpoints.md`
- [ ] Unit/Integration/e2e reports uploaded to CI artifacts
- [ ] Signed `CHANGELOG.md` & `LICENSE`
- [ ] WordPress SVN repository with correct structure

## Current Status
**Phase 2 (Core Backend) - In Progress**
- ✅ Database migrations and service layer fully implemented
- 🔄 Next: REST API endpoints implementation
- 📍 Current Goal: Implement `/token`, `/chat`, and `/settings` REST endpoints

## Risk Mitigation
- **R-1**: Contextual AI API rate caps → Dynamic back-off + local caching
- **R-2**: WordPress review rejects → Pre-submit to Plugin Review Team
- **R-3**: Data breach (PII) → AES-256 encryption + security plugin audit
- **R-4**: Unoptimized DB growth → Scheduled cron cleanup + table partitions
- **R-5**: Team resource shuffle → Knowledge base & extensive docs