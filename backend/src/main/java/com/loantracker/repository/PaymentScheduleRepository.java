package com.loantracker.repository;

import com.loantracker.model.PaymentSchedule;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentScheduleRepository extends JpaRepository<PaymentSchedule, Long> {
    Optional<PaymentSchedule> findFirstByLoanIdAndActiveTrueOrderByIdDesc(Long loanId);
    void deleteByLoanId(Long loanId);
}
