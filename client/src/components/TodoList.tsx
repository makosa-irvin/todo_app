'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { Todo, TodoFilter } from '@/types/todo';
import { TodoItem } from '@/components/TodoItem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TodoListProps {
  todos: Todo[];
  filter: TodoFilter;
  onFilterChange: (filter: TodoFilter) => void;
  counts: { active: number; completed: number; total: number };
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  onClearCompleted: () => void;
}

const FILTERS: { key: TodoFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export function TodoList({
  todos,
  filter,
  onFilterChange,
  counts,
  onToggle,
  onDelete,
  onEdit,
  onClearCompleted,
}: TodoListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              'rounded-full px-3 py-1 transition-colors',
              filter === key ? 'bg-secondary/15 text-secondary' : 'hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {todos.length === 0 ? (
        <div className="rounded-md border border-dashed border-border py-10 text-center">
          <p className="font-serif text-lg text-muted-foreground">Nothing on the list.</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-wide text-muted-foreground/70">
            Add a task above to get started
          </p>
        </div>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <motion.div
        layout
        className="mt-6 flex items-center justify-between border-t border-border pt-3 font-mono text-xs text-muted-foreground"
      >
        <span>
          {counts.active} left · {counts.completed} done
        </span>
        {counts.completed > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearCompleted} className="h-auto p-0 font-mono text-xs">
            Clear completed
          </Button>
        )}
      </motion.div>
    </div>
  );
}
