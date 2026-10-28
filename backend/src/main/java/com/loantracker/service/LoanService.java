package com.loantracker.service;

import com.loantracker.dto.ApiDtos.*;
import com.loantracker.model.*;
import com.loantracker.repository.EmailLogRepository;
import com.loantracker.repository.LoanRepository;
import com.loantracker.repository.PaymentScheduleRepository;
import com.loantracker.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LoanService {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final PaymentScheduleRepository scheduleRepository;
    private final EmailLogRepository emailLogRepository;
    private final LoanMapper loanMapper;
    private final LoanCalculator calculator;
    private final EmailService emailService;

    public LoanService(
            LoanRepository loanRepository,
            UserRepository userRepository,
            PaymentScheduleRepository scheduleRepository,
            EmailLogRepository emailLogRepository,
            LoanMapper loanMapper,
            LoanCalculator calculator,
            EmailService emailService
    ) {
        this.loanRepository = loanRepository;
        this.userRepository = userRepository;
        this.scheduleRepository = scheduleRepository;
        this.emailLogRepository = emailLogRepository;
        this.loanMapper = loanMapper;
        this.calculator = calculator;
        this.emailService = emailService;
    }

    public List<LoanDto> listOutstanding() {
        return loanRepository.findOutstandingWithCustomer().stream()
                .map(loan -> loanMapper.toDto(loan, activeSchedule(loan.getId())))
                .toList();
    }

    public LoanDetailResponse getAdminLoan(Long id) {
        Loan loan = loanRepository.findByIdWithCustomer(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
        return new LoanDetailResponse(loanMapper.toDto(loan, activeSchedule(id)), List.of());
    }

    @Transactional
    public CreateLoanResponse createLoan(CreateLoanRequest req) {
        if (req.name() == null || req.email() == null || req.date() == null
                || req.original() == null || req.rate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required fields");
        }

        String generatedPassword = "customer123";
        User customer = userRepository.findByEmailAndRole(req.email(), Role.customer).orElse(null);
        boolean createdAccount = false;

        if (customer == null) {
            String base = req.email().split("@")[0].toLowerCase().replaceAll("[^a-z0-9]", "");
            if (base.isBlank()) base = "customer";
            String username = base;
            int i = 1;
            while (userRepository.existsByUsername(username)) {
                username = base + i++;
            }
            customer = new User();
            customer.setUsername(username);
            customer.setPassword(generatedPassword);
            customer.setRole(Role.customer);
            customer.setName(req.name());
            customer.setEmail(req.email());
            customer.setPhone(req.phone() == null ? "" : req.phone());
            customer.setBankDetails("Not provided");
            customer = userRepository.save(customer);
            createdAccount = true;
        } else {
            customer.setName(req.name());
            if (req.phone() != null) customer.setPhone(req.phone());
            customer = userRepository.save(customer);
        }

        Loan loan = new Loan();
        loan.setCustomer(customer);
        loan.setDateTaken(req.date());
        loan.setOriginalAmount(req.original());
        loan.setBalance(req.original());
        loan.setRate(req.rate());
        loan.setTermMonths(req.term_months() == null ? 60 : req.term_months());
        loan.setStatus("active");
        loan = loanRepository.save(loan);

        if (createdAccount) {
            emailService.sendAccountCreated(customer, generatedPassword, loan);
        } else {
            emailService.sendAccountCreated(customer, "(existing password)", loan);
        }

        LoanDto dto = loanMapper.toDto(loan, null);
        return new CreateLoanResponse(dto, dto.suggested_monthly());
    }

    @Transactional
    public void deleteLoan(Long id) {
        if (!loanRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found");
        }
        scheduleRepository.deleteByLoanId(id);
        loanRepository.deleteById(id);
    }

    public List<LoanDto> customerLoans(User customer) {
        return loanRepository.findByCustomerIdOrderByDateTakenDesc(customer.getId()).stream()
                .map(loan -> {
                    loan.setCustomer(customer);
                    return loanMapper.toDto(loan, activeSchedule(loan.getId()));
                })
                .toList();
    }

    public LoanDetailResponse customerLoan(User customer, Long id) {
        Loan loan = loanRepository.findByIdAndCustomerId(id, customer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
        loan.setCustomer(customer);
        return new LoanDetailResponse(loanMapper.toDto(loan, activeSchedule(id)), List.of());
    }

    @Transactional
    public UserDto updateProfile(User customer, ProfileUpdateRequest req) {
        if (req.name() == null || req.email() == null || req.name().isBlank() || req.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and email required");
        }
        customer.setName(req.name());
        customer.setEmail(req.email());
        customer.setPhone(req.phone() == null ? "" : req.phone());
        String bank = req.bankDetails() != null ? req.bankDetails() : req.bank();
        if (bank != null) {
            customer.setBankDetails(bank);
        }
        User saved = userRepository.save(customer);
        emailService.sendProfileUpdated(saved);
        return AuthService.toDto(saved);
    }

    @Transactional
    public ScheduleResponse schedulePayment(User customer, Long loanId, ScheduleRequest req) {
        Loan loan = loanRepository.findByIdAndCustomerId(loanId, customer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Loan not found"));
        loan.setCustomer(customer);

        if (req.amount() == null || req.frequency() == null || req.next_payment_date() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Amount, frequency, and next payment date required");
        }

        BigDecimal minimum = calculator.minimumPayment(
                loan.getBalance(), loan.getRate(), loan.getTermMonths(), req.frequency());

        if (req.amount().compareTo(minimum) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payment must be at least the minimum of $" + minimum + " for " + req.frequency()
                            + " scheduling");
        }

        scheduleRepository.findFirstByLoanIdAndActiveTrueOrderByIdDesc(loanId)
                .ifPresent(existing -> {
                    existing.setActive(false);
                    scheduleRepository.save(existing);
                });

        PaymentSchedule schedule = new PaymentSchedule();
        schedule.setLoan(loan);
        schedule.setAmount(req.amount());
        schedule.setFrequency(req.frequency());
        schedule.setNextPaymentDate(req.next_payment_date());
        schedule.setActive(true);
        schedule = scheduleRepository.save(schedule);

        emailService.sendScheduleConfirmation(customer, loan, schedule);
        return new ScheduleResponse(
                new ScheduleDto(
                        schedule.getId(),
                        schedule.getAmount(),
                        schedule.getFrequency().name(),
                        schedule.getNextPaymentDate(),
                        schedule.isActive()),
                loanMapper.toDto(loan, schedule)
        );
    }

    public List<EmailDto> recentEmails() {
        return emailLogRepository.findTop50ByOrderBySentAtDesc().stream()
                .map(e -> new EmailDto(
                        e.getId(),
                        e.getToEmail(),
                        e.getSubject(),
                        e.getBody(),
                        e.getSentAt()))
                .toList();
    }

    private PaymentSchedule activeSchedule(Long loanId) {
        return scheduleRepository.findFirstByLoanIdAndActiveTrueOrderByIdDesc(loanId).orElse(null);
    }
}
