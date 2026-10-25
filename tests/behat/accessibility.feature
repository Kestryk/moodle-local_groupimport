@local @local_groupimport @javascript @accessibility
Feature: EasyStud management accessibility
  In order to manage course structures with assistive technology
  As an editing teacher
  I need the EasyStud-owned interface to meet Moodle accessibility standards

  Background:
    Given the following config values are set as admin:
      | config               | value | plugin            |
      | enablesimplifiedview | 1     | local_groupimport |
    And the following "courses" exist:
      | fullname                     | shortname | category |
      | EasyStud accessibility course | ESA11     | 0        |
    And the following "users" exist:
      | username | firstname | lastname | email                |
      | teacher1 | Teacher   | One      | teacher1@example.com |
      | student1 | Student   | One      | student1@example.com |
    And the following "course enrolments" exist:
      | user     | course | role           |
      | teacher1 | ESA11  | editingteacher |
      | student1 | ESA11  | student        |
    And the following "groups" exist:
      | name       | course | idnumber |
      | ES Group A | ESA11  | ESA11GA  |
    And the following "groupings" exist:
      | name          | course | idnumber |
      | ES Assignment | ESA11  | ESA11GG  |
    And the following "grouping groups" exist:
      | grouping | group   |
      | ESA11GG  | ESA11GA |

  Scenario: The EasyStud-owned management region passes the Moodle axe check
    Given I am on the "ESA11" "Course" page logged in as "teacher1"
    When I navigate to "Participants" in current page administration
    Then "#local-groupimport-easystud" "css_element" should be visible
    And the "#local-groupimport-easystud" "css_element" should meet accessibility standards with "best-practice" extra tests
