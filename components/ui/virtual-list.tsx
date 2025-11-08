'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  itemHeight?: number;
  className?: string;
  itemClassName?: string | ((item: T, index: number) => string);
  onItemClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  estimateSize?: (item: T, index: number) => number;
  overscan?: number;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  data,
  renderItem,
  height = 400,
  itemHeight = 50,
  className,
  itemClassName,
  onItemClick,
  emptyMessage = 'No items available',
  estimateSize,
  overscan = 5,
  getItemKey,
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize
      ? (index) => estimateSize(data[index], index)
      : () => itemHeight,
    overscan,
    getItemKey: getItemKey
      ? (index) => getItemKey(data[index], index)
      : undefined,
  });

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn('w-full overflow-auto rounded-md border', className)}
      style={{ height }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = data[virtualItem.index];
          const itemClass =
            typeof itemClassName === 'function'
              ? itemClassName(item, virtualItem.index)
              : itemClassName;

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className={cn(
                'border-b hover:bg-muted/50 transition-colors',
                onItemClick && 'cursor-pointer',
                'data-[state=selected]:bg-muted',
                itemClass
              )}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick?.(item, virtualItem.index)}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

