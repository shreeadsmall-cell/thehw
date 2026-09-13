# Class Connect

# SCHOOL HOMEWORK TRACKING SYSTEM

Build a complete, professional, production-ready **School Homework Tracking System** for managing teachers, classes, subjects, students, daily homework checking, and reports.

The system should be designed for real school usage and must be **fast, simple, secure, responsive, and mobile-friendly**.

The most important goal is to allow a teacher to check homework for an entire class with the **minimum number of clicks**.

---

# 1. USER ROLES

There are only two roles:

## ADMIN

There should be **one Admin account**.

Default Admin credentials:

* Email: `mahipaljinjala@gmail.com`
* Password: `123456789`
* Role: `admin`

### IMPORTANT ADMIN AUTHENTICATION RULES

* Do NOT create a public Admin signup page.
* Do NOT allow users to register themselves as Admin.
* Only the existing Admin can access the Admin panel.
* Admin can create multiple Teacher accounts.
* Admin can activate/deactivate Teacher accounts.
* Admin has access to all school data.

For production security, structure authentication properly so the default password can later be changed.

---

# 2. TEACHER ACCOUNTS

Admin can create multiple Teacher accounts.

Teacher fields:

* Full Name
* Email
* Mobile Number
* Password
* Status

  * Active
  * Inactive

Admin actions:

* Create Teacher
* Edit Teacher
* View Teacher
* Activate Teacher
* Deactivate Teacher
* Reset Password
* Delete Teacher

Teachers cannot create Admin accounts.

Teachers cannot access other teachers' private classes unless explicitly permitted.

---

# 3. ADMIN DASHBOARD

Create a professional Admin Dashboard.

Show these summary cards:

* Total Teachers
* Total Classes
* Total Subjects
* Total Students
* Today's Homework Sessions
* Total Homework Records

Also show:

### Recent Teachers

Display recently created teachers.

### Recent Classes

Display recently created classes.

### Today's Homework Activity

Show:

* Total homework sessions
* Completed entries
* Incomplete entries
* Not Submitted
* Absent

Admin sidebar:

* Dashboard
* Teachers
* Classes
* Students
* Homework Records
* Reports
* Settings
* Logout

---

# 4. TEACHER DASHBOARD

Teacher dashboard should show:

* My Classes
* Total Students
* Total Subjects
* Today's Homework Sessions
* Pending Homework
* Recent Homework Activity

Show class cards.

Example:

### Standard 8-A

45 Students
6 Subjects

Buttons:

* Take Homework
* Students
* Reports

---

# 5. CLASS CREATION

Teachers can create multiple classes.

To create a class, only require:

### Class Name

Example:

`Standard 8-A`

### Subjects

Teacher can add multiple subjects.

Example:

* Mathematics
* Science
* English
* Gujarati
* Hindi
* Social Science

Use a dynamic subject input.

Buttons:

`+ Add Subject`

`Remove Subject`

`Create Class`

After creating a class, teacher should be able to:

* Edit Class
* Add Subject
* Remove Subject
* Delete Class
* View Students
* Take Homework
* View Reports

---

# 6. CLASS-SUBJECT RELATION

Subjects must belong to a specific class.

For example:

Standard 8-A

Subjects:

* Mathematics
* Science
* English

Standard 9-B

Subjects:

* Mathematics
* Physics
* Chemistry

When a teacher selects a class during homework entry, only the subjects belonging to that class should appear.

---

# 7. STUDENT MANAGEMENT

Teachers can add students in two ways.

## OPTION 1 — MANUAL ENTRY

Fields:

* Roll Number
* Student Name

Buttons:

* Add Student
* Save

---

# 8. EXCEL STUDENT IMPORT

This is a very important feature.

Teachers should be able to quickly import students using Excel.

Supported formats:

* `.xlsx`
* `.xls`
* `.csv`

The import file will contain ONLY TWO COLUMNS:

| Roll Number | Name        |
| ----------- | ----------- |
| 1           | Rahul Patel |
| 2           | Jay Shah    |
| 3           | Priya Patel |

Do not require any other columns.

---

# 9. EXCEL IMPORT WORKFLOW

Teacher selects:

`Import Students`

Then:

### Step 1 — Upload File

Allow drag & drop and file selection.

Show:

`Download Sample Excel Template`

The sample file should contain:

* Roll Number
* Name

### Step 2 — Validate File

Validate:

* Roll Number is required
* Student Name is required
* Roll Number must be valid
* Duplicate Roll Numbers are not allowed within the same class
* Empty rows should be handled
* Invalid rows should be clearly identified

### Step 3 — Preview

Before importing, show:

Total Rows
Valid Students
Invalid Rows

Example:

Total Rows: 50
Valid: 48
Invalid: 2

Show invalid rows and reasons.

Example:

Row 15 — Roll Number Missing

