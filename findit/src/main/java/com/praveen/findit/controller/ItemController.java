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

        item.setId(null);                    // client se aayi id ignore
        item.setStatus(ItemStatus.ACTIVE);   // naya item hamesha ACTIVE
        return itemRepository.save(item);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}