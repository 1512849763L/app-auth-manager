import React, { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onUpload: (url: string, file: File) => void;
  onRemove?: () => void;
  currentUrl?: string;
  bucket: string;
  folder?: string;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  preview?: boolean;
}

export function FileUpload({
  onUpload,
  onRemove,
  currentUrl,
  bucket,
  folder = '',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  preview = true
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return '仅支持 JPG、PNG、WebP、GIF 格式的图片';
    }

    // Check file name for security
    const fileName = file.name.toLowerCase();
    const dangerousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.js', '.html', '.php'];
    if (dangerousPatterns.some(pattern => fileName.includes(pattern))) {
      return '文件类型不安全';
    }

    return null;
  };

  const generateSafeFileName = (originalName: string): string => {
    // Remove potentially dangerous characters and normalize
    const name = originalName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    const ext = name.split('.').pop();
    const nameWithoutExt = name.replace(`.${ext}`, '');
    
    return `${nameWithoutExt}_${timestamp}_${random}.${ext}`;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: '文件验证失败',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Generate safe file name
      const safeFileName = generateSafeFileName(file.name);
      const filePath = folder ? `${folder}/${safeFileName}` : safeFileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onUpload(publicUrl, file);
      
      toast({
        title: '上传成功',
        description: '文件已成功上传',
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: '上传失败',
        description: error.message || '文件上传失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current image preview */}
      {currentUrl && preview && (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed border-muted-foreground/25 rounded-lg p-6',
          'hover:border-primary/50 transition-colors cursor-pointer',
          'flex flex-col items-center justify-center space-y-2',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">上传中...</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">点击上传文件</p>
              <p className="text-xs text-muted-foreground">
                支持 JPG、PNG、WebP 格式，最大 {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
}