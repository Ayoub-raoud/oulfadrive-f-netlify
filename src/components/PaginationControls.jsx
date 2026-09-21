import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  pageSizeOptions = [10, 20, 50, 100],
  className = '',
}) => {
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const handleItemsPerPageChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onItemsPerPageChange(newSize);
    // Reset to page 1 when changing page size
    if (currentPage !== 1) onPageChange(1);
  };

  if (totalPages <= 1 && totalItems <= itemsPerPage) {
    return null; // No pagination needed
  }

  // Generate page numbers to display (max 5)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <>
      <div className={`pagination-controls ${className}`}>
        <div className="pagination-info">
          <span>
            {totalItems} élément(s) — Page {currentPage} sur {totalPages}
          </span>
          <div className="pagination-size-selector">
            <label htmlFor="itemsPerPage">Lignes par page :</label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pagination-buttons">
          <button
            className="page-btn"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Première page"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="page-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Page précédente"
          >
            <ChevronLeft size={16} />
          </button>

          {pageNumbers.map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="page-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="page-btn"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Dernière page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          width: 100%;
        }

        .pagination-info {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: #64748b;
          flex-wrap: wrap;
        }

        .pagination-size-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
        }

        .pagination-size-selector label {
          font-weight: 500;
        }

        .pagination-size-selector select {
          padding: 0.4rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.8rem;
          background: #fff;
          cursor: pointer;
          font-family: inherit;
          color: #334155;
          transition: all 0.2s;
        }

        .pagination-size-selector select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }

        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-wrap: wrap;
        }

        .page-btn {
          min-width: 2.25rem;
          height: 2.25rem;
          padding: 0 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
          transform: translateY(-1px);
        }

        .page-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
        }

        .page-btn.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: #f8fafc;
        }

        @media (max-width: 768px) {
          .pagination-controls {
            flex-direction: column;
            align-items: stretch;
          }
          .pagination-info {
            justify-content: space-between;
          }
          .pagination-buttons {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
};

export default PaginationControls;