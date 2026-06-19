/**
 * Downloads a blob response as a file.
 * Works with both axios responses (response.data) and raw Blob objects.
 *
 * @param {Blob|Object} blobOrResponse - An axios response with .data, or a raw Blob
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadBlob = (blobOrResponse, filename) => {
  const blob = blobOrResponse instanceof Blob
    ? blobOrResponse
    : new Blob([blobOrResponse]);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
