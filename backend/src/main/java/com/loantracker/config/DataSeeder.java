package com.loantracker.config;

import com.loantracker.model.Loan;
import com.loantracker.model.Role;
import com.loantracker.model.User;
import com.loantracker.repository.LoanRepository;
import com.loantracker.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LoanRepository loanRepository;

    public DataSeeder(UserRepository userRepository, LoanRepository loanRepository) {
        this.userRepository = userRepository;
        this.loanRepository = loanRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = user("admin", "admin123", Role.admin, "Admin User", "admin@loantracker.local", "");
        User collin = user("collin", "customer123", Role.customer, "Collin Raymond",
                "collin@example.com", "555-122-0607");
        collin.setBankDetails("Demo Bank — ending in 4726");
        User tyreek = user("tyreek", "customer123", Role.customer, "Tyreek Hill",
                "tyreek@example.com", "555-224-0706");
        User patrick = user("patrick", "customer123", Role.customer, "Patrick Mahomes",
                "patrick@example.com", "555-333-0708");

        admin = userRepository.save(admin);
        collin = userRepository.save(collin);
        tyreek = userRepository.save(tyreek);
        patrick = userRepository.save(patrick);

        // Partially repaid loans for demo (assignment requirement)
        loanRepository.save(loan(collin, LocalDate.of(2025, 9, 12),
                bd("12000"), bd("8350"), bd("6.5"), 48));
        loanRepository.save(loan(tyreek, LocalDate.of(2026, 3, 5),
                bd("7500"), bd("6200"), bd("5.25"), 36));
        loanRepository.save(loan(patrick, LocalDate.of(2026, 8, 20),
                bd("18000"), bd("18000"), bd("7"), 60));

        System.out.println("Seeded demo users and loans (admin/admin123, customers/customer123).");
    }

    private static User user(String username, String password, Role role, String name, String email, String phone) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(password);
        u.setRole(role);
        u.setName(name);
        u.setEmail(email);
        u.setPhone(phone);
        return u;
    }

    private static Loan loan(User customer, LocalDate date, BigDecimal original, BigDecimal balance,
                             BigDecimal rate, int term) {
        Loan loan = new Loan();
        loan.setCustomer(customer);
        loan.setDateTaken(date);
        loan.setOriginalAmount(original);
        loan.setBalance(balance);
        loan.setRate(rate);
        loan.setTermMonths(term);
        loan.setStatus(balance.compareTo(BigDecimal.ZERO) <= 0 ? "paid" : "active");
        return loan;
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }
}
