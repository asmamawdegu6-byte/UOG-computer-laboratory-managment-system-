import React from 'react';
import './Table.css';

const Table = ({ 
  columns, 
  data, 
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Helper to get nested value from object (e.g., 'lab.name')
  const getNestedValue = (obj, path) => {
    if (!path) return '';
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : '', obj);
  };

  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th 
                key={column.key || column.accessor || index}
                style={{ width: column.width }}
                className={column.align ? `text-${column.align}` : ''}
              >
                {column.title || column.header || ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row._id || row.id || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column, colIndex) => {
                const key = column.key || column.accessor || colIndex;
                const value = column.accessor ? getNestedValue(row, column.accessor) : row[column.key];
                return (
                  <td 
                    key={key}
                    className={column.align ? `text-${column.align}` : ''}
                  >
                    {column.render 
                      ? (column.render.length === 1 ? column.render(row) : column.render(value, row))
                      : (value !== undefined && value !== null ? value : '-')
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
