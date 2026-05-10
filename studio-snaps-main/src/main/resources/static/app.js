document.querySelectorAll(".dashboard-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".dashboard-tabs button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

function showDashboardPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  document.querySelectorAll(".dashboard-panel").forEach((item) => {
    item.classList.toggle("active", item.id === panelId);
  });
  document.querySelectorAll(".dashboard-tabs button, .dashboard-tabs a").forEach((item) => {
    item.classList.toggle("active", item.dataset.dashboardTab === panelId);
  });
}

document.querySelectorAll("[data-dashboard-tab]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    showDashboardPanel(item.dataset.dashboardTab);
  });
});

const dashboardHomeTab = document.querySelector(".dashboard-tabs a.active");
if (dashboardHomeTab && document.getElementById("dashboard-overview")) {
  dashboardHomeTab.dataset.dashboardTab = "dashboard-overview";
  dashboardHomeTab.addEventListener("click", (event) => {
    event.preventDefault();
    showDashboardPanel("dashboard-overview");
  });
}

function createPhotographerAuthModal() {
  const modal = document.createElement("div");
  modal.className = "photographer-auth-modal";
  modal.id = "photographer-auth-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="photographer-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="photographer-auth-title">
      <button class="auth-close-button" type="button" data-close-photographer-auth aria-label="Close">x</button>
      <div class="auth-heading">
        <span>Photographer Access</span>
        <h2 id="photographer-auth-title">Continue to dashboard</h2>
      </div>
      <div class="auth-tabs" role="tablist" aria-label="Photographer access">
        <button class="active" type="button" data-auth-mode="login">Login</button>
        <button type="button" data-auth-mode="register">Register</button>
      </div>
      <form class="auth-form active" data-auth-form="login" novalidate>
        <label>
          Phone Number
          <input type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="Enter phone number" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autocomplete="current-password" placeholder="Enter password" required minlength="6" />
        </label>
        <p class="auth-error" aria-live="polite"></p>
        <button class="button gold-button" type="submit">Login</button>
      </form>
      <form class="auth-form" data-auth-form="register" novalidate>
        <label>
          Phone Number
          <input type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="Enter phone number" required />
        </label>
        <label>
          Email Address
          <input type="email" name="email" autocomplete="email" placeholder="studio@example.com" required />
        </label>
        <label>
          Password
          <input type="password" name="password" autocomplete="new-password" placeholder="Create password" required minlength="6" />
        </label>
        <p class="auth-error" aria-live="polite"></p>
        <button class="button gold-button" type="submit">Register</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

const photographerAuthLinks = Array.from(document.querySelectorAll('a[href="/photographers"]'));
const photographerAuthModal = photographerAuthLinks.length ? createPhotographerAuthModal() : null;
let photographerAuthRedirect = "/photographers";
const photographerAuthStorageKey = "momentoPhotographerAuth";

function getPhotographerAuth() {
  try {
    return JSON.parse(localStorage.getItem(photographerAuthStorageKey) || "{}");
  } catch (error) {
    return {};
  }
}

function isPhotographerLoggedIn() {
  return getPhotographerAuth().loggedIn === true;
}

function setPhotographerAuthMode(mode) {
  if (!photographerAuthModal) return;
  photographerAuthModal.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === mode);
  });
  photographerAuthModal.querySelectorAll("[data-auth-form]").forEach((form) => {
    const active = form.dataset.authForm === mode;
    form.classList.toggle("active", active);
    form.querySelector(".auth-error").textContent = "";
    if (active) {
      const input = form.querySelector("input");
      if (input) input.focus();
    }
  });
}

function openPhotographerAuth(event) {
  if (!photographerAuthModal) return;
  if (isPhotographerLoggedIn()) return;
  event.preventDefault();
  photographerAuthRedirect = event.currentTarget.getAttribute("href") || "/photographers";
  photographerAuthModal.classList.add("open");
  photographerAuthModal.setAttribute("aria-hidden", "false");
  setPhotographerAuthMode("login");
}

function closePhotographerAuth() {
  if (!photographerAuthModal) return;
  photographerAuthModal.classList.remove("open");
  photographerAuthModal.setAttribute("aria-hidden", "true");
}

