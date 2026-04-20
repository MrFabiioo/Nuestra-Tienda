type AdminFeedbackTone = 'info' | 'success' | 'danger' | 'warning';

type AdminConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AdminFeedbackTone;
};

type AdminAlertOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: AdminFeedbackTone;
};

type AdminToastOptions = {
  title?: string;
  message: string;
  tone?: AdminFeedbackTone;
  durationMs?: number;
};

type AdminFeedbackShell = {
  dialog: HTMLDialogElement;
  title: HTMLHeadingElement;
  message: HTMLParagraphElement;
  confirmButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
  toastRegion: HTMLDivElement;
  liveRegion: HTMLDivElement;
};

const STYLE_ID = 'admin-feedback-styles';
const DIALOG_ID = 'admin-feedback-dialog';
const TOAST_REGION_ID = 'admin-feedback-toasts';
const LIVE_REGION_ID = 'admin-feedback-live-region';

const STYLE_CONTENT = `
  #${LIVE_REGION_ID} {
    position: fixed;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .admin-feedback-dialog {
    width: min(100%, 30rem);
    border: 1px solid color-mix(in srgb, var(--color-border-strong) 42%, transparent);
    border-radius: 1.75rem;
    padding: 0;
    background: color-mix(in srgb, var(--color-surface-elevated) 92%, rgba(255, 255, 255, 0.05));
    color: var(--color-heading);
    box-shadow: 0 32px 80px rgba(15, 23, 42, 0.28);
    overflow: hidden;
  }

  .admin-feedback-dialog::backdrop {
    background: rgba(15, 23, 42, 0.52);
    backdrop-filter: blur(10px);
  }

  .admin-feedback-panel {
    padding: 1.5rem;
  }

  .admin-feedback-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--admin-feedback-tone) 24%, transparent);
    background: color-mix(in srgb, var(--admin-feedback-tone) 9%, transparent);
    color: var(--admin-feedback-tone);
    padding: 0.45rem 0.8rem;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .admin-feedback-eyebrow::before {
    content: '';
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 16%, transparent);
  }

  .admin-feedback-title {
    margin: 1rem 0 0;
    font-size: 1.35rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .admin-feedback-copy {
    margin: 0.85rem 0 0;
    color: var(--color-text-muted);
    font-size: 0.96rem;
    line-height: 1.65;
  }

  .admin-feedback-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .admin-feedback-button {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 0.8rem 1.1rem;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
    transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
  }

  .admin-feedback-button:hover,
  .admin-feedback-button:focus-visible {
    transform: translateY(-1px);
  }

  .admin-feedback-button:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--admin-feedback-tone) 42%, white);
    outline-offset: 2px;
  }

  .admin-feedback-button--ghost {
    border-color: var(--color-border);
    background: transparent;
    color: var(--color-heading-sub);
  }

  .admin-feedback-button--ghost:hover,
  .admin-feedback-button--ghost:focus-visible {
    border-color: color-mix(in srgb, var(--color-border-strong) 65%, transparent);
    background: color-mix(in srgb, var(--color-surface-soft) 80%, transparent);
  }

  .admin-feedback-button--solid {
    border-color: color-mix(in srgb, var(--admin-feedback-tone) 38%, transparent);
    background: color-mix(in srgb, var(--admin-feedback-tone) 15%, var(--color-surface-elevated));
    color: var(--admin-feedback-tone);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .admin-feedback-button--solid:hover,
  .admin-feedback-button--solid:focus-visible {
    border-color: color-mix(in srgb, var(--admin-feedback-tone) 58%, transparent);
    background: color-mix(in srgb, var(--admin-feedback-tone) 20%, var(--color-surface-elevated));
  }

  #${TOAST_REGION_ID} {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 60;
    display: flex;
    width: min(calc(100vw - 2rem), 26rem);
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: none;
  }

  .admin-feedback-toast {
    pointer-events: auto;
    border-radius: 1.3rem;
    border: 1px solid color-mix(in srgb, var(--admin-feedback-tone) 24%, transparent);
    background: color-mix(in srgb, var(--color-surface-elevated) 94%, rgba(255, 255, 255, 0.05));
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.2);
    padding: 1rem 1rem 0.95rem;
    transform: translateY(10px);
    opacity: 0;
    transition: transform 180ms ease, opacity 180ms ease;
  }

  .admin-feedback-toast[data-visible='true'] {
    transform: translateY(0);
    opacity: 1;
  }

  .admin-feedback-toast__title {
    margin: 0;
    color: var(--admin-feedback-tone);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .admin-feedback-toast__message {
    margin: 0.45rem 0 0;
    color: var(--color-heading-sub);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  @media (prefers-reduced-motion: reduce) {
    .admin-feedback-button,
    .admin-feedback-toast {
      transition: none;
    }
  }
`;

const TONE_MAP: Record<AdminFeedbackTone, { color: string; label: string }> = {
  info: { color: 'var(--color-accent)', label: 'Confirmación' },
  success: { color: 'var(--color-accent)', label: 'Listo' },
  danger: { color: 'var(--color-danger)', label: 'Atención' },
  warning: { color: '#ca8a04', label: 'Importante' },
};

