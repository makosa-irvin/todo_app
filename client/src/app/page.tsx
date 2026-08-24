'use client';

import { useTodos } from '@/hooks/useTodos';
import { AddTodoForm } from '@/components/AddTodoForm';
import { TodoList } from '@/components/TodoList';

const today = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function Page() {
  const {
    filteredTodos,
    isLoading,
    error,
    filter,
    setFilter,
    counts,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    clearCompleted,
  } = useTodos();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-14 sm:py-20">
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-secondary">{today()}</p>
        <h1 className="mt-2 font-serif text-4xl italic tracking-tight text-foreground">Today&apos;s ledger</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {String(counts.total).padStart(2, '0')} entries · {String(counts.active).padStart(2, '0')} open
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card px-6 py-6 shadow-sm">
        <AddTodoForm onAdd={addTodo} />

        <div className="mt-6">
          {isLoading ? (
            <p className="py-10 text-center font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Opening the ledger…
            </p>
          ) : error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <TodoList
              todos={filteredTodos}
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
              onClearCompleted={clearCompleted}
            />
          )}
        </div>
      </section>

      <p className="mt-6 text-center font-mono text-[11px] text-muted-foreground/60">
        Double-click an entry to edit it
      </p>
    </main>
  );
}
