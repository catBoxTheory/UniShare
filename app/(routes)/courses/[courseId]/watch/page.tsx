import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CourseVideoPlayer } from "@/components/video/CourseVideoPlayer";
import { getFile, getRelatedFiles } from "@/app/actions/files";

interface WatchPageProps {
  params: {
    courseId: string;
  };
  searchParams: {
    fileId?: string;
  };
}

const WatchPage = async ({ params, searchParams }: WatchPageProps) => {
    if (!searchParams.fileId) {
        return (
            <div className="container mx-auto p-4 max-w-7xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h1 className="text-2xl font-bold text-red-600">File Not Found</h1>
                    <p className="mt-2 text-muted-foreground">Please select a file to watch.</p>
                </div>
            </div>
        );
    }

    const video = await getFile(searchParams.fileId);
    
    if (!video) {
        return (
            <div className="container mx-auto p-4 max-w-7xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h1 className="text-2xl font-bold text-red-600">File Not Found</h1>
                    <p className="mt-2 text-muted-foreground">This file does not exist or has been deleted.</p>
                </div>
            </div>
        );
    }

    const related = await getRelatedFiles(params.courseId, video.id);

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col gap-1 mb-6">
                <nav className="flex items-center text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link
                        href={`/courses/${params.courseId}`}
                        className="hover:text-foreground transition-colors"
                    >
                        {params.courseId}
                    </Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="font-medium text-foreground">Watch</span>
                </nav>
            </div>

            <CourseVideoPlayer video={video} relatedVideos={related} courseId={params.courseId} />
        </div>
    );
};

export default WatchPage;