function validateAuthForm(form) {
  const phone = form.elements.phone?.value.trim() || "";
  const email = form.elements.email?.value.trim() || "";
  const password = form.elements.password?.value || "";
  const error = form.querySelector(".auth-error");
  const phoneDigits = phone.replace(/\D/g, "");

  if (phoneDigits.length < 10) {
    error.textContent = "Enter a valid phone number.";
    return false;
  }
  if (form.dataset.authForm === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.textContent = "Enter a valid email address.";
    return false;
  }
  if (password.length < 6) {
    error.textContent = "Password must be at least 6 characters.";
    return false;
  }

  error.textContent = "";
  return true;
}

photographerAuthLinks.forEach((link) => {
  link.addEventListener("click", openPhotographerAuth);
});

if (window.location.pathname === "/photographers" && !isPhotographerLoggedIn()) {
  window.location.replace("/");
}

if (photographerAuthModal) {
  photographerAuthModal.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setPhotographerAuthMode(button.dataset.authMode));
  });
  photographerAuthModal.querySelectorAll("[data-close-photographer-auth]").forEach((button) => {
    button.addEventListener("click", closePhotographerAuth);
  });
  photographerAuthModal.addEventListener("click", (event) => {
    if (event.target === photographerAuthModal) closePhotographerAuth();
  });
  photographerAuthModal.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateAuthForm(form)) return;
      localStorage.setItem(photographerAuthStorageKey, JSON.stringify({
        loggedIn: true,
        phone: form.elements.phone?.value.trim() || "",
        email: form.elements.email?.value.trim() || "",
        mode: form.dataset.authForm
      }));
      window.location.href = photographerAuthRedirect;
    });
  });
}

document.querySelectorAll("[data-photographer-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    localStorage.removeItem(photographerAuthStorageKey);
    window.location.href = "/";
  });
});

const eventPhotoInput = document.getElementById("event-photo-input");
const eventUploadForm = document.querySelector(".event-detail-upload");
const eventUploadTitle = document.getElementById("event-upload-title");
const eventUploadHelp = document.getElementById("event-upload-help");
const eventUploadProgress = document.getElementById("event-upload-progress");
const eventUploadStatus = document.getElementById("event-upload-status");
const eventProgressBar = document.querySelector(".event-upload-progress .progress-bar");

function showEventUploadProgress(files) {
  if (!eventUploadProgress || !eventUploadStatus || !eventUploadTitle || !eventUploadHelp) return;
  const count = files?.length || 0;
  if (!count) return;

  eventUploadProgress.classList.add("visible");
  eventUploadTitle.textContent = `${count} photo${count === 1 ? "" : "s"} selected`;
  eventUploadHelp.textContent = "Click Upload Photos to start uploading.";
  eventUploadStatus.textContent = `${count} file${count === 1 ? "" : "s"} ready to upload.`;
  if (eventProgressBar) eventProgressBar.style.width = "18%";
}

if (eventPhotoInput) {
  eventPhotoInput.addEventListener("change", (event) => {
    showEventUploadProgress(event.target.files);
  });
}

if (eventUploadForm) {
  eventUploadForm.addEventListener("submit", () => {
    const count = eventPhotoInput?.files?.length || 0;
    if (!count || !eventUploadProgress || !eventUploadStatus) return;

    eventUploadProgress.classList.add("visible");
    eventUploadForm.classList.add("uploading");
    eventUploadStatus.textContent = `Uploading ${count} photo${count === 1 ? "" : "s"}...`;
  });
}

const portfolioPhotoInput = document.getElementById("portfolio-photo-input");
const portfolioUploadForm = document.querySelector(".portfolio-upload-form");
const portfolioUploadTitle = document.getElementById("portfolio-upload-title");
const portfolioUploadProgress = document.getElementById("portfolio-upload-progress");
const portfolioUploadStatus = document.getElementById("portfolio-upload-status");
const portfolioProgressBar = document.querySelector(".portfolio-upload-progress .progress-bar");
const portfolioFileCount = document.getElementById("portfolio-file-count");
const portfolioFilePreview = document.getElementById("portfolio-file-preview");
const portfolioFileEmpty = document.getElementById("portfolio-file-empty");
const portfolioClearFiles = document.getElementById("portfolio-clear-files");
const portfolioClearTop = document.getElementById("portfolio-clear-top");
let portfolioPreviewUrl = "";

