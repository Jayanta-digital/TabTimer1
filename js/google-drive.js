// Google Drive API Integration

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient;
let accessToken = null;

function initializeGoogleDrive() {
  // Load Google API
  gapi.load('client', initializeGapiClient);
  
  // Load Google Identity Services
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.google.clientId,
    scope: CONFIG.google.scope,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token;
        console.log('✅ Google Drive authenticated');
      }
    }
  });
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: CONFIG.google.apiKey,
    discoveryDocs: CONFIG.google.discoveryDocs
  });
  gapiLoaded = true;
  console.log('✅ Google API client initialized');
}

async function uploadFileToDrive(file, fileName) {
  if (!accessToken) {
    tokenClient.requestAccessToken();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  try {
    const metadata = {
      name: fileName,
      mimeType: file.type,
      parents: [CONFIG.google.folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: form
      }
    );

    const result = await response.json();
    
    // Make file publicly accessible
    await shareFile(result.id);
    
    return {
      success: true,
      fileId: result.id,
      fileUrl: `https://drive.google.com/uc?export=download&id=${result.id}`
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
}

async function shareFile(fileId) {
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    }
  );
}

async function deleteFileFromDrive(fileId) {
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializeGoogleDrive,
    uploadFileToDrive,
    deleteFileFromDrive
  };
}