Row 23 — Duplicate Roll Number

### Step 4 — Import

Allow teacher to import valid records.

After successful import show:

`48 Students Imported Successfully`

---

# 10. STUDENT LIST

Inside every class, show students ordered by Roll Number.

Columns:

* Roll Number
* Student Name
* Homework Completion %
* Total Homework
* Completed
* Incomplete
* Not Submitted
* Absent
* Actions

Actions:

* Edit
* Delete
* View History

Features:

* Search Student
* Sort by Roll Number
* Add Student
* Import Excel
* Export Student List

---

# 11. DAILY HOMEWORK ENTRY

This is the **most important feature**.

Create a very fast homework checking system.

Teacher clicks:

`Take Homework`

Then follow this exact flow:

### STEP 1 — SELECT CLASS

Example:

`Standard 8-A`

### STEP 2 — SELECT SUBJECT

Only subjects belonging to the selected class should appear.

Example:

* Mathematics
* Science
* English
* Gujarati

### STEP 3 — SELECT DATE

Date should automatically default to today's date.

Teacher can change the date if required.

### STEP 4 — AUTOMATICALLY LOAD STUDENTS

After selecting Class + Subject + Date, automatically display every student in that class.

Students should automatically appear in Roll Number order.

Example:

| Roll No | Student Name | Status        | Remarks             |
| ------- | ------------ | ------------- | ------------------- |
| 1       | Rahul Patel  | Completed     |                     |
| 2       | Jay Shah     | Incomplete    | Notebook incomplete |
| 3       | Priya Patel  | Not Submitted |                     |
| 4       | Riya Shah    | Absent        |                     |

The teacher should NOT have to manually add students every time.

---

# 12. HOMEWORK STATUS

Each student should have four status options:

### ✓ Completed

### ⚠ Incomplete

### ✕ Not Submitted

### A Absent

Use large, touch-friendly buttons.

The selected status should be visually obvious.

---

# 13. FAST HOMEWORK CHECKING

Make this screen extremely fast.

The teacher should be able to check 40–60 students quickly.

Provide:

* Mark All Completed
* Mark All Incomplete
* Mark All Not Submitted
* Mark All Absent
* Clear All

Teacher can then individually change any student's status.

Optional keyboard navigation can be added on desktop.

After selecting a status, automatically move/focus toward the next student where practical.

---

# 14. REMARKS

Every student should optionally have a Remarks field.

Examples:

* Notebook incomplete
* Homework partially completed
* Forgot notebook
* Work not neat

Remarks are optional.

---

# 15. SAVE HOMEWORK

Before saving, show a summary:

Class: Standard 8-A
Subject: Mathematics
Date: 12 September 2026

Total Students: 45

Completed: 35
Incomplete: 5
Not Submitted: 3
Absent: 2

Button:

`Save Homework`

After saving:

`Homework saved successfully.`

---

# 16. DUPLICATE HOMEWORK PROTECTION

Do NOT allow duplicate homework sessions for:

**Same Class + Same Subject + Same Date**

If a teacher tries to create an entry that already exists, show:

`Homework has already been entered for this class, subject, and date.`

Provide:

`Edit Existing Homework`

instead of creating another record.

---

# 17. EDIT HOMEWORK

Teachers should be able to edit previously saved homework.

Example:

Select:

Class → Subject → Date

Load existing student statuses.

Teacher can update:

* Status
* Remarks

Then click:

`Update Homework`

---

# 18. HOMEWORK HISTORY

Create a Homework History page.

Filters:

* Class
* Subject
* Date
* Date Range
* Student
* Status

Display:

* Date
* Class
* Subject
* Student
* Roll Number
* Status
* Remarks
* Teacher

Provide search and filtering.

---

# 19. STUDENT HOMEWORK HISTORY

When opening a student's profile, show:

Student Name
Roll Number
Class

Statistics:

* Total Homework
* Completed
* Incomplete
* Not Submitted
* Absent
* Completion Percentage

Then show history:

| Date | Subject | Status | Remarks |
| ---- | ------- | ------ | ------- |

This allows teachers to understand an individual student's homework performance.

---

# 20. REPORTS

Create a professional Reports section.

Reports must be downloadable **class-wise**.

Teacher/Admin can select:

### Required

* Class

### Optional

* Subject
* Date
* Date Range
* Student
* Status

---

# 21. CLASS-WISE REPORT

Example:

Class:

`Standard 8-A`

Show:

| Roll No | Student | Total | Completed | Incomplete | Not Submitted | Absent | Completion % |
| ------- | ------- | ----: | --------: | ---------: | ------------: | -----: | -----------: |

Calculate all statistics automatically from real homework records.

Do NOT use static/demo numbers.

---

# 22. DAILY REPORT

Allow teacher to select:

Class
Subject
Date

Then show:

Total Students: 45

