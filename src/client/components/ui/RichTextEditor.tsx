'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { Bold, Italic, List, ListOrdered, Link, Image, Code, Eye, Edit3, Heading1, Heading2, Quote } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/client/lib/utils';

// Dynamic import to avoid SSR issues with the markdown editor
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = 300,
  maxHeight = 600,
  className,
  disabled = false,
  onImageUpload,
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('split');

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText('**', '**');
  const handleItalic = () => insertText('*', '*');
  const handleH1 = () => insertText('# ');
  const handleH2 = () => insertText('## ');
  const handleList = () => insertText('- ');
  const handleOrderedList = () => insertText('1. ');
  const handleLink = () => insertText('[', '](url)');
  const handleCode = () => insertText('`', '`');
  const handleQuote = () => insertText('> ');

  const handleImageInsert = async () => {
    if (onImageUpload) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const url = await onImageUpload(file);
            insertText(`![${file.name}](${url})`);
          } catch (error) {
            console.error('Failed to upload image:', error);
          }
        }
      };
      input.click();
    } else {
      insertText('![alt text](', ')');
    }
  };

  return (
    <div className={cn('rich-text-editor', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border border-b-0 rounded-t-lg bg-muted/50 dark:bg-gray-800 flex-wrap">
        <div className="flex items-center gap-1 border-r pr-2 mr-2 dark:border-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleItalic}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2 dark:border-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH1}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH2}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2 dark:border-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleList}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOrderedList}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleQuote}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-r pr-2 mr-2 dark:border-gray-600">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLink}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Insert Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageInsert}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Insert Image"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCode}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            type="button"
            variant={mode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('edit')}
            className="h-8 px-2"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant={mode === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('split')}
            className="h-8 px-2"
          >
            Split
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode('preview')}
            className="h-8 px-2"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div data-color-mode="auto" className="border rounded-b-lg overflow-hidden">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview={mode === 'preview' ? 'preview' : mode === 'edit' ? 'edit' : 'live'}
          hideToolbar={true}
          height={minHeight}
          style={{ maxHeight }}
          textareaProps={{
            placeholder,
            disabled,
          }}
        />
      </div>

      {/* Character count */}
      <div className="text-xs text-muted-foreground mt-1 text-right">
        {value.length} ký tự
      </div>
    </div>
  );
}

export default RichTextEditor;
