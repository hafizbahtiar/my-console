# My Console - Admin Dashboard Application

A comprehensive admin dashboard built with **Next.js 16**, **Appwrite**, and **Bun**, featuring authentication, audit logging, internationalization, and a complete UI component library.

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework with App Router | 16.0.1 |
| **Appwrite** | Backend-as-a-Service | 21.4.0 |
| **OpenRouter** | AI API Gateway | Latest |
| **Bun** | JavaScript Runtime & Package Manager | Latest |
| **TypeScript** | Type-Safe JavaScript | 5.x |
| **Tailwind CSS** | Utility-First CSS Framework | 4.x |
| **shadcn/ui** | Component Library | Latest |
| **Radix UI** | Headless UI Primitives | Latest |

## 🚀 Application Overview

My Console is a full-featured admin dashboard application with:

- **🔐 Authentication System**: Secure login/logout with Appwrite backend
- **📊 Audit Logging**: Comprehensive activity tracking and security monitoring
- **🌍 Internationalization**: Multi-language support (English & Malay)
- **🎨 Modern UI**: Complete shadcn/ui component library (47+ components)
- **🌓 Dark Mode**: Built-in theme switching with system preference detection
- **🎨 Customizable Theme**: User-selectable primary accent colors with theme-aware variants
- **📱 Responsive Design**: Mobile-first approach with adaptive layouts
- **📦 Automated Backups**: Cron-based data exports with daily replacement strategy
- **📝 Blog Management**: Full-featured CMS with rich text editor, SEO optimization, and content analytics
- **🔍 SEO Optimized**: Comprehensive metadata, OpenGraph tags, Twitter Cards, and structured data
- **⚡ Auto-save Settings**: Immediate settings updates without save buttons
- **⚡ Optimized Pagination**: Smart server-side/client-side pagination for efficient data loading

### ✨ Key Features

#### 🔐 Authentication & Security
- **Secure Login/Logout**: Appwrite-powered authentication with session management
- **Audit Logging**: Comprehensive activity tracking with predefined events
- **Rate Limiting**: Built-in protection against brute force attacks
- **Session Management**: Secure session handling and monitoring
- **Security Events**: Failed login attempt tracking and alerts

#### 📝 Blog Management System
- **Rich Text Editor**: TipTap-powered WYSIWYG editor with advanced formatting, tables, images, and math expressions
- **AI-Powered Content**: OpenRouter API integration for automated excerpt generation and content improvement with multiple AI models
- **Content Analytics**: View tracking, like counts, and automated read time calculation (blog_views, blog_likes tables)
- **SEO Optimization**: Meta titles, descriptions, and keyword management for search engines
- **Content Categorization**: Hierarchical categories with bidirectional relationship-based organization and many-to-many tag relationships
- **Publishing Workflow**: Draft, published, and archived content states with status badges
- **Featured Content**: Highlight important posts with featured status
- **Content Preview**: Dynamic view dialogs with full content rendering and metadata display
- **AI Content Enhancement**: Five AI-powered improvement options (improve, rephrase, shorten, expand, fix grammar)
- **Comments Display**: Threaded comment system with hierarchical display, author information, engagement metrics, and visual indentation for nested replies

#### 🌍 Internationalization
- **Multi-language Support**: English and Malay (Bahasa Melayu)
- **Browser Detection**: Automatic language detection based on browser settings
- **Persistent Preferences**: Language settings saved to localStorage
- **Fallback System**: Graceful fallback to English when translations are missing
- **Immediate Updates**: Language changes apply instantly with user feedback

#### 🎨 Theme & Customization
- **Dark Mode**: Built-in theme switching with system preference detection
- **Primary Color Customization**: 9 color options (default, blue, green, purple, red, orange, pink, cyan, amber)
- **Theme-aware Colors**: Automatic light/dark variants for each color
- **Auto-initialization**: User preferences loaded on app startup
- **Persistent Settings**: All theme preferences saved to localStorage

#### 🎨 UI/UX Components
- **shadcn/ui Library**: Complete component library with 47+ components
- **TypeScript**: Full type safety across all components
- **Dark Mode**: Built-in theme support with next-themes
- **Tailwind CSS 4**: Modern styling with CSS variables
- **React Server Components**: RSC-compatible components
- **New York Style**: Clean, modern design system
- **Lucide Icons**: Beautiful icon library integration

