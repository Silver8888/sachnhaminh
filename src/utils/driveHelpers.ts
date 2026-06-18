export const parseDriveUrl = (url: string, type: 'image' | 'video' | 'folder' = 'image'): string => {
  if (!url) return '';
  
  if (type === 'video') {
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
  }

  let fileId = '';
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
  const folderRegex = /drive\.google\.com\/drive\/folders\/([^\/\?]+)/;

  const folderMatch = url.match(folderRegex);
  if (folderMatch && folderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#grid`;
  }

  const driveMatch = url.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    fileId = driveMatch[1];
  }

  if (fileId) {
    if (type === 'image') {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    } else if (type === 'video') {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  return url;
};

export const isDriveFolderUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('drive.google.com/drive/folders') || url.includes('embeddedfolderview');
};

export const getThumbnailForUrl = (url: string, type: 'image' | 'video'): string => {
  if (!url) return '';
  if (isDriveFolderUrl(url)) return ''; // Folders cannot have an auto-generated image thumbnail
  
  if (type === 'video') {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
    }
    // Drive video: we can't extract a direct image easily without an API, return empty
    return '';
  }
  
  return parseDriveUrl(url, 'image');
};
