import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTodoForm } from '@/components/AddTodoForm';

describe('AddTodoForm', () => {
  it('calls onAdd with the trimmed title when submitted', async () => {
    const onAdd = jest.fn();
    render(<AddTodoForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(/add a task/i);
    await userEvent.type(input, '  Buy milk  ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith('Buy milk');
  });

  it('clears the input after a successful submit', async () => {
    const onAdd = jest.fn();
    render(<AddTodoForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(/add a task/i) as HTMLInputElement;
    await userEvent.type(input, 'Task one');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(input.value).toBe('');
  });

  it('submits when Enter is pressed', async () => {
    const onAdd = jest.fn();
    render(<AddTodoForm onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(/add a task/i);
    await userEvent.type(input, 'Task via enter{Enter}');

    expect(onAdd).toHaveBeenCalledWith('Task via enter');
  });

  it('does not call onAdd for a blank title', async () => {
    const onAdd = jest.fn();
    render(<AddTodoForm onAdd={onAdd} />);

    await userEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });
});
