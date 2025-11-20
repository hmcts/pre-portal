Feature: Forgot Password
  Scenario: Display verification code message on forgotten password flow
    When I go to '/'
    Then I click the link 'Forgot your password?'
    Then I enter a valid email address
    Then the page should include 'Please provide the following details.'
    Then the page should include 'Verification Code'