Completed: 35
Incomplete: 5
Not Submitted: 3
Absent: 2

Then show student-wise details.

Allow download.

---

# 23. MONTHLY REPORT

Create monthly homework reports.

Filters:

* Class
* Subject
* Month
* Year

Show:

| Student | Total Homework | Completed | Incomplete | Not Submitted | Absent | Completion % |
| ------- | -------------: | --------: | ---------: | ------------: | -----: | -----------: |

This report should help identify students who regularly fail to complete homework.

---

# 24. REPORT DOWNLOAD FORMATS

Reports must be downloadable in:

* Excel `.xlsx`
* CSV `.csv`
* PDF `.pdf`

Buttons:

`Download Excel`

`Download CSV`

`Download PDF`

Use professional report formatting.

---

# 25. REPORT FILE NAMES

Use professional filenames.

Examples:

`Standard-8-A_Mathematics_12-09-2026.xlsx`

`Standard-8-A_September-2026_Report.xlsx`

`Standard-8-A_Mathematics_12-09-2026.pdf`

---

# 26. STUDENT EXPORT

Teachers should also be able to export the student list.

Formats:

* Excel
* CSV

Example:

`Standard-8-A_Students.xlsx`

---

# 27. DATABASE STRUCTURE

Use a proper relational database.

## users

Fields:

* id
* full_name
* email
* mobile
* password/auth_id
* role
* status
* created_at
* updated_at

Roles:

* admin
* teacher

---

## classes

Fields:

* id
* teacher_id
* class_name
* created_at
* updated_at

---

## subjects

Fields:

* id
* class_id
* subject_name
* created_at
* updated_at

---

## students

Fields:

* id
* class_id
* roll_number
* student_name
* created_at
* updated_at

Constraint:

`roll_number + class_id` must be unique.

---

## homework_sessions

Fields:

* id
* class_id
* subject_id
* teacher_id
* homework_date
* created_at
* updated_at

Unique constraint:

`class_id + subject_id + homework_date`

---

## homework_entries

Fields:

* id
* homework_session_id
* student_id
* status
* remarks
* created_at
* updated_at

Allowed statuses:

* completed
* incomplete
* not_submitted
* absent

---

# 28. IMPORTANT DATA RELATIONSHIPS

Each homework entry must belong to:

* One homework session
* One student

Each homework session belongs to:

* One teacher
* One class
* One subject
* One date

Each student belongs to:

* One class

Each subject belongs to:

* One class

---

# 29. DELETE SAFETY

Deleting a student must NOT accidentally destroy historical homework reports.

Use appropriate database relationships.

If a class/student is deleted, preserve historical records wherever appropriate.

Use confirmation dialogs before destructive actions.

Example:

`Are you sure you want to delete this student?`

---

# 30. TEACHER DATA ISOLATION

A teacher should normally only be able to access:

* Their own classes
* Their own students
* Their own subjects
* Their own homework records

Admin can access everything.

Implement proper authorization and database-level security.

Do not rely only on frontend hiding.

---

# 31. MOBILE-FIRST DESIGN

Teachers may use this application primarily from smartphones.

The homework entry screen must be highly optimized for mobile.

Example student card:

**Roll No: 12**

**Rahul Patel**

[ ✓ Completed ]

[ ⚠ Incomplete ]

[ ✕ Not Submitted ]

[ A Absent ]

Remarks

Buttons should be large enough for comfortable touch interaction.

Use a sticky bottom:

`Save Homework`

---

# 32. DESKTOP DESIGN

On desktop:

* Left sidebar
* Top navigation/header
* Dashboard cards
* Tables
* Search
* Filters
* Pagination
* Modals

Tables should remain responsive.

On smaller screens convert important tables into cards where necessary.

---

# 33. UI / UX STYLE

Create a modern professional **School ERP / Education Management** design.

Use:

* React
* TypeScript
* Tailwind CSS
* Shadcn UI
* Lucide Icons

Design characteristics:

* Clean
* Professional
* Modern
* Minimal
* Fast
* Easy to understand
* Good typography
* Proper spacing
* Rounded cards
* Subtle shadows
* Professional dashboard
* Responsive layout

Avoid unnecessary animations.

Prioritize usability over decoration.

---

# 34. LOADING & ERROR STATES

Implement proper:

* Loading indicators
* Skeleton loaders
* Empty states
* Error messages
* Success toast notifications
* Confirmation dialogs

Example empty state:

`No students added to this class yet.`

Button:

`Add Students`

---

# 35. SEARCH

Add search functionality for:

* Teachers
* Classes
* Students
* Homework Records

Student search should support:

* Roll Number
* Student Name

---

# 36. FILTERING

Provide filters for:

* Class
* Subject
* Date
* Date Range
* Student
* Homework Status
* Teacher (Admin only)

Filters should work with real database data.

---

