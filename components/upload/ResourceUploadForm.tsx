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

const formSchema = z.object({
  title: z.string().optional(),
  file: z.any()
    .refine((file) => file?.length !== 0, "File is required"),
})

export function ResourceUploadForm({ courseId, folderId }: { courseId?: string, folderId?: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    
    // Create FormData
    const formData = new FormData();
    if (values.title) formData.append("title", values.title);
    if (courseId) formData.append("courseId", courseId);
    if (folderId) formData.append("folderId", folderId);
    formData.append("file", values.file);

    try {
      if (values.file.size > 4.5 * 1024 * 1024) {
        alert("File is too large! Vercel limits uploads to 4.5MB. For larger files, please use a smaller version or contact support.");
        return;
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      console.log("File uploaded:", data.url);
      alert(`File uploaded successfully!`);
      // Optional: Refresh page or update list
      window.location.reload();
      
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file. Please try again.");
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

