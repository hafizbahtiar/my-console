# Virtual Scrolling Implementation Guide

## Overview

My Console includes virtual scrolling components for efficiently rendering large lists and tables. Virtual scrolling only renders the visible items in the viewport, dramatically improving performance for datasets with hundreds or thousands of items.

## Features

- ✅ **High Performance**: Only renders visible items, handles 10,000+ items smoothly
- ✅ **Dynamic Row Heights**: Supports variable row heights with automatic measurement
- ✅ **TypeScript Support**: Full type safety with generic components
- ✅ **Flexible API**: Easy to customize and extend
- ✅ **Responsive**: Works on all screen sizes

## Architecture

### Components

1. **`VirtualList`** (`components/ui/virtual-list.tsx`)
   - Generic list component for any data type
   - Supports custom item rendering
   - Variable item heights

2. **`VirtualTable`** (`components/ui/virtual-table.tsx`)
   - Table-specific virtual scrolling component
   - Column-based layout
   - Sticky header support

3. **`AuditTableVirtual`** (`components/app/auth/audit/audit-table-virtual.tsx`)
   - Example implementation for audit logs
   - Expandable rows with virtual scrolling

## Installation

The virtual scrolling implementation uses `@tanstack/react-virtual`:

```bash
bun add @tanstack/react-virtual
```

## Usage

### Basic Virtual List

```tsx
import { VirtualList } from '@/components/ui/virtual-list';

interface Item {
  id: string;
  name: string;
}

function MyComponent() {
  const items: Item[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    // ... thousands more
  ];

  return (
    <VirtualList
      data={items}
      renderItem={(item, index) => (
        <div className="p-4 border-b">
          <h3>{item.name}</h3>
        </div>
      )}
      height={600}
      itemHeight={60}
      getItemKey={(item) => item.id}
    />
  );
}
```

### Virtual Table

```tsx
import { VirtualTable } from '@/components/ui/virtual-table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function UsersTable() {
  const users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    // ... thousands more
  ];

  return (
    <VirtualTable
      data={users}
      columns={[
        {
          header: 'Name',
          accessor: 'name',
          width: 200,
        },
        {
          header: 'Email',
          accessor: 'email',
          width: 250,
        },
        {
          header: 'Role',
          accessor: 'role',
          width: 150,
        },
        {
          header: 'Actions',
          accessor: (user) => (
            <button onClick={() => handleEdit(user)}>Edit</button>
          ),
          width: 100,
        },
      ]}
      height={600}
      rowHeight={50}
      onRowClick={(user) => console.log('Clicked:', user)}
    />
  );
}
```

### Variable Row Heights

For rows with different heights (e.g., expandable rows):

```tsx
import { VirtualList } from '@/components/ui/virtual-list';
import { useState } from 'react';

function ExpandableList() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const items = [...]; // Your data

  const estimateSize = (item: Item) => {
    // Return estimated height based on expanded state
    return expandedItems.has(item.id) ? 200 : 60;
  };

  const renderItem = (item: Item, index: number) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <div>
        <div onClick={() => toggleExpanded(item.id)}>
          {item.name}
        </div>
        {isExpanded && (
          <div>
            {/* Expanded content */}
          </div>
        )}
      </div>
    );
  };

  return (
    <VirtualList
      data={items}
      renderItem={renderItem}
      height={600}
      itemHeight={60}
      estimateSize={estimateSize}
    />
  );
}
```

## API Reference

### VirtualList Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of items to render |
| `renderItem` | `(item: T, index: number) => React.ReactNode` | Required | Function to render each item |
| `height` | `number` | `400` | Height of the scrollable container |
| `itemHeight` | `number` | `50` | Default height of each item |
| `className` | `string` | - | Additional CSS classes |
| `itemClassName` | `string \| (item: T, index: number) => string` | - | CSS classes for items |
| `onItemClick` | `(item: T, index: number) => void` | - | Click handler for items |
| `emptyMessage` | `string` | `'No items available'` | Message when data is empty |
| `estimateSize` | `(item: T, index: number) => number` | - | Function to estimate item height |
| `overscan` | `number` | `5` | Number of items to render outside viewport |
| `getItemKey` | `(item: T, index: number) => string \| number` | - | Function to get unique key for items |

