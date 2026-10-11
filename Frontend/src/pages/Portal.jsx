import { Link } from 'react-router';

export default function Portal({ loans }) {
  return <section>
    <h1>Outstanding Loans</h1>
    <p>Select a loan to view more information.</p>
    <div className="table-container">
      <table>
        <thead><tr>
          <th>Customer</th><th>Date Taken Out</th><th>Original Amount</th>
          <th>Still Owed</th><th>Interest Rate</th><th>Details</th>
        </tr></thead>
        <tbody>
          {loans.filter(loan => loan.balance > 0).map(loan => <tr key={loan.id}>
            <td>{loan.name}</td><td>{loan.date}</td>
            <td>${Number(loan.original).toFixed(2)}</td>
            <td>${Number(loan.balance).toFixed(2)}</td>
            <td>{loan.rate}%</td>
            <td><Link to={'/loans/' + loan.id}>View</Link></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <p><Link to="/loans/new">Create a New Loan</Link></p>
  </section>;
}
