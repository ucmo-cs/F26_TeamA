package com.loantracker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loantracker.dto.ApiDtos.ErrorResponse;
import com.loantracker.model.Role;
import com.loantracker.model.User;
import com.loantracker.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String ATTR_USER = "currentUser";

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public AuthInterceptor(JwtService jwtService, UserRepository userRepository, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/health") || path.startsWith("/h2-console")) {
            return true;
        }

        if (!path.startsWith("/api/")) {
            return true;
        }

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            writeError(response, HttpStatus.UNAUTHORIZED, "Not authenticated");
            return false;
        }

        try {
            String token = header.substring(7);
            Long userId = jwtService.userId(token);
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                writeError(response, HttpStatus.UNAUTHORIZED, "User not found");
                return false;
            }

            if (path.startsWith("/api/admin") && user.getRole() != Role.admin) {
                writeError(response, HttpStatus.FORBIDDEN, "Forbidden");
                return false;
            }
            if (path.startsWith("/api/customer") && user.getRole() != Role.customer) {
                writeError(response, HttpStatus.FORBIDDEN, "Forbidden");
                return false;
            }

            request.setAttribute(ATTR_USER, user);
            return true;
        } catch (Exception e) {
            writeError(response, HttpStatus.UNAUTHORIZED, "Invalid token");
            return false;
        }
    }

    private void writeError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(message));
    }
}