### VirtualTable Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | Required | Array of rows to render |
| `columns` | `Column<T>[]` | Required | Column definitions |
| `height` | `number` | `600` | Height of the table |
| `rowHeight` | `number` | `50` | Default height of each row |
| `className` | `string` | - | Additional CSS classes |
| `headerClassName` | `string` | - | CSS classes for header |
| `rowClassName` | `string \| (row: T, index: number) => string` | - | CSS classes for rows |
| `onRowClick` | `(row: T, index: number) => void` | - | Click handler for rows |
| `emptyMessage` | `string` | `'No data available'` | Message when data is empty |
| `estimateSize` | `(row: T, index: number) => number` | - | Function to estimate row height |
| `overscan` | `number` | `5` | Number of rows to render outside viewport |

### Column Definition

```typescript
interface Column<T> {
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  width?: number; // Percentage or pixel width
}
```

## Performance Considerations

### When to Use Virtual Scrolling

✅ **Use virtual scrolling when**:
- Rendering 100+ items
- Items have complex rendering logic
- Performance is critical
- Memory usage is a concern

❌ **Don't use virtual scrolling when**:
- Rendering < 50 items
- Items are very simple
- You need native browser scrolling behavior
- Items have unpredictable heights (unless using `estimateSize`)

### Performance Tips

1. **Use `getItemKey`**: Always provide a stable key function for better performance
2. **Optimize `estimateSize`**: Accurate estimates improve scrolling smoothness
3. **Adjust `overscan`**: Higher values = smoother scrolling but more DOM nodes
4. **Memoize render functions**: Use `useCallback` for `renderItem` if it depends on props
5. **Avoid inline styles**: Use CSS classes for better performance

## Examples

### Audit Logs Table

See `components/app/auth/audit/audit-table-virtual.tsx` for a complete example with:
- Expandable rows
- Variable row heights
- Complex nested content
- Click handlers

### Blog Posts List

```tsx
<VirtualList
  data={blogPosts}
  renderItem={(post, index) => (
    <div className="p-4 border-b">
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <div className="flex gap-2">
        <Badge>{post.status}</Badge>
        <span>{post.author}</span>
      </div>
    </div>
  )}
  height={800}
  itemHeight={120}
  getItemKey={(post) => post.$id}
/>
```

### Community Posts Table

```tsx
<VirtualTable
  data={communityPosts}
  columns={[
    { header: 'Title', accessor: 'title', width: 300 },
    { header: 'Author', accessor: 'author', width: 150 },
    { header: 'Status', accessor: (post) => <StatusBadge status={post.status} />, width: 100 },
    { header: 'Created', accessor: (post) => formatDate(post.$createdAt), width: 150 },
  ]}
  height={600}
  rowHeight={60}
  onRowClick={(post) => router.push(`/community/posts/${post.$id}`)}
/>
```

## Migration Guide

### From Regular List to Virtual List

**Before:**
```tsx
<div className="h-[600px] overflow-auto">
  {items.map((item) => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

**After:**
```tsx
<VirtualList
  data={items}
  renderItem={(item) => <div>{item.name}</div>}
  height={600}
  itemHeight={50}
  getItemKey={(item) => item.id}
/>
```

### From Regular Table to Virtual Table

**Before:**
```tsx
<Table>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

**After:**
```tsx
<VirtualTable
  data={rows}
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
  ]}
  height={600}
  rowHeight={50}
/>
```

## Troubleshooting

### Items Not Rendering

- Check that `data` array is not empty
- Verify `renderItem` function returns valid React nodes
- Ensure `height` prop is set correctly

### Scrolling Not Smooth

- Increase `overscan` value (default: 5)
- Provide accurate `estimateSize` function
- Check for expensive operations in `renderItem`

### Incorrect Item Heights

- Use `estimateSize` for variable heights
- Ensure estimates are reasonably accurate
- Consider using fixed heights if possible

### Performance Issues

- Use `getItemKey` with stable keys
- Memoize `renderItem` function
- Reduce complexity of item rendering
- Check for unnecessary re-renders

## Best Practices

1. **Always provide keys**: Use `getItemKey` for stable item identification
2. **Estimate heights accurately**: Better estimates = smoother scrolling
3. **Keep render functions simple**: Move complex logic to separate components
4. **Test with large datasets**: Verify performance with 1000+ items
5. **Consider accessibility**: Ensure keyboard navigation works correctly

## Related Documentation

- [PAGINATION_OPTIMIZATION.md](./PAGINATION_OPTIMIZATION.md) - Pagination strategies
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [TIPTAP_PERFORMANCE_ANALYSIS.md](./TIPTAP_PERFORMANCE_ANALYSIS.md) - Performance optimizations

---

**Last Updated**: November 11, 2025

