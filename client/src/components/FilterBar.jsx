import React from 'react';
import './FilterBar.css';

function FilterBar({ filters, onFilterChange, onClearFilters }) {
  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== 'All') ||
    (filters.priority && filters.priority !== 'All') ||
    (filters.customer && filters.customer.trim()) ||
    (filters.search && filters.search.trim())
  );

  return (
    <div className="filter-bar" data-testid="filter-bar" role="search" aria-label="Filter tickets">
      <div className="filter-group">
        <label htmlFor="filter-status" className="filter-label">
          Status
        </label>
        <select
          id="filter-status"
          data-testid="filter-status"
          className="filter-select"
          value={filters.status || 'All'}
          onChange={(e) => onFilterChange('status', e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-priority" className="filter-label">
          Priority
        </label>
        <select
          id="filter-priority"
          data-testid="filter-priority"
          className="filter-select"
          value={filters.priority || 'All'}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="All">All</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-customer" className="filter-label">
          Customer Name
        </label>
        <input
          type="text"
          id="filter-customer"
          data-testid="filter-customer"
          className="filter-input"
          placeholder="Filter by customer name..."
          value={filters.customer}
          onChange={(e) => onFilterChange('customer', e.target.value)}
          aria-label="Filter by customer name"
        />
      </div>

      <div className="filter-group filter-group-search">
        <label htmlFor="filter-search" className="filter-label">
          Search
        </label>
        <input
          type="text"
          id="filter-search"
          data-testid="filter-search"
          className="filter-input"
          placeholder="Search title or customer..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          aria-label="Search title or customer"
        />
      </div>

      {hasActiveFilters && (
        <div className="filter-group filter-group-actions">
          <label className="filter-label">&nbsp;</label>
          <button
            type="button"
            data-testid="filter-clear-btn"
            className="filter-clear-btn"
            onClick={onClearFilters}
            title="Reset all filters"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterBar;
