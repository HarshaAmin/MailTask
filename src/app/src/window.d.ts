// window.d.ts or custom.d.ts (or any other name you choose)
declare global {
  interface Window {
    embedded_svc: any; // You can replace 'any' with a more specific type if desired
  }
}

export {};
