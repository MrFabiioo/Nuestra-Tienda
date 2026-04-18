import { actions } from 'astro:actions';

export function initPaymentProofPage(rootNode: ParentNode = document) {
  const pageRoot = rootNode.querySelector<HTMLElement>('[data-payment-page]');
  if (!pageRoot || pageRoot.dataset.paymentReady === 'true') {
    return;
  }

  pageRoot.dataset.paymentReady = 'true';

  const form = pageRoot.querySelector<HTMLFormElement>('#payment-proof-form');
  const submit = pageRoot.querySelector<HTMLButtonElement>('#payment-proof-submit');
  const feedback = pageRoot.querySelector<HTMLParagraphElement>('#payment-proof-feedback');
  const select = pageRoot.querySelector<HTMLSelectElement>('#paymentMethod');
  const currentMethod = pageRoot.querySelector<HTMLElement>('#current-payment-method');
  const banners = Array.from(pageRoot.querySelectorAll<HTMLElement>('[data-payment-banner]'));

  const methodLabels: Record<string, string> = {
    bancolombia: 'Bancolombia',
    nequi: 'Nequi',
    qr: 'QR',
  };

  const syncBanners = () => {
    if (!select) {
      return;
    }

    const activeMethod = select.value;

    banners.forEach((banner) => {
      const isActive = banner.dataset.paymentBanner === activeMethod;
      banner.classList.toggle('hidden', !isActive);
      banner.setAttribute('aria-hidden', String(!isActive));
    });

    if (currentMethod) {
      currentMethod.textContent = methodLabels[activeMethod] ?? activeMethod;
    }
  };

  if (select) {
    select.addEventListener('change', syncBanners);
    syncBanners();
  }

  if (!form || !submit || !feedback) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const file = formData.get('proofFile');

    if (!(file instanceof File) || file.size === 0) {
      feedback.textContent = 'Elegí un comprobante antes de enviarlo.';
      feedback.className = 'min-h-[1.25rem] text-sm text-[var(--color-danger)]';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Subiendo comprobante...';
    feedback.textContent = 'Estamos subiendo el archivo y moviendo el pedido a revisión.';
    feedback.className = 'min-h-[1.25rem] text-sm text-[var(--color-text-muted)]';

    const { error } = await actions.uploadPaymentProof(formData);

    if (error) {
      feedback.textContent = error.message;
      feedback.className = 'min-h-[1.25rem] text-sm text-[var(--color-danger)]';
      submit.disabled = false;
      submit.textContent = 'Subir comprobante y pasar a revisión';
      return;
    }

    window.location.href = `${window.location.pathname}?uploaded=1`;
  });
}
