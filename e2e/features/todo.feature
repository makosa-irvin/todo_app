Feature: Todo management
  As a user
  I want to manage a small list of tasks
  So that I can track what I still need to do

  Background:
    Given the todo list is empty
    And I have opened the todo application

  @E2E-001
  Scenario: View the empty state
    Given there are no todos
    When the todo page finishes loading
    Then I should see the empty-state message

  @E2E-002
  Scenario: Add a new todo
    Given there are no todos
    When I add a todo named "Buy groceries"
    Then "Buy groceries" should appear in the list
    And the active count should be 1

  @E2E-003
  Scenario: Complete a todo
    Given a todo named "Walk the dog" exists
    When I mark "Walk the dog" as done
    Then "Walk the dog" should be shown as completed
    And the completed count should be 1

  @E2E-004
  Scenario: Edit a todo title
    Given a todo named "Old title" exists
    When I edit its title to "New title"
    Then "New title" should appear in the list
    And "Old title" should no longer appear

  @E2E-005
  Scenario: Delete a todo
    Given a todo named "Temporary task" exists
    When I delete "Temporary task"
    Then "Temporary task" should no longer appear
    And I should see the empty-state message

  @E2E-006
  Scenario: Filter active and completed todos
    Given an active todo named "Active task" exists
    And a completed todo named "Done task" exists
    When I select the Active filter
    Then only "Active task" should be visible
    When I select the Completed filter
    Then only "Done task" should be visible
    When I select the All filter
    Then both todos should be visible

  @E2E-007
  Scenario: Clear completed todos only
    Given an active todo named "Keep me" exists
    And a completed todo named "Clear me" exists
    When I clear completed todos
    Then "Clear me" should no longer appear
    And "Keep me" should still appear

  @E2E-008
  Scenario: Complete a full todo lifecycle
    Given there are no todos
    When I add a todo named "Draft the proposal"
    And I edit it to "Send the proposal"
    And I mark it as done
    And I filter the list by Active
    Then "Send the proposal" should not be visible
    When I return to the All filter and delete the todo
    Then I should see the empty-state message

  @E2E-009
  Scenario: Preserve todos across a page reload
    Given a todo named "Persisted task" exists
    When I reload the page
    Then "Persisted task" should still appear

  @E2E-010
  Scenario: Show an error when the API cannot be reached
    Given the application has loaded successfully
    And the todo API becomes unreachable
    When I reload the todo page
    Then I should see an inline error message