function showPortfolioUploadProgress(files) {
  if (!portfolioUploadProgress || !portfolioUploadStatus || !portfolioUploadTitle || !portfolioFileCount) return;
  const count = files?.length || 0;
  if (!count) return;

  portfolioUploadProgress.classList.add("visible");
  portfolioFileCount.textContent = `${count} file${count === 1 ? "" : "s"} uploaded`;
  portfolioUploadTitle.textContent = files[0]?.name || `${count} photo${count === 1 ? "" : "s"} selected`;
  portfolioUploadStatus.textContent = `${count} file${count === 1 ? "" : "s"} ready.`;
  if (portfolioProgressBar) portfolioProgressBar.style.width = "22%";

  if (portfolioFilePreview && portfolioFileEmpty && files[0]?.type?.startsWith("image/")) {
    if (portfolioPreviewUrl) URL.revokeObjectURL(portfolioPreviewUrl);
    portfolioPreviewUrl = URL.createObjectURL(files[0]);
    portfolioFilePreview.src = portfolioPreviewUrl;
    portfolioFilePreview.hidden = false;
    portfolioFileEmpty.hidden = true;
  }
}

function clearPortfolioFiles() {
  if (!portfolioPhotoInput || !portfolioUploadTitle || !portfolioUploadStatus || !portfolioFileCount) return;
  portfolioPhotoInput.value = "";
  portfolioFileCount.textContent = "No files selected";
  portfolioUploadTitle.textContent = "Choose portfolio photos";
  portfolioUploadStatus.textContent = "Select the strongest images for this scheme.";
  if (portfolioProgressBar) portfolioProgressBar.style.width = "0";
  if (portfolioUploadProgress) portfolioUploadProgress.classList.remove("visible");
  if (portfolioUploadForm) portfolioUploadForm.classList.remove("uploading");
  if (portfolioFilePreview && portfolioFileEmpty) {
    if (portfolioPreviewUrl) URL.revokeObjectURL(portfolioPreviewUrl);
    portfolioPreviewUrl = "";
    portfolioFilePreview.removeAttribute("src");
    portfolioFilePreview.hidden = true;
    portfolioFileEmpty.hidden = false;
  }
}

if (portfolioPhotoInput) {
  portfolioPhotoInput.addEventListener("change", (event) => {
    showPortfolioUploadProgress(event.target.files);
  });
}

if (portfolioUploadForm) {
  portfolioUploadForm.addEventListener("submit", () => {
    const count = portfolioPhotoInput?.files?.length || 0;
    if (!count || !portfolioUploadProgress || !portfolioUploadStatus) return;

    portfolioUploadProgress.classList.add("visible");
    portfolioUploadForm.classList.add("uploading");
    portfolioUploadStatus.textContent = `Uploading ${count} photo${count === 1 ? "" : "s"}...`;
  });
}

[portfolioClearFiles, portfolioClearTop].forEach((button) => {
  if (button) button.addEventListener("click", clearPortfolioFiles);
});

const shareModal = document.getElementById("share-modal");
const shareUrlInput = document.getElementById("client-share-url");
const copyShareLink = document.getElementById("copy-share-link");
const shareCopyStatus = document.getElementById("share-copy-status");

function buildAbsoluteShareUrl(path) {
  if (!path) return "";
  return new URL(path, window.location.origin).toString();
}

function setShareUrl() {
  if (!shareUrlInput) return;
  shareUrlInput.value = buildAbsoluteShareUrl(shareUrlInput.dataset.sharePath);
}

function openSharePopup(event) {
  if (!shareModal) return;
  const path = event?.currentTarget?.dataset?.sharePath || shareUrlInput?.dataset?.sharePath;
  if (shareUrlInput) shareUrlInput.value = buildAbsoluteShareUrl(path);
  shareModal.classList.add("open");
  shareModal.setAttribute("aria-hidden", "false");
  if (shareUrlInput) shareUrlInput.select();
}

