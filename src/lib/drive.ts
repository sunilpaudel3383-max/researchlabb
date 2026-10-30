import { getAccessToken } from './firebase';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}

const DEFAULT_FOLDER_NAME = 'CollabScholar - Research Manuscripts';

export async function findOrCreateFolder(folderName = DEFAULT_FOLDER_NAME): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  // Search for existing folder
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to search Google Drive folders.');
  }

  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Drive folder.');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

export async function uploadManuscriptToDrive(
  fileName: string,
  blob: Blob,
  folderId: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive.');

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType,
    description: `Exported publication snapshot from CollabScholar Real-Time Workspace.`
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', blob);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload manuscript to Google Drive.');
  }

  const resData = await uploadRes.json();
  return {
    fileId: resData.id,
    webViewLink: resData.webViewLink || `https://drive.google.com/file/d/${resData.id}/view`,
  };
}

export async function listFolderFiles(folderId: string): Promise<DriveFileSummary[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink,createdTime,size)&orderBy=createdTime desc`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

export const CITED_LITERATURE_FOLDER = 'CollabScholar - Cited Literature PDFs';

export async function uploadCitedPdfToDrive(
  fileName: string,
  pdfBlob: Blob,
  citationKey: string,
  paperTitle: string,
  folderName = CITED_LITERATURE_FOLDER
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Drive. Please sign in with Google to grant Drive access.');

  const folderId = await findOrCreateFolder(folderName);

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'application/pdf',
    description: `Cited Research Manuscript PDF for reference [${citationKey}]: ${paperTitle}`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', pdfBlob);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload cited manuscript PDF to Google Drive.');
  }

  const resData = await uploadRes.json();
  return {
    fileId: resData.id,
    webViewLink: resData.webViewLink || `https://drive.google.com/file/d/${resData.id}/view`,
    folderId,
  };
}

export async function getCitedLiteratureFolderUrl(): Promise<string> {
  try {
    const folderId = await findOrCreateFolder(CITED_LITERATURE_FOLDER);
    return `https://drive.google.com/drive/folders/${folderId}`;
  } catch {
    return 'https://drive.google.com';
  }
}
