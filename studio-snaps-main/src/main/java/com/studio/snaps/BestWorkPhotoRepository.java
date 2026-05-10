package com.studio.snaps;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BestWorkPhotoRepository extends JpaRepository<BestWorkPhoto, Long> {

    List<BestWorkPhoto> findAllByOrderByUploadedAtDesc();
}