function closeSharePopup() {
  if (!shareModal) return;
  shareModal.classList.remove("open");
  shareModal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll("[data-open-share-popup]").forEach((button) => {
  button.addEventListener("click", openSharePopup);
});

document.querySelectorAll("[data-close-share-popup]").forEach((button) => {
  button.addEventListener("click", closeSharePopup);
});

if (shareModal) {
  setShareUrl();
  if (shareModal.classList.contains("open")) {
    shareModal.setAttribute("aria-hidden", "false");
  }
  shareModal.addEventListener("click", (event) => {
    if (event.target === shareModal) closeSharePopup();
  });
}

if (copyShareLink) {
  copyShareLink.addEventListener("click", async () => {
    if (!shareUrlInput || !shareCopyStatus) return;
    try {
      await navigator.clipboard.writeText(shareUrlInput.value);
      shareCopyStatus.textContent = "Link copied. Send it to the client.";
    } catch (error) {
      shareUrlInput.select();
      shareCopyStatus.textContent = "Select and copy the link from the box.";
    }
  });
}

const selectionConfirmModal = document.getElementById("selection-confirm-modal");
const openSelectionConfirm = document.getElementById("open-selection-confirm");
const confirmSendSelection = document.getElementById("confirm-send-selection");
const clientSubmitSelectionForm = document.getElementById("client-submit-selection-form");

function openSelectionConfirmModal() {
  if (!selectionConfirmModal) return;
  selectionConfirmModal.classList.add("open");
  selectionConfirmModal.setAttribute("aria-hidden", "false");
}

function closeSelectionConfirmModal() {
  if (!selectionConfirmModal) return;
  selectionConfirmModal.classList.remove("open");
  selectionConfirmModal.setAttribute("aria-hidden", "true");
}

if (openSelectionConfirm) {
  openSelectionConfirm.addEventListener("click", () => {
    if (!openSelectionConfirm.disabled) openSelectionConfirmModal();
  });
}

document.querySelectorAll("[data-close-selection-confirm]").forEach((button) => {
  button.addEventListener("click", closeSelectionConfirmModal);
});

if (selectionConfirmModal) {
  selectionConfirmModal.addEventListener("click", (event) => {
    if (event.target === selectionConfirmModal) closeSelectionConfirmModal();
  });
}

if (confirmSendSelection) {
  confirmSendSelection.addEventListener("click", () => {
    confirmSendSelection.disabled = true;
    confirmSendSelection.textContent = "Sending...";
    if (openSelectionConfirm) {
      openSelectionConfirm.disabled = true;
      openSelectionConfirm.textContent = "Sending...";
    }
    if (clientSubmitSelectionForm) clientSubmitSelectionForm.submit();
  });
}

function showGalleryTab(tabId) {
  if (!tabId) return;
  const targetPanel = document.getElementById(tabId);
  if (!targetPanel) return;

  const tabGroup = targetPanel.closest(".event-photo-section, .client-selection-card, .gallery-card") || document;
  tabGroup.querySelectorAll(".gallery-tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
  tabGroup.querySelectorAll("[data-gallery-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.galleryTab === tabId);
  });
}

document.querySelectorAll("[data-gallery-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    showGalleryTab(button.dataset.galleryTab);
  });
});

const clientLightbox = document.getElementById("client-photo-lightbox");
const clientLightboxImage = document.getElementById("client-lightbox-image");
const clientLightboxCaption = document.getElementById("client-lightbox-caption");
const clientLightboxCounter = document.getElementById("client-lightbox-counter");
const clientLightboxFavorite = document.getElementById("client-lightbox-favourite");
const clientLightboxPhotos = Array.from(document.querySelectorAll("#client-all-photos .client-lightbox-photo, #photographer-all-photos .client-lightbox-photo"));
let clientLightboxIndex = 0;

function getClientLightboxPhoto(index) {
  if (!clientLightboxPhotos.length) return null;
  const nextIndex = (index + clientLightboxPhotos.length) % clientLightboxPhotos.length;
  clientLightboxIndex = nextIndex;
  return clientLightboxPhotos[nextIndex];
}

function renderClientLightbox(index) {
  const photo = getClientLightboxPhoto(index);
  if (!photo || !clientLightboxImage || !clientLightboxCaption || !clientLightboxCounter) return;

  const selected = photo.dataset.photoSelected === "true";
  clientLightboxImage.src = photo.dataset.photoSrc || "";
  clientLightboxImage.alt = photo.dataset.photoAlt || "Selected photo";
  clientLightboxCaption.textContent = photo.dataset.photoAlt || "Photo";
  clientLightboxCounter.textContent = `${clientLightboxIndex + 1} / ${clientLightboxPhotos.length}`;
  if (clientLightboxFavorite) {
    clientLightboxFavorite.classList.toggle("selected", selected);
    clientLightboxFavorite.setAttribute("aria-label", selected ? "Remove from favourites" : "Add to favourites");
    clientLightboxFavorite.querySelector("span").textContent = selected ? "\u2665" : "\u2661";
    clientLightboxFavorite.dataset.photoId = photo.dataset.photoId || "";
  }
}

