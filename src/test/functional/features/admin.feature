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
    Then I am on the '/status' page

  Scenario: The edit request page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I see the link 'Edit Requests'
    Then I click the link 'Edit Requests'
    Then I am on the '/edit-request' page

  Scenario: The audits page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I see the link 'Audits'
    Then I click the link 'Audits'
    Then I am on the '/audits' page


  Scenario: The live events page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I see the link 'MediaKind'
    Then I click the link 'MediaKind'
    Then I am on the '/MK-live-events' page
    Then the page should include 'MediaKind Live Events'

  Scenario: The migration page should display for Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as a super user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I see the link 'Migration'
    Then I click the link 'Migration'
    Then I am on the '/migration' page
    Then the page should include 'Migration resolutions'

  Scenario: The admin pages should not display for non Super Users
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with valid credentials as the test user
    Then I accept the terms and conditions if I need to
    Then I am on the '/browse' page
    Then the page should include 'Welcome back,'
    Then I do not see the link 'Admin'
    Given I go to '/edit-request'
    Then the page should include 'Page is not available'
    Given I go to '/status'
    Then the page should include 'Page is not available'
    Given I go to '/MK-live-events'
    Then the page should include 'Page is not available'




