'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface QuickCreateFormProps {
  label: string;
  placeholder?: string;
  onSubmit: (name: string) => void | Promise<void>;
}

export function QuickCreateForm({ label, placeholder, onSubmit }: QuickCreateFormProps) {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsLoading(true);
    try {
      await onSubmit(trimmed);
      setValue('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
    >
      <Plus className="h-4 w-4 text-slate-400" />
      <Input
        placeholder={placeholder || label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 flex-1 border-0 bg-transparent px-0 text-sm focus-visible:ring-0"
      />
      <Button type="submit" size="sm" isLoading={isLoading}>
        Añadir
      </Button>
    </form>
  );
}
