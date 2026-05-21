"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCourse } from "@/app/actions/courses";

export function CourseCreationForm() {
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit() {
        if (!title || !code) return;
        setIsLoading(true);
        const res = await createCourse(title, code);
        setIsLoading(false);
        if (res.success) {
            alert("Course created successfully!");
            window.location.reload();
        } else {
            alert("Failed to create course.");
        }
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label>Course Title</Label>
                <Input placeholder="Introduction to Computer Science" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Course Code</Label>
                <Input placeholder="CS101" value={code} onChange={e => setCode(e.target.value)} />
            </div>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                {isLoading ? "Creating..." : "Create Course"}
            </Button>
        </div>
    )
}

