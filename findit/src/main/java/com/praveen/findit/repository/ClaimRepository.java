package com.praveen.findit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.praveen.findit.entity.Claim;
import com.praveen.findit.enums.ClaimStatus;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // Ek item par kitne claims (approved/rejected) ho chuke
    long countByItemIdAndStatus(Long itemId, ClaimStatus status);

    // Ek claimant ne ek item par kitni baar galat jawab diya
    long countByItemIdAndClaimantContactIgnoreCaseAndStatus(
            Long itemId, String claimantContact, ClaimStatus status);
}