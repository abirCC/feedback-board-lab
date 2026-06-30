'use client';

import { useEffect, useState } from 'react';

const NAME_MAX_LENGTH = 100;
const TEXT_MAX_LENGTH = 2000;

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('success');

  function showStatus(message, type = 'success') {
    setStatus(message);
    setStatusType(type);
  }

  async function loadFeedback() {
    try {
      const res = await fetch('/api/feedback');

      if (!res.ok) {
        throw new Error('Failed to load feedback');
      }

      const data = await res.json();
      setFeedbackList(data);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedText = text.trim();

    if (!trimmedName || !trimmedText) {
      showStatus('Name and feedback are required.', 'error');
      return;
    }

    if (trimmedName.length > NAME_MAX_LENGTH || trimmedText.length > TEXT_MAX_LENGTH) {
      showStatus('Name or feedback is too long.', 'error');
      return;
    }

    showStatus('Submitting...');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, text: trimmedText }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit feedback.');
      }

      setName('');
      setText('');
      showStatus('Submitted!');
      loadFeedback();
    } catch (error) {
      showStatus(error.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!adminKey.trim()) {
      showStatus('Admin key is required to delete feedback.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error(res.status === 403 ? 'Invalid admin key.' : 'Failed to delete feedback.');
      }

      showStatus('Feedback deleted.');
      loadFeedback();
    } catch (error) {
      showStatus(error.message, 'error');
    }
  }

  return (
    <div>
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '500px' }}>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          maxLength={NAME_MAX_LENGTH}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <textarea
          placeholder="Your feedback"
          value={text}
          maxLength={TEXT_MAX_LENGTH}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Submit
        </button>
        {status && (
          <p style={{ color: statusType === 'error' ? '#c00' : 'green' }}>
            {status}
          </p>
        )}
      </form>

      <h2 style={{ marginTop: '2rem' }}>All Feedback</h2>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxWidth: '500px', marginBottom: '1rem' }}>
        <span>Admin key</span>
        <input
          type="password"
          placeholder="Required for deleting feedback"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem' }}
        />
      </label>
      {feedbackList.length === 0 && <p>No feedback yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {feedbackList.map((item) => (
          <li
            key={item.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <strong>{item.name}</strong>
            <span style={{ color: '#888', marginLeft: '1rem', fontSize: '0.85rem' }}>
              {item.createdAt}
            </span>
            <p>{item.text}</p>
            <button
              onClick={() => handleDelete(item.id)}
              style={{ background: '#c00', color: '#fff', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '3px' }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
