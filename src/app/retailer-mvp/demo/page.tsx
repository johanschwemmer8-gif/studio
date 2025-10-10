
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayCircle, Mic, Milestone, PauseCircle, FastForward } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const demoScript = [
    { time: "0:00", scene: "Opening Shot", text: "[Music begins] Welcome to the iNteract-AOE Retailer MVP dashboard, your central hub for revolutionizing the in-store customer experience." },
    { time: "0:10", scene: "Dashboard Overview", text: "Here on the main dashboard, you get an immediate, high-level executive summary of your performance. Track unique scans, engagement rates, and basket uplift at a glance." },
    { time: "0:25", scene: "AI Analysis", text: "But we go beyond numbers. With a single click, our AI analyzes these core metrics to give you actionable conclusions and recommendations. No more guessing what the data means." },
    { time: "0:45", scene: "QR Management", text: "Let's dive into QR Management. Here, you can generate single or bulk QR codes for your campaigns. Define your campaign, choose a template, and create thousands of unique codes instantly." },
    { time: "1:05", scene: "AI Profiles", text: "This is where the magic happens. In the AI Profile Manager, you define the personality of your in-store assistant. Is it a friendly helper? A product expert? You decide its tone, intent, and constraints." },
    { time: "1:30", scene: "In-Store Display", text: "Extend your digital presence to physical screens. Register your in-store displays and assign dynamic content configurations, from AI-driven prompts to promotional videos." },
    { time: "1:50", scene: "Analytics Deep Dive", text: "In the Scan Analytics section, you can track performance by campaign, region, or even individual product. Understand customer behavior like never before." },
    { time: "2:15", scene: "Billing & Admin", text: "Finally, manage your subscription, view invoices, and configure user access in the Administration sections. Everything you need to manage your iNteract-AOE experience is right here." },
    { time: "2:30", scene: "Closing", text: "[Music swells] Empower your retail space with iNteract-AOE. It's not just data; it's in-store intelligence. [Logo fades in]" },
];

export default function DemoVideoPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const totalDuration = 150; // Total seconds

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && progress < totalDuration) {
            interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 1, totalDuration));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, progress]);

    const currentScriptIndex = Math.floor((progress / totalDuration) * (demoScript.length -1));

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Retailer MVP Demo</h2>
                <p className="text-muted-foreground max-w-3xl">A guided walkthrough of the key features and benefits of your new dashboard.</p>
            </div>
            <Separator />
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Video Player</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-white relative">
                             <div className="text-center p-8">
                                <h3 className="text-2xl font-bold text-primary-foreground">{demoScript[currentScriptIndex].scene}</h3>
                                <p className="text-lg text-muted-foreground mt-2">{demoScript[currentScriptIndex].text}</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                             <div className="w-full bg-muted rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(progress / totalDuration) * 100}%` }}></div>
                            </div>
                             <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>{new Date(progress * 1000).toISOString().substr(14, 5)}</span>
                                <div className="flex items-center gap-4">
                                     <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                                        {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
                                    </Button>
                                     <Button variant="ghost" size="icon" onClick={() => setProgress(prev => Math.min(prev + 10, totalDuration))}>
                                        <FastForward className="h-6 w-6" />
                                    </Button>
                                </div>
                                <span>{new Date(totalDuration * 1000).toISOString().substr(14, 5)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Demo Transcript</CardTitle>
                        <CardDescription>Follow along with the video script.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[500px] overflow-y-auto">
                        <div className="space-y-6">
                            {demoScript.map((item, index) => (
                                <div key={item.time} className={`p-3 rounded-md transition-colors ${index === currentScriptIndex ? 'bg-primary/10' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`font-mono text-xs ${index === currentScriptIndex ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{item.time}</div>
                                            <div className={`h-full w-px bg-border my-1 ${index === demoScript.length - 1 ? 'hidden' : ''}`}></div>
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${index === currentScriptIndex ? 'text-primary' : ''}`}>{item.scene}</p>
                                            <p className="text-sm text-muted-foreground">{item.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
