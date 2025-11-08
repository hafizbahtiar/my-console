# TipTap Performance Analysis & Optimization Plan

## Current State Analysis

### 1. Component Structure
- **File**: `components/ui/tiptap.tsx`
- **Lines**: ~1036 lines
- **Component Type**: Functional component (not memoized)
- **Extensions Loaded**: 20+ extensions loaded synchronously

### 2. Performance Issues Identified

#### Issue 1: No React.memo Implementation
**Problem**: 
- The `TipTap` component is not wrapped with `React.memo`
- Component re-renders on every parent re-render, even when props haven't changed
- This causes unnecessary editor re-initialization and DOM updates

**Impact**: 
- High: Causes editor to potentially recreate on every parent state change
- Affects: Blog post create/edit pages where form state changes frequently

**Current Code**:
```typescript
export function TipTap({ value, onChange, placeholder, className, readonly = false, stickyTop = "top-0" }: TipTapProps) {
  // Component implementation
}
```

**Evidence**:
- Parent components (`create/page.tsx`, `edit/page.tsx`) have frequent state updates
- `onChange` callback creates new function reference on every render
- No memoization of props or component itself

---

#### Issue 2: All Extensions Loaded Synchronously
**Problem**:
- All 20+ extensions are imported at the top level
- Heavy extensions loaded even when not used:
  - `Mathematics` (~50KB with KaTeX)
  - `TableKit` (~30KB)
  - `DragHandle` (~20KB)
  - `TableOfContents` (~15KB)
  - `Emoji` (~25KB)
  - `Mention` (~10KB)
- Total bundle size impact: ~150KB+ of unused code for most users

**Impact**:
- High: Increases initial bundle size significantly
- Affects: Initial page load time, especially on mobile/slow connections
- Affects: Memory usage (all extensions loaded in memory)

**Current Code**:
```typescript
import StarterKit from "@tiptap/starter-kit";
import CodeBlock from "@tiptap/extension-code-block";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Mathematics from "@tiptap/extension-mathematics";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyle, FontFamily } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { Strike } from "@tiptap/extension-strike";
import { TextAlign } from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Emoji from "@tiptap/extension-emoji";
import Mention from "@tiptap/extension-mention";
import { TableOfContents } from "@tiptap/extension-table-of-contents";
import HardBreak from "@tiptap/extension-hard-break";
import Typography from "@tiptap/extension-typography";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
```

**Extensions Usage Analysis**:
- **Always Used**: StarterKit, CodeBlock, Image, CharacterCount, TextStyle, FontFamily, Color, Highlight, Underline, Strike, TextAlign, Placeholder, HardBreak, Typography
- **Conditionally Used** (can be lazy loaded):
  - `TableKit` - Only when user inserts a table
  - `Youtube` - Only when user embeds a video
  - `Mathematics` - Only when user adds math expressions
  - `TableOfContents` - Only when user enables TOC
  - `Emoji` - Only when user uses emoji picker
  - `Mention` - Only when user uses mentions
  - `DragHandle` - Only in edit mode (not readonly)

---

#### Issue 3: useEditor Dependencies Not Optimized
**Problem**:
- `onChange` callback is passed directly without memoization
- `value` prop changes trigger editor content updates
- Extension configurations create new objects on every render
- `Placeholder` and `TableOfContents` use inline callbacks

**Impact**:
- Medium: Editor may recreate unnecessarily
- Affects: Performance during typing/editing

**Current Code**:
```typescript
const editor = useEditor({
  extensions: [
    // ... all extensions
    Placeholder.configure({
      placeholder: ({ node }) => {
        // New function on every render
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`;
        }
        return "Start writing...";
      },
    }),
    TableOfContents.configure({
      getId: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      onUpdate: (content) => {
        setTocContent(content); // State setter, but creates new function
      },
    }),
  ],
  content: value, // Changes trigger editor update
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML()); // New function reference on every render
  },
  // ...
});
```

**Evidence**:
- Parent components pass inline `onChange` callbacks
- No `useCallback` in parent components
- Extension callbacks are not memoized

---

#### Issue 4: Parent Component onChange Callbacks
**Problem**:
- Parent components create new `onChange` functions on every render
- These functions include additional logic (readTime calculation, state updates)

**Impact**:
- Medium: Causes TipTap to potentially re-render unnecessarily

**Current Code (create/page.tsx)**:
```typescript
<TipTap
  value={formData.content}
  stickyTop="top-59"
  onChange={(value) => {
    const readTime = calculateReadTime(value);
    setFormData(prev => ({
      ...prev,
      content: value,
      readTime: readTime
    }));
  }}
