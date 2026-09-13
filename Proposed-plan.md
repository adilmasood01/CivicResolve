Build: CivicResolve — Government Public-Service Complaint Management System
You are a senior full-stack engineer and software architect.
Build a production-quality portfolio project called CivicResolve, a Government/Public-Service Complaint Management System.
The application should demonstrate strong full-stack engineering, database design, authentication, authorization, workflow management, auditability, responsive UI, analytics, validation, and clean architecture.
Do NOT build this as a simple CRUD demo.
________________________________________
1. Product Vision
CivicResolve is a centralized platform where citizens can submit complaints about public services and government departments can receive, assign, investigate, resolve, and close those complaints.
The system must provide:
•	Citizen complaint submission
•	Complaint tracking
•	Department assignment
•	Officer assignment
•	Complaint workflow
•	Priority management
•	SLA monitoring
•	Attachments/evidence
•	Comments
•	Notifications
•	Audit trail
•	Analytics dashboards
•	Role-based access control
The UI should look like a modern government/public-service platform rather than a generic admin dashboard.
________________________________________
2. Recommended Tech Stack
Use:
•	Next.js with App Router
•	TypeScript
•	PostgreSQL
•	Prisma ORM
•	Tailwind CSS
•	shadcn/ui
•	React Hook Form
•	Zod
•	TanStack Query where appropriate
•	Recharts for analytics
•	Auth.js or another secure authentication implementation suitable for Next.js
•	REST-style API/service layer where appropriate
Use strict TypeScript.
Avoid unnecessary dependencies.
Keep the architecture maintainable and scalable.
________________________________________
3. User Roles
Implement four roles:
CITIZEN
Permissions:
•	Register/login
•	Submit complaints
•	View own complaints
•	Track complaint status
•	Add comments to own complaints
•	Upload attachments
•	View complaint timeline
•	Confirm resolution
•	Reject a resolution
•	Reopen a complaint where allowed
•	Rate completed complaints
A citizen must NEVER be able to access another citizen's private complaint data.
________________________________________
OFFICER
Permissions:
•	View complaints assigned to them
•	View relevant complaint details
•	Update complaint status
•	Add internal notes
•	Add public comments
•	Upload resolution evidence
•	Mark complaints as resolved
•	Request additional information
Officers must only access complaints they are authorized to handle.
________________________________________
DEPARTMENT_MANAGER
Permissions:
•	View all complaints belonging to their department
•	Assign complaints to officers
•	Reassign complaints
•	Change priority
•	Update department-level status where appropriate
•	Monitor SLA
•	View department analytics
•	View officer workload
•	Review resolved complaints
________________________________________
ADMIN
Full system access:
•	Manage users
•	Manage departments
•	Manage categories
•	Manage SLA rules
•	Manage roles
•	View all complaints
•	Assign departments
•	Manage system configuration
•	View system-wide analytics
•	View audit logs
________________________________________
4. Complaint Lifecycle
Implement this workflow:
SUBMITTED
→ UNDER_REVIEW
→ ASSIGNED
→ IN_PROGRESS
→ RESOLVED
→ CLOSED
Additional states:
REJECTED
REOPENED
Do not allow arbitrary status changes.
Implement valid state transitions.
For example:
SUBMITTED → UNDER_REVIEW
UNDER_REVIEW → ASSIGNED
ASSIGNED → IN_PROGRESS
IN_PROGRESS → RESOLVED
RESOLVED → CLOSED
RESOLVED → REOPENED
Only authorized roles can perform each transition.
Every status change must create a status-history/audit record.
________________________________________
5. Complaint Data Model
A complaint should contain at minimum:
•	id
•	complaintNumber
•	title
•	description
•	categoryId
•	departmentId
•	citizenId
•	assignedOfficerId
•	priority
•	status
•	location
•	latitude/longitude if available
•	SLA deadline
•	createdAt
•	updatedAt
•	resolvedAt
•	closedAt
Generate a human-readable complaint number such as:
CMP-2026-000001
Do not expose database IDs as the primary public complaint identifier.
________________________________________
6. Complaint Categories
Seed the database with:
•	Roads & Infrastructure
•	Street Lighting
•	Water & Sanitation
•	Waste Management
•	Electricity
•	Traffic
•	Public Safety
•	Parks & Recreation
•	Healthcare
•	Education
•	Other
Administrators must be able to create/edit/deactivate categories.
________________________________________
7. Departments
Seed realistic demo departments such as:
•	Municipal Services
•	Water & Sanitation
•	Traffic Management
•	Public Works
•	Parks & Recreation
•	Public Health
•	Education Services
These are fictional/demo departments for the portfolio project.
Do not represent them as actual government organizations unless explicitly configured by the user.
________________________________________
8. Priority System
Implement:
LOW
MEDIUM
HIGH
CRITICAL
Use configurable SLA rules.
Example seed data:
LOW → 10 days
MEDIUM → 5 days
HIGH → 48 hours
CRITICAL → 24 hours
Store SLA rules in the database rather than hard-coding them throughout the application.
________________________________________
9. SLA Monitoring
Every complaint must have an SLA deadline based on its priority.
Display:
•	Time remaining
•	SLA status
•	SLA breached indicator
Possible states:
ON_TRACK
DUE_SOON
BREACHED
COMPLETED
Use clear visual indicators.
Do not rely only on frontend calculations. SLA logic should be implemented in a reusable server-side service.
________________________________________
10. Complaint Timeline
Every important action should appear in a chronological timeline.
Examples:
Complaint submitted
Department assigned
Officer assigned
Priority changed
Status changed
Comment added
Attachment uploaded
Resolution submitted
Complaint reopened
Complaint closed
Each timeline event should record:
•	actor
•	action
•	timestamp
•	relevant metadata
________________________________________
11. Comments
Support two types:
PUBLIC_COMMENT
INTERNAL_NOTE
Public comments can be viewed by the citizen.
Internal notes are only visible to authorized government staff.
This distinction must be enforced server-side.
Never depend only on frontend hiding.
________________________________________
12. Attachments
Allow citizens and authorized staff to attach evidence.
Examples:
•	Images
•	PDF documents
Store attachment metadata in PostgreSQL.
Design the application so storage can later be switched to S3-compatible object storage.
Do not store large binary files directly in PostgreSQL.
Validate:
•	file type
•	file size
•	ownership/access permissions
________________________________________
13. Citizen Dashboard
Create a polished citizen dashboard.
Display:
•	Total complaints
•	Pending complaints
•	In-progress complaints
•	Resolved complaints
•	Closed complaints
Include:
•	Recent complaints
•	Complaint status
•	Complaint number
•	Priority
•	Department
•	Last update
Provide a prominent:
"Submit New Complaint"
button.
________________________________________
14. Complaint Submission
Create a multi-section complaint form.
Fields:
Title
Description
Category
Location
Priority suggestion if appropriate
Attachments
The system should determine the final priority based on configurable rules/authorized staff rather than blindly trusting user input.
After submission:
1.	Generate complaint number
2.	Determine category
3.	Determine department
4.	Calculate SLA
5.	Create complaint
6.	Create initial timeline event
7.	Create notification
8.	Redirect citizen to complaint tracking page
________________________________________
15. Government Staff Dashboard
Create a separate staff experience.
Dashboard should show:
Total assigned complaints
Pending review
In progress
Resolved
SLA due soon
SLA breached
Charts:
•	Complaints by category
•	Complaints by priority
•	Complaints by status
•	Resolution rate
•	Average resolution time
________________________________________
16. Department Manager Dashboard
Display:
Department complaint count
Open complaints
Resolved complaints
SLA compliance
Average resolution time
Officer workload
Officer performance
Category distribution
Allow filtering by:
•	Date range
•	Category
•	Priority
•	Officer
•	Status
________________________________________
17. Admin Dashboard
Create a system-wide analytics dashboard.
Metrics:
•	Total complaints
•	Open complaints
•	Resolved complaints
•	Closed complaints
•	Reopened complaints
•	SLA breach rate
•	Average resolution time
•	Resolution rate
Charts:
•	Monthly complaint volume
•	Complaints by department
•	Complaints by category
•	Complaints by priority
•	Complaint status distribution
Use Recharts.
Charts must be responsive.
________________________________________
18. Complaint Search & Filtering
Implement server-side filtering/pagination.
Allow users to search by:
•	Complaint number
•	Title
•	Category
•	Department
•	Status
•	Priority
•	Citizen
•	Assigned officer
Do not load the entire complaint database into the browser.
Use pagination.
________________________________________
19. Authentication
Implement secure authentication.
Support:
•	Registration
•	Login
•	Logout
•	Password hashing
•	Session management
•	Protected routes
Implement authorization on the server.
Never trust role information coming directly from the client.
________________________________________
20. Authorization
Create a centralized permission system.
Avoid scattering role checks everywhere.
Example conceptual API:
can(user, "complaint:update", complaint)
can(user, "complaint:assign", complaint)
can(user, "complaint:view", complaint)
can(user, "complaint:close", complaint)
Use this system consistently.
________________________________________
21. Database Design
Use Prisma with PostgreSQL.
Expected models include:
User
Role
Department
Category
Complaint
ComplaintAssignment
ComplaintComment
ComplaintAttachment
ComplaintStatusHistory
SLARule
Notification
Rating
AuditLog
Design proper relationships and indexes.
Add indexes for frequently queried fields such as:
•	complaintNumber
•	status
•	priority
•	departmentId
•	categoryId
•	citizenId
•	assignedOfficerId
•	createdAt
Use appropriate cascading/restrictive delete behavior.
Do not use unnecessary denormalization.
________________________________________
22. Notifications
Create an in-app notification system.
Examples:
Citizen:
"Your complaint CMP-2026-000123 has been assigned."
Officer:
"New complaint assigned to you."
Manager:
"Complaint CMP-2026-000123 is approaching its SLA deadline."
Citizen:
"Your complaint has been resolved."
Include:
•	unread/read state
•	timestamp
•	notification type
•	related complaint
________________________________________
23. Audit Logs
Create a proper audit system.
Record sensitive actions such as:
•	Login
•	User creation
•	Role changes
•	Complaint assignment
•	Status changes
•	Priority changes
•	Complaint reopening
•	Complaint resolution
•	Complaint closure
•	Category changes
•	Department changes
Audit log should include:
actor
action
entity
entityId
timestamp
metadata
Do not allow ordinary users to modify audit records.
________________________________________
24. Citizen Resolution Confirmation
When an officer marks a complaint as RESOLVED:
The citizen should see:
"Resolution submitted"
with two options:
[Accept Resolution]
[Report Issue]
If accepted:
RESOLVED → CLOSED
If the citizen reports that the issue is not resolved:
RESOLVED → REOPENED
Require a reason when reopening.
________________________________________
25. Rating
After closure, allow citizens to rate the resolution.
Use:
1–5 stars
and optional feedback.
Only allow one rating per complaint.
________________________________________
26. UI/UX Requirements
Design should feel:
•	Professional
•	Trustworthy
•	Accessible
•	Modern
•	Government/public-service oriented
•	Responsive
Avoid excessive gradients, glassmorphism, animations, or flashy startup-style UI.
Prioritize usability.
Use:
•	clear typography
•	accessible forms
•	consistent spacing
•	cards
•	tables
•	badges
•	status indicators
•	breadcrumbs
•	confirmation dialogs
•	empty states
•	loading states
•	error states
The application must work well on desktop and mobile.
________________________________________
27. Main Pages
Create:
PUBLIC:
/
/about
/login
/register
/track
/complaints/[complaintNumber]
CITIZEN:
/dashboard
/complaints
/complaints/new
/complaints/[id]
/notifications
/profile
STAFF:
/staff/dashboard
/staff/complaints
/staff/complaints/[id]
/staff/notifications
MANAGER:
/manager/dashboard
/manager/complaints
/manager/officers
/manager/analytics
ADMIN:
/admin/dashboard
/admin/users
/admin/departments
/admin/categories
/admin/sla-rules
/admin/complaints
/admin/audit-logs
________________________________________
28. Public Complaint Tracking
Allow a citizen to track a complaint using:
Complaint Number
and an appropriate verification mechanism.
Do not expose sensitive personal information through public tracking.
Display:
•	Complaint number
•	Category
•	Current status
•	Department
•	Submission date
•	Last update
•	Timeline summary
________________________________________
29. Validation
Use Zod schemas.
Validate all user input server-side.
Handle:
•	missing fields
•	invalid IDs
•	unauthorized access
•	invalid status transitions
•	invalid file uploads
•	duplicate ratings
•	malformed requests
Return consistent error responses.
________________________________________
30. Error Handling
Implement:
•	loading states
•	error states
•	empty states
•	API error handling
•	form validation messages
•	404 pages
•	unauthorized pages
•	forbidden pages
Do not silently fail.
________________________________________
31. Security Requirements
Implement:
•	Password hashing
•	Server-side authorization
•	Input validation
•	CSRF protection where applicable
•	Secure session handling
•	Rate limiting for sensitive endpoints where practical
•	File validation
•	Access control for attachments
•	Protection against IDOR
•	Protection against unauthorized complaint access
•	No sensitive information in client logs
Never expose secrets in source code.
Use environment variables.
Create .env.example.
________________________________________
32. Seed Data
Create realistic demo data.
Include:
•	Admin account
•	Department managers
•	Officers
•	Citizens
•	Departments
•	Categories
•	SLA rules
•	Complaints
•	Comments
•	Notifications
•	Status history
Make the dashboard look populated when the project is first run.
Clearly document demo credentials in the README only.
________________________________________
33. API/Service Architecture
Do not place all business logic inside React components.
Separate:
UI
API/route handlers
Validation
Business logic/services
Database access
Authorization
Example:
components/
app/
lib/
services/
repositories/
schemas/
types/
Use a clean structure appropriate for a production Next.js application.
________________________________________
34. Important Engineering Principle
The system must enforce authorization at the server/database-access layer.
For example:
A citizen requesting:
GET /api/complaints/123
must not receive complaint 123 merely because they know its ID.
Verify that the authenticated user owns the complaint or has an authorized staff role.
Similarly:
An officer must not access complaints belonging to unrelated departments unless explicitly authorized.
________________________________________
35. Development Strategy
Do NOT attempt to build everything in one step.
Build incrementally.
Phase 1:
Project setup
Phase 2:
Database schema + Prisma
Phase 3:
Authentication + roles
Phase 4:
Citizen complaint submission
Phase 5:
Complaint workflow
Phase 6:
Officer dashboard
Phase 7:
Manager dashboard
Phase 8:
Admin dashboard
Phase 9:
Notifications + audit logs
Phase 10:
SLA monitoring
Phase 11:
Attachments
Phase 12:
Testing + security hardening
Phase 13:
UI polish
Phase 14:
Deployment preparation
After completing each phase, verify that the application still runs correctly before proceeding.
________________________________________
36. Testing
Add tests for important business logic.
Especially test:
•	Authentication
•	Authorization
•	Complaint creation
•	Status transitions
•	SLA calculation
•	Assignment
•	Reopening
•	Resolution confirmation
•	Rating restrictions
Prioritize testing business rules over superficial UI tests.
________________________________________
37. README
Create a professional README containing:
Project overview
Features
Architecture
Tech stack
Database architecture
Role/permission model
Complaint lifecycle
Screenshots section
Local setup
Environment variables
Database setup
Seed instructions
Test accounts
Deployment instructions
Future improvements
________________________________________
38. Portfolio Quality
The final application should be something I can confidently demonstrate in a software engineering portfolio.
It should communicate:
"I can design and build real-world business systems."
Do not create fake complexity just to increase the number of files.
Prefer clean, understandable architecture.
________________________________________
39. Future Extensions
Do NOT implement these in the initial MVP unless the architecture naturally supports them:
•	AI complaint classification
•	Automatic department routing using ML
•	SMS notifications
•	Email notifications
•	GIS/map visualization
•	Mobile application
•	Multilingual support
•	Government identity verification
•	Advanced fraud detection
Design the system so these can be added later.
________________________________________
40. Final Instruction
Before writing significant amounts of code:
1.	Inspect the existing repository.
2.	Determine whether a project already exists.
3.	Do not destroy existing functionality.
4.	Propose the folder structure.
5.	Propose the database schema.
6.	Explain major architectural decisions briefly.
7.	Then implement Phase 1.
8.	Verify the implementation.
9.	Continue phase-by-phase.
Keep the code production-quality, typed, modular, secure, and maintainable.
Do not use placeholder TODO implementations for core functionality.
When a feature is implemented, make it actually functional rather than creating mock UI only.

