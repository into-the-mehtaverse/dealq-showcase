"use client";

import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, GridApi, GridReadyEvent, ValueFormatterParams, ModuleRegistry, AllCommunityModule } from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Import legacy CSS for theming
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface TableViewerProps {
  data: any[];
  title?: string;
  description?: string;
  isEditable?: boolean;
  onDataChange?: (newData: any[]) => void;
  className?: string;
  dataType?: 'source' | 'structured';
  sheetName?: string;
  columnValidation?: {
    [columnName: string]: {
      type: 'select' | 'text' | 'number';
      options?: string[];
      required?: boolean;
    };
  };
}

export default function TableViewer({
  data = [],
  title = "Data Table",
  description = "Review and edit data",
  isEditable = false,
  onDataChange,
  className = "",
  dataType = 'structured',
  sheetName,
  columnValidation
}: TableViewerProps) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [currentData, setCurrentData] = useState<any[]>(data);

  // Generate column definitions based on data structure
  const columnDefs = useMemo(() => {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const columns: ColDef[] = [];

    Object.keys(firstRow).forEach((key, index) => {
      const column: ColDef = {
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 120,
        flex: 1,
        editable: isEditable,
        cellStyle: { padding: '8px' },
        headerClass: 'ag-header-cell-custom',
        cellClass: 'ag-cell-custom',
        cellEditorPopup: false,
        singleClickEdit: isEditable
      };

      // Apply column validation if specified
      if (columnValidation && columnValidation[key]) {
        const validation = columnValidation[key];

        if (validation.type === 'select' && validation.options) {
          column.cellEditor = 'agSelectCellEditor';
          column.cellEditorParams = {
            values: validation.options
          };

          // Add validation styling for invalid values
          column.cellClass = (params) => {
            const value = params.value;
            if (value && !validation.options?.includes(value)) {
              return 'ag-cell-custom invalid-cell';
            }
            return 'ag-cell-custom';
          };
        } else if (validation.type === 'number') {
          column.cellEditor = 'agNumberCellEditor';
        } else {
          column.cellEditor = isEditable ? 'agTextCellEditor' : undefined;
        }
      } else {
        column.cellEditor = isEditable ? 'agTextCellEditor' : undefined;
      }

      // Format currency fields
      if (typeof firstRow[key] === 'number' && (
        key.toLowerCase().includes('price') ||
        key.toLowerCase().includes('rent') ||
        key.toLowerCase().includes('amount') ||
        key.toLowerCase().includes('total') ||
        key.toLowerCase().includes('revenue') ||
        key.toLowerCase().includes('expense')
      )) {
        column.valueFormatter = (params: ValueFormatterParams) => {
          if (params.value != null) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(params.value);
          }
          return '';
        };
        column.type = 'numericColumn';
      }

      // Format percentage fields
      if (typeof firstRow[key] === 'number' && (
        key.toLowerCase().includes('rate') ||
        key.toLowerCase().includes('percentage') ||
        key.toLowerCase().includes('percent')
      )) {
        column.valueFormatter = (params: ValueFormatterParams) => {
          if (params.value != null) {
            return `${params.value.toFixed(2)}%`;
          }
          return '';
        };
        column.type = 'numericColumn';
      }

      // Format date fields
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('expiration')) {
        column.valueFormatter = (params: ValueFormatterParams) => {
          if (params.value) {
            return new Date(params.value).toLocaleDateString();
          }
          return '';
        };
      }

      // Add row number column
      if (index === 0) {
        columns.unshift({
          headerName: '#',
          valueGetter: (params) => params.node?.rowIndex ? params.node.rowIndex + 1 : 1,
          width: 60,
          sortable: false,
          filter: false,
          editable: false,
          cellStyle: {
            backgroundColor: '#f8fafc',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        });
      }

      columns.push(column);
    });

    return columns;
  }, [data, isEditable]);

  // Handle grid ready
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  // Handle cell value changes
  const onCellValueChanged = useCallback((params: any) => {
    if (onDataChange) {
      const updatedData = [...currentData];
      const rowIndex = params.node.rowIndex;
      const field = params.colDef.field;

      if (rowIndex >= 0 && rowIndex < updatedData.length && field) {
        updatedData[rowIndex] = {
          ...updatedData[rowIndex],
          [field]: params.newValue
        };

        setCurrentData(updatedData);
        onDataChange(updatedData);
      }
    }
  }, [currentData, onDataChange]);

  // Handle row deletion
  const onRowDelete = useCallback(() => {
    if (gridApi && isEditable) {
      const selectedRows = gridApi.getSelectedRows();
      if (selectedRows.length > 0) {
        const updatedData = currentData.filter(row => !selectedRows.includes(row));
        setCurrentData(updatedData);
        onDataChange?.(updatedData);
        gridApi.deselectAll();
      }
    }
  }, [gridApi, currentData, isEditable, onDataChange]);

  // Handle row addition
  const onRowAdd = useCallback(() => {
    if (isEditable && data.length > 0) {
      const newRow = Object.keys(data[0]).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {} as any);

      const updatedData = [...currentData, newRow];
      setCurrentData(updatedData);
      onDataChange?.(updatedData);
    }
  }, [data, currentData, isEditable, onDataChange]);

  // Export data
  const onExportData = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      });
    }
  }, [gridApi, title]);

    return (
    <div className={`${className}`}>
      <style jsx>{`
        :global(.invalid-cell) {
          background-color: #fef2f2 !important;
          border: 1px solid #f87171 !important;
          color: #dc2626 !important;
        }
        :global(.invalid-cell:hover) {
          background-color: #fee2e2 !important;
        }
      `}</style>

      {data.length === 0 ? (
        <div className="text-center text-slate-400 p-8">
          <div className="text-6xl mb-4">📊</div>
          <h4 className="text-lg font-medium mb-2">No Data Available</h4>
          <p className="text-sm">
            {dataType === 'source'
              ? 'Source data will appear here during verification'
              : 'Structured data will appear here after processing'
            }
          </p>
        </div>
      ) : (
        <div className="ag-theme-alpine w-full rounded-lg overflow-hidden">
          <AgGridReact
            theme="legacy"
            columnDefs={columnDefs}
            rowData={currentData}
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            rowSelection={isEditable ? 'multiple' : undefined}
            suppressRowClickSelection={!isEditable}
            enableFillHandle={isEditable}
            enableCellTextSelection={true}
            suppressCopyRowsToClipboard={false}
            editType="fullRow"
            stopEditingWhenCellsLoseFocus={true}
            enterNavigatesVertically={true}
            enterNavigatesVerticallyAfterEdit={true}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              minWidth: 100,
              flex: 1,
              editable: isEditable,
              singleClickEdit: isEditable,
              cellEditor: isEditable ? 'agTextCellEditor' : undefined,
              cellEditorPopup: false,
            }}
            domLayout="autoHeight"
            pagination={true}
            paginationPageSize={50}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            animateRows={true}
            rowHeight={35}
            headerHeight={45}
            suppressRowHoverHighlight={false}
            suppressCellFocus={false}
            suppressFieldDotNotation={true}
            suppressMenuHide={true}
            suppressMovableColumns={false}
            suppressColumnVirtualisation={false}
            suppressRowVirtualisation={false}
            suppressAnimationFrame={false}
            suppressBrowserResizeObserver={false}
            suppressColumnMoveAnimation={false}
            suppressLoadingOverlay={false}
            suppressNoRowsOverlay={false}
            suppressRowTransform={false}
          />
        </div>
      )}
    </div>
  );
}
