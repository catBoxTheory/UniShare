"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCourse } from "@/app/actions/courses";

interface DeleteCourseButtonProps {
  courseId: string;
  courseName: string;
  variant?: "icon" | "text";
  onDeleted?: () => void;
  redirectToHome?: boolean;
}

export function DeleteCourseButton({
  courseId,
  courseName,
  variant = "icon",
  onDeleted,
  redirectToHome = variant === "text", // Default to redirect when using text variant (on dashboard)
}: DeleteCourseButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCourse(courseId);
      if (result.success) {
        setOpen(false);
        if (onDeleted) {
          onDeleted();
        }
        if (redirectToHome) {
          router.push("/");
        } else {
          router.refresh();
        }
      } else {
        alert(result.error || "Failed to delete course");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the course");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="destructive"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Course
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Course</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{courseName}&quot;? This action cannot be undone and will permanently delete all course materials, videos, and folders.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Course"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

