@CrossBrowser
Feature: View Browse and play Page
    Background: portal login
      Given I go to '/'
      Then the page should include 'Sign in'
      Then I sign in with valid credentials as the test user
      Then I accept the terms and conditions if I need to

    Scenario: The browse page should show a list of all the videos after signing in
      When I am on the '/browse' page
      Then the page should include 'Welcome back,'
      Then the page should include 'Recordings'

    Scenario: Play recording from watch page
      When I click on play on a browse page
      When  I play the recording
      Then recording is played
