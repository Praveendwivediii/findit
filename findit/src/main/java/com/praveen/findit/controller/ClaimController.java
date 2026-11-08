package com.praveen.findit.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.praveen.findit.entity.Claim;
import com.praveen.findit.entity.Item;
import com.praveen.findit.enums.ClaimStatus;
import com.praveen.findit.enums.ItemStatus;
import com.praveen.findit.enums.ItemType;
import com.praveen.findit.repository.ClaimRepository;
import com.praveen.findit.repository.ItemRepository;
import com.praveen.findit.util.HashUtil;

@RestController
@RequestMapping("/api/items")
public class ClaimController {

    private static final int MAX_WRONG_PER_CLAIMANT = 3;
    private static final int MAX_WRONG_PER_ITEM = 10;

    private final ItemRepository itemRepository;
    private final ClaimRepository claimRepository;

    public ClaimController(ItemRepository itemRepository, ClaimRepository claimRepository) {
        this.itemRepository = itemRepository;
        this.claimRepository = claimRepository;
    }

    // Browser se aane wala claim data
    public record ClaimRequest(String claimantName, String claimantContact, String answer) {
    }

    // GET /api/items/{id}/question -> claim popup mein sirf question dikhane ke liye
    @org.springframework.web.bind.annotation.GetMapping("/{id}/question")
    public Map<String, String> getQuestion(@PathVariable Long id) {
        Item item = findClaimableItem(id);
        return Map.of("question", item.getVerificationQuestion());
    }

    // POST /api/items/{id}/claim -> answer check karo, sahi ho to finder ka contact do
    @PostMapping("/{id}/claim")
    public Map<String, Object> claim(@PathVariable Long id, @RequestBody ClaimRequest request) {
        Item item = findClaimableItem(id);

        if (isBlank(request.claimantName())
                || isBlank(request.claimantContact())
                || isBlank(request.answer())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name, contact and answer are required");
        }

        if (request.claimantName().length() > 100
                || request.claimantContact().length() > 150
                || request.answer().length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One of the fields is too long");
        }

        String contact = request.claimantContact().trim();

        // Brute-force se bachne ke liye limits
        long itemWrong = claimRepository.countByItemIdAndStatus(id, ClaimStatus.REJECTED);
        if (itemWrong >= MAX_WRONG_PER_ITEM) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many wrong attempts on this item. Please contact campus security.");
        }

        long myWrong = claimRepository.countByItemIdAndClaimantContactIgnoreCaseAndStatus(
                id, contact, ClaimStatus.REJECTED);
        if (myWrong >= MAX_WRONG_PER_CLAIMANT) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "You have used all your attempts for this item.");
        }

        boolean correct = HashUtil.matches(request.answer(), item.getVerificationAnswer());

        Claim claim = new Claim();
        claim.setItemId(id);
        claim.setClaimantName(request.claimantName().trim());
        claim.setClaimantContact(contact);
        claim.setStatus(correct ? ClaimStatus.APPROVED : ClaimStatus.REJECTED);
        claimRepository.save(claim);

        if (correct) {
            return Map.of(
                "approved", true,
                "finderName", item.getContactName(),
                "finderContact", item.getContactInfo()
            );
        }

        long attemptsLeft = MAX_WRONG_PER_CLAIMANT - (myWrong + 1);
        return Map.of(
            "approved", false,
            "message", "That answer does not match.",
            "attemptsLeft", attemptsLeft
        );
    }

    // Sirf ACTIVE FOUND item par claim ho sakta hai
    private Item findClaimableItem(Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (item.getType() != ItemType.FOUND
                || item.getStatus() == ItemStatus.RETURNED
                || item.getVerificationQuestion() == null
                || item.getVerificationAnswer() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This item cannot be claimed");
        }
        return item;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}