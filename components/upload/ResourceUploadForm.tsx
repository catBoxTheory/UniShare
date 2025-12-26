"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { UploadCloud } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { saveMaterialToDb } from "@/app/actions/materials"
import { MaterialType } from "@prisma/client"

const formSchema = z.object({
  title: z.string().optional(),
  file: z.any()
    .refine((file) => file && file instanceof File, "File is required"),
})

export function ResourceUploadForm({ courseId, folderId }: { courseId?: string, folderId?: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const file = values.file as File;
    const title = values.title || file.name;
    
    try {
      // 1. Get Presigned URL
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!presignedRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await presignedRes.json();

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) throw new Error("Cloud upload failed");

      // 3. Determine Material Type
      const videoExtensions = /\.(mp4|mov|avi|wmv|flv|webm|mkv|m4v|3gp)$/i;
      const isVideo = file.type.startsWith("video/") || videoExtensions.test(file.name);
      const materialType = isVideo ? MaterialType.VIDEO : MaterialType.FILE;

      // 4. Save to Database
      if (courseId) {
        const dbRes = await saveMaterialToDb({
          title,
          url: publicUrl,
          type: materialType,
          courseId,
          folderId,
        });

        if (!dbRes.success) throw new Error(dbRes.error);
      }

      alert(`Uploaded successfully!`);
      window.location.reload();
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      alert(`Error uploading file: ${error.message}`);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UploadCloud className="w-5 h-5" />
          Upload Material
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter file title" {...field} />
                  </FormControl>
                  <FormDescription>
                     If left blank, the filename will be used.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      onChange={(event) => {
                        onChange(event.target.files && event.target.files[0]);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the video or document you want to upload.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Upload</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

