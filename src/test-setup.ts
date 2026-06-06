import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// Polyfill DataTransfer for jsdom (used in file upload tests)
if (typeof globalThis.DataTransfer === 'undefined') {
  class DataTransferPolyfill {
    private _files: File[] = []
    items = {
      add: (file: File) => { this._files.push(file) },
    }
    get files(): FileList {
      const files = this._files
      const fileList = {
        length: files.length,
        item: (i: number) => files[i] ?? null,
      } as unknown as FileList
      for (let i = 0; i < files.length; i++) {
        (fileList as unknown as Record<number, File>)[i] = files[i]
      }
      return fileList
    }
  }
  // @ts-expect-error polyfill
  globalThis.DataTransfer = DataTransferPolyfill
}
