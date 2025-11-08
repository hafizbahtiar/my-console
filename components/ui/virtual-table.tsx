'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Table, TableHeader, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface VirtualTableProps<T> {
  data: T[];
  columns: {
    header: string | React.ReactNode;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
    headerClassName?: string;
    width?: number;
  }[];
  height?: number;
  rowHeight?: number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  estimateSize?: (row: T, index: number) => number;
  overscan?: number;
}

export function VirtualTable<T extends { $id?: string; id?: string }>({
  data,
  columns,
  height = 600,
  rowHeight = 50,
  className,
  headerClassName,
  rowClassName,
  onRowClick,
  emptyMessage = 'No data available',
  estimateSize,
  overscan = 5,
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize
      ? (index) => estimateSize(data[index], index)
      : () => rowHeight,
    overscan,
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
        {/* Table Header */}
        <div
          className={cn(
            'sticky top-0 z-10 bg-background border-b',
            headerClassName
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead
                    key={index}
                    className={cn(column.headerClassName || column.className)}
                    style={{ width: column.width || `${100 / columns.length}%` }}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* Virtual Rows */}
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = data[virtualRow.index];
          const rowClass =
            typeof rowClassName === 'function'
              ? rowClassName(row, virtualRow.index)
              : rowClassName;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={cn(
                'w-full',
                rowClass
              )}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Table>
                <TableRow
                  className={cn(
                    onRowClick && 'cursor-pointer',
                    rowClass
                  )}
                  onClick={() => onRowClick?.(row, virtualRow.index)}
                >
                  {columns.map((column, colIndex) => {
                    const cellContent =
                      typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : (row[column.accessor] as React.ReactNode);

                    return (
                      <TableCell
                        key={colIndex}
                        className={column.className}
                        style={{ width: column.width || `${100 / columns.length}%` }}
                      >
                        {cellContent}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </Table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

