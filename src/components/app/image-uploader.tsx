'use client';

import React, { useCallback, useState } from 'react'; // Ensure useState is imported
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, XCircle, Loader2, ImageIcon, FileWarning } from 'lucide-react'; // Added FileWarning
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
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null);

    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0].message || 'Invalid file type or size. Please upload an image up to 5MB.');
      onRemoveImage();
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        onImageUpload(dataUri);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
        onRemoveImage();
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
      // 'image/gif': ['.gif'], // Consider removing gif if AI struggles
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
    disabled: isLoading,
  });

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    setFileName(null);
    onRemoveImage();
  };

  return (
    <Card className="w-full shadow-lg transition-all duration-300 hover:shadow-xl border-border/60 overflow-hidden bg-card rounded-xl relative isolate"> {/* Added relative isolate */}
       {/* Subtle background pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-5"></div>

      <CardHeader className="pb-4 border-b border-border/30 backdrop-blur-sm bg-card/80"> {/* Slight blur effect */}
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-card-foreground">
          <ImageIcon className="text-primary" />
          Upload Timetable Image
        </CardTitle>
        <CardDescription className="text-muted-foreground">Drag & drop your image or click to select. Max 5MB.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div
          {...getRootProps()}
          className={cn(
            `relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background`,
            isLoading ? 'cursor-not-allowed opacity-50 bg-muted/50' : 'hover:border-accent hover:bg-accent/5', // Subtle hover bg
            isDragActive ? 'border-primary bg-primary/10 scale-105 shadow-inner ring-2 ring-primary ring-offset-1' : 'border-border/50', // Enhanced drag active state
            isFocused && !isDragActive && 'border-primary', // Use primary color for focus border
            error ? 'border-destructive bg-destructive/10 hover:border-destructive/70' : '', // Enhanced error state
            preview && !isLoading ? 'border-solid border-primary/30 p-0' : 'min-h-[200px] p-6' // Slightly taller, adjusted padding
          )}
          aria-disabled={isLoading}
        >
           <input {...getInputProps()} id="file-upload" className="sr-only" />

          {preview && (
             <div className="relative w-full h-auto max-h-96 overflow-hidden rounded-lg group">
               <div className="aspect-video w-full relative bg-black/20"> {/* Background for containment */}
                 <Image
                   src={preview}
                   alt={fileName || "Timetable preview"}
                   fill={true}
                   style={{objectFit: "contain"}}
                   className={cn(
                       "rounded-lg transition-all duration-300",
                       isLoading ? "opacity-30 blur-sm scale-100" : "opacity-100 blur-0 scale-100 group-hover:scale-105" // Blur/fade image during loading
                   )}
                 />
               </div>
               {/* Enhanced Loading Overlay */}
               {isLoading && (
                  <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center rounded-lg backdrop-blur-md z-10 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-lg text-primary/80 font-medium text-center px-4 tracking-wider">ANALYZING...</p>
                      <p className="text-xs text-muted-foreground text-center px-6">AI is processing the image. This might take a moment.</p>
                  </div>
               )}
               {/* Enhanced Remove button */}
               {!isLoading && (
                 <Button
                   variant="destructive"
                   size="icon"
                   className="absolute top-3 right-3 rounded-full h-9 w-9 z-20 shadow-lg bg-destructive/80 hover:bg-destructive hover:scale-110 transition-all duration-200 opacity-70 group-hover:opacity-100 backdrop-blur-sm"
                   onClick={handleRemoveClick}
                   aria-label="Remove image"
                 >
                   <XCircle className="h-5 w-5" />
                 </Button>
               )}
             </div>
           )}

           {!preview && !isLoading && (
             <div className="text-center py-6 pointer-events-none flex flex-col items-center justify-center space-y-4">
                <UploadCloud
                    className={cn("mx-auto h-16 w-16 mb-4 transition-all duration-300 stroke-1", // Thinner stroke
                    isDragActive ? "text-primary scale-110 animate-pulse" : "text-muted-foreground/60 group-hover:text-accent group-hover:scale-105"
                    )}
                />
               {isDragActive ? (
                 <p className="text-primary font-semibold text-lg">Drop the image here!</p>
               ) : (
                  <>
                    <p className="font-semibold text-foreground/90 text-lg">Click to upload or drag & drop</p> {/* Larger text */}
                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP (Max 5MB)</p>
                  </>
               )}
             </div>
           )}
        </div>
         {error && !isLoading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-destructive font-medium animate-shake p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <FileWarning className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