/>
```

**Evidence**:
- `onChange` is an inline arrow function
- No `useCallback` wrapper
- Function reference changes on every render

---

## Optimization Strategy

### Priority 1: Implement React.memo (High Impact, Low Risk)
**Goal**: Prevent unnecessary re-renders when props haven't changed

**Implementation**:
1. Wrap `TipTap` component with `React.memo`
2. Create custom comparison function for props
3. Memoize internal callbacks with `useCallback`
4. Memoize extension configurations with `useMemo`

**Expected Benefits**:
- 30-50% reduction in unnecessary re-renders
- Smoother editing experience
- Better performance on slower devices

---

### Priority 2: Lazy Load Heavy Extensions (High Impact, Medium Risk)
**Goal**: Reduce initial bundle size by loading extensions on-demand

**Implementation Strategy**:
1. **Always Load** (Core functionality):
   - StarterKit
   - CodeBlock
   - Image
   - CharacterCount
   - TextStyle, FontFamily, Color
   - Highlight, Underline, Strike
   - TextAlign
   - Placeholder
   - HardBreak
   - Typography

2. **Lazy Load** (Conditional usage):
   - `TableKit` - Load when user clicks "Insert Table"
   - `Youtube` - Load when user clicks "Insert Video"
   - `Mathematics` - Load when user clicks "Insert Math"
   - `TableOfContents` - Load when user enables TOC
   - `Emoji` - Load when user opens emoji picker
   - `Mention` - Load when user types "@"
   - `DragHandle` - Load only in edit mode (not readonly)

**Implementation Approach**:
```typescript
// Dynamic import with React.lazy
const TableKit = lazy(() => import("@tiptap/extension-table").then(m => ({ default: m.TableKit })));

// Load extension when needed
const loadTableKit = async () => {
  const { TableKit } = await import("@tiptap/extension-table");
  editor.extensionManager.addExtension(TableKit.configure({...}));
};
```

**Expected Benefits**:
- 100-150KB reduction in initial bundle size
- Faster initial page load (20-30% improvement)
- Lower memory usage
- Better mobile performance

**Challenges**:
- Need to handle extension loading state
- Editor may need to be recreated when extensions are added
- User experience: slight delay when first using a feature

---

### Priority 3: Optimize useEditor Dependencies (Medium Impact, Low Risk)
**Goal**: Prevent editor recreation on unnecessary prop changes

**Implementation**:
1. Memoize `onChange` callback in parent components with `useCallback`
2. Memoize extension configurations
3. Use `useMemo` for extension array
4. Optimize `Placeholder` and `TableOfContents` callbacks

**Expected Benefits**:
- More stable editor instance
- Fewer editor recreations
- Better performance during editing

---

## Detailed Implementation Plan

### Phase 1: React.memo Implementation

#### Step 1.1: Wrap Component with React.memo
```typescript
import React, { memo } from 'react';

export const TipTap = memo(function TipTap({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  readonly = false, 
  stickyTop = "top-0" 
}: TipTapProps) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.value === nextProps.value &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.stickyTop === nextProps.stickyTop &&
    prevProps.className === nextProps.className &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.onChange === nextProps.onChange
  );
});
```

#### Step 1.2: Memoize Internal Callbacks
```typescript
const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
  onChange(editor.getHTML());
}, [onChange]);

const placeholderFn = useCallback(({ node }: { node: any }) => {
  if (node.type.name === 'heading') {
    return `Heading ${node.attrs.level}`;
  }
  return placeholder || "Start writing...";
}, [placeholder]);

