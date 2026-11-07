package com.praveen.findit.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.praveen.findit.enums.ItemStatus;
import com.praveen.findit.enums.ItemType;

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
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType type;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 50)
    private String location;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemStatus status;

    private LocalDateTime createdAt;

    // ----- Verification (sirf FOUND items ke liye) -----

    @Column(length = 200)
    private String verificationQuestion;

    // Hash save hota hai. WRITE_ONLY = API se aa sakta hai, par JSON response mein kabhi nahi jayega.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(length = 100)
    private String verificationAnswer;

    // ----- Finder ka contact (claim approve hone par hi dikhega) -----

    @Column(length = 100)
    private String contactName;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(length = 150)
    private String contactInfo;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ItemStatus.ACTIVE;
        }
    }

    // ----- Getters and Setters -----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ItemType getType() { return type; }
    public void setType(ItemType type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ItemStatus getStatus() { return status; }
    public void setStatus(ItemStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getVerificationQuestion() { return verificationQuestion; }
    public void setVerificationQuestion(String verificationQuestion) { this.verificationQuestion = verificationQuestion; }

    public String getVerificationAnswer() { return verificationAnswer; }
    public void setVerificationAnswer(String verificationAnswer) { this.verificationAnswer = verificationAnswer; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }
}