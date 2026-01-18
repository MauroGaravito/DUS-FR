import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: 'engineer@example.com', password: 'password123' });
  const [visits, setVisits] = useState([]);
  const [visitForm, setVisitForm] = useState({ projectName: '', location: '' });
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [entries, setEntries] = useState([]);
  const [entryForm, setEntryForm] = useState({ type: 'text', text: '', isFinding: false });
  const [entryFile, setEntryFile] = useState(null);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const authedFetch = async (path, options = {}) => {
    const headers = options.headers || {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  useEffect(() => {
    if (token) {
      authedFetch('/users/me')
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
      fetchVisits();
    }
  }, [token]);

  useEffect(() => {
    if (selectedVisit) {
      fetchEntries(selectedVisit._id);
      fetchReport(selectedVisit._id);
    }
  }, [selectedVisit]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setMessage('Logged in');
    } else {
      setMessage(data.message || 'Login failed');
    }
  };

  const fetchVisits = async () => {
    if (!token) return;
    const res = await authedFetch('/visits');
    const data = await res.json();
    if (res.ok) {
      setVisits(data.visits || []);
    }
  };

  const createVisit = async (e) => {
    e.preventDefault();
    const res = await authedFetch('/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitForm)
    });
    const data = await res.json();
    if (res.ok) {
      setVisits([data.visit, ...visits]);
      setVisitForm({ projectName: '', location: '' });
      setMessage('Visit created');
    } else {
      setMessage(data.message || 'Could not create visit');
    }
  };

  const fetchEntries = async (visitId) => {
    const res = await authedFetch(`/visits/${visitId}/entries`);
    const data = await res.json();
    if (res.ok) {
      setEntries(data.entries || []);
    }
  };

  const submitEntry = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;

    if (entryForm.type === 'text') {
      try {
        const res = await authedFetch(`/visits/${selectedVisit._id}/entries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'text',
            text: entryForm.text,
            isFinding: entryForm.isFinding
          })
        });
        const data = await res.json();
        if (res.ok) {
          setEntries([data.entry, ...entries]);
          setEntryForm({ ...entryForm, text: '', isFinding: false });
          setMessage('Entry added');
        } else {
          setMessage(data.message || 'Could not add entry');
        }
      } catch {
        setMessage('Could not add entry');
      }
    } else {
      if (!entryFile) {
        setMessage('Select a file first');
        return;
      }
      setUploadingAudio(entryForm.type === 'audio');
      const formData = new FormData();
      formData.append('type', entryForm.type);
      formData.append('file', entryFile);
      formData.append('isFinding', entryForm.isFinding);
      try {
        const res = await authedFetch(`/visits/${selectedVisit._id}/entries`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (res.ok) {
          setEntries([data.entry, ...entries]);
          setEntryFile(null);
          setMessage('Entry added');
        } else {
          setMessage(data.message || 'Could not add entry');
        }
      } catch {
        setMessage('Upload failed');
      } finally {
        setUploadingAudio(false);
      }
    }
  };

  const updateEntryStatus = async (entryId, status) => {
    try {
      const res = await authedFetch(`/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(entries.map((e) => (e._id === entryId ? data.entry : e)));
        setMessage('Entry updated');
      } else {
        setMessage(data.message || 'Update failed');
      }
    } catch {
      setMessage('Update failed');
    }
  };

  const generateReport = async () => {
    if (!selectedVisit) return;
    setGeneratingReport(true);
    try {
      const res = await authedFetch(`/visits/${selectedVisit._id}/generate-report`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setMessage('Report generated');
      } else {
        setMessage(data.message || 'Report failed');
      }
    } catch {
      setMessage('Report failed');
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchReport = async (visitId) => {
    const res = await authedFetch(`/visits/${visitId}/report`);
    const data = await res.json();
    if (res.ok) {
      setReport(data.report);
    } else {
      setReport(null);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSelectedVisit(null);
    setEntries([]);
    setReport(null);
  };

  const hasAcceptedEntries = entries.some((e) => e.status === 'accepted' && !e.deleted);

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h1>DUS Field Reports</h1>
        <form onSubmit={handleLogin}>
          <div>
            <label>Email</label>
            <input
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
          </div>
          <button type="submit">Login</button>
        </form>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20 }}>
      <div style={{ width: '25%', minWidth: 240 }}>
        <h2>Welcome {user?.name}</h2>
        <button onClick={logout}>Logout</button>
        <h3>Create Visit</h3>
        <form onSubmit={createVisit}>
          <input
            placeholder="Project name"
            value={visitForm.projectName}
            onChange={(e) => setVisitForm({ ...visitForm, projectName: e.target.value })}
          />
          <input
            placeholder="Location"
            value={visitForm.location}
            onChange={(e) => setVisitForm({ ...visitForm, location: e.target.value })}
          />
          <button type="submit">Save</button>
        </form>
        <h3>Visits</h3>
        <ul>
          {visits.map((v) => (
            <li key={v._id}>
              <button onClick={() => setSelectedVisit(v)}>
                {v.projectName} - {v.location}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        {selectedVisit ? (
          <>
            <h2>Visit: {selectedVisit.projectName}</h2>
            <p>Location: {selectedVisit.location}</p>
            <p>Status: {selectedVisit.status}</p>

            <h3>Add Entry</h3>
            <form onSubmit={submitEntry}>
              <label>
                Type
                <select
                  value={entryForm.type}
                  onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="audio">Audio</option>
                  <option value="photo">Photo</option>
                </select>
              </label>
              {entryForm.type === 'text' ? (
                <textarea
                  rows="3"
                  placeholder="Details"
                  value={entryForm.text}
                  onChange={(e) => setEntryForm({ ...entryForm, text: e.target.value })}
                />
              ) : (
                <input type="file" onChange={(e) => setEntryFile(e.target.files?.[0] || null)} />
              )}
              <label>
                <input
                  type="checkbox"
                  checked={entryForm.isFinding}
                  onChange={(e) => setEntryForm({ ...entryForm, isFinding: e.target.checked })}
                />
                Mark as finding
              </label>
              <button type="submit" disabled={uploadingAudio && entryForm.type === 'audio'}>
                {uploadingAudio && entryForm.type === 'audio' ? 'Uploading...' : 'Add Entry'}
              </button>
            </form>

            <h3>Entries</h3>
            <ul>
              {entries.map((entry) => (
                <li key={entry._id} style={{ marginBottom: 8 }}>
                  <div>
                    <strong>{entry.type}</strong> — {entry.status} {entry.isFinding ? '(Finding)' : ''}
                  </div>
                  {entry.text && <div>{entry.text}</div>}
                  {entry.fileUrl && (
                    <div>
                      <a href={entry.fileUrl} target="_blank" rel="noreferrer">
                        File
                      </a>
                    </div>
                  )}
                  {entry.type === 'audio' && (
                    <div>
                      <button onClick={() => updateEntryStatus(entry._id, 'accepted')}>Accept</button>
                      <button onClick={() => updateEntryStatus(entry._id, 'rejected')}>Reject</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div>
              <button onClick={generateReport} disabled={!hasAcceptedEntries || generatingReport}>
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
              {!hasAcceptedEntries && <p>No accepted entries yet.</p>}
            </div>
            {report && (
              <div>
                <h3>Report</h3>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{report.content}</pre>
              </div>
            )}
          </>
        ) : (
          <p>Select a visit to view details</p>
        )}
      </div>
      <div style={{ width: '20%', minWidth: 160 }}>
        <h3>Status</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

export default App;
