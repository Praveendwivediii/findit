package com.praveen.findit.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import com.praveen.findit.repository.UserRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // Password hash karne ka tool (BCrypt: salt ke saath, slow by design)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Login ke waqt Spring email se user ko database mein ye dhundhta hai
    @Bean
    public UserDetailsService userDetailsService(UserRepository userRepository) {
        return email -> {
            com.praveen.findit.entity.User user = userRepository
                    .findByEmail(email.trim().toLowerCase())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));

            return org.springframework.security.core.userdetails.User
                    .withUsername(user.getEmail())
                    .password(user.getPasswordHash())
                    .roles(user.getRole().name())
                    .build();
        };
    }

    // AuthController isse email + password verify karega
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // Login ke baad user ko session mein yaad rakhne ke liye
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   SecurityContextRepository securityContextRepository) throws Exception {
        http
            .securityContext(context -> context.securityContextRepository(securityContextRepository))

            // Spring ka default login form aur popup band, hum apna login.html use karenge
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            .authorizeHttpRequests(auth -> auth
                // Ye sab bina login ke khule rahenge
                .requestMatchers("/login.html", "/error", "/css/**", "/js/**", "/images/**", "/favicon.ico").permitAll()
                .requestMatchers("/api/auth/csrf", "/api/auth/register", "/api/auth/login").permitAll()
                // Baaki sab kuch (home page, items, claims) login ke baad hi
                .anyRequest().authenticated()
            )

            // Login nahi hai to: API ko 401 milega, page ko login.html par redirect
            .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                if (request.getRequestURI().startsWith("/api/")) {
                    response.setStatus(401);
                } else {
                    response.sendRedirect("/login.html");
                }
            }))

            .logout(logout -> logout
                .logoutUrl("/api/auth/logout")
                .logoutSuccessHandler((request, response, authentication) -> response.setStatus(200))
            );

        // CSRF protection default ON rehta hai (POST requests par token zaroori)
        return http.build();
    }
}