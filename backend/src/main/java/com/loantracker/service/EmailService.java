package com.loantracker.service;

import com.loantracker.model.EmailLog;
import com.loantracker.model.Loan;
import com.loantracker.model.PaymentSchedule;
import com.loantracker.model.User;
import com.loantracker.repository.EmailLogRepository;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends real SMTP email (when enabled) and always logs a copy in email_log.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.US);

    private final EmailLogRepository emailLogRepository;
    private final JavaMailSender mailSender;
    private final boolean mailEnabled;
    private final String fromAddress;

    public EmailService(
            EmailLogRepository emailLogRepository,
            JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.from:}") String fromAddress,
            @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.emailLogRepository = emailLogRepository;
        this.mailSender = mailSender;
        this.mailEnabled = mailEnabled;
        this.fromAddress = (fromAddress == null || fromAddress.isBlank()) ? mailUsername : fromAddress;
    }

    public EmailLog send(String to, String subject, String body) {
        String statusNote = "";
        if (mailEnabled && fromAddress != null && !fromAddress.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
                helper.setFrom(fromAddress);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(body, false);
                mailSender.send(message);
                statusNote = "\n\n[SMTP: sent successfully]";
                log.info("Email sent via SMTP -> {} | {}", to, subject);
            } catch (Exception ex) {
                statusNote = "\n\n[SMTP ERROR: " + ex.getMessage() + "]";
                log.error("Failed to send email to {}: {}", to, ex.getMessage());
            }
        } else {
            statusNote = "\n\n[SMTP disabled — set app.mail.enabled=true and MAIL_USERNAME / MAIL_PASSWORD]";
            log.warn("Email logged only (SMTP disabled) -> {} | {}", to, subject);
        }

        EmailLog entry = new EmailLog();
        entry.setToEmail(to);
        entry.setSubject(subject);
        entry.setBody(body + statusNote);
        return emailLogRepository.save(entry);
    }

    public void sendAccountCreated(User customer, String plainPassword, Loan loan) {
        String body = """
                Hi %s,

                A loan account has been created for you in Loan Repayment Tracker.

                Login details:
                Username: %s
                Password: %s

                Loan details:
                Original amount: $%s
                Interest rate: %s%%
                Date taken out: %s

                Please log in to the customer portal to review your loan and schedule payments.
                """.formatted(
                customer.getName(),
                customer.getUsername(),
                plainPassword,
                loan.getOriginalAmount().setScale(2),
                loan.getRate().stripTrailingZeros().toPlainString(),
                loan.getDateTaken().format(DATE_FMT)
        );
        send(customer.getEmail(), "Your Loan Repayment Tracker account", body);
    }

    public void sendScheduleConfirmation(User customer, Loan loan, PaymentSchedule schedule) {
        String body = """
                Hi %s,

                Your payment schedule for loan #%d has been saved.

                Amount: $%s
                Frequency: %s
                Next payment: %s
                Remaining balance: $%s
                """.formatted(
                customer.getName(),
                loan.getId(),
                schedule.getAmount().setScale(2),
                schedule.getFrequency(),
                schedule.getNextPaymentDate().format(DATE_FMT),
                loan.getBalance().setScale(2)
        );
        send(customer.getEmail(), "Payment schedule confirmed — Loan Repayment Tracker", body);
    }

    public void sendProfileUpdated(User customer) {
        String body = """
                Hi %s,

                Your account information was updated.

                Email: %s
                Phone: %s
                Bank details: %s
                """.formatted(
                customer.getName(),
                customer.getEmail(),
                customer.getPhone() == null || customer.getPhone().isBlank() ? "—" : customer.getPhone(),
                customer.getBankDetails()
        );
        send(customer.getEmail(), "Profile updated — Loan Repayment Tracker", body);
    }
}
