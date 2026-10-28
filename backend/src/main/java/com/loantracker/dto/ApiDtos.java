package com.loantracker.dto;

import com.loantracker.model.PaymentFrequency;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class ApiDtos {
    private ApiDtos() {}

    public record LoginRequest(String username, String password, String role) {}

    public record UserDto(
            Long id,
            String username,
            String role,
            String name,
            String email,
            String phone,
            String bankDetails
    ) {}

    public record LoginResponse(String token, UserDto user) {}

    public record ScheduleDto(
            Long id,
            BigDecimal amount,
            String frequency,
            LocalDate next_payment_date,
            boolean active
    ) {}

    public record LoanDto(
            Long id,
            String name,
            String email,
            String phone,
            String bank,
            LocalDate date_taken,
            BigDecimal original_amount,
            BigDecimal balance,
            BigDecimal rate,
            Integer term_months,
            String status,
            BigDecimal suggested_monthly,
            BigDecimal minimum_payment,
            Integer months_remaining,
            LocalDate projected_payoff,
            String projected_payoff_display,
            String date_taken_display,
            ScheduleDto schedule,
            Map<String, BigDecimal> minimums_by_frequency
    ) {}

    public record CreateLoanRequest(
            String name,
            String email,
            String phone,
            LocalDate date,
            BigDecimal original,
            BigDecimal rate,
            Integer term_months
    ) {}

    public record ProfileUpdateRequest(
            String name,
            String email,
            String phone,
            String bankDetails,
            String bank
    ) {}

    public record ScheduleRequest(
            BigDecimal amount,
            PaymentFrequency frequency,
            LocalDate next_payment_date
    ) {}

    public record EmailDto(
            Long id,
            String to_email,
            String subject,
            String body,
            LocalDateTime sent_at
    ) {}

    public record LoansResponse(List<LoanDto> loans) {}
    public record LoanDetailResponse(LoanDto loan, List<Object> payments) {}
    public record ScheduleResponse(ScheduleDto schedule, LoanDto loan) {}
    public record EmailsResponse(List<EmailDto> emails) {}
    public record UserResponse(UserDto user) {}
    public record ErrorResponse(String error) {}
    public record OkResponse(boolean ok) {}
    public record CreateLoanResponse(LoanDto loan, BigDecimal suggested_monthly) {}
}
