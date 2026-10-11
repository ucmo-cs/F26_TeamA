import { Link, useParams } from 'react-router';

export default function LoanDetails({ loans }) {
  const { id } = useParams();
  const loan = loans.find(loan => loan.id === id);

  if (!loan) return <p>Loan not found. <Link to="/portal">Back to loans</Link></p>;

  return <section>
    <h1>Loan Details</h1>
    <p><strong>Customer:</strong> {loan.name}</p>
    <p><strong>Email:</strong> {loan.email}</p>
    <p><strong>Phone:</strong> {loan.phone}</p>
    <p><strong>Date Taken Out:</strong> {loan.date}</p>
    <p><strong>Original Amount:</strong> ${Number(loan.original).toFixed(2)}</p>
    <p><strong>Still Owed:</strong> ${Number(loan.balance).toFixed(2)}</p>
    <p><strong>Interest Rate:</strong> {loan.rate}%</p>
    <p><strong>Bank Account:</strong> {loan.bank}</p>
    <p><strong>Scheduled Autopay:</strong> {loan.autopay}</p>
    <p><strong>Projected Payoff:</strong> {loan.payoff}</p>
    <p><Link to="/portal">Back to Outstanding Loans</Link></p>
  </section>;
}
