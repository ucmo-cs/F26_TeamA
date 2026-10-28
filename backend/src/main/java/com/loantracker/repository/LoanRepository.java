package com.loantracker.repository;

import com.loantracker.model.Loan;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Query("SELECT l FROM Loan l JOIN FETCH l.customer WHERE l.balance > 0 ORDER BY l.dateTaken DESC")
    List<Loan> findOutstandingWithCustomer();

    @Query("SELECT l FROM Loan l JOIN FETCH l.customer WHERE l.id = :id")
    Optional<Loan> findByIdWithCustomer(Long id);

    List<Loan> findByCustomerIdOrderByDateTakenDesc(Long customerId);

    Optional<Loan> findByIdAndCustomerId(Long id, Long customerId);
}
