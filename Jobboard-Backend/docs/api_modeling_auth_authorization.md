# API Modeling, Authentication, and Authorization Design

## Job Board Platform

## 1. Purpose

This document defines the initial API modeling, authentication, and authorization decisions for the Job Board backend. The goal is to make clear backend design decisions before writing implementation code.

The system includes the following core resources:

Users
Companies
Jobs
Job Applications
Skills

## 2. API Modeling / API Style

## Decision

The backend will expose a REST API.

The API will use versioned routes under:

/api/v1/

## Reasoning

REST is the best choice for this project because the Job Board system is resource-based. The main entities are users, companies, jobs, job applications, and skills. These map naturally to REST endpoints and standard HTTP methods.

For example:


GET    /api/v1/jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/{id}
PATCH  /api/v1/jobs/{id}
DELETE /api/v1/jobs/{id}


REST is also simple to understand, easy to test, and works well with web and mobile clients. 

GraphQL

GraphQL is not selected for the initial version. It is useful when clients need highly flexible queries or want to avoid over-fetching and under-fetching, but it adds complexity in caching, authorization, rate limiting, and query control. The current Job Board requirements do not need that complexity yet.

gRPC

gRPC is not selected because it is better suited for internal service-to-service communication. It is not as simple for browser or client-facing APIs.

tRPC

tRPC is not selected because it works best when both frontend and backend are coupled in TypeScript. This backend is being built with Django/Python.

Basic API Resource Model

The API will be organized around the main system resources.

### Authentication


POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me


### Users


GET   /api/v1/users/me
PATCH /api/v1/users/me

### Companies

GET    /api/v1/companies
GET    /api/v1/companies/{id}
POST   /api/v1/companies
PATCH  /api/v1/companies/{id}
DELETE /api/v1/companies/{id}

### Jobs

GET    /api/v1/jobs
GET    /api/v1/jobs/{id}
POST   /api/v1/jobs
PATCH  /api/v1/jobs/{id}
DELETE /api/v1/jobs/{id}


### Job Applications

POST   /api/v1/jobs/{job_id}/applications
GET    /api/v1/applications/me
GET    /api/v1/jobs/{job_id}/applications
PATCH  /api/v1/job-applications/{id}
DELETE /api/v1/job-applications/{id}

### Skills

GET    /api/v1/skills
POST   /api/v1/skills
PATCH  /api/v1/skills/{id}
DELETE /api/v1/skills/{id}

## API Conventions

The API will follow these conventions:

 Routes will use plural resource names.
 Routes will be versioned using `/api/v1/`.
 Request and response bodies will use JSON.
 Filtering will be handled through query parameters.
 Dates and timestamps will use ISO 8601 format.
 Soft-deleted records will not appear in normal list responses.

Example job search query:

GET /api/v1/jobs?location=Karachi&status=open&employment_type=full-time


# 2. Authentication

## Decision

The system will use JWT access tokens with stateful refresh tokens.

Access tokens will be short-lived and used to authenticate API requests. Refresh tokens will be stored server-side so that sessions can be revoked when needed.

## Reasoning

A fully stateless JWT approach is simple, but it has an important weakness: once an access token is issued, it cannot easily be revoked until it expires. If a token is stolen, the system has limited control.

Using a short-lived access token with a stateful refresh token gives a better balance:

Access tokens keep normal API requests fast and stateless.
Refresh tokens allow logout and session revocation.
The system can support “logout from this device” and “logout from all devices.”
Security is stronger than using only long-lived stateless JWTs.

## Token Strategy

Recommended token lifetime:

Access token: 15 minutes
Refresh token: 7 days


## Authentication Flow

### Registration

A user registers with required details such as name, email, and password.

The password will never be stored directly. The database stores only a password hash.

### Login

The user submits email and password.

If the credentials are valid, the API returns:

access_token
refresh_token

### Authenticated Requests

For protected endpoints, the client sends the access token in the request header.

If the token is missing, invalid, or expired, the request is rejected.

### Token Refresh

When the access token expires, the client sends the refresh token to get a new access token.

The backend checks whether the refresh token is valid, not expired, and not revoked.

### Logout

Logout revokes the refresh token so it cannot be used again.

### Logout All

Logout all revokes all active refresh tokens for the user.

### Password Reset

Password reset will be handled through a secure reset token. The user requests a reset using their email, receives a reset link/token, and then sets a new password.

## Authentication Error Handling

Unauthenticated requests should return:

401 Unauthorized


# 4. Authorization

## Decision

The system will use a combination of:

Role-Based Access Control + Ownership Checks

## Reasoning

Role-based access control is needed because different users have different permissions.

For example:

 A job seeker can apply to jobs.
 A company representative can create jobs.
 An admin can manage platform-level records.

However, roles alone are not enough. A company representative should not be able to edit every company or every job. They should only manage their own company’s jobs. This requires ownership checks.

So my final approach is:

 Use roles to decide what type of action a user can perform.
 Use ownership checks to decide whether the user can perform that action on a specific resource.

## Roles

The system will support three main roles:

job_seeker
company_representative
admin


## Job Seeker Permissions

A job seeker can:

 View open jobs
 View job details
 Manage their own profile
 Manage their own skills
 Apply to jobs
 View their own applications
 Soft-delete their own applications

A job seeker cannot:

 Create jobs
 Update jobs
 Delete jobs
 View applications submitted by other users
 Manage companies
 Verify companies
 Manage platform skills

## Company Representative Permissions

A company representative can:

 Manage their own company profile
 Create jobs for their own company
 Update jobs for their own company
 Soft-delete jobs for their own company
 View applications for jobs belonging to their own company
 Update application status for jobs belonging to their own company

A company representative cannot:

 Manage another company
 Update another company’s jobs
 View applications for another company’s jobs
 Verify companies
 Manage global platform skills unless explicitly allowed

## Admin Permissions

An admin can:

 Manage users
 Manage companies
 Verify companies
 Manage jobs
 Manage job applications
 Manage skills
 View platform-level data




## Example authorization flow:


Can this user update this job?

1. Is the user authenticated?
2. Is the user an admin?
   - If yes, allow.
3. Is the user a company representative?
   - If no, deny.
4. Does this job belong to the user’s company?
   - If yes, allow.
   - If no, deny.


## Authorization Error Handling

If the user is not logged in:

401 Unauthorized


If the user is logged in but does not have permission:

403 Forbidden


