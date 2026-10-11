import { useState } from 'react';
import { Routes, Route } from 'react-router';
import Header from './Header';
import Login from './pages/Login';
import Portal from './pages/Portal';
import LoanDetails from './pages/LoanDetails';
import CreateLoan from './pages/CreateLoan';
import { startingLoans } from './data';
import './App.css';

export default function App() {
  const [loans, setLoans] = useState(startingLoans);

  function addLoan(loan) {
    setLoans([...loans, { ...loan, id: String(Date.now()) }]);
  }

  // Delete the selected loan from list
  function deleteLoan(id) {
    setLoans(loans.filter(loan => loan.id !== id));
  }

  return (
    <>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/portal"
            element={<Portal loans={loans} deleteLoan={deleteLoan} />}
          />

          <Route
            path="/loans/:id"
            element={<LoanDetails loans={loans} />}
          />

          <Route
            path="/loans/new"
            element={<CreateLoan addLoan={addLoan} />}
          />

          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}