package com.studio.snaps;

import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
public class PhotoStorageService {

    public record StoredPhoto(String reference, boolean s3Object) {
    }

    private final String bucketName;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public PhotoStorageService(
            @Value("${studio.aws.s3.bucket:}") String bucketName,
            @Value("${studio.aws.region:ap-south-1}") String regionName) {
        this.bucketName = bucketName;
        Region region = Region.of(regionName);
        DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
        this.s3Client = S3Client.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
        this.s3Presigner = S3Presigner.builder()
                .region(region)
                .credentialsProvider(credentialsProvider)
                .build();
    }

    public StoredPhoto uploadEventPhoto(Long eventId, MultipartFile photo, String storedFileName) throws IOException {
        if (!StringUtils.hasText(bucketName)) {
            Path eventDirectory = Paths.get("uploads", "event-photos", String.valueOf(eventId));
            Files.createDirectories(eventDirectory);
            Path destination = eventDirectory.resolve(storedFileName);
            photo.transferTo(destination);
            return new StoredPhoto(destination.toString(), false);
        }

        String key = "event-photos/" + eventId + "/" + storedFileName;
        String contentType = photo.getContentType() == null ? "application/octet-stream" : photo.getContentType();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(photo.getInputStream(), photo.getSize()));
        return new StoredPhoto(key, true);
    }

    public StoredPhoto uploadBestWorkPhoto(String scheme, MultipartFile photo, String storedFileName) throws IOException {
        String safeScheme = StringUtils.hasText(scheme) ? scheme.toLowerCase().replaceAll("[^a-z0-9-]+", "-") : "general";
        if (!StringUtils.hasText(bucketName)) {
            Path bestWorkDirectory = Paths.get("uploads", "best-work", safeScheme);
            Files.createDirectories(bestWorkDirectory);
            Path destination = bestWorkDirectory.resolve(storedFileName);
            photo.transferTo(destination);
            return new StoredPhoto(destination.toString(), false);
        }

        String key = "best-work/" + safeScheme + "/" + storedFileName;
        String contentType = photo.getContentType() == null ? "application/octet-stream" : photo.getContentType();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(contentType)
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(photo.getInputStream(), photo.getSize()));
        return new StoredPhoto(key, true);
    }

    public void deletePhoto(String s3Key) {
        if (!StringUtils.hasText(bucketName) || !StringUtils.hasText(s3Key)) {
            return;
        }

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(s3Key)
                .build();
        s3Client.deleteObject(deleteObjectRequest);
    }

    public String createViewUrl(EventPhoto photo) {
        if (StringUtils.hasText(bucketName) && StringUtils.hasText(photo.getS3Key())) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(photo.getS3Key())
                    .build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(30))
                    .getObjectRequest(getObjectRequest)
                    .build();
            URL url = s3Presigner.presignGetObject(presignRequest).url();
            return url.toString();
        }

        return "/uploads/event-photos/" + photo.getEventId() + "/" + photo.getStoredFileName();
    }

    public String createViewUrl(BestWorkPhoto photo) {
        if (StringUtils.hasText(bucketName) && StringUtils.hasText(photo.getS3Key())) {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(photo.getS3Key())
                    .build();
            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(30))
                    .getObjectRequest(getObjectRequest)
                    .build();
            URL url = s3Presigner.presignGetObject(presignRequest).url();
            return url.toString();
        }

        String safeScheme = StringUtils.hasText(photo.getScheme()) ? photo.getScheme().toLowerCase().replaceAll("[^a-z0-9-]+", "-") : "general";
        return "/uploads/best-work/" + safeScheme + "/" + photo.getStoredFileName();
    }

    public String createStoredFileName(String originalFileName) {
        String extension = "";
        int extensionIndex = originalFileName.lastIndexOf('.');
        if (extensionIndex >= 0) {
            extension = originalFileName.substring(extensionIndex);
        }
        return UUID.randomUUID() + extension;
    }

}
