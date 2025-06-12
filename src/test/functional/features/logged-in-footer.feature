Feature: Footers Present
  Scenario: The footer links should be present on all pages
    When I go to '/'
    Then the page should include 'Sign in'
    Then I see the link 'Terms and conditions'
    Then I see the link 'Accessibility statement'
    Then I sign in with valid credentials as the test user
    When I am on the '/browse' page
    Then I see the link 'Terms and conditions'
    Then I see the link 'Accessibility statement'
    Then I see the link 'Cookies'
