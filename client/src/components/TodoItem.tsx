'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { Todo } from '@/types/todo';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setDraft(todo.title);
    setIsEditing(true);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== todo.title) {
      onEdit(todo.id, trimmed);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      setDraft(todo.title);
      setIsEditing(false);
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-4 border-b border-border py-3 first:pt-0 last:border-b-0"
    >
      <button
        role="checkbox"
        aria-checked={todo.completed}
        aria-label={todo.completed ? 'Mark as not done' : 'Mark as done'}
        onClick={() => onToggle(todo.id)}
        className={cn(
          'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          todo.completed ? 'border-primary bg-primary' : 'border-muted-foreground/50 hover:border-primary',
        )}
      >
        {todo.completed && (
          <motion.span
            initial={{ scale: 1.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
          </motion.span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            aria-label="Edit task title"
            className="w-full border-b border-secondary bg-transparent font-serif text-base text-foreground outline-none"
          />
        ) : (
          <span
            onDoubleClick={startEditing}
            className={cn(
              'block cursor-text select-none truncate font-serif text-base transition-colors',
              todo.completed ? 'text-muted-foreground line-through decoration-2' : 'text-foreground',
            )}
          >
            {todo.title}
          </span>
        )}
      </div>

      <button
        aria-label="Delete task"
        onClick={() => onDelete(todo.id)}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.li>
  );
}
