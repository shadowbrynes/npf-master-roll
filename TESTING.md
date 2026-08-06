# Automated Testing & Verification Suite

## NPF EOD CBRN Personnel and Equipment Management System

### 1. Unit Tests (Vitest)
Unit tests verify domain logic, statutory retirement date calculations, date validations, and permission masks:
```bash
npm run test
```

### 2. End-to-End Tests (Playwright)
E2E tests simulate user authentication, multi-step personnel creation, RLS data isolation, base transfers, and document uploads:
```bash
npm run test:e2e
```
