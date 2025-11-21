const videoList = document.getElementById('video-list');
const mainVideo = document.getElementById('main-video');
const videoTitle = document.getElementById('video-title');
const addBtn = document.getElementById('add-video-btn');
const videoFileInput = document.getElementById('video-file');
const videoNameInput = document.getElementById('video-name');

let db;

// Initialize IndexedDB
const request = indexedDB.open('videoDB', 1);
request.onerror = () => console.error('Database failed to open');
request.onsuccess = () => {
  db = request.result;
  loadVideos();
};
request.onupgradeneeded = e => {
  db = e.target.result;
  const objectStore = db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
  objectStore.createIndex('title', 'title', { unique: false });
};

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.6.1/firebase-storage.js";

addBtn.addEventListener('click', async () => {
  const file = videoFileInput.files[0];
  const title = videoNameInput.value.trim();
  if (!file || !title) return alert('Select a video and enter a title');

  // Create a reference in Firebase Storage
  const storageRef = ref(storage, 'videos/' + file.name);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get the public URL
  const url = await getDownloadURL(storageRef);

  // Add video to your UI
  addVideoToUI(title, url);

  videoFileInput.value = '';
  videoNameInput.value = '';
});

function addVideoToUI(title, url) {
  const div = document.createElement('div');
  div.classList.add('video-item');
  div.innerHTML = `
    <video src="${url}" muted></video>
    <p>${title}</p>
  `;
  div.querySelector('video').addEventListener('click', () => {
    mainVideo.src = url;
    videoTitle.textContent = title;
    mainVideo.play();
  });
  videoList.appendChild(div);
}

// Delete video by ID
function deleteVideo(id) {
  if (!confirm('Are you sure you want to delete this video?')) return;
  const transaction = db.transaction(['videos'], 'readwrite');
  const store = transaction.objectStore('videos');
  store.delete(id);
  transaction.oncomplete = () => loadVideos();
}

// Load videos from IndexedDB
function loadVideos() {
  videoList.innerHTML = '';
  const transaction = db.transaction(['videos'], 'readonly');
  const store = transaction.objectStore('videos');
  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const videoData = cursor.value;
      const div = document.createElement('div');
      div.classList.add('video-item');

      div.innerHTML = `
        <video src="${videoData.file}" muted></video>
        <p>${videoData.title}</p>
        <button class="delete-btn">Delete</button>
      `;

      // Play video on click
      div.querySelector('video').addEventListener('click', () => {
        mainVideo.src = videoData.file;
        videoTitle.textContent = videoData.title;
        mainVideo.play();
      });

      // Delete button click
      div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // prevent triggering video play
        deleteVideo(videoData.id);
      });

      videoList.appendChild(div);
      cursor.continue();
    }
  };
}