#### 🗄️ Database Administration
- **Real-time Monitoring**: Live database statistics and collection metrics from actual Appwrite data
- **Smart Backup Management**: Automated daily backups with replacement strategy and real backup history
- **Multi-format Export**: PostgreSQL, MongoDB, and Excel export formats with real collection data
- **Backup History**: Complete backup history with delete functionality using actual backup logs
- **Activity Tracking**: Real-time audit log integration with live user activity
- **System Health**: Dynamic database performance and connection monitoring metrics

#### 🔍 SEO & Metadata
- **Enhanced Metadata**: Comprehensive OpenGraph, Twitter Card, and structured data (JSON-LD)
- **Dynamic Titles**: Template-based page titles with fallback
- **Social Sharing**: Optimized images and descriptions for social platforms
- **Structured Data**: Schema.org WebApplication markup for search engines
- **Canonical URLs**: Proper canonical link management
- **Theme Color**: Dynamic theme color based on light/dark mode

#### ⚙️ Settings & Preferences
- **Auto-save Pattern**: All settings update immediately without save buttons
- **Theme Selection**: Light, dark, or system preference
- **Primary Color**: Visual color picker with theme-aware preview
- **Language Selection**: Instant language switching with feedback
- **Notification Preferences**: Toggle push notifications and email updates
- **Security Settings**: Two-factor authentication and password management
- **Connection Testing**: Built-in Appwrite connection diagnostics

## 🚀 Getting Started

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- Appwrite account and project

### Installation & Development

