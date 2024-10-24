Feature: View Browse Page
@CrossBrowser
    Scenario: The browse page should show a list of all the videos after signing in
      When I go to '/'
      Then the page should include 'Sign in'
      Then I sign in with valid credentials as the test user
      Then I am on the '/browse' page
      Then the page should include 'Welcome back,'
      Then the page should include 'Recordings'

