@CrossBrowser
Feature: View Admin Page

  Scenario: The admin status page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I see the link 'System Status'
    Then I click the link 'System Status'
    Then I am on the '/admin/status' page
    Then the page title should include "System Status"
    Then I see the link 'Edit Requests'
    Then I click the link 'Edit Requests'
    Then I am on the '/admin/edit-request' page
    Then the page title should include "Edit Upload"
    Then I see the link 'MediaKind'
    Then I click the link 'MediaKind'
    Then I am on the '/admin/MK-live-events' page
    Then the page title should include 'MediaKind Live Events'
    Then I see the link 'Audits'
    Then I click the link 'Audits'
    Then I am on the '/admin/audits' page
    # Because nav is not on the 'Not Available' page
    Then I go to '/'

  Scenario: The admin pages should not display for non Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as the test user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I do not see the link 'System Status'
    Given I go to '/admin/edit-request'
    Then the page should include 'Page is not available'
    Given I go to '/admin/status'
    Then the page should include 'Page is not available'
    Given I go to '/admin/MK-live-events'
    Then the page should include 'Page is not available'




