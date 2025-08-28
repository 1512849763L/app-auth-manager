import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, User } from 'lucide-react';

interface AvatarUploadProps {
  currentUrl?: string;
  userId: string;
  username: string;
  onAvatarUpdate: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({ 
  currentUrl, 
  userId, 
  username, 
  onAvatarUpdate,
  size = 'md' 
}: AvatarUploadProps) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const handleAvatarUpload = async (url: string, file: File) => {
    setUpdating(true);
    try {
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      onAvatarUpdate(url);
      setOpen(false);
      
      toast({
        title: '头像更新成功',
        description: '您的头像已成功更新',
      });
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast({
        title: '更新失败',
        description: error.message || '头像更新失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUpdating(true);
    try {
      // Remove avatar from profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      onAvatarUpdate('');
      
      toast({
        title: '头像已移除',
        description: '您的头像已成功移除',
      });
    } catch (error: any) {
      console.error('Error removing avatar:', error);
      toast({
        title: '移除失败',
        description: error.message || '头像移除失败，请重试',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={currentUrl} alt={username} />
            <AvatarFallback>
              <User className="w-1/2 h-1/2" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新头像</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              <AvatarImage src={currentUrl} alt={username} />
              <AvatarFallback>
                <User className="w-12 h-12" />
              </AvatarFallback>
            </Avatar>
          </div>
          
          <FileUpload
            onUpload={handleAvatarUpload}
            onRemove={currentUrl ? handleRemoveAvatar : undefined}
            currentUrl={currentUrl}
            bucket="avatars"
            folder={userId}
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
            preview={false}
          />
          
          {currentUrl && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleRemoveAvatar}
                disabled={updating}
              >
                移除当前头像
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}