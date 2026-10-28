package com.loantracker.web;

import com.loantracker.dto.ApiDtos.*;
import com.loantracker.service.LoanService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final LoanService loanService;

    public AdminController(LoanService loanService) {
        this.loanService = loanService;
    }

    @GetMapping("/loans")
    public LoansResponse listLoans() {
        return new LoansResponse(loanService.listOutstanding());
    }

    @GetMapping("/loans/{id}")
    public LoanDetailResponse getLoan(@PathVariable Long id) {
        return loanService.getAdminLoan(id);
    }

    @PostMapping("/loans")
    @ResponseStatus(HttpStatus.CREATED)
    public CreateLoanResponse createLoan(@RequestBody CreateLoanRequest request) {
        return loanService.createLoan(request);
    }

    @DeleteMapping("/loans/{id}")
    public OkResponse deleteLoan(@PathVariable Long id) {
        loanService.deleteLoan(id);
        return new OkResponse(true);
    }

    @GetMapping("/emails")
    public EmailsResponse emails() {
        return new EmailsResponse(loanService.recentEmails());
    }
}