```bash
# Install dependencies (Bun recommended)
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linting
bun run lint

# Database backup commands
bun run backup          # Manual backup
bun run backup:cron     # Start automated backups
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Setup

1. **Appwrite Configuration**: Follow the setup guide in `docs/APPWRITE_SETUP.md`
2. **Database Administration**: Read `docs/DATABASE_ADMIN.md` for backup and monitoring features
3. **Blog Management**: See `docs/BLOG_MANAGEMENT.md` for content management features
4. **Blog Database Schemas**: Check `docs/APPWRITE_DB_BLOG_POSTS.md`, `docs/APPWRITE_DB_BLOG_CATEGORIES.md`, `docs/APPWRITE_DB_BLOG_TAGS.md`, `docs/APPWRITE_DB_BLOG_COMMENTS.md`, `docs/APPWRITE_DB_BLOG_VIEWS.md`, `docs/APPWRITE_DB_BLOG_LIKES.md` for database schemas
5. **TipTap Editor**: Check `docs/TIPTAP_COMPONENTS.md` for rich text editor documentation
6. **Pagination Optimization**: See `docs/PAGINATION_OPTIMIZATION.md` for efficient data loading strategies
7. **Future Roadmap**: Review `docs/NICE_TO_HAVE.md` for planned enhancements
8. **Development Tasks**: Check `TODO.md` for current development priorities and progress
9. **Environment Variables**: Copy `.env.example` to `.env.local` and configure:
   ```env
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=console-db
   ```

### Application Pages

- **/**: Login page with authentication form
- **/auth/dashboard**: Main dashboard with overview and activity
- **/auth/profile**: User profile management
- **/auth/admin/database**: Real-time database administration and backup management
- **/auth/settings**: Application settings and preferences
- **/auth/audit**: Audit log viewer (admin feature)
- **/auth/sessions**: Active sessions management
- **/auth/blog/blog-posts**: Blog post management with CRUD operations
- **/auth/blog/blog-posts/create**: Create new blog posts with rich text editor
- **/auth/blog/blog-posts/[id]**: View blog post with content, comments, and analytics tabs
- **/auth/blog/blog-posts/[id]/edit**: Edit existing blog posts
- **/auth/blog/blog-categories**: Blog category management
- **/auth/blog/blog-tags**: Blog tag management

## 🏗️ Application Architecture

### Core Modules

#### Authentication System (`lib/auth-context.tsx`)
- User session management with Appwrite
- Rate limiting for login attempts (3s between attempts, 429 error handling)
- Automatic session validation and refresh
- Comprehensive error handling and user feedback

#### Audit Logging System (`lib/audit-log.ts`)
- Singleton pattern for centralized logging
- Predefined audit events (login, logout, profile updates, security events)
- Rate limiting to prevent log spam (500ms between writes, 1s between reads)
- Client-side filtering and sorting for performance

#### Internationalization (`lib/language-context.tsx`)
- Custom React context-based i18n implementation
- Browser language detection with localStorage persistence
- Parameter interpolation and fallback handling
- Translation files in JSON format (`public/locales/`)

#### Appwrite Integration (`lib/appwrite.ts`)
- Centralized client configuration
- Database and account service exports
- Centralized database and collection ID constants
- Environment variable management
- All collection IDs exported for consistent usage across the application

#### Pagination System (`lib/pagination.ts`)
- Optimized pagination utility with server-side/client-side fallback
- Smart pagination strategy: server-side when no filters, client-side when filters active
- Automatic fallback to client-side pagination if Appwrite queries fail
- Efficient data loading: only loads current page when possible
- Supports filters, ordering, and data transformation

#### Client-side Initialization (`components/app/`)
- **PrimaryColorInit**: Loads and applies primary color from localStorage on app startup
- **ErrorHandlerInit**: Sets up global error handlers for unhandled rejections and errors
- Ensures user preferences are restored before first render
- Provides comprehensive error handling from app startup

## 📚 Component Library

### Core Components

| Component | Description | Status |
|-----------|-------------|---------|
| `button` | Versatile button component with multiple variants | ✅ |
| `input` | Form input fields | ✅ |
| `textarea` | Multi-line text input | ✅ |
| `select` | Dropdown selection component | ✅ |
| `checkbox` | Checkbox input | ✅ |
| `radio-group` | Radio button groups | ✅ |
| `switch` | Toggle switch component | ✅ |
| `slider` | Range slider input | ✅ |

### Layout Components

| Component | Description | Status |
|-----------|-------------|---------|
| `card` | Content containers | ✅ |
| `sheet` | Slide-out panels | ✅ |
| `dialog` | Modal dialogs | ✅ |
| `drawer` | Mobile-friendly drawers | ✅ |
| `popover` | Floating content | ✅ |
| `tooltip` | Contextual help | ✅ |
| `accordion` | Collapsible content | ✅ |
| `tabs` | Tabbed interfaces | ✅ |
| `separator` | Visual dividers | ✅ |

### Navigation Components

| Component | Description | Status |
|-----------|-------------|---------|
| `sidebar` | Application sidebar navigation | ✅ |
| `navigation-menu` | Complex navigation menus | ✅ |
| `breadcrumb` | Navigation breadcrumbs | ✅ |
| `pagination` | Page navigation | ✅ |
| `menubar` | Desktop menu bars | ✅ |

### Data Display

| Component | Description | Status |
|-----------|-------------|---------|
| `table` | Data tables | ✅ |
| `badge` | Status indicators | ✅ |
| `avatar` | User avatars | ✅ |
| `progress` | Progress indicators | ✅ |
| `skeleton` | Loading placeholders | ✅ |
| `spinner` | Loading spinners | ✅ |
| `status-badge` | Advanced status badges with icons and internationalization (blog, task, database, backup, system health) | ✅ |

### Feedback Components

| Component | Description | Status |
|-----------|-------------|---------|
| `alert` | Status messages | ✅ |
| `alert-dialog` | Confirmation dialogs | ✅ |
| `sonner` | Toast notifications | ✅ |
| `empty` | Empty state displays | ✅ |

### Advanced Components

| Component | Description | Status |
|-----------|-------------|---------|
| `chart` | Data visualization charts | ✅ |
| `calendar` | Date picker component | ✅ |
| `command` | Command palette | ✅ |
| `form` | Form management with validation | ✅ |
| `carousel` | Image/content carousels | ✅ |
| `resizable` | Resizable panels | ✅ |
| `scroll-area` | Custom scrollbars | ✅ |
| `hover-card` | Hover-triggered cards | ✅ |
| `context-menu` | Right-click menus | ✅ |
| `dropdown-menu` | Dropdown menus | ✅ |
| `collapsible` | Collapsible sections | ✅ |
| `tiptap` | Rich text editor with TipTap | ✅ |

## 🎯 Usage Examples

### Basic Button Usage

```tsx
import { Button } from "@/components/ui/button"

export function MyComponent() {
  return (
    <div className="flex gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}
```

### Form with Validation

```tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="Enter your password" />
        </div>
        <Button className="w-full">Sign In</Button>
      </CardContent>
    </Card>
  )
}
```

### Status Badge Component

```tsx
import { StatusBadge } from "@/components/custom/status-badge"

