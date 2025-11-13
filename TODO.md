# Project TODO List

## Overview

This document tracks current development tasks, features, and improvements for My Console. Tasks are prioritized and categorized for better organization.

## 📊 Priority Legend

- 🔥 **Critical** - Must be addressed immediately (blocking issues, security, core functionality)
- 🔴 **High** - Important for user experience and core features
- 🟡 **Medium** - Nice-to-have features and enhancements
- 🟢 **Low** - Future considerations and optimizations
- 📝 **Planning** - Research and planning phase

---

## 🔥 Critical Priority

### Security Enhancements
**Status**: ✅ Complete
**Priority**: Critical
**Estimated Effort**: Completed
**Due Date**: Q1 2026

**Description**:
Address security vulnerabilities and implement security best practices identified in security audit.

**✅ Completed**:
- ✅ Implement structured logging with log levels (replace console.error)
- ✅ Add request size limits to API routes
- ✅ Standardize error handling across all API routes
- ✅ Implement request size limits in Next.js config
- ✅ Review and sanitize error messages before logging
- ✅ Add file size validation for uploads/imports
- ✅ Document audit log retention policy
- ✅ Add CSP headers configuration
- ✅ Document API key rotation procedure - Complete documentation in `docs/API_KEY_ROTATION.md`
- ✅ CSRF protection with cookie-based session ID
- ✅ JWT authentication for cross-domain scenarios
- ✅ Image upload security with validation and deletion of old files

**❌ Remaining**:
- None (all security enhancements complete)

**Security Audit**: See `docs/SECURITY_AUDIT.md` for detailed findings and recommendations.

### AI Integration with OpenRouter API
**Status**: ✅ Core Features Complete - Advanced Features Remaining
**Priority**: Critical
**Estimated Effort**: 1-2 weeks (Remaining)
**Due Date**: Q1 2026

**Description**:
Integrate OpenRouter API to provide AI-powered content assistance features in the blog management system. All core AI features are now fully functional.

**Completed**:
- ✅ OpenRouter API integration (excerpt generation, title generation, SEO suggestions, content improvement)
- ✅ Multiple AI model support with fallback mechanism
- ✅ Server-side API routes with comprehensive error handling
- ✅ UI integration in blog create/edit pages (both pages fully functional)
- ✅ StatusBadge component with internationalization
- ✅ **Title generation fully functional** - Works on both create and edit pages with proper cleanup
- ✅ **Enhanced excerpt generation** - Improved cleanup to remove formatting artifacts (Option:, Choice:, etc.)
- ✅ **Improved title cleanup** - Removes prefixes, markdown, and formatting artifacts
- ✅ **CSRF protection** - Proper session ID handling with cookie-based identification
- ✅ **Query optimization** - Fixed pagination queries to use Appwrite Query builder (resolved syntax errors)

**Remaining Requirements**:
- [ ] Add content summarization capabilities
- [ ] Add plagiarism detection
- [ ] Create AI chat interface for content assistance
- [ ] Implement usage tracking and rate limiting
- [ ] Add content translation capabilities
- [ ] Implement tone adjustment features

---

## 🔴 High Priority

### Performance Optimization
**Status**: ✅ Core Complete, 🟡 Minor Optimizations Remaining
**Priority**: High
**Estimated Effort**: 1 week

**Tasks**:
- [x] Implement React.memo for TipTap components
- [x] Add lazy loading for heavy extensions
- [ ] Optimize bundle size with code splitting
- [x] Add service worker for caching
- [x] Implement virtual scrolling for large lists
- [x] Optimize database queries with pagination
- [x] **Fixed pagination query syntax** - Updated to use Appwrite Query builder (resolved "Invalid query: Syntax error")
- [x] **Query optimization** - Proper use of Query.equal(), Query.orderDesc(), Query.limit(), Query.offset()
- [x] Better Appwrite query handling with error fallbacks

### Security Hardening
**Status**: ✅ Core Complete, 🟡 Minor Enhancements Remaining
**Priority**: High

**Summary**: HTML sanitization, rate limiting, input validation, CSRF protection, session management, and security headers all implemented.

