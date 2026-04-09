// Resize a File to a base64 data URL, capping at maxSide pixels on the longest side.
// Returns { dataURL, naturalWidth, naturalHeight } — dimensions of the *stored* image.
export function readAndResizeImage(file, maxSide = 1920) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      const scale    = Math.min(maxSide / w, maxSide / h, 1)
      const outW     = Math.round(w * scale)
      const outH     = Math.round(h * scale)
      const canvas   = document.createElement('canvas')
      canvas.width   = outW
      canvas.height  = outH
      canvas.getContext('2d').drawImage(img, 0, 0, outW, outH)
      resolve({ dataURL: canvas.toDataURL('image/jpeg', 0.88), naturalWidth: outW, naturalHeight: outH })
    }
    img.onerror = reject
    img.src = url
  })
}
