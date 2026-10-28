package com.loantracker.web;

import com.loantracker.dto.ApiDtos.LoginRequest;
import com.loantracker.dto.ApiDtos.LoginResponse;
import com.loantracker.dto.ApiDtos.UserResponse;
import com.loantracker.model.User;
import com.loantracker.security.AuthInterceptor;
import com.loantracker.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(HttpServletRequest request) {
        User user = (User) request.getAttribute(AuthInterceptor.ATTR_USER);
        return new UserResponse(AuthService.toDto(user));
    }
}
