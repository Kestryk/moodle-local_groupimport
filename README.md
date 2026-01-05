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

- Simplify group management for teachers  
- Prevent common CSV import errors  
- Avoid accidental user creation or enrolment  
- Provide clear feedback on successful and failed operations  
- Improve adoption through contextual guided tours  

---

## ✨ Key Features

### CSV Group Import
- Import groups from a CSV file  
- Enrol users into groups  
- Optional creation of groupings  
- Supports `;` and `,` as CSV separators  

### Safety & Validation
- No user creation  
- No course enrolment  
- Each row is validated independently:
  - user not found  
  - user not enrolled in the course  
  - user already in group  
  - group already exists  

### Import Report
- Lists successful group enrolments  
- Lists errors with clear explanations  
- Import continues even if some rows fail  

### Guided Tours (User Tours)
- Guided tour on the Group Import page  
- Guided tour on the course home page (More menu)  
- Automatically installed  
- Multilingual (English / French)  

---

## 📍 How to Access the Tool

- **Course → More → Group import**  
- Direct URL: `/local/groupimport/index.php?id=COURSEID`

---

## 📄 CSV File Format

### Required Columns

| Column | Required | Description |
|------|----------|-------------|
| useridentifier | Yes | Username, email, idnumber, or custom profile field |
| groupname | Yes | Group name |
| groupingname | No | Grouping name |

### Example

useridentifier;groupname;groupingname  
jdupont;Group A;Tutorial groups  
asmith;Group B;Tutorial groups  

---

## 👩‍🏫 User Workflow

1. Open the course  
2. More → Group import  
3. Download CSV template  
4. Upload CSV  
5. Select user identifier  
6. Start import  
7. Review report  

---

## 🌍 Languages

- English  
- French  

---

## 🔐 Permissions

Accessible to:
- Teachers  
- Editing teachers  
- Course managers  

---

## 🛠 Technical Information

- Plugin type: Local (`local/groupimport`)  
- Minimum Moodle version: 4.1  
- Compatible with Moodle 4.x  

---

## 🔄 Upgrade Behaviour

- Guided tours imported if missing  
- No duplication of existing tours  

---

## 🧪 Maturity

`MATURITY_BETA`

---

## 📄 License

GNU General Public License v3 (GPLv3)
