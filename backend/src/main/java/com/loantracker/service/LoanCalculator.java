package com.loantracker.service;

import com.loantracker.model.PaymentFrequency;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import org.springframework.stereotype.Component;

/**
 * Standard amortization formulas used for minimum payments and payoff estimates.
 */
@Component
public class LoanCalculator {

    private static final MathContext MC = new MathContext(16, RoundingMode.HALF_UP);

    /** Monthly payment using the standard amortization formula. */
    public BigDecimal monthlyPayment(BigDecimal principal, BigDecimal annualRatePercent, int termMonths) {
        return paymentForPeriods(principal, annualRatePercent, termMonths, 12);
    }

    /**
     * Minimum payment for a chosen schedule.
     * Monthly = 12/year, bi-weekly = 26/year, weekly = 52/year.
     * Term is converted so total duration roughly matches termMonths.
     */
    public BigDecimal minimumPayment(
            BigDecimal principal,
            BigDecimal annualRatePercent,
            int termMonths,
            PaymentFrequency frequency
    ) {
        int periodsPerYear = periodsPerYear(frequency);
        int totalPeriods = Math.max(1, (int) Math.round(termMonths * (periodsPerYear / 12.0)));
        return paymentForPeriods(principal, annualRatePercent, totalPeriods, periodsPerYear);
    }

    public BigDecimal paymentForPeriods(
            BigDecimal principal,
            BigDecimal annualRatePercent,
            int totalPeriods,
            int periodsPerYear
    ) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || totalPeriods <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal r = annualRatePercent
                .divide(BigDecimal.valueOf(100), MC)
                .divide(BigDecimal.valueOf(periodsPerYear), MC);

        if (r.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(totalPeriods), 2, RoundingMode.HALF_UP);
        }

        BigDecimal onePlusR = BigDecimal.ONE.add(r, MC);
        BigDecimal factor = onePlusR.pow(totalPeriods, MC);
        BigDecimal numerator = principal.multiply(r, MC).multiply(factor, MC);
        BigDecimal denominator = factor.subtract(BigDecimal.ONE, MC);
        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    /** Remaining periods given fixed payment size and frequency. */
    public Integer remainingPeriods(
            BigDecimal balance,
            BigDecimal annualRatePercent,
            BigDecimal payment,
            PaymentFrequency frequency
    ) {
        if (payment == null || payment.compareTo(BigDecimal.ZERO) <= 0
                || balance == null || balance.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }

        int periodsPerYear = periodsPerYear(frequency);
        BigDecimal r = annualRatePercent
                .divide(BigDecimal.valueOf(100), MC)
                .divide(BigDecimal.valueOf(periodsPerYear), MC);

        if (r.compareTo(BigDecimal.ZERO) == 0) {
            return (int) Math.ceil(balance.divide(payment, MC).doubleValue());
        }

        BigDecimal interestOnly = balance.multiply(r, MC);
        if (payment.compareTo(interestOnly) <= 0) {
            return null; // never pays off
        }

        double rd = r.doubleValue();
        double n = Math.log(payment.doubleValue() / (payment.doubleValue() - balance.doubleValue() * rd))
                / Math.log(1 + rd);
        return (int) Math.ceil(n);
    }

    public LocalDate projectedPayoffDate(
            BigDecimal balance,
            BigDecimal annualRatePercent,
            BigDecimal payment,
            PaymentFrequency frequency,
            LocalDate from
    ) {
        Integer periods = remainingPeriods(balance, annualRatePercent, payment, frequency);
        if (periods == null || periods <= 0) {
            return null;
        }
        LocalDate date = from == null ? LocalDate.now() : from;
        return switch (frequency) {
            case weekly -> date.plusWeeks(periods);
            case biweekly -> date.plusWeeks(periods * 2L);
            case monthly -> date.plusMonths(periods);
        };
    }

    public int periodsPerYear(PaymentFrequency frequency) {
        return switch (frequency) {
            case weekly -> 52;
            case biweekly -> 26;
            case monthly -> 12;
        };
    }
}
