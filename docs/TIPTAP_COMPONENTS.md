# TipTap Rich Text Editor Components

## Overview

My Console includes a comprehensive rich text editor powered by TipTap, a headless editor framework that provides advanced content editing capabilities with full TypeScript support and extensibility.

## Core Architecture

### TipTap Editor Setup

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Hello World!</p>',
  onUpdate: ({ editor }) => {
    console.log(editor.getHTML())
  }
})

return <EditorContent editor={editor} />
```

### Component Structure

```
TipTap Component
├── Toolbar (sticky)
│   ├── Format Menu (Menubar)
│   ├── Insert Menu (Menubar)
│   ├── Text Styling (Popovers)
│   ├── Math Expressions (Popover)
│   └── Table Controls (conditional)
├── Editor Content Area
│   ├── ProseMirror Editor
│   ├── Drag Handle (for node manipulation)
│   └── Table of Contents (optional panel)
└── Status Bar
    ├── Character/Word Count
    ├── Active Mode Indicators
    └── TOC Toggle
```

## Component API

### Props Interface

```typescript
interface TipTapProps {
  value: string                    // HTML content
  onChange: (value: string) => void // Content change handler
  placeholder?: string            // Placeholder text
  className?: string              // Additional CSS classes
  readonly?: boolean             // Read-only mode
  stickyTop?: string             // CSS top position for sticky toolbar
}
```

### Usage Examples

#### Basic Usage

```tsx
import { TipTap } from "@/components/ui/tiptap"

function BlogEditor() {
  const [content, setContent] = useState("")

  return (
    <TipTap
      value={content}
      onChange={setContent}
      placeholder="Start writing..."
    />
  )
}
```

#### With Sticky Positioning

```tsx
<TipTap
  value={content}
  onChange={setContent}
  stickyTop="top-16"  // Account for page headers
  placeholder="Enter your content here..."
/>
```

#### Read-only Mode

```tsx
<TipTap
  value={content}
  readonly={true}
  className="border-none shadow-none"
