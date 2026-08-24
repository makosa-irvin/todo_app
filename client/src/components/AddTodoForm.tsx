'use client';

import { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddTodoFormProps {
  onAdd: (title: string) => void;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        aria-label="New task title"
        className="border-0 border-b border-border rounded-none bg-transparent px-1 text-base font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:border-secondary"
      />
      <Button
        type="submit"
        variant="secondary"
        size="icon"
        aria-label="Add task"
        className="shrink-0 rounded-full"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
