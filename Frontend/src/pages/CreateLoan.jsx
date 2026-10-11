import { useState } from 'react';
import { useNavigate, Link } from 'react-router';

export default function CreateLoan({ addLoan }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', original: '', rate: '' });
  const navigate = useNavigate();

  // Update the field the user is typing in.
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleSubmit(event) {
    event.preventDefault();
    addLoan({ ...form, original: Number(form.original), balance: Number(form.original), rate: Number(form.rate), bank: 'Not provided', autopay: 'Not scheduled', payoff: 'Not available' });
    navigate('/portal');
  }

  return <section>
    <h1>Create a New Loan</h1>
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Customer Name</label>
      <input id="name" name="name" value={form.name} onChange={handleChange} required />
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
      <label htmlFor="phone">Phone Number</label>
      <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} required />
      <label htmlFor="date">Date Taken Out</label>
      <input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
      <label htmlFor="original">Original Amount ($)</label>
      <input id="original" name="original" type="number" min="1" step="0.01" value={form.original} onChange={handleChange} required />
      <label htmlFor="rate">Interest Rate (%)</label>
      <input id="rate" name="rate" type="number" min="0" max="100" step="0.01" value={form.rate} onChange={handleChange} required />
      <button type="submit">Create Loan</button>
    </form>
    <p><Link to="/portal">Cancel</Link></p>
    <p className="note">The customer can create an account but the confirmation emails will be handled by the backend later.</p>
  </section>;
}
