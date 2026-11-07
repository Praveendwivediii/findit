package com.praveen.findit.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.praveen.findit.entity.Item;
import com.praveen.findit.enums.ItemStatus;
import com.praveen.findit.enums.ItemType;
import com.praveen.findit.repository.ItemRepository;
import com.praveen.findit.util.HashUtil;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemRepository itemRepository;

    public ItemController(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    // GET /api/items -> active feed (RETURNED items nahi aayenge)
    @GetMapping
    public List<Item> getActiveItems() {
        return itemRepository.findByStatusNotOrderByCreatedAtDesc(ItemStatus.RETURNED);
    }

    // GET /api/items/stats -> hero section ke numbers
    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return Map.of(
            "lost", itemRepository.countByType(ItemType.LOST),
            "found", itemRepository.countByType(ItemType.FOUND),
            "returned", itemRepository.countByStatus(ItemStatus.RETURNED)
        );
    }

    // POST /api/items -> naya Lost/Found report save karo
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Item createItem(@RequestBody Item item) {
        if (item.getType() == null
                || isBlank(item.getName())
                || isBlank(item.getCategory())
                || isBlank(item.getLocation())
                || item.getDate() == null
                || isBlank(item.getDescription())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All fields are required");
        }

        if (item.getName().length() > 100 || item.getDescription().length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name or description is too long");
        }

        if (item.getType() == ItemType.FOUND) {
            // Found report mein verification aur finder ka contact zaroori hai
            if (isBlank(item.getVerificationQuestion())
                    || isBlank(item.getVerificationAnswer())
                    || isBlank(item.getContactName())
                    || isBlank(item.getContactInfo())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Found reports need a verification question, answer and your contact details");
            }

            if (item.getVerificationQuestion().length() > 200
                    || item.getVerificationAnswer().length() > 100
                    || item.getContactName().length() > 100
                    || item.getContactInfo().length() > 150) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One of the fields is too long");
            }

            // Answer ko plain text mein kabhi save nahi karte, sirf hash
            item.setVerificationAnswer(HashUtil.hash(item.getVerificationAnswer()));
        } else {
            // Lost report mein ye fields hote hi nahi
            item.setVerificationQuestion(null);
            item.setVerificationAnswer(null);
            item.setContactName(null);
            item.setContactInfo(null);
        }

        item.setId(null);                    // client se aayi id ignore
        item.setStatus(ItemStatus.ACTIVE);   // naya item hamesha ACTIVE
        return itemRepository.save(item);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}