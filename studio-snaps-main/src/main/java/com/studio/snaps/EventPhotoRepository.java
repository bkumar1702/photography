package com.studio.snaps;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EventPhotoRepository extends JpaRepository<EventPhoto, Long> {

    long countByEventId(Long eventId);

    List<EventPhoto> findAllByEventIdOrderByUploadedAtDesc(Long eventId);
}