**Completed**:
- ✅ CSRF protection on all state-changing operations
- ✅ **CSRF token session management** - Cookie-based session ID generation and validation
- ✅ **CSRF header support** - Multiple header name variations supported (x-csrf-token, X-CSRF-Token, etc.)
- ✅ **CSRF implementation for all API routes** - All POST/PUT/DELETE/PATCH routes now have CSRF protection enabled by default
- ✅ **API route standardization** - All API routes follow consistent patterns with protection wrappers
- ✅ **Dynamic route params support** - API protection utilities handle Next.js 15 dynamic route parameters
- ✅ **Standardized response helpers** - All routes use createSuccessResponse/createErrorResponse for consistent responses
- ✅ **Schema validation integration** - Request body validation integrated into protection layer
- ✅ Rate limiting on API routes
- ✅ Input validation with Zod schemas
- ✅ HTML sanitization for user content
- ✅ Security headers via middleware
- ✅ Audit logging system
- ✅ User ownership checks (self-service model)
- ✅ Structured logging with log levels (DEBUG, INFO, WARN, ERROR, FATAL)
- ✅ Request size limits (10MB default, configurable per route)
- ✅ Standardized error handling with APIError class and consistent responses
- ✅ Error message sanitization (removes sensitive data from logs)
- ✅ JWT authentication for cross-domain Appwrite access
- ✅ Automatic deletion of old uploaded files

**Remaining Enhancements** (See `docs/SECURITY_AUDIT.md`):
- ✅ API key rotation documentation - Complete procedure documented in `docs/API_KEY_ROTATION.md`

### Mobile Responsiveness
**Status**: Partially Complete
**Priority**: High
**Estimated Effort**: 3-4 days

**Tasks**:
- [ ] Optimize TipTap toolbar for mobile
- [ ] Improve touch interactions
- [ ] Test all pages on mobile devices
- [ ] Fix responsive layout issues
- [ ] Add mobile-specific navigation

---

## 🟡 Medium Priority

### Multi-Language Support (English & Malay)
**Status**: ✅ Complete
**Priority**: Medium

**Summary**: Complete multi-language support for English and Malay across all 19 pages. See [I18N_SETUP.md](./docs/I18N_SETUP.md) for details.

### Customers Module
**Status**: ✅ Core Features Complete + Notes/Interactions/Import-Export/Tags/Bulk Operations Complete
**Priority**: Medium
**Estimated Effort**: Completed (Core + Notes/Interactions/Import-Export/Tags/Bulk Operations), 1-2 weeks (Remaining)

**Description**:
Self-service customer relationship management (CRM) module for managing customer data, interactions, and relationships. Users own and manage their own customer records.

**✅ Completed Core Features**:
- ✅ Customer listing page with search and filters
- ✅ Customer detail view page with tabs (overview, details, notes, interactions, activity timeline)
- ✅ Create customer form with validation and unsaved changes detection
- ✅ Edit customer form with validation and unsaved changes detection
- ✅ Customer deletion with confirmation dialog
- ✅ Customer contact information management
- ✅ Customer status management (active, inactive, lead, prospect, archived)
- ✅ Customer search with filters (name, email, phone, company, status)
- ✅ Empty state with shadcn UI components and create button
- ✅ Mobile responsive design
- ✅ Full internationalization (English & Malay)
- ✅ Complete shadcn UI integration (Breadcrumb, Separator, Badge, Avatar, Tabs, ScrollArea, Tooltip)
- ✅ Self-service model implementation (user ownership)
- ✅ Customer notes management (create, edit, delete, pin, tag, mark important)
- ✅ Customer interactions logging (calls, emails, meetings, tasks, etc.)
- ✅ Activity timeline combining notes and interactions
- ✅ Customer import/export with CSV, JSON, Excel
- ✅ Customer tags system
- ✅ Bulk operations (status update, tag management, export)

**Database Schema**:
- ✅ Customer collection documented in `docs/APPWRITE_DB_CUSTOMERS.md`
- ✅ Customer interactions collection documented in `docs/APPWRITE_DB_CUSTOMER_INTERACTIONS.md`
- ✅ Customer notes collection documented in `docs/APPWRITE_DB_CUSTOMER_NOTES.md`

