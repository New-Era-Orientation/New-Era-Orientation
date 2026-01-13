'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/client/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  accept = 'image/*',
  maxSize = 5, // 5MB default
  className,
  disabled = false,
  placeholder = 'Kéo thả hoặc click để tải ảnh lên',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'Vui lòng chọn file ảnh';
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File quá lớn. Tối đa ${maxSize}MB`;
    }

    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload if handler provided
    if (onUpload) {
      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
        setPreviewUrl(url);
      } catch (err) {
        setError('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
        setPreviewUrl(null);
        onChange(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Use data URL if no upload handler
      onChange(previewUrl);
    }
  }, [onUpload, onChange, maxSize, previewUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn('image-upload', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
          {!disabled && !isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Đang tải lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {isDragging ? (
                <Upload className="h-10 w-10 text-primary" />
              ) : (
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">{placeholder}</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF tối đa {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}

// Multi-image upload component
interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  onUpload?: (file: File) => Promise<string>;
  maxImages?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

export function MultiImageUpload({
  values = [],
  onChange,
  onUpload,
  maxImages = 10,
  maxSize = 5,
  className,
  disabled = false,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (values.length + files.length > maxImages) {
      setError(`Tối đa ${maxImages} ảnh`);
      return;
    }

    setError(null);
    setIsUploading(true);

    const newUrls: string[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > maxSize * 1024 * 1024) continue;

      if (onUpload) {
        try {
          const url = await onUpload(file);
          newUrls.push(url);
        } catch {
          // Continue with other files
        }
      } else {
        // Use data URL
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        newUrls.push(dataUrl);
      }
    }

    onChange([...values, ...newUrls]);
    setIsUploading(false);
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className={cn('multi-image-upload', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {values.map((url, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {values.length < maxImages && (
          <div
            onClick={() => !disabled && inputRef.current?.click()}
            className={cn(
              'aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors',
              'border-muted-foreground/25 hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Thêm ảnh</span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}

      <p className="text-xs text-muted-foreground mt-2">
        {values.length}/{maxImages} ảnh
      </p>
    </div>
  );
}

export default ImageUpload;
