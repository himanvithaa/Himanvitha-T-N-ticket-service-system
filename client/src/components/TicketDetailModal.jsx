import React, { useState, useEffect } from 'react';
import './TicketDetailModal.css';
import { formatDate } from '../utils/formatDate';

function TicketDetailModal({ ticketId, onClose, onTicketUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    if (!ticketId) return;

    let isMounted = true;

    const fetchTicketDetails = async () => {
      setLoading(true);
      setFetchError(null);
      setUpdateError(null);

      try {
        const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`);
        if (!response.ok) {
          let errMsg = `HTTP error ${response.status}`;
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errMsg = errData.error;
            }
          } catch {
            if (response.statusText) {
              errMsg = response.statusText;
            }
          }
          throw new Error(errMsg);
        }

        const data = await response.json();
        if (isMounted) {
          setTicket(data);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to fetch ticket details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTicketDetails();

    return () => {
      isMounted = false;
    };
  }, [ticketId]);

  if (!ticketId) return null;

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === ticket?.status) return;

    setUpdatingStatus(true);
    setUpdateError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errMsg =
          (data && data.error) ||
          `Server returned status ${response.status}: ${response.statusText || 'Update failed'}`;
        throw new Error(errMsg);
      }

      // Update displayed ticket with newly returned ticket (includes updated status & updatedAt)
      setTicket(data);

      // Update underlying ticket list in parent component
      if (onTicketUpdated) {
        onTicketUpdated(data);
      }
    } catch (err) {
      setUpdateError(err.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
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
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div className="header-id-badge">
            <span className="detail-ticket-id">#{ticket?.id || ticketId}</span>
            {ticket && (
              <span className={getStatusBadgeClass(ticket.status)}>
                {ticket.status}
              </span>
            )}
          </div>
          <button
            type="button"
            className="detail-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="detail-modal-body">
          {loading && (
            <div className="detail-loading-state">
              <div className="spinner"></div>
              <p>Loading ticket details...</p>
            </div>
          )}

          {fetchError && !loading && (
            <div className="detail-error-banner" role="alert">
              <span>Error: {fetchError}</span>
              <button
                type="button"
                className="retry-button"
                onClick={() => {
                  setLoading(true);
                  setFetchError(null);
                  fetch(`http://localhost:5000/api/tickets/${ticketId}`)
                    .then((r) => r.json())
                    .then((d) => {
                      setTicket(d);
                      setLoading(false);
                    })
                    .catch((err) => {
                      setFetchError(err.message);
                      setLoading(false);
                    });
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && ticket && (
            <>
              {updateError && (
                <div className="detail-error-banner update-error" role="alert">
                  <span>Failed to update status: {updateError}</span>
                </div>
              )}

              <div className="detail-title-section">
                <h3 className="detail-ticket-title">{ticket.title}</h3>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <span className="field-label">Customer Name</span>
                  <span className="field-value">{ticket.customerName}</span>
                </div>

                <div className="detail-field">
                  <span className="field-label">Priority</span>
                  <span className="field-value">
                    <span className={getPriorityBadgeClass(ticket.priority)}>
                      {ticket.priority}
                    </span>
                  </span>
                </div>

                <div className="detail-field">
                  <span className="field-label">Created Date</span>
                  <span className="field-value">{formatDate(ticket.createdAt)}</span>
                </div>

                <div className="detail-field">
                  <span className="field-label">Last Updated Date</span>
                  <span className="field-value">{formatDate(ticket.updatedAt)}</span>
                </div>
              </div>

              <div className="detail-description-section">
                <span className="field-label">Description</span>
                <div className="detail-description-box">
                  {ticket.description || 'No description provided.'}
                </div>
              </div>

              <div className="detail-status-change-section">
                <label htmlFor="ticket-status-select" className="status-label">
                  Change Status:
                </label>
                <div className="status-select-wrapper">
                  <select
                    id="ticket-status-select"
                    className="status-dropdown"
                    value={ticket.status}
                    onChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                  {updatingStatus && (
                    <div className="updating-status-indicator">
                      <span className="status-spinner"></span>
                      <span>Updating...</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="detail-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailModal;
