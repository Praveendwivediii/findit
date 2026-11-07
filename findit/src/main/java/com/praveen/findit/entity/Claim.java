package com.praveen.findit.entity;

import java.time.LocalDateTime;

import com.praveen.findit.enums.ClaimStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Kis item par claim kiya gaya (items table ki id)
    @Column(nullable = false)
    private Long itemId;

    @Column(nullable = false, length = 100)
    private String claimantName;

    // Claimant ka contact (email ya phone)
    @Column(nullable = false, length = 150)
    private String claimantContact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // ----- Getters and Setters -----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public String getClaimantName() { return claimantName; }
    public void setClaimantName(String claimantName) { this.claimantName = claimantName; }

    public String getClaimantContact() { return claimantContact; }
    public void setClaimantContact(String claimantContact) { this.claimantContact = claimantContact; }

    public ClaimStatus getStatus() { return status; }
    public void setStatus(ClaimStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}