type DocumentEventRegistryWindow = Window & {
  __guacaDocumentEventRegistry__?: Set<string>;
};

export function bindDocumentEventOnce(
  eventName: string,
  registryKey: string,
  listener: EventListenerOrEventListenerObject,
) {
  const registryWindow = window as DocumentEventRegistryWindow;
  registryWindow.__guacaDocumentEventRegistry__ ??= new Set<string>();

  const compositeKey = `${eventName}:${registryKey}`;
  if (registryWindow.__guacaDocumentEventRegistry__.has(compositeKey)) {
    return;
  }

  document.addEventListener(eventName, listener as EventListener);
  registryWindow.__guacaDocumentEventRegistry__.add(compositeKey);
}
