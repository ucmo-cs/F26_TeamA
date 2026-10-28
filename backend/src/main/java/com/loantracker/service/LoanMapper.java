package com.loantracker.service;

import com.loantracker.dto.ApiDtos.LoanDto;
import com.loantracker.dto.ApiDtos.ScheduleDto;
import com.loantracker.model.Loan;
import com.loantracker.model.PaymentFrequency;
import com.loantracker.model.PaymentSchedule;
import com.loantracker.model.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class LoanMapper {

    private static final DateTimeFormatter DISPLAY =
            DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.US);

    private final LoanCalculator calculator;

    public LoanMapper(LoanCalculator calculator) {
        this.calculator = calculator;
    }

    public LoanDto toDto(Loan loan, PaymentSchedule schedule) {
        User customer = loan.getCustomer();
        BigDecimal monthly = calculator.monthlyPayment(
                loan.getBalance(), loan.getRate(), loan.getTermMonths());

        Map<String, BigDecimal> mins = new LinkedHashMap<>();
        for (PaymentFrequency freq : PaymentFrequency.values()) {
            mins.put(freq.name(), calculator.minimumPayment(
                    loan.getBalance(), loan.getRate(), loan.getTermMonths(), freq));
        }

        BigDecimal paymentForPayoff = monthly;
        PaymentFrequency freqForPayoff = PaymentFrequency.monthly;
        if (schedule != null) {
            paymentForPayoff = schedule.getAmount();
            freqForPayoff = schedule.getFrequency();
        }

        LocalDate payoff = calculator.projectedPayoffDate(
                loan.getBalance(),
                loan.getRate(),
                paymentForPayoff,
                freqForPayoff,
                schedule != null ? schedule.getNextPaymentDate() : LocalDate.now()
        );

        Integer periodsLeft = calculator.remainingPeriods(
                loan.getBalance(), loan.getRate(), paymentForPayoff, freqForPayoff);

        Integer monthsRemaining = null;
        if (periodsLeft != null) {
            monthsRemaining = switch (freqForPayoff) {
                case weekly -> (int) Math.ceil(periodsLeft / (52.0 / 12.0));
                case biweekly -> (int) Math.ceil(periodsLeft / (26.0 / 12.0));
                case monthly -> periodsLeft;
            };
        }

        ScheduleDto scheduleDto = null;
        if (schedule != null) {
            scheduleDto = new ScheduleDto(
                    schedule.getId(),
                    schedule.getAmount(),
                    schedule.getFrequency().name(),
                    schedule.getNextPaymentDate(),
                    schedule.isActive()
            );
        }

        return new LoanDto(
                loan.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getBankDetails(),
                loan.getDateTaken(),
                loan.getOriginalAmount(),
                loan.getBalance(),
                loan.getRate(),
                loan.getTermMonths(),
                loan.getStatus(),
                monthly,
                monthly,
                monthsRemaining,
                payoff,
                payoff == null ? null : payoff.format(DISPLAY),
                loan.getDateTaken().format(DISPLAY),
                scheduleDto,
                mins
        );
    }
}
