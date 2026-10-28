package com.loantracker.service;

import com.loantracker.dto.ApiDtos.LoginRequest;
import com.loantracker.dto.ApiDtos.LoginResponse;
import com.loantracker.dto.ApiDtos.UserDto;
import com.loantracker.model.Role;
import com.loantracker.model.User;
import com.loantracker.repository.UserRepository;
import com.loantracker.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        if (request.username() == null || request.password() == null
                || request.username().isBlank() || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username and password required");
        }

        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Incorrect username or password"));

        // Plain-text compare — assignment does not require encryption
        if (!user.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect username or password");
        }

        if (request.role() != null && !request.role().isBlank()) {
            Role expected = Role.valueOf(request.role());
            if (user.getRole() != expected) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "This account is a " + user.getRole() + " account. Please use the "
                                + user.getRole() + " login.");
            }
        }

        return new LoginResponse(jwtService.createToken(user), toDto(user));
    }

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getRole().name(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getBankDetails()
        );
    }
}
