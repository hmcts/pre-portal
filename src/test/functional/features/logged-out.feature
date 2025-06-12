Feature: Logged out Pages
  Scenario: The Terms & Conditions should not require a login
    When I go to '/terms-and-conditions'
    Then the page title should include 'Terms and Conditions'

  Scenario: The Accessibility Statement should not require a login
    When I go to '/accessibility-statement'
    Then the page should include 'Accessibility statement'

  Scenario: The Cookies page should not require a login
    When I go to '/cookies'
    Then the page should include 'Cookies'

