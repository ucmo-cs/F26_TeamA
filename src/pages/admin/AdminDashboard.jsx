import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api, formatCurrency, formatDisplayDate } from '../../api';

export default function AdminDashboard() {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/loans')
      .then((data) => setLoans(data.loans))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function deleteLoan(id) {
    if (!confirm('Delete this loan?')) return;
    try {
      await api(`/admin/loans/${id}`, { method: 'DELETE' });
      setLoans((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const active = loans.filter((l) => l.balance > 0);
  const totalOwed = active.reduce((sum, l) => sum + Number(l.balance), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>Outstanding loans</h1>
          <p className="muted">Balances and schedules.</p>
        </div>
        <Link className="btn primary" to="/admin/loans/new">
          Create loan
        </Link>
      </div>

      <div className="stat-row">
        <div className="stat">
          <span className="stat-label">Active loans</span>
          <span className="stat-value">{active.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total outstanding</span>
          <span className="stat-value">{formatCurrency(totalOwed)}</span>
        </div>
      </div>

      {loading && <p>Loading loans…</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="loan-grid">
        {active.map((loan) => (
          <article key={loan.id} className="loan-card">
            <header>
              <h2>{loan.name}</h2>
              <span className="badge">{loan.rate}% APR</span>
            </header>
            <dl className="meta">
              <div>
                <dt>Opened</dt>
                <dd>{formatDisplayDate(loan.date_taken)}</dd>
              </div>
              <div>
                <dt>Original</dt>
                <dd>{formatCurrency(loan.original_amount)}</dd>
              </div>
              <div>
                <dt>Still owed</dt>
                <dd className="emphasis">{formatCurrency(loan.balance)}</dd>
              </div>
              <div>
                <dt>Est. payoff</dt>
                <dd>{loan.projected_payoff_display || 'Schedule a payment'}</dd>
              </div>
            </dl>
            <div className="card-actions">
              <Link className="btn ghost" to={`/admin/loans/${loan.id}`}>
                View details
              </Link>
              <button type="button" className="btn danger" onClick={() => deleteLoan(loan.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && active.length === 0 && (
        <p className="empty">No outstanding loans. Create one to begin.</p>
      )}
    </div>
  );
}
