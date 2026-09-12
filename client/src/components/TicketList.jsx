import React, { useState, useEffect } from 'react';
import './TicketList.css';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/tickets');
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
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleString();
    } catch {
      return dateStr;
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
        <h2>Tickets</h2>
        {!loading && !error && (
          <span className="ticket-count">{tickets.length} total tickets</span>
        )}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tickets...</p>
        </div>
      )}

      {error && !loading && (
        <div className="error-container">
          <span className="error-message">Error: {error}</span>
          <button className="retry-button" onClick={fetchTickets}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="table-wrapper">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets found.</p>
            </div>
          ) : (
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
                  <tr key={ticket.id}>
                    <td className="ticket-id">#{ticket.id}</td>
                    <td>{ticket.customerName}</td>
                    <td className="ticket-title">{ticket.title}</td>
                    <td>
                      <span className={getPriorityBadgeClass(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{formatDate(ticket.createdAt)}</td>
                    <td>{formatDate(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default TicketList;