/>
```

## Extension Configuration

### Core Extensions

#### StarterKit
- **Paragraph**: Basic text blocks
- **Heading**: H1-H3 headings with anchor links
- **Bold/Italic/Underline/Strike**: Text formatting
- **BulletList/OrderedList**: List types
- **Blockquote**: Quote blocks
- **Code/CodeBlock**: Inline and block code
- **HorizontalRule**: Dividers
- **HardBreak**: Line breaks

#### Advanced Extensions

##### TableKit
```typescript
TableKit.configure({
  table: {
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full'
    }
  }
})
```
- Resizable table columns
- Add/remove rows and columns
- Cell merging capabilities

##### Mathematics
```typescript
Mathematics.configure({
  katexOptions: {
    throwOnError: false
  }
})
```
- LaTeX math expression rendering
- Inline and block math formulas
- KaTeX integration for high-quality rendering

##### Image
```typescript
Image.configure({
  HTMLAttributes: {
    class: 'rounded-lg max-w-full h-auto'
  }
})
```
- Image embedding with upload support
- Responsive image handling
- Custom styling and attributes

##### TextStyle & FontFamily
- Font family selection (Arial, Helvetica, Times, etc.)
- Font size controls (12px - 48px)
- Text color picker with predefined colors
- Highlight colors for text emphasis

##### TextAlign
```typescript
TextAlign.configure({
  types: ['heading', 'paragraph'],
  alignments: ['left', 'center', 'right', 'justify']
})
```
- Left/Center/Right/Justify alignment
- Keyboard shortcuts (Ctrl+Shift+L/E/R/J)

### Custom Extensions

#### Mention (@user)
```typescript
Mention.configure({
  HTMLAttributes: {
    class: 'bg-blue-100 text-blue-800 px-2 py-1 rounded'
  }
})
```
- User mentions with @ syntax
- Custom styling for mentions
- Extensible suggestion system

#### YouTube Embed
```typescript
Youtube.configure({
  width: 640,
  height: 360,
  controls: true
})
```
- YouTube video embedding
- Responsive video sizing
- Player controls configuration

#### Table of Contents
```typescript
TableOfContents.configure({
  getId: (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  onUpdate: (content) => {
    setTocContent(content)
  }
})
```
- Automatic TOC generation from headings
- Custom ID generation for anchor links
- Real-time content updates

## Toolbar Components

### Format Menu (Menubar)

| Button | Function | Shortcut |
|--------|----------|----------|
| **Bold** | Toggle bold text | Ctrl+B |
| **Italic** | Toggle italic text | Ctrl+I |
| **Underline** | Toggle underline | Ctrl+U |
| **Strikethrough** | Toggle strikethrough | - |
| **Highlight** | Toggle text highlight | Ctrl+Shift+H |
| **H1/H2/H3** | Heading levels | - |
| **Bullet List** | Unordered list | - |
| **Numbered List** | Ordered list | - |
| **Blockquote** | Quote block | - |
| **Align Left/Center/Right/Justify** | Text alignment | Ctrl+Shift+L/E/R/J |

### Insert Menu (Menubar)

| Button | Function | Description |
|--------|----------|-------------|
| **Table** | Insert table | 3x3 table with header row |
| **Image** | Insert image | File picker for image upload |
| **YouTube** | Embed video | YouTube URL input |
| **Code Block** | Code block | Syntax-highlighted code |

### Text Styling Popovers

#### Color Picker
- **Predefined Colors**: 11 color options (Black, Gray, Red, Orange, Yellow, Green, Cyan, Blue, Violet, Magenta, Rose)
- **Custom Colors**: Hex color input support
- **Live Preview**: Color changes apply immediately

#### Highlight Colors
- **Background Highlights**: 7 highlight colors (Yellow, Blue, Green, Red, Purple, Amber, Emerald, Sky)
- **Text Preservation**: Original text color maintained
- **Multiple Highlights**: Support for multi-color highlighting

#### Font Controls
- **Font Families**: 9 web-safe fonts (Arial, Helvetica, Times New Roman, Georgia, etc.)
- **Font Sizes**: 10 size options (12px to 48px)
- **Live Preview**: Font changes show immediately

### Math Expression Library

#### Basic Operations
- Addition, Subtraction, Multiplication, Division
- Power, Square Root, nth Root
- Fractions, Equality/Inequality
- Less/Greater than symbols

#### Advanced Math
- Greek letters (α, β, γ, δ, θ, π, σ)
- Calculus (∫, d/dx, ∂/∂x, lim)
- Advanced symbols (∑, ∏, √, →)
- Matrix support (2x2 matrices)
- Custom LaTeX input

### Table Controls

*Appears when table is active*

#### Row Operations
- **Add Row Above/Below**: Insert rows at cursor position
- **Remove Row**: Delete current row

#### Column Operations
- **Add Column Left/Right**: Insert columns at cursor position
- **Remove Column**: Delete current column

#### Table Actions
- **Delete Table**: Remove entire table with confirmation

## Keyboard Shortcuts

### Text Formatting
- `Ctrl+B` / `Cmd+B`: Bold
- `Ctrl+I` / `Cmd+I`: Italic
- `Ctrl+U` / `Cmd+U`: Underline
- `Ctrl+Shift+H`: Highlight

### Text Alignment
- `Ctrl+Shift+L`: Align left
- `Ctrl+Shift+E`: Align center
- `Ctrl+Shift+R`: Align right
- `Ctrl+Shift+J`: Justify

### Editor Controls
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+A` / `Cmd+A`: Select all

## Accessibility Features

### Screen Reader Support
- **ARIA Labels**: Proper labeling for toolbar buttons
- **Semantic HTML**: Correct heading hierarchy
- **Focus Management**: Keyboard navigation support
- **Status Announcements**: Screen reader feedback

### Keyboard Navigation
- **Tab Navigation**: Logical tab order through toolbar
- **Arrow Keys**: Navigate within popovers and menus
- **Enter/Space**: Activate buttons and menu items
- **Escape**: Close popovers and menus

## Performance Optimizations

### Lazy Loading
- **Extension Loading**: Heavy extensions loaded on demand
- **Component Splitting**: Toolbar components split for better loading

### Memory Management
- **State Optimization**: Efficient state updates with useCallback
- **Event Debouncing**: Content change events throttled
- **Cleanup**: Proper editor cleanup on unmount

### Rendering Optimization
- **Memoization**: Expensive operations cached
- **Conditional Rendering**: UI elements rendered only when needed
- **Virtual Scrolling**: For large content areas

## Customization

### Theme Integration
```css
/* Dark mode support */
.prose {
  color: hsl(var(--foreground));
}

.prose h1, .prose h2, .prose h3 {
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
}

/* Custom styling */
.prose code {
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
}
```

### Extension Customization
```typescript
// Custom color palette
const customColors = [
  { value: '#ff0000', label: 'Custom Red' },
  { value: '#00ff00', label: 'Custom Green' }
]

// Custom font sizes
const customSizes = [
  { value: '10px', label: '10px' },
  { value: '72px', label: '72px' }
]
```

## Error Handling

### Validation
- **URL Validation**: Featured image URLs must be valid
- **HTML Sanitization**: Content cleaned before storage
- **Extension Errors**: Graceful handling of extension failures

### Recovery
- **Editor Recovery**: Automatic editor reinitialization on errors
- **Content Preservation**: Draft saving to prevent data loss
- **User Feedback**: Clear error messages and recovery options

## Browser Compatibility

### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Mobile Support
- **iOS Safari**: Full support with touch optimizations
- **Android Chrome**: Complete functionality
- **Responsive Design**: Adapts to screen sizes automatically

## Future Enhancements

### Planned Features
- **Collaborative Editing**: Real-time multi-user editing
- **Version History**: Content versioning and restoration
- **Templates**: Pre-built content templates
- **AI Assistance**: Content generation and suggestions
- **Advanced Media**: Video upload, audio embedding, file attachments

### Extensibility
- **Plugin System**: Custom extensions support
- **Theme Customization**: Advanced theming options
- **API Integration**: Third-party service integrations
- **Export Formats**: Additional export formats (PDF, DOCX)
