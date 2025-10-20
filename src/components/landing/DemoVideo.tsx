
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DemoVideo() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace this with your actual YouTube video ID
  const youtubeVideoId = 'qR6189CfWpA'; 

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
  const videoUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 md:px-6">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="relative group w-full max-w-2xl mx-auto aspect-video rounded-lg overflow-hidden shadow-2xl cursor-pointer">
              <Image
                src={thumbnailUrl}
                alt="Demo video thumbnail"
                layout="fill"
                objectFit="cover"
                data-ai-hint="demo video retail technology"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-20 w-20 text-white/80 group-hover:text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full p-0 border-0">
            <DialogTitle className="sr-only">iNteract AOE Demo Video</DialogTitle>
            <div className="aspect-video">
              {isOpen && (
                <iframe
                  width="100%"
                  height="100%"
                  src={videoUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