**UI Components Implemented**:
- ✅ Customer listing table with pagination and bulk selection
- ✅ Customer detail view with tabs
- ✅ Customer form (create/edit) with tags
- ✅ Customer search and filter components
- ✅ Empty state component
- ✅ View and delete dialogs
- ✅ Notes and interactions components
- ✅ Activity timeline
- ✅ Bulk operations toolbar
- ✅ Tags input
- ✅ Import/export component

**Remaining Features** (Future Enhancements):
- [ ] Advanced customer analytics dashboard

---

### User Experience Enhancements
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1-2 weeks

**Tasks**:
- [ ] Implement auto-save functionality
- [ ] Add content templates library
- [ ] Create bulk operations for content management
- [ ] Add advanced search and filtering
- [ ] Implement content scheduling
- [ ] Add version history and rollback

### Content Management Features
**Status**: Partially Complete
**Priority**: Medium
**Estimated Effort**: 2-3 weeks

**✅ Completed**: Content categories, tags system, featured posts, analytics dashboard, threaded comments display, image upload with deletion of old images

**❌ Missing**:
- [ ] **Comment creation form** - Users can view comments but cannot create new ones
- [ ] **Comment moderation** - No approve/reject/edit/delete interface for comments
- [ ] **Bulk operations** - Cannot delete/update multiple posts at once
- [ ] **Content export** - No export functionality for blog posts (CSV, JSON, PDF)
- [ ] **Content import** - No bulk import from CSV/JSON
- [ ] **Content scheduling** - Cannot schedule posts for future publication
- [ ] **Version history** - No content versioning or rollback capability
- [ ] **Duplicate post** - No "duplicate" functionality to create similar posts
- [ ] **Content sharing features** - No social sharing or permalink management
- [ ] **Advanced analytics** - Limited analytics beyond basic view/like counts

### Blog Admin Features (Portfolio-Next)
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1-2 weeks

**Description**:
Admin features for managing blog posts in the portfolio-next project. These features are managed through my-console but affect the portfolio blog.

**Tasks**:
- [ ] Add blog post preview mode for drafts
- [ ] Implement blog post scheduling
- [ ] Add blog analytics dashboard (view counts, like counts, popular posts, reading time analytics, etc.)
- [ ] Implement blog post export functionality (CSV, JSON, PDF)
- [ ] Add blog post drafts management
- [ ] Implement blog post versioning
- [ ] Create content import/export functionality
- [ ] Consider headless CMS integration for content management
- [ ] Implement content preview mode
- [ ] Add content workflow management

### Portfolio Analytics Dashboard
**Status**: Not Started
**Priority**: Medium
**Estimated Effort**: 1-2 weeks

**Description**:
Analytics and reporting features for the portfolio-next project, accessible through my-console admin interface.

**Tasks**:
- [ ] Implement custom analytics dashboard for portfolio
- [ ] Add user behavior tracking (page views, time on page, bounce rate, scroll depth)
- [ ] Create analytics reports (daily, weekly, monthly summaries)
- [ ] Add blog post performance metrics (views, likes, reading time, completion rate, popular posts)
- [ ] Implement visitor analytics (unique visitors, returning visitors, geographic data, device types)
- [ ] Add project view tracking and analytics
- [ ] Create engagement metrics (time on site, pages per session, exit pages)

### Better Appwrite Implementation
**Status**: Planning
**Priority**: High
**Estimated Effort**: 1 week

**Tasks**:
- [ ] Update to latest Appwrite SDK to resolve deprecation warnings
- [ ] Optimize all database queries with proper indexing
- [ ] Implement error handling for all Appwrite calls
- [ ] Add retry mechanism for failed Appwrite requests
- [ ] Use Appwrite's real-time subscriptions where appropriate
- [ ] Review and improve relationship handling in schemas

---

## 🔍 Critical Missing Features Analysis

### Blog Module (`/auth/blog/blog-posts`)
**Status**: Core CRUD Complete, Missing Advanced Features
**Priority**: High

**✅ Implemented**: Full CRUD, view page with tabs, threaded comments display, search/filtering, pagination, status management, image upload with old image deletion, category loading in edit page

