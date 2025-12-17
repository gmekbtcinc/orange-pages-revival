import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  bucket: 'benefit-images' | 'company-logos' | 'brand-logos';
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  maxSize?: number;
  acceptedTypes?: string[];
}

export function ImageUpload({
  bucket,
  value,
  onChange,
  className,
  maxSize = 5,
  acceptedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      if (!acceptedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `Please upload one of: ${acceptedTypes.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > maxSize) {
        toast({
          title: 'File too large',
          description: `Maximum file size is ${maxSize}MB`,
          variant: 'destructive',
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(publicUrl);

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error: Error | unknown) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Error uploading image',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      const urlParts = value.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) throw error;

      onChange(null);

      toast({
        title: 'Success',
        description: 'Image removed successfully',
      });
    } catch (error: Error | unknown) {
      console.error('Error removing image:', error);
      toast({
        title: 'Error removing image',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded image"
            className="w-full h-48 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <label
            htmlFor={`file-upload-${bucket}`}
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <span className="text-sm text-muted-foreground mb-2">
              Click to upload or drag and drop
            </span>
            <span className="text-xs text-muted-foreground">
              PNG, JPG, WEBP up to {maxSize}MB
            </span>
            <input
              id={`file-upload-${bucket}`}
              type="file"
              className="hidden"
              accept={acceptedTypes.join(',')}
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {uploading && (
        <div className="text-sm text-muted-foreground text-center">
          Uploading...
        </div>
      )}
    </div>
  );
}
