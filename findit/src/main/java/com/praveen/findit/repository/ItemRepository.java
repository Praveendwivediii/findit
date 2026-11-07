package com.praveen.findit.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.praveen.findit.entity.Item;
import com.praveen.findit.enums.ItemStatus;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByStatusNotOrderByCreatedAtDesc(ItemStatus status);

    long countByType(com.praveen.findit.enums.ItemType type);

    long countByStatus(ItemStatus status);
}