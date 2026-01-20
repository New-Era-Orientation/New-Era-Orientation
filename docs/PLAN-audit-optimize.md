# PLAN-audit-optimize

> **Status**: APPROVED
> **Goal**: Comprehensive system audit (Security, Performance, Code, UX) and subsequent optimization/UI upgrade for `neo-next`.

## 1. Context & Objectives

The user requires a full "health check" and improvement cycle for the `neo-next` project.
**Key Objectives:**
- **Audit**: Identify bugs, security vulnerabilities, performance bottlenecks, and UX/UI issues.
- **Report**: Produce a detailed status report.
- **Optimize**: Fix issues and improve system performance.
- **Upgrade**: Enhance the User Interface (UI).

## 2. Phase 1: Comprehensive Audit (Discovery)

**Agent**: `security-auditor`, `performance-optimizer`, `frontend-specialist`, `debugger`

### 1.1 Security & Code Quality Audit
- [ ] Dependency Vulnerability Scan (`npm audit`, `snyk` if available).
- [ ] Static Code Analysis (Linting, unused exports, circular dependencies).
- [ ] Secret Exposure Check (Env vars, hardcoded secrets).
- [ ] API Security Review (Auth checks, input validation).

### 1.2 Performance Profiling
- [ ] Bundle Size Analysis (`@next/bundle-analyzer`).
- [ ] Database Query Performance (Prisma slow queries).
- [ ] Core Web Vitals (Lighthouse CI).
- [ ] API Response Time Analysis.

### 1.3 UX/UI & Functional Verification
- [ ] Automated E2E Testing (Playwright/Cypress).
- [ ] Manual UX Review (Responsive design, accessibility/a11y check).
- [ ] Broken Link / Route Verification.
- [ ] "Purple Ban" & Design Consistency Check.

## 3. Phase 2: Reporting

**Agent**: `project-planner`

- [ ] Compile "Deep Audit Report" with findings categorized by High/Medium/Low severity.
- [ ] Propose detailed "Optimization Roadmap" based on findings.

## 4. Phase 3: Implementation - Optimization (Fix & Tune)

**Agent**: `backend-specialist`, `performance-optimizer`

- [ ] **Critical Fixes**: Address High severity security/bug issues immediately.
- [ ] **Database Tuning**: Add indexes, optimize Prisma schemas.
- [ ] **Performance Tuning**: Image optimization, lazy loading, code splitting, memoization.

## 5. Phase 4: Implementation - UI Upgrade (Enhance)

**Agent**: `frontend-specialist`

- [ ] **Design Refresh**: Apply "Neo-Modern" aesthetic (Glassmorphism, dynamic animations - per `web_application_development` rules).
- [ ] **Component Polish**: Upgrade specific UI components (Cards, Nav, Forms) to Premium standard.
- [ ] **Responsive Fixes**: Ensure perfect mobile/tablet experience.

## 6. Verification Plan

- [ ] **Regression Testing**: Run full test suite (`npm test`).
- [ ] **Performance Benchmark**: Compare metrics before vs. after.
- [ ] **User Acceptance**: Walkthrough of new UI elements.