**❌ Missing**:
- [ ] **Comment creation form** - Users can view comments but cannot create new ones
- [ ] **Comment moderation** - No approve/reject/edit/delete interface for comments
- [ ] **Bulk operations** - Cannot delete/update multiple posts at once
- [ ] **Content export** - No export functionality for blog posts (CSV, JSON, PDF)
- [ ] **Content import** - No bulk import from CSV/JSON
- [ ] **Content scheduling** - Cannot schedule posts for future publication
- [ ] **Version history** - No content versioning or rollback capability
- [ ] **Duplicate post** - No "duplicate" functionality to create similar posts
- [ ] **Advanced search** - Limited to title/content search, no full-text search
- [ ] **Content templates** - No template system for common post types

---

### Community Module (`/auth/community/community-posts`)
**Status**: Core CRUD Complete, Missing Engagement Features
**Priority**: High

**✅ Implemented**: Full CRUD, view/edit pages, topic management, status management, post flags

**❌ Missing**:
- [ ] **Reply creation** - Users cannot create replies to posts (only display exists)
- [ ] **Vote functionality** - Upvote/downvote buttons exist but no actual voting implementation
- [ ] **Bulk operations** - Cannot moderate multiple posts at once
- [ ] **Moderation tools** - Limited moderation capabilities (approve/reject only)
- [ ] **Export functionality** - No export for community posts
- [ ] **Advanced filtering** - Limited filters (status, search only)
- [ ] **User reputation** - No reputation system based on votes/replies
- [ ] **Notification system** - No notifications for replies, mentions, or votes
- [ ] **Content moderation queue** - No dedicated queue for pending posts

---

### Dashboard (`/auth/dashboard`)
**Status**: Basic Stats Complete, Missing Advanced Analytics
**Priority**: Medium

**✅ Implemented**: Basic statistics, charts, role-based filtering, quick actions

**❌ Missing**:
- [ ] **Data export** - Cannot export dashboard data (CSV, PDF)
- [ ] **Date range filters** - No custom date range selection for charts
- [ ] **More detailed analytics** - Limited to basic counts, no trends, growth rates
- [ ] **Customizable widgets** - Cannot add/remove/reorder dashboard widgets
- [ ] **Real-time updates** - Dashboard doesn't refresh automatically
- [ ] **Comparison periods** - Cannot compare current period vs. previous period
- [ ] **Goal tracking** - No way to set and track goals

---

### Profile (`/auth/profile`)
**Status**: Core Features Complete, Missing Advanced Account Management
**Priority**: Medium

**✅ Implemented**:
- Profile view/edit with extended fields
- Settings integration
- Teams display
- Session statistics
- Email verification resend with callback handling
- Password reset (forgot password flow)
- Personal activity timeline with proper timeline UI (visual timeline with icons, cards, and hover effects)
- Account deletion with confirmation

**❌ Missing**:
- [ ] **Avatar upload** - Cannot upload/change profile picture
- [ ] **Two-factor authentication setup** - Toggle exists but no actual 2FA implementation
- [ ] **Export user data** - No GDPR-compliant data export
- [ ] **Email change** - No email address update functionality

**✅ Implemented**:
- **Account deletion** - Users can delete their account with password confirmation and "DELETE" text confirmation
- **Email change** - Users can change their email address with password verification and email verification flow

---

### Settings (`/auth/settings`)
**Status**: Basic Settings Complete, Missing Advanced Options
**Priority**: Medium

**✅ Implemented**: Theme selection, language selection, primary color, password change, notification toggle, 2FA toggle (UI only)

**❌ Missing**:
- [ ] **Email preferences** - No granular email notification settings
- [ ] **Notification settings persistence** - Toggle exists but preferences not fully saved
- [ ] **2FA implementation** - Toggle exists but no actual 2FA setup/verification
- [ ] **API keys management** - No way to manage API keys
- [ ] **Connected accounts** - No OAuth/social login management
- [ ] **Privacy settings** - No privacy controls (profile visibility, etc.)
- [ ] **Data export** - No export user data functionality
- [ ] **Account deletion** - No account deletion option

---

### Sessions (`/auth/sessions`)
**Status**: ✅ Complete
**Priority**: Low

**✅ Implemented**:
- Session listing with current session display
- Individual session revocation
- Revoke all sessions with confirmation dialog and auto-logout
- Session details modal with comprehensive information
- Session activity timeline showing all activities for a session
- Suspicious activity detection - Alerts for unusual sessions with severity levels (low, medium, high)
- Session export - Export functionality (CSV, JSON, PDF) with suspicious activity flags

