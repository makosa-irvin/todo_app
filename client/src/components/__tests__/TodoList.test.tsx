import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from '@/components/TodoList';
import type { Todo } from '@/types/todo';

function makeTodo(overrides: Partial<Todo>): Todo {
  return {
    id: overrides.id ?? '1',
    title: overrides.title ?? 'Task',
    completed: overrides.completed ?? false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const noop = () => {};

describe('TodoList', () => {
  it('shows an empty state when there are no todos', () => {
    render(
      <TodoList
        todos={[]}
        filter="all"
        onFilterChange={noop}
        counts={{ active: 0, completed: 0, total: 0 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={noop}
      />,
    );
    expect(screen.getByText(/nothing on the list/i)).toBeInTheDocument();
  });

  it('renders one row per todo', () => {
    const todos = [makeTodo({ id: '1', title: 'A' }), makeTodo({ id: '2', title: 'B' })];
    render(
      <TodoList
        todos={todos}
        filter="all"
        onFilterChange={noop}
        counts={{ active: 2, completed: 0, total: 2 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={noop}
      />,
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('shows the active count in the footer', () => {
    render(
      <TodoList
        todos={[makeTodo({ id: '1' })]}
        filter="all"
        onFilterChange={noop}
        counts={{ active: 3, completed: 1, total: 4 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={noop}
      />,
    );
    expect(screen.getByText(/3 left/i)).toBeInTheDocument();
  });

  it('calls onFilterChange when a filter tab is clicked', async () => {
    const onFilterChange = jest.fn();
    render(
      <TodoList
        todos={[]}
        filter="all"
        onFilterChange={onFilterChange}
        counts={{ active: 0, completed: 0, total: 0 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={noop}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Active' }));
    expect(onFilterChange).toHaveBeenCalledWith('active');
  });

  it('calls onClearCompleted when the clear-completed button is clicked, and hides it when nothing is completed', async () => {
    const onClearCompleted = jest.fn();
    const { rerender } = render(
      <TodoList
        todos={[]}
        filter="all"
        onFilterChange={noop}
        counts={{ active: 0, completed: 2, total: 2 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={onClearCompleted}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /clear completed/i }));
    expect(onClearCompleted).toHaveBeenCalled();

    rerender(
      <TodoList
        todos={[]}
        filter="all"
        onFilterChange={noop}
        counts={{ active: 0, completed: 0, total: 0 }}
        onToggle={noop}
        onDelete={noop}
        onEdit={noop}
        onClearCompleted={onClearCompleted}
      />,
    );
    expect(screen.queryByRole('button', { name: /clear completed/i })).not.toBeInTheDocument();
  });
});
