"use client";

import { useState } from "react";
import { updateCourse } from "@/app/actions/courses";
import { EditableText } from "@/components/ui/editable-text";

interface EditableCourseHeaderProps {
  courseId: string;
  initialCode: string;
  initialTitle: string;
  description?: string | null;
}

export function EditableCourseHeader({
  courseId,
  initialCode,
  initialTitle,
  description,
}: EditableCourseHeaderProps) {
  const [code, setCode] = useState(initialCode);
  const [title, setTitle] = useState(initialTitle);

  const handleSaveCode = async (newCode: string) => {
    const result = await updateCourse(courseId, title, newCode);
    if (result.success) {
      setCode(newCode);
    } else {
      throw new Error(result.error);
    }
  };

  const handleSaveTitle = async (newTitle: string) => {
    const result = await updateCourse(courseId, newTitle, code);
    if (result.success) {
      setTitle(newTitle);
    } else {
      throw new Error(result.error);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
        <EditableText
          value={code}
          onSave={handleSaveCode}
          className="hover:bg-gray-100 rounded px-1 -mx-1"
          inputClassName="text-3xl font-bold w-40"
        />
        <span className="text-slate-400">-</span>
        <EditableText
          value={title}
          onSave={handleSaveTitle}
          className="hover:bg-gray-100 rounded px-1 -mx-1"
          inputClassName="text-3xl font-bold flex-1 min-w-[200px]"
        />
      </h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