export function StatusDisplay() {
  return (
    <div className="space-y-4">
      {/* Blog post statuses - automatically localized */}
      <StatusBadge status="published" type="blog-post" />
      <StatusBadge status="draft" type="blog-post" />
      <StatusBadge status="archived" type="blog-post" />

      {/* Blog category statuses */}
      <StatusBadge status="active" type="blog-category" />
      <StatusBadge status="inactive" type="blog-category" />

      {/* Task statuses */}
      <StatusBadge status="completed" type="task" />
      <StatusBadge status="in-progress" type="task" />
      <StatusBadge status="pending" type="task" />

      {/* Database collection statuses */}
      <StatusBadge status="active" type="database-collection" />
      <StatusBadge status="empty" type="database-collection" />

      {/* Backup statuses */}
      <StatusBadge status="completed" type="backup" />
      <StatusBadge status="failed" type="backup" />
      <StatusBadge status="manual" type="backup" />
      <StatusBadge status="scheduled" type="backup" />

      {/* System health statuses */}
      <StatusBadge status="healthy" type="system-health" />
      <StatusBadge status="warning" type="system-health" />
      <StatusBadge status="critical" type="system-health" />
    </div>
  )
}
```

### Table with Data

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/custom/status-badge"

export function BlogPostsTable() {
  const posts = [
    { id: 1, title: "Getting Started with Next.js", status: "published", author: "John Doe" },
    { id: 2, title: "Advanced React Patterns", status: "draft", author: "Jane Smith" },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Author</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell>{post.title}</TableCell>
            <TableCell>
              <StatusBadge status={post.status} type="blog-post" />
            </TableCell>
            <TableCell>{post.author}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### TipTap Rich Text Editor

```tsx
import { TipTap } from "@/components/ui/tiptap"

export function BlogEditor() {
  const [content, setContent] = useState("")

  return (
    <div className="space-y-4">
      <h2>Blog Post Content</h2>
      <TipTap
        value={content}
        onChange={setContent}
        placeholder="Start writing your blog post..."
        stickyTop="top-16" // Account for page headers
      />
      <p className="text-sm text-muted-foreground">
        {content.split(' ').filter(word => word.length > 0).length} words
      </p>
    </div>
  )
}
```

## 🎨 Theming & Customization

### CSS Variables

The design system uses CSS custom properties for theming. Key variables include:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(0.97 0 0);
  --accent: oklch(0.97 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
```

### Dark Mode

Dark mode is automatically supported through the CSS variables. Use next-themes for theme switching:

```tsx
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {/* Theme toggle icon */}
    </Button>
  )
}
```