const tocUpdateHandler = useCallback((content: any[]) => {
  setTocContent(content);
}, []);
```

#### Step 1.3: Memoize Extension Configurations
```typescript
const extensions = useMemo(() => [
  StarterKit.configure({...}),
  CodeBlock.configure({...}),
  // ... other extensions
  Placeholder.configure({
    placeholder: placeholderFn,
  }),
  TableOfContents.configure({
    getId: (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    onUpdate: tocUpdateHandler,
  }),
], [placeholderFn, tocUpdateHandler]);
```

---

### Phase 2: Lazy Loading Implementation

#### Step 2.1: Identify Lazy-Loadable Extensions
```typescript
// Core extensions (always loaded)
const CORE_EXTENSIONS = [
  StarterKit,
  CodeBlock,
  Image,
  CharacterCount,
  TextStyle,
  FontFamily,
  Color,
  Highlight,
  Underline,
  Strike,
  TextAlign,
  Placeholder,
  HardBreak,
  Typography,
];

// Lazy-loadable extensions
const LAZY_EXTENSIONS = {
  table: () => import("@tiptap/extension-table").then(m => m.TableKit),
  youtube: () => import("@tiptap/extension-youtube").then(m => m.default),
  mathematics: () => import("@tiptap/extension-mathematics").then(m => m.default),
  tableOfContents: () => import("@tiptap/extension-table-of-contents").then(m => m.TableOfContents),
  emoji: () => import("@tiptap/extension-emoji").then(m => m.default),
  mention: () => import("@tiptap/extension-mention").then(m => m.default),
  dragHandle: () => import("@tiptap/extension-drag-handle-react").then(m => m.DragHandle),
};
```

#### Step 2.2: Implement Dynamic Extension Loading
```typescript
const [loadedExtensions, setLoadedExtensions] = useState<Set<string>>(new Set());
const [isLoadingExtension, setIsLoadingExtension] = useState(false);

const loadExtension = useCallback(async (extensionName: keyof typeof LAZY_EXTENSIONS) => {
  if (loadedExtensions.has(extensionName) || !editor) return;
  
  setIsLoadingExtension(true);
  try {
    const ExtensionClass = await LAZY_EXTENSIONS[extensionName]();
    const extension = ExtensionClass.configure({...});
    
    editor.extensionManager.addExtension(extension);
    setLoadedExtensions(prev => new Set([...prev, extensionName]));
  } catch (error) {
    console.error(`Failed to load extension ${extensionName}:`, error);
  } finally {
    setIsLoadingExtension(false);
  }
}, [editor, loadedExtensions]);
```

#### Step 2.3: Update Feature Handlers
```typescript
const addTable = useCallback(async () => {
  if (!editor) return;
  
  // Load TableKit if not already loaded
  if (!loadedExtensions.has('table')) {
    await loadExtension('table');
  }
  
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
}, [editor, loadedExtensions, loadExtension]);
```

---

### Phase 3: Parent Component Optimization

#### Step 3.1: Memoize onChange in Parent Components
```typescript
// In create/page.tsx and edit/page.tsx
const handleContentChange = useCallback((value: string) => {
  const readTime = calculateReadTime(value);
  setFormData(prev => ({
    ...prev,
    content: value,
    readTime: readTime
  }));
}, []); // Empty deps - calculateReadTime is pure function

<TipTap
  value={formData.content}
  stickyTop="top-59"
  onChange={handleContentChange}
/>
```

---

## Performance Metrics

### Current Performance (Baseline)
- **Initial Bundle Size**: ~500KB (estimated with all extensions)
- **Component Re-renders**: ~10-20 per keystroke (estimated)
- **Editor Recreations**: 1-2 per form state change
- **Time to Interactive**: ~2-3 seconds (on 3G)

### Expected Performance (After Optimization)
- **Initial Bundle Size**: ~350KB (30% reduction)
- **Component Re-renders**: ~2-5 per keystroke (60% reduction)
- **Editor Recreations**: 0-1 per form state change (50% reduction)
- **Time to Interactive**: ~1.5-2 seconds (25% improvement)

---

## Risk Assessment

### Low Risk
- ✅ React.memo implementation
- ✅ Parent component onChange memoization
- ✅ Extension configuration memoization

### Medium Risk
- ⚠️ Lazy loading extensions (may cause UX issues if loading is slow)
- ⚠️ Editor recreation when extensions are added dynamically

### Mitigation Strategies
1. Show loading indicators when extensions are being loaded
2. Preload commonly used extensions (TableKit, Mathematics) on hover
3. Cache loaded extensions in component state
4. Fallback to synchronous loading if dynamic import fails

---

## Testing Strategy

### Unit Tests
- Test React.memo comparison function
- Test extension lazy loading
- Test memoized callbacks

### Integration Tests
- Test editor functionality after lazy loading
- Test performance improvements
- Test edge cases (extension loading failures)

### Performance Tests
- Measure bundle size before/after
- Measure render counts before/after
- Measure time to interactive before/after
- Measure memory usage before/after

---

## Implementation Timeline

### Phase 1: React.memo (1-2 hours)
- Low risk, high impact
- Can be done immediately

### Phase 2: Lazy Loading (4-6 hours)
- Medium risk, high impact
- Requires careful testing
- May need iteration based on UX feedback

### Phase 3: Parent Optimization (1 hour)
- Low risk, medium impact
- Quick win

**Total Estimated Time**: 6-9 hours

---

## Next Steps

1. ✅ **Analysis Complete** - This document
2. ⏳ **Implementation** - Start with Phase 1 (React.memo)
3. ⏳ **Testing** - Verify improvements
4. ⏳ **Iteration** - Refine based on results
5. ⏳ **Documentation** - Update TIPTAP_COMPONENTS.md