---

### Audit Logs (`/auth/audit`)
**Status**: Core Features Complete, Missing Advanced Features
**Priority**: Medium

**✅ Implemented**: Log listing with pagination, advanced filtering, field-specific search with operators (AND/OR/NOT), search history, export (CSV/JSON/PDF), real-time updates, log retention settings UI, analytics dashboard

**❌ Missing**:
- [ ] **Alert rules** - No way to set up alerts for specific audit events

---

### Database Admin (`/auth/admin/database`)
**Status**: ✅ Complete
**Priority**: High

**✅ Implemented**:
- Database statistics and overview
- Collection overview with schema inspection
- Manual backup creation
- Backup history and deletion
- Restore from backup (SQL, BSON, Excel formats)
- Import data (CSV, JSON, Excel)
- Visual query builder
- Data validation and integrity checks
- Collection management UI (with Appwrite Console integration)
- Index management UI (with Appwrite Console integration)
- Backup scheduling configuration UI
- Performance metrics
- Backup automation (scheduling UI complete)
- Query optimization (caching, performance tracking, slow query detection)
- Database monitoring (real-time query monitoring, performance analytics)
- Database migration scripts (migration system with version tracking, CLI, and documentation)
- Performance tuning and optimization (comprehensive performance tuning guide with best practices)
- Better Appwrite implementation with optimized queries and error handling

---

## 🟢 Low Priority

### Advanced Features
**Status**: Planning
**Priority**: Low
**Estimated Effort**: 4-6 weeks

**Tasks**:
- [ ] Implement real-time collaboration
- [ ] Add multi-language content support
- [ ] Create API integrations
- [ ] Build webhook system
- [ ] Add advanced analytics
- [ ] Implement plugin system

### Developer Experience
**Status**: Ongoing
**Priority**: Low
**Estimated Effort**: 2-3 weeks

**Tasks**:
- [ ] Add comprehensive testing suite
- [ ] Implement CI/CD pipeline
- [ ] Create development documentation
- [ ] Add performance monitoring
- [ ] Implement error tracking
- [ ] Create component library docs

---

## 📝 Planning Phase

### Research & Planning
**Status**: Ongoing
**Priority**: Planning

**Tasks**:
- [ ] Evaluate alternative AI providers
- [ ] Research content management best practices
- [ ] Plan microservices architecture
- [ ] Design advanced analytics system
- [ ] Research real-time collaboration solutions

### Future Architecture
**Status**: Planning
**Priority**: Planning

**Tasks**:
- [ ] Design mobile application
- [ ] Plan enterprise features
- [ ] Design advanced permission system
- [ ] Plan multi-tenant architecture

---

## 📈 Progress Tracking

