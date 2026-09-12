import React, { useState } from 'react';
import './CreateTicketModal.css';

function CreateTicketModal({ isOpen, onClose, onSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setCustomerName('');
    setTitle('');
    setDescription('');
    setPriority('');
    setFormError(null);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const validate = () => {
    if (!customerName.trim()) {
      return 'Customer name is required';
    }
    if (!title.trim()) {
      return 'Title is required';
    }
    if (!description.trim()) {
      return 'Description is required';
    }
    if (!priority || !['Low', 'Medium', 'High'].includes(priority)) {
      return 'Please select a priority (Low, Medium, or High)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: customerName.trim(),
          title: title.trim(),
          description: description.trim(),
          priority
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMsg =
          (data && data.error) ||
          `Server returned status ${response.status}: ${response.statusText || 'Error'}`;
        setFormError(errorMsg);
        return;
      }

      // Success: notify parent, reset form, and close modal
      resetForm();
      onSuccess(data);
      onClose();
    } catch (err) {
      setFormError(
        err.message || 'Network error: Could not reach the server. Make sure it is running on port 5000.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Ticket</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
            disabled={submitting}
          >
            &times;
          </button>
        </div>

        <form className="create-ticket-form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-error-banner" role="alert">
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerName">
              Customer Name <span className="required">*</span>
            </label>
            <input
              id="customerName"
              type="text"
              className="form-control"
              placeholder="e.g. Jane Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">
              Title <span className="required">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="form-control"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              className="form-control"
              placeholder="Detailed description of the problem"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              Priority <span className="required">*</span>
            </label>
            <select
              id="priority"
              className="form-control"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={submitting}
            >
              <option value="">Select priority...</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicketModal;
