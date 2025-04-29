'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  onImageUpload: (dataUri: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onImageUpload, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setError(null); // Clear previous errors
    setPreview(null);
    setFileName(null);

    if (fileRejections.length > 0) {
      setError(fileRejections[0].errors[0].message || 'Invalid file type. Please upload an image.');
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setPreview(dataUri);
        onImageUpload(dataUri);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
      }
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB limit
  });

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the dropzone click
    setPreview(null);
    setFileName(null);
    setError(null);
    // Optionally clear the input value if needed, though dropzone manages this internally
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <Card className="w-full shadow-md transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>Upload Timetable Image</CardTitle>
        <CardDescription>Drag & drop your timetable image here, or click to select.</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-accent'}
          ${error ? 'border-destructive' : ''}
          ${preview ? 'border-none p-0' : ''}`}
        >
          <input {...getInputProps()} id="file-upload" className="sr-only" />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48">
               <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
               <p className="text-muted-foreground">Processing Image...</p>
            </div>
          ) : preview ? (
             <div className="relative w-full h-auto max-h-96 overflow-hidden rounded-lg">
               <Image
                 src={preview}
                 alt={fileName || "Timetable preview"}
                 layout="responsive"
                 width={500} // Provide indicative width
                 height={300} // Provide indicative height
                 objectFit="contain"
                 className="rounded-lg"
               />
               <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full h-8 w-8 z-10 shadow-md"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                >
                  <XCircle className="h-5 w-5" />
                </Button>
             </div>
          ) : (
            <div className="text-center py-10">
              <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-primary font-semibold">Drop the image here...</p>
              ) : (
                 <>
                   <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
                   <p className="text-sm text-muted-foreground mt-1">PNG, JPG, WEBP, GIF (max 5MB)</p>
                 </>
              )}
            </div>
          )}
        </div>
         {error && !isLoading && (
           <p className="mt-2 text-sm text-destructive">{error}</p>
         )}
      </CardContent>
    </Card>
  );
}
