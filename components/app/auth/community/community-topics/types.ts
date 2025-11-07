import {
    MessageSquare,
    HelpCircle,
    Award,
    Megaphone,
    Code,
    Smartphone,
    Palette,
    Layout,
    Users,
    Book,
    Lightbulb,
    Bug,
    Wrench,
    Cpu,
    Database,
    Globe,
    Heart,
    Star,
    Zap,
    Target,
    Rocket,
    Shield,
    Lock,
    Unlock,
    Bell,
    Mail,
    Calendar,
    Clock,
    TrendingUp,
    BarChart3,
    FileText,
    Image,
    Video,
    Music,
    Gamepad2,
    Camera,
    Film,
    ShoppingBag,
    CreditCard,
    Building2,
    Home,
    MapPin,
    Plane,
    Car,
    Bike,
    Dumbbell,
    Utensils,
    Coffee,
    LucideIcon,
} from "lucide-react";

export interface CommunityTopic {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    isActive: boolean;
    isPublic: boolean;
    displayOrder: number;
    color?: string;
    icon?: string;
    postCount: number;
    replyCount: number;
    lastPostAt?: string;
    moderatorIds?: string[];
    rules?: string;
}

export interface IconOption {
    name: string;
    component: LucideIcon;
    label: string;
}

export interface TopicFormData {
    name: string;
    slug: string;
    description: string;
    parentId: string;
    color: string;
    icon: string;
    isActive: boolean;
    isPublic: boolean;
    displayOrder: number;
    rules: string;
}

export const AVAILABLE_ICONS: IconOption[] = [
    { name: 'message-circle', component: MessageSquare, label: 'Message Circle' },
    { name: 'help-circle', component: HelpCircle, label: 'Help Circle' },
    { name: 'award', component: Award, label: 'Award' },
    { name: 'megaphone', component: Megaphone, label: 'Megaphone' },
    { name: 'code', component: Code, label: 'Code' },
    { name: 'smartphone', component: Smartphone, label: 'Smartphone' },
    { name: 'palette', component: Palette, label: 'Palette' },
    { name: 'layout', component: Layout, label: 'Layout' },
    { name: 'users', component: Users, label: 'Users' },
    { name: 'book', component: Book, label: 'Book' },
    { name: 'lightbulb', component: Lightbulb, label: 'Lightbulb' },
    { name: 'bug', component: Bug, label: 'Bug' },
    { name: 'wrench', component: Wrench, label: 'Wrench' },
    { name: 'cpu', component: Cpu, label: 'CPU' },
    { name: 'database', component: Database, label: 'Database' },
    { name: 'globe', component: Globe, label: 'Globe' },
    { name: 'heart', component: Heart, label: 'Heart' },
    { name: 'star', component: Star, label: 'Star' },
    { name: 'zap', component: Zap, label: 'Zap' },
    { name: 'target', component: Target, label: 'Target' },
    { name: 'rocket', component: Rocket, label: 'Rocket' },
    { name: 'shield', component: Shield, label: 'Shield' },
    { name: 'lock', component: Lock, label: 'Lock' },
    { name: 'unlock', component: Unlock, label: 'Unlock' },
    { name: 'bell', component: Bell, label: 'Bell' },
    { name: 'mail', component: Mail, label: 'Mail' },
    { name: 'calendar', component: Calendar, label: 'Calendar' },
    { name: 'clock', component: Clock, label: 'Clock' },
    { name: 'trending-up', component: TrendingUp, label: 'Trending Up' },
    { name: 'bar-chart-3', component: BarChart3, label: 'Bar Chart' },
    { name: 'file-text', component: FileText, label: 'File Text' },
    { name: 'image', component: Image, label: 'Image' },
    { name: 'video', component: Video, label: 'Video' },
    { name: 'music', component: Music, label: 'Music' },
    { name: 'gamepad-2', component: Gamepad2, label: 'Gamepad' },
    { name: 'camera', component: Camera, label: 'Camera' },
    { name: 'film', component: Film, label: 'Film' },
    { name: 'shopping-bag', component: ShoppingBag, label: 'Shopping Bag' },
    { name: 'credit-card', component: CreditCard, label: 'Credit Card' },
    { name: 'building-2', component: Building2, label: 'Building' },
    { name: 'home', component: Home, label: 'Home' },
    { name: 'map-pin', component: MapPin, label: 'Map Pin' },
    { name: 'plane', component: Plane, label: 'Plane' },
    { name: 'car', component: Car, label: 'Car' },
    { name: 'bike', component: Bike, label: 'Bike' },
    { name: 'dumbbell', component: Dumbbell, label: 'Dumbbell' },
    { name: 'utensils', component: Utensils, label: 'Utensils' },
    { name: 'coffee', component: Coffee, label: 'Coffee' },
];

export const DEFAULT_FORM_DATA: TopicFormData = {
    name: '',
    slug: '',
    description: '',
    parentId: 'none',
    color: '#3B82F6',
    icon: 'message-circle',
    isActive: true,
    isPublic: true,
    displayOrder: 0,
    rules: '',
};

