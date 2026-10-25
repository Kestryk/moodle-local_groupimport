@local @local_groupimport @javascript
Feature: Open and navigate the EasyStud management workspace
  In order to organise course participants without leaving Moodle
  As an editing teacher
  I need the native Participants navigation to open a stable EasyStud workspace

  Background:
    Given the following config values are set as admin:
      | config              | value | plugin            |
      | enablesimplifiedview | 1     | local_groupimport |
    And the following "courses" exist:
      | fullname             | shortname | category |
      | EasyStud test course | ES101     | 0        |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | One      | teacher1@example.com |
      | student1 | Student   | One      | student1@example.com |
      | student2 | Student   | Two      | student2@example.com |
      | student3 | Student   | Three    | student3@example.com |
      | student4 | Student   | Four     | student4@example.com |
      | student5 | Student   | Five     | student5@example.com |
      | student6 | Student   | Six      | student6@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | ES101  | editingteacher |
      | student1 | ES101  | student        |
      | student2 | ES101  | student        |
      | student3 | ES101  | student        |
      | student4 | ES101  | student        |
      | student5 | ES101  | student        |
      | student6 | ES101  | student        |
    And the following "groups" exist:
      | name           | course | idnumber |
      | ES Group A     | ES101  | ESGA     |
      | ES Group B     | ES101  | ESGB     |
      | ES Empty Group | ES101  | ESGE     |
    And the following "groupings" exist:
      | name              | course | idnumber |
      | ES Assignment     | ES101  | ESGG1    |
      | ES Empty Grouping | ES101  | ESGG2    |
    And the following "group members" exist:
      | user     | group |
      | student1 | ESGA  |
      | student2 | ESGA  |
      | student3 | ESGA  |
      | student4 | ESGB  |
      | student5 | ESGB  |
    And the following "grouping groups" exist:
      | grouping | group |
      | ESGG1    | ESGA  |
      | ESGG1    | ESGB  |

  Scenario: Participants navigation opens EasyStud and switches all workspaces
    Given I am on the "ES101" "Course" page logged in as "teacher1"
    When I navigate to "Participants" in current page administration
    Then the "#local-groupimport-easystud" "css_element" should be visible
    And I should see "Student One" in the "#local-groupimport-easystud" "css_element"
    And the "[data-easystud-layout-mode='both']" "css_element" should exist
    And the "[data-easystud-layout-mode='participants']" "css_element" should exist
    And the "[data-easystud-layout-mode='structure']" "css_element" should exist
    When I click on "[data-easystud-layout-mode='participants']" "css_element"
    Then the ".local-groupimport-easystud--participant-focus" "css_element" should exist
    When I click on "[data-easystud-layout-mode='structure']" "css_element"
    Then the ".local-groupimport-easystud--structure-focus" "css_element" should exist
    When I click on "[data-easystud-layout-mode='both']" "css_element"
    Then the ".local-groupimport-easystud--participant-focus" "css_element" should not exist
    And the ".local-groupimport-easystud--structure-focus" "css_element" should not exist

  Scenario: Participant density and selection can be changed without mutating course data
    Given I am on the "ES101" "Course" page logged in as "teacher1"
    When I navigate to "Participants" in current page administration
    Then the ".local-groupimport-easystud--compact-users" "css_element" should exist
    When I click on "[data-easystud-density-toggle]" "css_element"
    Then the ".local-groupimport-easystud--compact-users" "css_element" should not exist
    When I click on "[data-easystud-user][data-user-id] > .local-groupimport-easystud-selector" "css_element"
    Then the "[data-easystud-user].is-selected" "css_element" should exist
    And the "[data-easystud-clear-all-selection]" "css_element" should be visible
    When I click on "[data-easystud-clear-all-selection]" "css_element"
    Then the "[data-easystud-user].is-selected" "css_element" should not exist

  Scenario: Teacher opens Mass Import and sees its upload panels
    Given I am on the "ES101" "Course" page logged in as "teacher1"
    When I follow "Mass Import"
    Then the "#local-groupimport-import" "css_element" should be visible
    And the ".local-groupimport-import-card--upload" "css_element" should be visible
    And the ".local-groupimport-import-fields" "css_element" should be visible
