package com.studio.snaps;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class HomeController {

    private final StudioEventRepository studioEventRepository;
    private final EventPhotoRepository eventPhotoRepository;
    private final BestWorkPhotoRepository bestWorkPhotoRepository;
    private final PhotoStorageService photoStorageService;

    private static final List<String> BEST_WORK_SCHEMES = List.of(
            "Wedding",
            "Birthday",
            "Engagement",
            "Corporate",
            "Portrait",
            "Baby Shoot",
            "Other");

    public HomeController(
            StudioEventRepository studioEventRepository,
            EventPhotoRepository eventPhotoRepository,
            BestWorkPhotoRepository bestWorkPhotoRepository,
            PhotoStorageService photoStorageService) {
        this.studioEventRepository = studioEventRepository;
        this.eventPhotoRepository = eventPhotoRepository;
        this.bestWorkPhotoRepository = bestWorkPhotoRepository;
        this.photoStorageService = photoStorageService;
    }

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/photographers")
    public String photographers(Model model) {
        model.addAttribute("events", studioEventRepository.findAllByOrderByCreatedAtDesc());
        model.addAttribute("eventCount", studioEventRepository.count());
        model.addAttribute("photoUploadCount", eventPhotoRepository.count());
        return "photographer-dashboard";
    }

    @GetMapping("/best-work")
    public String bestWork(Model model) {
        List<BestWorkPhoto> bestWorkPhotos = bestWorkPhotoRepository.findAllByOrderByUploadedAtDesc();
        Map<String, List<BestWorkPhoto>> photosByScheme = new LinkedHashMap<>();
        BEST_WORK_SCHEMES.forEach(scheme -> photosByScheme.put(scheme, bestWorkPhotos.stream()
                .filter(photo -> scheme.equals(photo.getScheme()))
                .toList()));
        Map<Long, String> bestWorkPhotoUrls = bestWorkPhotos.stream()
                .collect(Collectors.toMap(BestWorkPhoto::getId, photoStorageService::createViewUrl));

        model.addAttribute("schemes", BEST_WORK_SCHEMES);
        model.addAttribute("photosByScheme", photosByScheme);
        model.addAttribute("bestWorkPhotoUrls", bestWorkPhotoUrls);
        model.addAttribute("bestWorkCount", bestWorkPhotos.size());
        return "best-work";
    }

    @PostMapping("/best-work")
    public String uploadBestWork(
            @RequestParam("scheme") String scheme,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("photos") MultipartFile[] photos,
            RedirectAttributes redirectAttributes) throws IOException {
        if (!BEST_WORK_SCHEMES.contains(scheme)) {
            throw new IllegalArgumentException("Best work scheme is invalid: " + scheme);
        }

        int uploadedCount = 0;
        for (MultipartFile photo : photos) {
            if (photo.isEmpty()) {
                continue;
            }

            String originalFileName = StringUtils.cleanPath(photo.getOriginalFilename() == null ? "photo" : photo.getOriginalFilename());
            String storedFileName = photoStorageService.createStoredFileName(originalFileName);
            PhotoStorageService.StoredPhoto storedPhoto = photoStorageService.uploadBestWorkPhoto(scheme, photo, storedFileName);

            BestWorkPhoto bestWorkPhoto = new BestWorkPhoto();
            bestWorkPhoto.setScheme(scheme);
            bestWorkPhoto.setTitle(title);
            bestWorkPhoto.setDescription(description);
            bestWorkPhoto.setOriginalFileName(originalFileName);
            bestWorkPhoto.setStoredFileName(storedFileName);
            bestWorkPhoto.setContentType(photo.getContentType());
            bestWorkPhoto.setFilePath(storedPhoto.reference());
            if (storedPhoto.s3Object()) {
                bestWorkPhoto.setS3Key(storedPhoto.reference());
            }
            bestWorkPhotoRepository.save(bestWorkPhoto);
            uploadedCount++;
        }

        redirectAttributes.addFlashAttribute("bestWorkMessage", uploadedCount + " best work photo(s) added to " + scheme + ".");
        return "redirect:/best-work";
    }

    @PostMapping("/best-work/{id}/delete")
    public String deleteBestWorkPhoto(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) throws IOException {
        BestWorkPhoto photo = bestWorkPhotoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Best work photo not found: " + id));

        deleteStoredBestWorkPhoto(photo);
        bestWorkPhotoRepository.delete(photo);
        redirectAttributes.addFlashAttribute("bestWorkMessage", "Best work photo deleted.");
        return "redirect:/best-work";
    }

    @GetMapping("/clients")
    public String clients() {
        return "redirect:/events";
    }

    @GetMapping("/client-gallery/{id}")
    public String clientGallery(@PathVariable Long id) {
        return "redirect:/events";
    }

    @GetMapping("/client-gallery")
    public String emptyClientGallery() {
        return "redirect:/events";
    }

    @GetMapping("/events")
    public String events(Model model) {
        var events = studioEventRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, Long> photoCounts = events.stream()
                .collect(Collectors.toMap(StudioEvent::getId, event -> eventPhotoRepository.countByEventId(event.getId())));
        model.addAttribute("event", new StudioEvent());
        model.addAttribute("events", events);
        model.addAttribute("photoCounts", photoCounts);
        return "events";
    }

    @GetMapping("/events/{id}")
    public String eventDetails(@PathVariable Long id, Model model) {
        StudioEvent event = studioEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));
        List<EventPhoto> photos = eventPhotoRepository.findAllByEventIdOrderByUploadedAtDesc(id);
        List<EventPhoto> selectedPhotos = photos.stream()
                .filter(EventPhoto::isSelectedByClient)
                .toList();
        model.addAttribute("event", event);
        model.addAttribute("photos", photos);
        model.addAttribute("selectedPhotos", selectedPhotos);
        model.addAttribute("photoUrls", createPhotoUrls(photos));
        model.addAttribute("selectedPhotoCount", selectedPhotos.size());
        return "event-details";
    }

    @GetMapping("/events/{id}/photos")
    public String eventPhotos(@PathVariable Long id, Model model) {
        StudioEvent event = studioEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));
        List<EventPhoto> photos = eventPhotoRepository.findAllByEventIdOrderByUploadedAtDesc(id);
        List<EventPhoto> selectedPhotos = photos.stream()
                .filter(EventPhoto::isSelectedByClient)
                .toList();
        model.addAttribute("event", event);
        model.addAttribute("photos", photos);
        model.addAttribute("selectedPhotos", selectedPhotos);
        model.addAttribute("photoUrls", createPhotoUrls(photos));
        model.addAttribute("selectedPhotoCount", selectedPhotos.size());
        return "event-photos";
    }

    @PostMapping("/events")
    public String saveEvent(@ModelAttribute("event") StudioEvent event) {
        studioEventRepository.save(event);
        return "redirect:/events";
    }

    @PostMapping("/events/{id}/photos")
    public String uploadEventPhotos(
            @PathVariable Long id,
            @RequestParam("photos") MultipartFile[] photos,
            RedirectAttributes redirectAttributes) throws IOException {
        StudioEvent event = studioEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));

        int uploadedCount = 0;

        for (MultipartFile photo : photos) {
            if (photo.isEmpty()) {
                continue;
            }

            String originalFileName = StringUtils.cleanPath(photo.getOriginalFilename() == null ? "photo" : photo.getOriginalFilename());
            String storedFileName = photoStorageService.createStoredFileName(originalFileName);
            PhotoStorageService.StoredPhoto storedPhoto = photoStorageService.uploadEventPhoto(event.getId(), photo, storedFileName);

            EventPhoto eventPhoto = new EventPhoto();
            eventPhoto.setEventId(event.getId());
            eventPhoto.setOriginalFileName(originalFileName);
            eventPhoto.setStoredFileName(storedFileName);
            eventPhoto.setContentType(photo.getContentType());
            eventPhoto.setFilePath(storedPhoto.reference());
            if (storedPhoto.s3Object()) {
                eventPhoto.setS3Key(storedPhoto.reference());
            }
            eventPhotoRepository.save(eventPhoto);
            uploadedCount++;
        }

        redirectAttributes.addFlashAttribute("uploadMessage", uploadedCount + " photo(s) uploaded for " + event.getClientName() + ".");
        return "redirect:/events/" + event.getId();
    }

    @PostMapping("/events/{eventId}/photos/{photoId}/delete")
    public String deleteEventPhoto(
            @PathVariable Long eventId,
            @PathVariable Long photoId,
            RedirectAttributes redirectAttributes) throws IOException {
        EventPhoto photo = eventPhotoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        if (!photo.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Photo does not belong to event: " + eventId);
        }

        deleteStoredPhoto(photo);
        eventPhotoRepository.delete(photo);
        redirectAttributes.addFlashAttribute("uploadMessage", "Photo deleted.");
        return "redirect:/events/" + eventId + "/photos";
    }

    @PostMapping("/events/{id}/share")
    public String createShareLink(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        StudioEvent event = studioEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found: " + id));

        if (!StringUtils.hasText(event.getShareToken())) {
            event.setShareToken(UUID.randomUUID().toString().replace("-", ""));
            studioEventRepository.save(event);
        }

        redirectAttributes.addFlashAttribute("shareMessage", "Client gallery link is ready.");
        return "redirect:/events/" + id;
    }

    @GetMapping("/client/events/{id}/gallery")
    public String clientEventGallery(
            @PathVariable Long id,
            @RequestParam("token") String token,
            Model model) {
        StudioEvent event = studioEventRepository.findByIdAndShareToken(id, token)
                .orElseThrow(() -> new IllegalArgumentException("Client gallery link is invalid."));
        List<EventPhoto> photos = eventPhotoRepository.findAllByEventIdOrderByUploadedAtDesc(id);
        List<EventPhoto> selectedPhotos = photos.stream()
                .filter(EventPhoto::isSelectedByClient)
                .toList();

        model.addAttribute("event", event);
        model.addAttribute("token", token);
        model.addAttribute("photos", photos);
        model.addAttribute("selectedPhotos", selectedPhotos);
        model.addAttribute("photoUrls", createPhotoUrls(photos));
        model.addAttribute("selectedPhotoCount", selectedPhotos.size());
        return "client-event-gallery";
    }

    @PostMapping("/client/events/{eventId}/photos/{photoId}/select")
    public String selectClientPhoto(
            @PathVariable Long eventId,
            @PathVariable Long photoId,
            @RequestParam("token") String token,
            @RequestParam("selected") boolean selected) {
        studioEventRepository.findByIdAndShareToken(eventId, token)
                .orElseThrow(() -> new IllegalArgumentException("Client gallery link is invalid."));
        EventPhoto photo = eventPhotoRepository.findById(photoId)
                .orElseThrow(() -> new IllegalArgumentException("Photo not found: " + photoId));

        if (!photo.getEventId().equals(eventId)) {
            throw new IllegalArgumentException("Photo does not belong to event: " + eventId);
        }

        photo.setSelectedByClient(selected);
        eventPhotoRepository.save(photo);
        return "redirect:/client/events/" + eventId + "/gallery?token=" + token;
    }

    @PostMapping("/client/events/{eventId}/submit-selection")
    public String submitClientSelection(
            @PathVariable Long eventId,
            @RequestParam("token") String token,
            RedirectAttributes redirectAttributes) {
        StudioEvent event = studioEventRepository.findByIdAndShareToken(eventId, token)
                .orElseThrow(() -> new IllegalArgumentException("Client gallery link is invalid."));

        event.setClientSelectionSubmitted(true);
        event.setClientSelectionSubmittedAt(LocalDateTime.now());
        studioEventRepository.save(event);
        redirectAttributes.addFlashAttribute("selectionMessage", "Your selected photos have been sent to the studio.");
        return "redirect:/client/events/" + eventId + "/gallery?token=" + token;
    }

    private Map<Long, String> createPhotoUrls(List<EventPhoto> photos) {
        return photos.stream()
                .collect(Collectors.toMap(EventPhoto::getId, photoStorageService::createViewUrl));
    }

    private void deleteStoredPhoto(EventPhoto photo) throws IOException {
        if (StringUtils.hasText(photo.getS3Key())) {
            photoStorageService.deletePhoto(photo.getS3Key());
        } else {
            Files.deleteIfExists(Paths.get(photo.getFilePath()));
        }
    }

    private void deleteStoredBestWorkPhoto(BestWorkPhoto photo) throws IOException {
        if (StringUtils.hasText(photo.getS3Key())) {
            photoStorageService.deletePhoto(photo.getS3Key());
        } else {
            Files.deleteIfExists(Paths.get(photo.getFilePath()));
        }
    }
}
