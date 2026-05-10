package com.studio.snaps;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StudioEventRepository extends JpaRepository<StudioEvent, Long> {

    List<StudioEvent> findAllByOrderByCreatedAtDesc();

    Optional<StudioEvent> findByIdAndShareToken(Long id, String shareToken);
}
