import React, { useState, useEffect, useCallback } from 'react';
import './TicketList.css';
import FilterBar from './FilterBar';
import CreateTicketModal from './CreateTicketModal';
import TicketDetailModal from './TicketDetailModal';
import { formatDate } from '../utils/formatDate';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [filters, setFilters] = useState({
    status: 'All',
    priority: 'All',
    customer: '',
    search: '',
  });

  const hasActiveFilters = Boolean(
    (filters.status && filters.status !== 'All') ||
    (filters.priority && filters.priority !== 'All') ||
    (filters.customer && filters.customer.trim()) ||
    (filters.search && filters.search.trim())
  );

  const fetchTickets = useCallback(
    async (targetPage = page, targetLimit = limit, activeFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('page', targetPage);
        params.append('limit', targetLimit);

        if (activeFilters.status && activeFilters.status !== 'All') {
          params.append('status', activeFilters.status);
        }
        if (activeFilters.priority && activeFilters.priority !== 'All') {
          params.append('priority', activeFilters.priority);
        }
        if (activeFilters.customer && activeFilters.customer.trim()) {
          params.append('customer', activeFilters.customer.trim());
        }
        if (activeFilters.search && activeFilters.search.trim()) {
          params.append('search', activeFilters.search.trim());
        }

        const response = await fetch(
          `http://localhost:5000/api/tickets?${params.toString()}`
        );
        if (!response.ok) {
          let errorMessage = `HTTP error ${response.status}`;
          try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = errorData.error;
            }
          } catch {
            if (response.statusText) {
              errorMessage = response.statusText;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Handle both { tickets, totalCount, totalPages } and array fallback
        if (Array.isArray(data)) {
          setTickets(data);
          setTotalCount(data.length);
          setTotalPages(Math.max(1, Math.ceil(data.length / targetLimit)));
        } else {
          setTickets(Array.isArray(data.tickets) ? data.tickets : []);
          setTotalCount(typeof data.totalCount === 'number' ? data.totalCount : 0);
          setTotalPages(typeof data.totalPages === 'number' ? Math.max(1, data.totalPages) : 1);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch tickets');
      } finally {
        setLoading(false);
      }
    },
    [page, limit, filters]
  );

  useEffect(() => {
    fetchTickets(page, limit, filters);
  }, [fetchTickets, page, limit, filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'All',
      priority: 'All',
      customer: '',
      search: '',
    });
    setPage(1);
  };

  const handleTicketCreated = () => {
    // Refresh to page 1 so user can see the newly created ticket at the top
    if (page === 1) {
      fetchTickets(1, limit, filters);
    } else {
      setPage(1);
    }
  };

  const handleTicketUpdated = (updatedTicket) => {
    // Update the ticket in the local list immediately without full page reload
    setTickets((prevTickets) =>
      prevTickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'badge badge-priority-high';
      case 'medium':
        return 'badge badge-priority-medium';
      case 'low':
        return 'badge badge-priority-low';
      default:
        return 'badge';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'badge badge-status-open';
      case 'in progress':
        return 'badge badge-status-in-progress';
      case 'resolved':
        return 'badge badge-status-resolved';
      case 'closed':
        return 'badge badge-status-closed';
      default:
        return 'badge';
    }
  };

  return (
    <div className="ticket-list-container">
      <div className="ticket-list-header">
        <div className="header-title-group">
          <h2>Tickets</h2>
          {!loading && !error && (
            <span className="ticket-count">
              {totalCount} total {totalCount === 1 ? 'ticket' : 'tickets'}
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn-create-ticket"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Create Ticket
        </button>
      </div>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleTicketCreated}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={handleTicketUpdated}
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-container">
          <span className="error-message">Error: {error}</span>
          <button
            className="retry-button"
            onClick={() => fetchTickets(page, limit, filters)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">
          {tickets.length === 0 ? (
            <div className="empty-state" data-testid="empty-state">
              <p data-testid="empty-message">
                {hasActiveFilters
                  ? 'No tickets match your filters'
                  : 'No tickets found.'}
              </p>
            </div>
          ) : (
            <>
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer Name</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created Date</th>
                    <th>Last Updated Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="ticket-row-clickable"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      title="Click to view ticket details"
                    >
                      <td className="ticket-id" data-label="ID">#{ticket.id}</td>
                      <td data-label="Customer Name">{ticket.customerName}</td>
                      <td className="ticket-title" data-label="Title">{ticket.title}</td>
                      <td data-label="Priority">
                        <span className={getPriorityBadgeClass(ticket.priority)}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={getStatusBadgeClass(ticket.status)}>
                          {ticket.status}
                        </span>
                      </td>
                      <td data-label="Created Date">{formatDate(ticket.createdAt)}</td>
                      <td data-label="Last Updated Date">{formatDate(ticket.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing Page <span className="pagination-current">{page}</span> of{' '}
                  <span className="pagination-total">{totalPages}</span> ({totalCount}{' '}
                  {totalCount === 1 ? 'ticket' : 'tickets'} total)
                </div>

                <div className="pagination-actions">
                  <button
                    type="button"
                    className="pagination-button"
                    onClick={handlePrevPage}
                    disabled={page <= 1 || loading}
                    aria-label="Previous Page"
                  >
                    &larr; Previous
                  </button>

                  <span className="pagination-page-indicator">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="pagination-button"
                    onClick={handleNextPage}
                    disabled={page >= totalPages || loading}
                    aria-label="Next Page"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TicketList;
