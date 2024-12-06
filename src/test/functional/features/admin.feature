Feature: View Admin Page
@CrossBrowser
    Scenario: The admin page should display for Super Users
      When I go to '/'
      Then the page should include 'Sign in'
      Then I sign in with valid credentials as a super user
      Then the page should include 'Verification'
     


    Scenario: The admin page should not display for non Super Users
      When I go to '/'
      Then the page should include 'Sign in'
      Then I sign in with valid credentials as the test user
      Then I accept the terms and conditions if I need to
      Then I am on the '/browse' page
      Then the page should include 'Welcome back,'
      Then I do not see the link 'Admin'
      Given I go to '/admin'
      Then the page should include 'Page Not Found'



