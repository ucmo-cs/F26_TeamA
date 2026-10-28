package com.loantracker.web;

import com.loantracker.dto.ApiDtos.*;
import com.loantracker.model.User;
import com.loantracker.security.AuthInterceptor;
import com.loantracker.service.LoanService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    private final LoanService loanService;

    public CustomerController(LoanService loanService) {
        this.loanService = loanService;
    }

    private User current(HttpServletRequest request) {
        return (User) request.getAttribute(AuthInterceptor.ATTR_USER);
    }

    @GetMapping("/loans")
    public LoansResponse loans(HttpServletRequest request) {
        return new LoansResponse(loanService.customerLoans(current(request)));
    }

    @GetMapping("/loans/{id}")
    public LoanDetailResponse loan(@PathVariable Long id, HttpServletRequest request) {
        return loanService.customerLoan(current(request), id);
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(@RequestBody ProfileUpdateRequest body, HttpServletRequest request) {
        return new UserResponse(loanService.updateProfile(current(request), body));
    }

    @PostMapping("/loans/{id}/schedule")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleResponse schedule(
            @PathVariable Long id,
            @RequestBody ScheduleRequest body,
            HttpServletRequest request
    ) {
        return loanService.schedulePayment(current(request), id, body);
    }
}
