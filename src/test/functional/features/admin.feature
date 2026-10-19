@CrossBrowser
Feature: View Admin Page

  Scenario: The admin status page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    # Recordings (standard + super user)
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    # User admin nav (CTSC + super user)
    Then I see the link 'User Admin'
    Then I click the link 'User Admin'
    Then I am on the '/user-admin/onboarding' page
    Then the page title should include "under development"
    # System nav (3LS + super user)
    Then I see the link 'System Status'
    Then I click the link 'System Status'
    Then I am on the '/system/status' page
    Then the page title should include "System Status"
    Then I see the link 'MediaKind'
    Then I click the link 'MediaKind'
    Then I am on the '/system/MK-live-events' page
    Then the page title should include 'MediaKind Live Events'
    # Support nav (2LS + super user)
    Then I see the link 'Support'
    Then I click the link 'Support'
    Then I am on the '/support/edit-request' page
    Then the page title should include "Edit Upload"
    # Management nav (Service)
    Then I see the link 'Management'
    Then I click the link 'Management'
    Then I am on the '/management/audit' page
    Then the page title should include "Audit Logs"
    Then I go to '/'
    Then the page should include 'Welcome back,'

  Scenario: The admin pages should not display for non Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as the test user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I do not see the link 'System Status'
    Then I do not see the link 'User Admin'
    Then I do not see the link 'Support'
    Then I do not see the link 'Management'
    Given I go to '/support/edit-request'
    Then the page should include 'Page is not available'
    Given I go to '/system/status'
    Then the page should include 'Page is not available'
    Given I go to '/system/MK-live-events'
    Then the page should include 'Page is not available'
    # These pages should be 'not available' to standard users after implementation
    Given I go to '/user-admin/onboarding'
    Then the page should include 'under development'





