"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteCourseButton } from "./DeleteCourseButton";
import { LibraryToggleButton } from "./LibraryToggleButton";
import { updateCourse } from "@/app/actions/courses";

interface CourseCardProps {
  course: {
    id: string;
    code: string;
    title: string;
    department?: {
      name: string;
    } | null;
  };
  initialEnrolled?: boolean;
}

export function CourseCard({ course, initialEnrolled }: CourseCardProps) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState(course.code);
  const [newTitle, setNewTitle] = useState(course.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [displayCode, setDisplayCode] = useState(course.code);
  const [displayTitle, setDisplayTitle] = useState(course.title);

  const handleOpenRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewCode(displayCode);
    setNewTitle(displayTitle);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!newCode.trim() || !newTitle.trim()) return;

    setIsRenaming(true);
    try {
      const result = await updateCourse(course.id, newTitle.trim(), newCode.trim());
      if (result.success) {
        setDisplayCode(newCode.trim());
        setDisplayTitle(newTitle.trim());
        setRenameDialogOpen(false);
      } else {
        alert("Failed to rename course. Please try again.");
      }
    } catch (error) {
      console.error("Rename error:", error);
      alert("Failed to rename course. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div className="group relative">
      <Link href={`/courses/${course.id}`}>
        <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-border hover:border-blue-300 bg-card">
          <div className="h-28 bg-blue-600 bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:from-blue-600 group-hover:to-indigo-700 transition-all flex items-center justify-center relative">
            <span className="text-3xl font-bold text-white drop-shadow-sm">{displayCode}</span>
          </div>
          <CardContent className="p-5">
            <h3 className="font-bold text-lg mb-2 text-foreground group-hover:text-blue-600 transition-colors line-clamp-2">
              {displayTitle}
            </h3>
            {course.department && (
              <p className="text-sm text-muted-foreground">{course.department.name}</p>
            )}
          </CardContent>
        </Card>
      </Link>
      
      {/* Action buttons - positioned absolutely in top right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {initialEnrolled !== undefined && (
          <LibraryToggleButton 
            courseId={course.id} 
            initialEnrolled={initialEnrolled} 
            minimal 
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenRename}
          className="h-8 w-8 bg-card/90 hover:bg-card text-muted-foreground hover:text-foreground shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <DeleteCourseButton
          courseId={course.id}
          courseName={`${displayCode} - ${displayTitle}`}
          variant="icon"
        />
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Course</DialogTitle>
            <DialogDescription>
              Update the course code and title.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
                placeholder="e.g., CS101"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="course-title">Course Title</Label>
              <Input
                id="course-title"
                placeholder="e.g., Introduction to Programming"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRename} 
              disabled={isRenaming || !newCode.trim() || !newTitle.trim()}
            >
              {isRenaming ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

