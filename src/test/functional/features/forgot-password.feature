Feature: Forgot Password
  Scenario: Display verification code message on forgotten password flow
    When I go to '/'
    Then I click the link 'Forgot your password?'
    Then I enter a valid email address
    Then the page should include 'Verification code has been sent to your inbox. Please copy it to the input box below.'

  Scenario: Display verification code message on forgotten password flow for unknown email addresses [S28-3045]
    When I go to '/'
    Then I click the link 'Forgot your password?'
    Then I enter a bogus email address
    Then the page should include 'Verification code has been sent to your inbox. Please copy it to the input box below.'
