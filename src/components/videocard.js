export function renderVideoCard(video) {
  return `
    <div class="video-card" data-id="${video.id}">
      <video src="${video.videoUrl}" muted loop playsinline class="video-preview"></video>
      <div class="video-overlay">
        <div class="product-name">${video.productName}</div>
        <div class="price">₹${video.price?.toLocaleString()}</div>
      </div>
    </div>
  `;
}
