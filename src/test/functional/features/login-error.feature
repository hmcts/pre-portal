Feature: Login failures
  Scenario: Login attempt with wrong credentials
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with the wrong password
    Then the page should include 'Incorrect email or password.'

  Scenario: Login attempt with unknown credentials
    When I go to '/'
    Then the page should include 'Sign in'
    Then I sign in with an unknown user
    Then the page should include 'Incorrect email or password.'
