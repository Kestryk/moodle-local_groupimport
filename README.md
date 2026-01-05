# 📦 Local Group Import (Moodle Plugin)

## Overview

**Local Group Import** is a Moodle *local plugin* that allows teachers to **import groups and enrol students into them using a CSV file**, directly from within a course.

The plugin is designed to be **safe, robust, and teacher-friendly**, ensuring that:
- only **existing users** are processed,
- only users **already enrolled in the course** can be added to groups,
- the import **never stops on errors**,
- a **detailed report** is provided after each import,
- **guided tours (User Tours)** help teachers discover and use the tool effectively.

---

## 🎯 Goals

- Simplify group management for teachers.
- Prevent common CSV import errors.
- Avoid accidental user creation or enrolment.
- Provide clear feedback on successful and failed operations.
- Improve adoption through contextual guided tours.

---

## ✨ Key Features

### CSV Group Import
- Import groups from a CSV file.
- Enrol users into groups.
- Optional creation of groupings.
- Supports `;` and `,` as CSV separators.

### Safety & Validation
- No user creation.
- No enrolment into the course.
- Each row is validated independently:
  - user not found,
  - user not enrolled in the course,
  - user already in group,
  - group already exists.

### Import Report
- Lists successful group enrolments.
- Lists errors with clear explanations.
- Import continues even if some rows fail.

### Guided Tours (User Tours)
- A guided tour on the **group import page**.
- A guided tour on the **course home page** explaining where to find the tool in the **“More” menu**.
- Tours are automatically installed with the plugin.
- Fully **multilingual (English / French)** using Moodle language strings.

---

## 📍 How to Access the Tool

From within a course:

- **Secondary navigation → More → Group import**
- Direct URL:

```text
/local/groupimport/index.php?id=COURSEID