### Recent Major Completions
- ✅ **Multi-Language Support**: All 19 pages fully internationalized (English & Malay)
- ✅ **Security Hardening**: HTML sanitization, rate limiting, CSRF protection, session management, security headers
- ✅ **Security Enhancements**: Structured logging, request size limits, standardized error handling, error sanitization
- ✅ **CSRF Token System**: Cookie-based session ID generation, multiple header support, proper token validation
- ✅ **API Route Standardization**: All API routes refactored to use consistent patterns with protection wrappers
- ✅ **CSRF Implementation**: All state-changing API routes (POST/PUT/DELETE/PATCH) now have CSRF protection enabled
- ✅ **API Protection Utilities**: Enhanced to support Next.js 15 dynamic route parameters
- ✅ **Standardized API Responses**: All routes use consistent response helpers (createSuccessResponse/createErrorResponse)
- ✅ **Security Audit**: Comprehensive security analysis completed (see `docs/SECURITY_AUDIT.md`)
- ✅ **AI Integration**: OpenRouter API with excerpt, title generation, SEO suggestions, content improvement
- ✅ **AI Title Generation**: Fully functional on both create and edit pages with enhanced cleanup
- ✅ **AI Excerpt Generation**: Enhanced cleanup to remove formatting artifacts (Option:, Choice:, etc.)
- ✅ **Performance Optimization**: TipTap optimization, smart pagination, virtual scrolling
- ✅ **Pagination Fixes**: Fixed query syntax errors by implementing proper Appwrite Query builder usage
- ✅ **Component Architecture**: Modular components with separation of concerns across all pages
- ✅ **Audit Log Export**: PDF, CSV, and JSON export with formatted reports and advanced search capabilities
- ✅ **Global Slug Utility**: Centralized slug generation replacing duplicate implementations across blog and community modules
- ✅ **Database Admin**: Complete database management system with backup/restore, import, query builder, validation, collection/index management, and scheduling UI
- ✅ **Session Management**: Complete session management with revoke all, session details modal, and activity timeline
- ✅ **Email & Password Management**: Email verification resend, password reset flow, and proper error handling
- ✅ **Personal Activity Timeline**: User-specific activity timeline on profile page with proper timeline UI using shadcn components
- ✅ **Customer Management Module**: Complete self-service CRM module with listing, create, view, edit, delete, search, filters, empty states, and full shadcn UI integration
- ✅ **Customer Notes & Interactions**: Full UI for customer notes and interactions with CRUD operations, activity timeline, and proper folder structure matching blog/community patterns
- ✅ **Customer Import/Export**: Complete import/export functionality with CSV, JSON, and Excel support, file validation, and error handling
- ✅ **Customer Tags**: Metadata-based tagging system for customer categorization with tag input component
- ✅ **Customer Bulk Operations**: Complete bulk operations system with checkbox selection, status update, tag management (add/remove/set), and bulk export for selected customers
- ✅ **Blog Post Edit Navigation**: Fixed navigation after post update to redirect to post list page with proper state management
- ✅ **SEO Suggestions API**: Enhanced JSON extraction and error handling for AI responses with reasoning text
- ✅ **Blog Post Create Page Fixes**: Fixed double submission prevention, immediate navigation after save, multi-language audit logs, and non-blocking audit logging
- ✅ **Logout Hook Error Fix**: Fixed "Rendered more hooks" error during logout by using window.location.href for reliable navigation
- ✅ **View and Like Tracking Implementation**: Complete implementation of view and like tracking for portfolio-next with IP address detection, sessionId fallback, and sessionStorage-based duplicate prevention
- ✅ **Multi-Language Redirect Support**: Added root-level redirect translations for consistent multi-language support across the application

### Metrics to Track

#### Code Quality
- [ ] Test coverage: Target 80%+
- [ ] Performance score: Target 90+ Lighthouse
- [ ] Bundle size: Keep under 500KB
- [ ] Core Web Vitals: All green

#### User Experience
- [ ] Page load time: Under 2 seconds
- [ ] Time to interactive: Under 3 seconds
- [ ] Mobile usability: 90+ score
- [ ] Accessibility: WCAG 2.1 AA compliance

#### Business Metrics
- [ ] User satisfaction: 4.5+ rating
- [ ] Feature adoption: 70%+ of users
- [ ] Error rate: Under 0.1%
- [ ] Uptime: 99.9%+

---

## 🤝 Contribution Guidelines

### Adding New Tasks
1. Use appropriate priority level (🔥 Critical, 🔴 High, 🟡 Medium, 🟢 Low, 📝 Planning)
2. Include estimated effort and due dates
3. Add detailed requirements and acceptance criteria
4. Link to related issues or documentation

### Task Lifecycle
1. **Not Started** → **In Progress** → **In Review** → **Completed**
2. **Blocked** tasks need clear blockers identified
3. Update progress regularly with meaningful status changes

### Code Review Process
- All changes require review
- Critical security changes require 2 approvals
- Performance-impacting changes need benchmarking
- New features need user acceptance testing

---

## 📞 Support & Resources

### Development Resources
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [TipTap Documentation](https://tiptap.dev/)
- [Appwrite Documentation](https://appwrite.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

### Design Resources
- [Shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)

### Project Documentation
- [README.md](./README.md) - Main project documentation
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [API_ROUTES.md](./docs/API_ROUTES.md) - API routes standardization and security guide
- [BLOG_MANAGEMENT.md](./docs/BLOG_MANAGEMENT.md) - Blog CMS guide
- [TIPTAP_COMPONENTS.md](./docs/TIPTAP_COMPONENTS.md) - Rich text editor
- [NICE_TO_HAVE.md](./docs/NICE_TO_HAVE.md) - Future features

---

*Last Updated: January 2025*
*Next Review: February 2025*
