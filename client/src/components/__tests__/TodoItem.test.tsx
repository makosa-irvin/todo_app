import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '@/components/TodoItem';
import type { Todo } from '@/types/todo';

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: '1',
    title: 'Buy milk',
    completed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TodoItem', () => {
  it('renders the todo title', () => {
    render(<TodoItem todo={makeTodo()} onToggle={jest.fn()} onDelete={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('shows the checkbox as unchecked when not completed', () => {
    render(<TodoItem todo={makeTodo({ completed: false })} onToggle={jest.fn()} onDelete={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('shows the checkbox as checked when completed', () => {
    render(<TodoItem todo={makeTodo({ completed: true })} onToggle={jest.fn()} onDelete={jest.fn()} onEdit={jest.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onToggle with the todo id when the checkbox is clicked', async () => {
    const onToggle = jest.fn();
    render(<TodoItem todo={makeTodo({ id: 'abc' })} onToggle={onToggle} onDelete={jest.fn()} onEdit={jest.fn()} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('abc');
  });

  it('calls onDelete with the todo id when the delete button is clicked', async () => {
    const onDelete = jest.fn();
    render(<TodoItem todo={makeTodo({ id: 'xyz' })} onToggle={jest.fn()} onDelete={onDelete} onEdit={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('xyz');
  });

  it('enters edit mode on double-click and calls onEdit when saved', async () => {
    const onEdit = jest.fn();
    render(<TodoItem todo={makeTodo({ id: '1', title: 'Old title' })} onToggle={jest.fn()} onDelete={jest.fn()} onEdit={onEdit} />);

    await userEvent.dblClick(screen.getByText('Old title'));
    const editInput = screen.getByDisplayValue('Old title');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'New title{Enter}');

    expect(onEdit).toHaveBeenCalledWith('1', 'New title');
  });

  it('cancels edit mode on Escape without calling onEdit', async () => {
    const onEdit = jest.fn();
    render(<TodoItem todo={makeTodo({ id: '1', title: 'Old title' })} onToggle={jest.fn()} onDelete={jest.fn()} onEdit={onEdit} />);

    await userEvent.dblClick(screen.getByText('Old title'));
    const editInput = screen.getByDisplayValue('Old title');
    await userEvent.type(editInput, ' more{Escape}');

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Old title')).toBeInTheDocument();
  });
});
