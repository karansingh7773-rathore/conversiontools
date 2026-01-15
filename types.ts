import { LucideIcon } from "lucide-react";

export interface Tool {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    badge?: string;
    badgeColor?: string;
    ctaText: string;
    isComingSoon?: boolean;
    category: 'PDF Page Ops' | 'PDF Office' | 'PDF Security' | 'PDF Advanced' | 'Image Tools' | 'Video Tools' | 'Utilities';
}

export interface Post {
    id: string;
    author: string;
    title: string;
    content?: string;
    image?: string;
    subreddit: string;
    upvotes: number;
    comments: number;
    timestamp: string;
}

export interface Community {
    name: string;
    icon: LucideIcon;
    color: string;
    members: string;
}

export interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
    isActive?: boolean;
}