## 🛠️ Configuration

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Adding New Components

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add toast
```

## 📦 Dependencies

### Core Dependencies

- **Radix UI**: Headless UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **class-variance-authority**: Variant management
- **clsx & tailwind-merge**: Class name utilities

### Form & Validation

- **React Hook Form**: Form management
- **Zod**: Schema validation
- **@hookform/resolvers**: Form validation resolvers

### Additional Features

- **next-themes**: Theme switching
- **recharts**: Data visualization
- **date-fns**: Date utilities
- **cmdk**: Command palette
- **sonner**: Toast notifications
- **@tiptap/react**: Rich text editor framework
- **@tiptap/extension-***: TipTap extensions for advanced features

## 🔧 Project Structure

```
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── ai/                  # AI-powered features
│   │   │   ├── generate-excerpt # Excerpt generation API
│   │   │   └── improve-content  # Content improvement API
│   │   └── [other-api-routes]   # Other API endpoints
│   ├── auth/                     # Protected application pages
│   │   ├── audit/               # Audit log viewer
│   │   ├── blog/                # Blog management system
│   │   │   ├── blog-posts/      # Blog post CRUD operations
│   │   │   │   ├── [id]/        # View blog post (content, comments, analytics)
│   │   │   │   │   └── edit/    # Edit blog post
│   │   │   │   └── create/      # Create blog post
│   │   │   ├── blog-categories/ # Category management
│   │   │   └── blog-tags/       # Tag management
│   │   ├── dashboard/           # Main dashboard
│   │   ├── layout.tsx           # Auth layout with sidebar
│   │   ├── profile/             # User profile management
│   │   ├── sessions/            # Session management
│   │   └── settings/            # Application settings
│   ├── globals.css              # Global styles & CSS variables
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Login page (public)
├── components/
│   ├── app/                     # Application-specific components
│   │   ├── auth/
│   │   │   ├── dashboard/       # Dashboard components
│   │   │   └── sidebar-nav.tsx  # Navigation sidebar with logo
│   │   ├── primary-color-init.tsx # Primary color initialization
│   │   ├── error-handler-init.tsx  # Global error handler setup
│   │   └── login.tsx            # Login form component
│   ├── custom/                  # Custom reusable components
│   │   └── status-badge.tsx     # Advanced status badge component
│   └── ui/                      # shadcn/ui components (47+)
├── lib/                         # Core application logic
│   ├── appwrite.ts              # Appwrite client configuration & centralized collection IDs
│   ├── audit-log.ts             # Audit logging system
│   ├── auth-context.tsx         # Authentication context
│   ├── language-context.tsx     # Internationalization context
│   └── utils.ts                 # Utility functions
├── public/
│   └── locales/                 # Translation files
│       ├── en/                  # English translations
│       └── ms/                  # Malay translations
├── docs/                        # Documentation
│   ├── APPWRITE_SETUP.md        # Appwrite configuration guide
│   ├── DATABASE_ADMIN.md        # Database administration guide
│   ├── BLOG_MANAGEMENT.md       # Blog CMS documentation
│   ├── APPWRITE_DB_BLOG_POSTS.md # Blog posts database schema
│   ├── APPWRITE_DB_BLOG_CATEGORIES.md # Blog categories schema
│   ├── APPWRITE_DB_BLOG_TAGS.md # Blog tags schema (many-to-many)
│   ├── APPWRITE_DB_BLOG_COMMENTS.md # Blog comments schema (threaded)
│   ├── APPWRITE_DB_BLOG_VIEWS.md # Blog views analytics schema
│   ├── APPWRITE_DB_BLOG_LIKES.md # Blog likes engagement schema
│   ├── TIPTAP_COMPONENTS.md     # Rich text editor guide
│   ├── NICE_TO_HAVE.md          # Future enhancements roadmap
│   ├── APPWRITE_DB_AUDIT_LOG.md # Audit logging setup
│   ├── ARCHITECTURE.md          # System architecture overview
│   └── I18N_SETUP.md            # Internationalization setup
├── hooks/                       # Custom React hooks
├── components.json              # shadcn/ui configuration
├── TODO.md                      # Development tasks and roadmap
└── package.json                 # Dependencies and scripts
```

## 🔍 Audit & Security Features

### Audit Logging
The application includes comprehensive audit logging that tracks:

- **User Authentication**: Login/logout events with session tracking
- **Profile Changes**: User profile updates with before/after values
- **Security Events**: Failed login attempts, suspicious activities
- **System Events**: Application-level events and errors

### Rate Limiting
Built-in protection against abuse:
- **Login Attempts**: 3-second cooldown between login attempts
- **Audit Writes**: 500ms rate limiting on log writes
- **Audit Reads**: 1-second rate limiting on log queries

### Security Best Practices
- **Secure Session Management**: Automatic session validation
- **Error Handling**: Comprehensive error handling without information leakage
- **Input Validation**: Type-safe inputs with Zod validation
- **Environment Security**: Sensitive data stored in environment variables

## 🚀 Deployment

### Prerequisites
- Appwrite project configured and running
- Environment variables set up
- Database collections created (see `docs/APPWRITE_SETUP.md`)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/my-console)

### Manual Deployment
1. Build the application: `bun run build`
2. Configure environment variables in your hosting platform
3. Deploy the `.next` build output

## 📝 Contributing

### Development Guidelines
1. **Code Quality**: Run `bun run lint` before committing
2. **TypeScript**: Use strict typing and avoid `any` types
3. **Component Patterns**: Follow existing patterns in `components/app/`
4. **Error Handling**: Implement comprehensive error handling
5. **Security**: Follow security best practices, especially for auth features
6. **Internationalization**: Add translations for new text content

### Testing Checklist
- [ ] Components render correctly in both light and dark modes
- [ ] Authentication flows work properly
- [ ] Audit logging captures expected events
- [ ] Language switching works for new content
- [ ] Mobile responsiveness across different screen sizes
- [ ] Accessibility compliance (WCAG guidelines)

### Code Style
- Use functional components with hooks
- Implement proper loading and error states
- Follow the established file structure
- Add JSDoc comments for complex functions
- Use descriptive variable and function names

## 📄 License

This project is licensed under the MIT License.