function openClientLightbox(index) {
  if (!clientLightbox) return;
  renderClientLightbox(index);
  clientLightbox.classList.add("open");
  clientLightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeClientLightbox() {
  if (!clientLightbox) return;
  clientLightbox.classList.remove("open");
  clientLightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

clientLightboxPhotos.forEach((photo, index) => {
  photo.addEventListener("click", () => {
    openClientLightbox(Number(photo.dataset.photoIndex || index));
  });
});

document.querySelectorAll("#client-favourites .client-lightbox-photo, #photographer-favourites .client-lightbox-photo").forEach((photo) => {
  photo.addEventListener("click", () => {
    const index = clientLightboxPhotos.findIndex((item) => item.dataset.photoId === photo.dataset.photoId);
    openClientLightbox(index >= 0 ? index : 0);
  });
});

document.querySelectorAll("[data-close-client-lightbox]").forEach((button) => {
  button.addEventListener("click", closeClientLightbox);
});

document.querySelectorAll("[data-client-lightbox-prev]").forEach((button) => {
  button.addEventListener("click", () => renderClientLightbox(clientLightboxIndex - 1));
});

document.querySelectorAll("[data-client-lightbox-next]").forEach((button) => {
  button.addEventListener("click", () => renderClientLightbox(clientLightboxIndex + 1));
});

if (clientLightbox) {
  clientLightbox.addEventListener("click", (event) => {
    if (event.target === clientLightbox) closeClientLightbox();
  });
}

if (clientLightboxFavorite) {
  clientLightboxFavorite.addEventListener("click", () => {
    const photoId = clientLightboxFavorite.dataset.photoId;
    const form = photoId ? document.querySelector(`#client-all-photos .client-photo-form[data-photo-id="${photoId}"]`) : null;
    if (form) form.submit();
  });
}

document.addEventListener("keydown", (event) => {
  if (!clientLightbox?.classList.contains("open")) return;
  if (event.key === "Escape") closeClientLightbox();
  if (event.key === "ArrowLeft") renderClientLightbox(clientLightboxIndex - 1);
  if (event.key === "ArrowRight") renderClientLightbox(clientLightboxIndex + 1);
});

const printSelectedPhotos = document.getElementById("print-selected-photos");
if (printSelectedPhotos) {
  printSelectedPhotos.addEventListener("click", () => {
    window.print();
  });
}

const eventForm = document.getElementById("event-form");
const eventComposer = document.getElementById("event-composer");
const eventInputs = {
  client: document.getElementById("client-name"),
  type: document.getElementById("event-type"),
  date: document.getElementById("event-date"),
  time: document.getElementById("event-time"),
  address: document.getElementById("event-address")
};

function openEventForm() {
  if (!eventComposer) return;
  eventComposer.classList.add("open");
  eventComposer.setAttribute("aria-hidden", "false");
  eventComposer.scrollIntoView({ behavior: "smooth", block: "start" });
  if (eventInputs.client) eventInputs.client.focus();
}

document.querySelectorAll("[data-open-event-form]").forEach((button) => {
  button.addEventListener("click", openEventForm);
});

function updateEventSummary() {
  const summaryType = document.getElementById("summary-type");
  const summaryClient = document.getElementById("summary-client");
  const summaryDate = document.getElementById("summary-date");
  const summaryAddress = document.getElementById("summary-address");
  if (!summaryType || !summaryClient || !summaryDate || !summaryAddress) return;

  summaryType.textContent = eventInputs.type?.value || "Event";
  summaryClient.textContent = eventInputs.client?.value || "Client name";
  const date = eventInputs.date?.value || "Pick date";
  const time = eventInputs.time?.value || "time";
  summaryDate.textContent = `${date} - ${time}`;
  summaryAddress.textContent = eventInputs.address?.value || "Add destination address";
}

Object.values(eventInputs).forEach((input) => {
  if (input) input.addEventListener("input", updateEventSummary);
});

const clientForm = document.getElementById("client-form");
const clientInputs = {
  name: document.getElementById("new-client-name"),
  event: document.getElementById("new-client-event"),
  date: document.getElementById("new-client-date")
};

function updateClientPreview() {
  const previewName = document.getElementById("client-preview-name");
  const previewEvent = document.getElementById("client-preview-event");
  const previewDate = document.getElementById("client-preview-date");
  const avatar = document.querySelector(".client-avatar");
  if (!previewName || !previewEvent || !previewDate) return;

  const name = clientInputs.name?.value || "Client name";
  previewName.textContent = name;
  previewEvent.textContent = clientInputs.event?.value || "Event gallery";
  previewDate.textContent = clientInputs.date?.value || "Add a date to keep records tidy";
  if (avatar) avatar.textContent = name.trim().charAt(0).toUpperCase() || "M";
}

Object.values(clientInputs).forEach((input) => {
  if (input) input.addEventListener("input", updateClientPreview);
});

function updateGalleryClient() {
  const title = document.getElementById("gallery-client-title");
  const date = document.getElementById("gallery-client-date");
  if (!title || !date) return;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("client") && !params.has("event") && !params.has("date")) return;

  const clientName = params.get("client") || "Client";
  const eventName = params.get("event") || "Gallery";
  const galleryDate = params.get("date") || "No date selected";
  title.textContent = `${clientName} - ${eventName}`;
  date.textContent = galleryDate;
}

updateClientPreview();
updateGalleryClient();

const calendarGrid = document.getElementById("event-calendar");
const calendarMonth = document.getElementById("calendar-month");
const calendarEmpty = document.getElementById("calendar-empty");
const calendarEvents = Array.from(document.querySelectorAll(".calendar-source")).map((item) => ({
  id: item.dataset.id,
  client: item.dataset.client || "Client",
  type: item.dataset.type || "Event",
  date: item.dataset.date || "",
  time: item.dataset.time || "",
  address: item.dataset.address || "",
  notes: item.dataset.notes || ""
})).filter((item) => item.date);
const eventDates = calendarEvents.map((item) => item.date).sort();
let calendarCursor = eventDates.length ? new Date(`${eventDates[0]}T00:00:00`) : new Date();

function formatEventTime(time) {
  if (!time) return "Time not set";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0), 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function buildCalendarDetails(events) {
  return events.map((event) => {
    const parts = [event.client, event.type, formatEventTime(event.time), event.address].filter(Boolean);
    return parts.join(" | ");
  }).join("\n");
}

function renderEventCalendar() {
  if (!calendarGrid || !calendarMonth) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const monthStart = new Date(year, month, 1);
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const eventsByDate = calendarEvents.reduce((map, event) => {
    if (!map.has(event.date)) map.set(event.date, []);
    map.get(event.date).push(event);
    return map;
  }, new Map());

  calendarMonth.textContent = monthStart.toLocaleDateString([], { month: "long", year: "numeric" });
  calendarGrid.innerHTML = "";
  if (calendarEmpty) calendarEmpty.hidden = calendarEvents.length > 0;

  for (let index = 0; index < firstWeekday; index += 1) {
    const spacer = document.createElement("span");
    spacer.className = "calendar-day calendar-day-empty";
    calendarGrid.appendChild(spacer);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = eventsByDate.get(dateKey) || [];
    const cell = document.createElement(dayEvents.length ? "a" : "span");
    cell.className = "calendar-day";
    cell.textContent = day;

    if (dayEvents.length) {
      cell.classList.add("has-event");
      cell.href = `/events/${dayEvents[0].id}`;
      cell.setAttribute("aria-label", buildCalendarDetails(dayEvents));

      const tooltip = document.createElement("span");
      tooltip.className = "calendar-tooltip";
      dayEvents.forEach((event) => {
        const detail = document.createElement("span");
        const client = document.createElement("strong");
        const eventMeta = document.createElement("small");
        const address = document.createElement("small");
        client.textContent = event.client;
        eventMeta.textContent = `${event.type} - ${formatEventTime(event.time)}`;
        address.textContent = event.address;
        detail.append(client, eventMeta, address);
        tooltip.appendChild(detail);
      });
      cell.appendChild(tooltip);
    }

    calendarGrid.appendChild(cell);
  }
}

document.querySelectorAll("[data-calendar-prev]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
    renderEventCalendar();
  });
});

document.querySelectorAll("[data-calendar-next]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
    renderEventCalendar();
  });
});

renderEventCalendar();

function updateFavoriteCount() {
  const count = document.querySelectorAll(".photo-tile[data-local-select].selected").length;
  const counter = document.getElementById("favorite-count");
  if (counter) counter.textContent = count;
}

document.querySelectorAll(".photo-tile[data-local-select]").forEach((tile) => {
  tile.addEventListener("click", () => {
    tile.classList.toggle("selected");
    updateFavoriteCount();
  });
});

updateFavoriteCount();
