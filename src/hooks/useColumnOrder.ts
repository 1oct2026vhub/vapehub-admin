import { useState, useEffect, useCallback, useMemo } from 'react';
import { MRT_ColumnDef } from 'material-react-table';

/**
 * A custom hook for managing column ordering with localStorage persistence
 * @param tableId - Unique ID for the table to store/retrieve column order
 * @param defaultColumns - Default column definitions
 * @returns An object with columns, columnOrder, and handlers for column ordering
 */
const useColumnOrder = <T extends Record<string, any>>(
  tableId: string,
  defaultColumns: MRT_ColumnDef<T>[]
) => {
  const storageKey = `table_columns_order_${tableId}`;
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  // Load column order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(storageKey);
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setColumnOrder(parsedOrder);
      } catch (error) {
        console.error(`Error parsing saved column order for ${tableId}:`, error);
        // If parsing fails, use default order
        setColumnOrder(defaultColumns.map(col => col.accessorKey as string));
      }
    } else {
      // If no saved order, use default order
      setColumnOrder(defaultColumns.map(col => col.accessorKey as string));
    }
  }, [defaultColumns, storageKey]);

  // Handle column reordering
  const handleColumnOrderChange = useCallback((newColumnOrder: string[]) => {
    setColumnOrder(newColumnOrder);
    localStorage.setItem(storageKey, JSON.stringify(newColumnOrder));
  }, [storageKey]);

  // Apply the column order
  const columns = useMemo<MRT_ColumnDef<T>[]>(() => {
    if (!columnOrder.length) return defaultColumns;

    // Create a copy of default columns with ordering applied
    const orderedColumns: MRT_ColumnDef<T>[] = [];
    
    // First add columns that exist in both columnOrder and defaultColumns
    columnOrder.forEach(key => {
      const column = defaultColumns.find(col => col.accessorKey === key);
      if (column) {
        orderedColumns.push(column);
      }
    });
    
    // Then add any new columns that exist in defaultColumns but not in columnOrder
    defaultColumns.forEach(column => {
      if (!columnOrder.includes(column.accessorKey as string)) {
        orderedColumns.push(column);
      }
    });
    
    return orderedColumns;
  }, [defaultColumns, columnOrder]);

  // Column order change handler that works with Material React Table's onColumnOrderChange
  const onColumnOrderChange = useCallback((updaterFn: any) => {
    // Material React Table passes a function that accepts the old order and returns the new order
    const newColumnOrder = typeof updaterFn === 'function' 
      ? updaterFn(columnOrder)
      : updaterFn;
      
    handleColumnOrderChange(newColumnOrder);
  }, [columnOrder, handleColumnOrderChange]);

  return {
    columns,
    columnOrder,
    handleColumnOrderChange,
    onColumnOrderChange
  };
};

export default useColumnOrder; 