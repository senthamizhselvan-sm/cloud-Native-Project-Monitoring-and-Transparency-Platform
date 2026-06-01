# Architecture Overview

## Core Services

- `auth-service`: registration, login, JWT, and RBAC.
- `project-service`: project CRUD, lifecycle tracking, and ownership metadata.
- `document-service`: images, reports, certificates, and compliance uploads.
- `monitoring-service`: delays, overruns, and missing-update checks.
- `analytics-service`: district, department, and budget reporting.
- `notification-service`: email, SMS, and in-app notifications.
- `feedback-service`: public grievance and feedback intake.

## Local Development Approach

- Use React + Vite for the frontend.
- Use FastAPI per microservice.
- Use MongoDB Atlas in production.
- Use a local MongoDB container for development if needed.
- Keep service code separated by domain so services can be deployed independently.