# 37. NAVIGATION

## ADMIN SIDEBAR

Dashboard
Teachers
Classes
Students
Homework Records
Reports
Settings
Logout

## TEACHER SIDEBAR

Dashboard
My Classes
Students
Take Homework
Homework History
Reports
Settings
Logout

---

# 38. CLASS DETAILS PAGE

When teacher opens a class, show:

Class Name

Example:

`Standard 8-A`

Subjects:

Mathematics
Science
English
Gujarati

Total Students:

45

Actions:

* Take Homework
* Add Student
* Import Students
* Manage Subjects
* Student List
* Reports

---

# 39. QUICK ACTIONS

Teacher Dashboard should have prominent buttons:

### + Create Class

### Take Today's Homework

### Import Students

### View Reports

The `Take Today's Homework` action should make the process extremely fast.

---

# 40. TODAY'S HOMEWORK

On Teacher Dashboard show whether today's homework has been completed for each class/subject.

Example:

| Class | Subject     | Status      |
| ----- | ----------- | ----------- |
| 8-A   | Mathematics | ✓ Completed |
| 8-A   | Science     | Pending     |
| 9-A   | English     | ✓ Completed |

Clicking `Pending` should open the homework entry screen directly.

---

# 41. ADMIN OVERVIEW

Admin should be able to see school-wide statistics:

* Total Teachers
* Total Classes
* Total Students
* Total Subjects
* Today's Homework Sessions
* Overall Homework Completion %
* Students with low completion rates

Use charts only where they add real value.

---

# 42. AUTHENTICATION

Implement secure authentication.

Admin:

`mahipaljinjala@gmail.com`

Teacher accounts are created by Admin.

No public registration.

Protect all dashboard routes.

Unauthenticated users must be redirected to Login.

Teacher cannot access Admin routes.

Admin can access all routes.

---

# 43. INITIAL ADMIN SETUP

On initial database setup, ensure the Admin account exists:

Email:

`mahipaljinjala@gmail.com`

Password:

`123456789`

Role:

`admin`

Do not create duplicate Admin accounts if the setup/migration runs more than once.

---

# 44. IMPORTANT — NO STATIC DATA

After implementation:

**Do not use hardcoded/static data for the actual application.**

All of these must come from the database:

* Teachers
* Classes
* Subjects
* Students
* Homework
* Reports
* Dashboard statistics
* Completion percentages
* Counts
* History

Demo data may be used only during development if clearly separated and must not appear as real production data.

---

# 45. PERFORMANCE

Optimize the system for fast daily usage.

Especially optimize:

* Student Excel import
* Student list
* Homework entry
* Saving 40–100 students at once
* Reports
* Dashboard

Homework should be saved efficiently rather than making unnecessary individual network requests for every student.

---

# 46. RESPONSIVE BREAKPOINTS

The application must work properly on:

* Mobile
* Tablet
* Laptop
* Desktop

Test:

* 360px mobile
* 390px mobile
* 768px tablet
* 1024px laptop
* 1440px desktop

No horizontal scrolling should occur unnecessarily.

---

# 47. FINAL USER FLOW

## ADMIN FLOW

Admin Login

↓

Admin Dashboard

↓

Create Teacher

↓

Teacher receives login credentials

↓

Teacher Login

---

## TEACHER FLOW

Teacher Login

↓

Create Class

↓

Enter Class Name

↓

Add Multiple Subjects

↓

Create Class

↓

Open Class

↓

Import Students Excel

↓

Preview Students

↓

Import Students

↓

Students automatically appear in class

↓

Teacher clicks Take Homework

↓

Select Class

↓

Select Subject

↓

Select Date

↓

Students automatically load

↓

Mark Homework Status

↓

Add optional remarks

↓

Save Homework

↓

View Reports

↓

Download Excel / CSV / PDF

---

# 48. MOST IMPORTANT REQUIREMENT

The entire system should be designed around this simple daily workflow:

**Class → Subject → Date → Automatically Load Students → Mark Homework → Save → Report**

A teacher should not need to repeatedly select or enter student information.

Once students are imported into a class, they should automatically appear whenever that class is selected for homework.

---

# 49. FINAL QUALITY REQUIREMENT

Build this as a **real production-ready School Homework Tracking System**, not just a UI prototype.

Ensure:

* Real authentication
* Real database
* Proper authorization
* Secure Admin/Teacher roles
* Real Excel import
* Real homework storage
* Real report generation
* Real Excel export
* Real CSV export
* Real PDF export
* Real dashboard statistics
* Responsive UI
* Mobile-first homework checking
* Proper validation
* Proper error handling
* Duplicate protection
* Clean database relationships

Do not leave major features as placeholders.

Make the application complete, polished, and ready for actual school use.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://thehw.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/066958b1-a8cd-48b2-85bb-5f7db05da000).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
