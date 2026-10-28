package com.loantracker.repository;

import com.loantracker.model.EmailLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
    List<EmailLog> findTop50ByOrderBySentAtDesc();
}
