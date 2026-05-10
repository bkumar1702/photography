package com.studio.snaps;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "studio_events")
public class StudioEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String clientName;

    @Column(nullable = false)
    private String eventType;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Column(nullable = false)
    private LocalDate eventDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private String destinationAddress;

    @Column(length = 1000)
    private String notes;

    @Column(length = 64)
    private String shareToken;

    private boolean clientSelectionSubmitted;

    private LocalDateTime clientSelectionSubmittedAt;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public void setEventDate(LocalDate eventDate) {
        this.eventDate = eventDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public String getDestinationAddress() {
        return destinationAddress;
    }

    public void setDestinationAddress(String destinationAddress) {
        this.destinationAddress = destinationAddress;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    public boolean isClientSelectionSubmitted() {
        return clientSelectionSubmitted;
    }

    public void setClientSelectionSubmitted(boolean clientSelectionSubmitted) {
        this.clientSelectionSubmitted = clientSelectionSubmitted;
    }

    public LocalDateTime getClientSelectionSubmittedAt() {
        return clientSelectionSubmittedAt;
    }

    public void setClientSelectionSubmittedAt(LocalDateTime clientSelectionSubmittedAt) {
        this.clientSelectionSubmittedAt = clientSelectionSubmittedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
