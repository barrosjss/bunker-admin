"use client";

import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/formatting";

type TableProps = HTMLAttributes<HTMLTableElement>;

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-border">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <thead
        ref={ref}
        className={cn("bg-surface-elevated", className)}
        {...props}
      >
        {children}
      </thead>
    );
  }
);

TableHeader.displayName = "TableHeader";

type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = "TableBody";

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable = true, children, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b border-border transition-colors",
          hoverable && "hover:bg-surface-elevated/50 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          "h-12 px-4 text-left align-middle font-medium text-text-secondary",
          "[&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </th>
    );
  }
);

TableHead.displayName = "TableHead";

type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          "px-4 py-3 align-middle text-text-primary",
          "[&:has([role=checkbox])]:pr-0",
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);

TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