function ensureStyles(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE_CONTENT;
  doc.head.append(style);
}

function ensureShell(doc: Document): AdminFeedbackShell {
  ensureStyles(doc);

  let dialog = doc.getElementById(DIALOG_ID) as HTMLDialogElement | null;
  let toastRegion = doc.getElementById(TOAST_REGION_ID) as HTMLDivElement | null;
  let liveRegion = doc.getElementById(LIVE_REGION_ID) as HTMLDivElement | null;

  if (!dialog) {
    dialog = doc.createElement('dialog');
    dialog.id = DIALOG_ID;
    dialog.className = 'admin-feedback-dialog';
    dialog.innerHTML = `
      <form method="dialog" class="admin-feedback-panel">
        <span class="admin-feedback-eyebrow">Confirmación</span>
        <h2 class="admin-feedback-title"></h2>
        <p class="admin-feedback-copy"></p>
        <div class="admin-feedback-actions">
          <button type="button" value="cancel" class="admin-feedback-button admin-feedback-button--ghost" data-admin-feedback-cancel>Cancelar</button>
          <button type="submit" value="confirm" class="admin-feedback-button admin-feedback-button--solid" data-admin-feedback-confirm>Confirmar</button>
        </div>
      </form>
    `;
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        dialog?.close('cancel');
      }
    });
    doc.body.append(dialog);
  }

  if (!toastRegion) {
    toastRegion = doc.createElement('div');
    toastRegion.id = TOAST_REGION_ID;
    doc.body.append(toastRegion);
  }

  if (!liveRegion) {
    liveRegion = doc.createElement('div');
    liveRegion.id = LIVE_REGION_ID;
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    doc.body.append(liveRegion);
  }

  return {
    dialog,
    title: dialog.querySelector('.admin-feedback-title') as HTMLHeadingElement,
    message: dialog.querySelector('.admin-feedback-copy') as HTMLParagraphElement,
    confirmButton: dialog.querySelector('[data-admin-feedback-confirm]') as HTMLButtonElement,
    cancelButton: dialog.querySelector('[data-admin-feedback-cancel]') as HTMLButtonElement,
    toastRegion,
    liveRegion,
  };
}

function applyTone(dialog: HTMLDialogElement, tone: AdminFeedbackTone) {
  dialog.style.setProperty('--admin-feedback-tone', TONE_MAP[tone].color);
  const eyebrow = dialog.querySelector('.admin-feedback-eyebrow');
  if (eyebrow) eyebrow.textContent = TONE_MAP[tone].label;
}

function showDialog(shell: AdminFeedbackShell, options: AdminConfirmOptions | AdminAlertOptions, hideCancel = false) {
  const tone = options.tone ?? 'info';
  applyTone(shell.dialog, tone);
  shell.title.textContent = options.title;
  shell.message.textContent = options.message;
  shell.confirmButton.textContent = options.confirmLabel ?? 'Aceptar';
  shell.cancelButton.textContent = 'cancelLabel' in options ? (options.cancelLabel ?? 'Cancelar') : 'Cancelar';
  shell.cancelButton.hidden = hideCancel;

  return new Promise<boolean>((resolve) => {
    const previousFocus = shell.dialog.ownerDocument.activeElement as HTMLElement | null;
    const handleClose = () => {
      previousFocus?.focus?.();
      resolve(shell.dialog.returnValue === 'confirm');
    };

    shell.cancelButton.onclick = () => shell.dialog.close('cancel');
    shell.dialog.addEventListener('close', handleClose, { once: true });
    shell.dialog.showModal();
    shell.confirmButton.focus();
  });
}

function createToast(shell: AdminFeedbackShell, options: AdminToastOptions) {
  const tone = options.tone ?? 'info';
  const toast = shell.toastRegion.ownerDocument.createElement('div');
  toast.className = 'admin-feedback-toast';
  toast.style.setProperty('--admin-feedback-tone', TONE_MAP[tone].color);
  toast.innerHTML = `
    <p class="admin-feedback-toast__title">${options.title ?? TONE_MAP[tone].label}</p>
    <p class="admin-feedback-toast__message"></p>
  `;

  const message = toast.querySelector('.admin-feedback-toast__message');
  if (message) message.textContent = options.message;

  shell.toastRegion.append(toast);
  shell.liveRegion.textContent = `${options.title ? `${options.title}. ` : ''}${options.message}`;
  requestAnimationFrame(() => {
    toast.dataset.visible = 'true';
  });

  const durationMs = options.durationMs ?? 4200;
  window.setTimeout(() => {
    toast.dataset.visible = 'false';
    window.setTimeout(() => toast.remove(), 220);
  }, durationMs);
}

export function createAdminFeedbackUi(doc: Document = document) {
  const shell = ensureShell(doc);

  return {
    confirm: (options: AdminConfirmOptions) => showDialog(shell, options, false),
    alert: async (options: AdminAlertOptions) => {
      await showDialog(shell, options, true);
    },
    notify: (options: AdminToastOptions) => createToast(shell, options),
  };
}
