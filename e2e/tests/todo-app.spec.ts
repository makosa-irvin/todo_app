import { test, expect } from '@playwright/test';
import { clearAllTodos } from './helpers';

test.beforeEach(async ({ request, page }) => {
  await clearAllTodos(request);
  await page.goto('/');
});

test('shows the empty state when there are no todos', async ({ page }) => {
  await expect(page.getByText(/nothing on the list/i)).toBeVisible();
});

test('adds a new todo and displays it in the list', async ({ page }) => {
  await page.getByPlaceholder(/add a task/i).fill('Buy groceries');
  await page.getByRole('button', { name: 'Add task' }).click();

  await expect(page.getByText('Buy groceries')).toBeVisible();
  await expect(page.getByText(/1 left/i)).toBeVisible();
});

test('toggles a todo as complete', async ({ page }) => {
  await page.getByPlaceholder(/add a task/i).fill('Walk the dog');
  await page.getByRole('button', { name: 'Add task' }).click();

  await page.getByRole('checkbox', { name: 'Mark as done' }).click();

  await expect(page.getByText('Walk the dog')).toHaveClass(/line-through/);
  await expect(page.getByText(/1 done/i)).toBeVisible();
});

test('edits a todo title via double-click', async ({ page }) => {
  await page.getByPlaceholder(/add a task/i).fill('Old title');
  await page.getByRole('button', { name: 'Add task' }).click();

  await page.getByText('Old title').dblclick();
  const editInput = page.getByLabel('Edit task title');
  await editInput.fill('New title');
  await editInput.press('Enter');

  await expect(page.getByText('New title')).toBeVisible();
  await expect(page.getByText('Old title')).not.toBeVisible();
});

test('deletes a todo', async ({ page }) => {
  await page.getByPlaceholder(/add a task/i).fill('Temporary task');
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(page.getByText('Temporary task')).toBeVisible();

  await page.getByRole('button', { name: 'Delete task' }).click();

  await expect(page.getByText('Temporary task')).not.toBeVisible();
  await expect(page.getByText(/nothing on the list/i)).toBeVisible();
});

test('filters todos by active and completed', async ({ page }) => {
  const input = page.getByPlaceholder(/add a task/i);
  const addButton = page.getByRole('button', { name: 'Add task' });

  await input.fill('Active task');
  await addButton.click();
  await input.fill('Done task');
  await addButton.click();

  // The second row's checkbox belongs to "Done task".
  await page.getByRole('checkbox', { name: 'Mark as done' }).nth(1).click();

  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(page.getByText('Active task')).toBeVisible();
  await expect(page.getByText('Done task')).not.toBeVisible();

  await page.getByRole('button', { name: 'Completed', exact: true }).click();
  await expect(page.getByText('Done task')).toBeVisible();
  await expect(page.getByText('Active task')).not.toBeVisible();

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByText('Active task')).toBeVisible();
  await expect(page.getByText('Done task')).toBeVisible();
});

test('clears all completed todos, leaving active ones untouched', async ({ page }) => {
  const input = page.getByPlaceholder(/add a task/i);
  const addButton = page.getByRole('button', { name: 'Add task' });

  await input.fill('Keep me');
  await addButton.click();
  await input.fill('Clear me');
  await addButton.click();

  await page.getByRole('checkbox', { name: 'Mark as done' }).nth(1).click();
  await page.getByRole('button', { name: /clear completed/i }).click();

  await expect(page.getByText('Clear me')).not.toBeVisible();
  await expect(page.getByText('Keep me')).toBeVisible();
});

test('a full task lifecycle: add, edit, complete, filter, then delete', async ({ page }) => {
  const input = page.getByPlaceholder(/add a task/i);
  const addButton = page.getByRole('button', { name: 'Add task' });

  await input.fill('Draft the proposal');
  await addButton.click();
  await expect(page.getByText(/1 left · 0 done/i)).toBeVisible();

  await page.getByText('Draft the proposal').dblclick();
  const editInput = page.getByLabel('Edit task title');
  await editInput.fill('Send the proposal');
  await editInput.press('Enter');
  await expect(page.getByText('Send the proposal')).toBeVisible();

  await page.getByRole('checkbox', { name: 'Mark as done' }).click();
  await expect(page.getByText(/0 left · 1 done/i)).toBeVisible();

  await page.getByRole('button', { name: 'Active', exact: true }).click();
  await expect(page.getByText('Send the proposal')).not.toBeVisible();

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: 'Delete task' }).click();
  await expect(page.getByText(/nothing on the list/i)).toBeVisible();
});
