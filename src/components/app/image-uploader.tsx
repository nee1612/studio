'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, XCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageUpload: (dataUri: string) => void;
  onRemoveImage: () => void; // Callback to notify parent about removal
  isLoading: boolean;
  preview: string | null; // Controlled preview state from parent
}

export function ImageUploader({ onImageUpload, onRemoveImage, isLoading, preview }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null); // Keep track of filename for alt text

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null); // Clear previous errors

    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0].message || 'Invalid file type or size. Please upload an image up to 5MB.');
      onRemoveImage(); // Clear preview in parent if rejection happens
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name); // Store filename
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        onImageUpload(dataUri); // Pass data URI to parent
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        onRemoveImage(); // Clear preview in parent on read error
      }
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, onRemoveImage]);

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    disabled: isLoading, // Disable dropzone while loading
  });

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropzone click
    setError(null);
    setFileName(null);
    onRemoveImage(); // Call parent's remove handler
  };

  return (
    <Card className="w-full shadow-lg transition-all duration-300 hover:shadow-xl border-border/60 overflow-hidden bg-card rounded-xl">
      <CardHeader className="pb-4 border-b border-border/30">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-card-foreground">
          <ImageIcon className="text-primary" />
          Upload Timetable
        </CardTitle>
        <CardDescription className="text-muted-foreground">Drag & drop your image or click to select. Max 5MB.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div
          {...getRootProps()}
          className={cn(
            `relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background`,
            isLoading ? 'cursor-not-allowed opacity-70 bg-muted/30' : 'hover:border-accent hover:bg-accent/10',
            isDragActive ? 'border-primary bg-primary/10 scale-105 shadow-inner' : 'border-border/50',
            isFocused && !isDragActive && 'border-ring', // Indicate focus
            error ? 'border-destructive bg-destructive/10' : '',
            preview && !isLoading ? 'border-solid border-transparent p-0' : 'min-h-[180px] p-6' // Adjust padding only when preview is shown and not loading
          )}
          aria-disabled={isLoading}
        >
           {/* Ensure input is always rendered */}
           <input {...getInputProps()} id="file-upload" className="sr-only" />


          {preview && (
             <div className="relative w-full h-auto max-h-96 overflow-hidden rounded-lg group">
               {/* Container for aspect ratio preservation */}
               <div className="aspect-video w-full relative">
                 <Image
                   src={preview}
                   alt={fileName || "Timetable preview"}
                   fill={true} // Use fill instead of layout
                   style={{objectFit: "contain"}} // Use style for objectFit
                   className="rounded-lg transition-transform duration-300 group-hover:scale-105"
                 />
               </div>
               {/* Overlay shown only during loading */}
               {isLoading && (
                  <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm z-10">
                      <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
                      <p className="text-muted-foreground font-medium text-center px-4">Analyzing Timetable...</p>
                  </div>
               )}
               {/* Remove button (shown when not loading) */}
               {!isLoading && (
                 <Button
                   variant="destructive"
                   size="icon"
                   className="absolute top-2 right-2 rounded-full h-8 w-8 z-20 shadow-md hover:scale-110 transition-transform opacity-80 hover:opacity-100 group-hover:opacity-100"
                   onClick={handleRemoveClick}
                   aria-label="Remove image"
                 >
                   <XCircle className="h-5 w-5" />
                 </Button>
               )}
             </div>
           )}

           {!preview && !isLoading && (
             <div className="text-center py-6 pointer-events-none flex flex-col items-center justify-center space-y-3">
                <UploadCloud
                    className={cn("mx-auto h-12 w-12 mb-4 transition-colors duration-300",
                    isDragActive ? "text-primary scale-110 animate-pulse" : "text-muted-foreground/70 group-hover:text-accent"
                    )}
                />
               {isDragActive ? (
                 <p className="text-primary font-semibold text-lg">Drop the image here!</p>
               ) : (
                  <>
                    <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP, GIF (Max 5MB)</p>
                  </>
               )}
             </div>
           )}
        </div>
         {error && !isLoading && (
           <p className="mt-3 text-sm text-destructive text-center font-medium animate-shake">{error}</p>
         )}
      </CardContent>
    </Card>
  );
}

// Removed the JavaScript block that was injecting styles and causing SSR errors.
// The shake animation is defined in globals.css.
