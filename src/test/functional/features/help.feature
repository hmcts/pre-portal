Feature: View Help Page
    Scenario: The help page should be accessible and include the required content
      When I go to '/help'
      Then the page should include 'Help'
      And the page should include 'Please follow instructions in the user guide provided in the Portal invitation email.'
      And the page should include 'If you require further assistance, please contact support on 0300 323 0194 between the hours of 08:00 and 18:00 weekdays, or 08:30 and 14:00 Saturday.'
