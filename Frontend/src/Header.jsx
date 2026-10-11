import { Link } from 'react-router';

export default function Header() {
  return <header>
    <h2>Loan Repayment Tracker</h2>
    <nav>
      <Link to="/">Login</Link>
      <Link to="/portal">All Loans</Link>
      <Link to="/loans/new">Create Loan</Link>
    </nav>
  </header>;
}
