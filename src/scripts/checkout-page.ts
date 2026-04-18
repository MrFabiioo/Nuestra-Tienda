import { actions } from 'astro:actions';
import { CartCookiesClient } from '@utils/cart-cookies';

type Tone = 'default' | 'error' | 'success';

const LOCKED_DELIVERY_DATA = {
  method: 'wemi',
  address: 'CR 48 14 49',
  city: 'Medellin - Poblado',
  notes: 'Grupo Emi Falk - Sala de Rdio',
};

const VALIDATION_MESSAGES: Record<string, string> = {
  fullName: 'Compártenos tu nombre completo para identificar el pedido.',
  phone: 'Necesitamos un teléfono válido para coordinar cualquier detalle.',
  email: 'Ingresá un correo válido para enviarte la confirmación.',
  address: 'La dirección de entrega en la WEMI debe quedar cargada.',
  city: 'La ciudad del punto de entrega en la WEMI debe quedar cargada.',
  deliveryMethod: 'La entrega se realiza únicamente en la WEMI.',
};

function setCheckoutFeedback(node: HTMLParagraphElement | null, message: string, tone: Tone = 'default') {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.classList.remove('text-gray-500', 'text-red-500', 'text-guacamole-b');

  if (tone === 'error') {
    node.classList.add('text-red-500');
    return;
  }

  if (tone === 'success') {
    node.classList.add('text-guacamole-b');
    return;
  }

  node.classList.add('text-gray-500');
}

function showFormFeedback(node: HTMLDivElement | null, message: string) {
  if (!node) {
    return;
  }

  node.textContent = message;
  node.classList.remove('hidden');
}

function hideFormFeedback(node: HTMLDivElement | null) {
  if (!node) {
    return;
  }

  node.textContent = '';
  node.classList.add('hidden');
}

function getFieldErrorNode(field: HTMLElement) {
  return field.closest('[data-field-wrapper]')?.querySelector<HTMLElement>('[data-field-error]') ?? null;
}

function setFieldError(field: HTMLElement, message: string) {
  const errorNode = getFieldErrorNode(field);
  field.setAttribute('aria-invalid', 'true');

  if (errorNode) {
    errorNode.textContent = message;
    errorNode.classList.remove('hidden');
  }
}

function clearFieldError(field: HTMLElement) {
  const errorNode = getFieldErrorNode(field);
  field.removeAttribute('aria-invalid');

  if (errorNode) {
    errorNode.textContent = '';
    errorNode.classList.add('hidden');
  }
}

function getFieldMessage(field: HTMLInputElement | HTMLTextAreaElement) {
  if (field.validity.valueMissing) {
    return VALIDATION_MESSAGES[field.name] ?? 'Este campo es obligatorio.';
  }

  if (field.validity.typeMismatch && field.name === 'email') {
    return 'Ese correo no parece válido. Revísalo antes de continuar.';
  }

  return '';
}

function applyLockedDeliveryData(form: HTMLFormElement) {
  const addressField = form.elements.namedItem('address') as HTMLInputElement | null;
  const cityField = form.elements.namedItem('city') as HTMLInputElement | null;
  const notesField = form.elements.namedItem('notes') as HTMLTextAreaElement | null;
  const deliveryMethods = form.elements.namedItem('deliveryMethod') as RadioNodeList | null;

  if (addressField) addressField.value = LOCKED_DELIVERY_DATA.address;
  if (cityField) cityField.value = LOCKED_DELIVERY_DATA.city;
  if (notesField) notesField.value = LOCKED_DELIVERY_DATA.notes;

  if (deliveryMethods) {
    for (let index = 0; index < deliveryMethods.length; index += 1) {
      const radio = deliveryMethods[index] as HTMLInputElement;
      radio.checked = radio.value === LOCKED_DELIVERY_DATA.method;
    }
  }
}

function validateForm(form: HTMLFormElement, feedbackBox: HTMLDivElement | null) {
  hideFormFeedback(feedbackBox);

  const invalidFields: HTMLElement[] = [];
  const methodRadios = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="deliveryMethod"]'));
  const hasDeliveryMethod = methodRadios.some((radio) => radio.checked);

  if (!hasDeliveryMethod && methodRadios.length > 0) {
    methodRadios.forEach((radio) => setFieldError(radio, VALIDATION_MESSAGES.deliveryMethod));
    invalidFields.push(methodRadios[0]);
  } else {
    methodRadios.forEach((radio) => clearFieldError(radio));
  }

  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((field) => {
    if (field.type === 'radio') {
      return;
    }

    const message = getFieldMessage(field);
    if (message) {
      setFieldError(field, message);
      invalidFields.push(field);
      return;
    }

    clearFieldError(field);
  });

  if (invalidFields.length > 0) {
    showFormFeedback(feedbackBox, 'Hay algunos datos por ajustar antes de pasar al pago. Revisa los campos marcados y continuamos.');
    invalidFields[0].focus();
    return false;
  }

  return true;
}

export function initCheckoutPage(rootNode: ParentNode = document) {
  const pageRoot = rootNode.querySelector<HTMLElement>('[data-checkout-page]');
  const form = pageRoot?.querySelector<HTMLFormElement>('#customer-form') ?? null;

  if (!pageRoot || !form || pageRoot.dataset.checkoutReady === 'true') {
    return;
  }

  pageRoot.dataset.checkoutReady = 'true';

  const checkoutFeedback = pageRoot.querySelector<HTMLParagraphElement>('#checkout-feedback');
  const feedbackBox = pageRoot.querySelector<HTMLDivElement>('#form-feedback');
  const proceedButton = pageRoot.querySelector<HTMLButtonElement>('#proceed-to-payment');
  const proceedButtonLabel = pageRoot.querySelector<HTMLElement>('#proceed-to-payment-label');

  applyLockedDeliveryData(form);

  form.addEventListener('input', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || field.type === 'radio') {
      return;
    }

    if (field.checkValidity()) {
      clearFieldError(field);
    }
  });

  form.addEventListener('focusout', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) || field.type === 'radio') {
      return;
    }

    const message = getFieldMessage(field);
    if (message) {
      setFieldError(field, message);
      return;
    }

    clearFieldError(field);
  });

  form.addEventListener('change', (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return;
    }

    if (field.type === 'radio' && field.name === 'deliveryMethod') {
      form.querySelectorAll<HTMLInputElement>('input[name="deliveryMethod"]').forEach((radio) => clearFieldError(radio));
      hideFormFeedback(feedbackBox);
      return;
    }

    if (field.checkValidity()) {
      clearFieldError(field);
    }
  });

  pageRoot.addEventListener('click', (event) => {
    const deleteButton = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('.btn-delete');
    if (!deleteButton || deleteButton.disabled) {
      return;
    }

    deleteButton.disabled = true;
    deleteButton.setAttribute('aria-busy', 'true');
    deleteButton.textContent = 'Quitando...';
    setCheckoutFeedback(checkoutFeedback, 'Actualizando tu pedido...', 'success');

    const productId = deleteButton.dataset.id ?? '';
    const size = deleteButton.dataset.size ?? '';
    CartCookiesClient.removeItem(productId, size);
    window.location.assign('/checkout');
  });

  if (!proceedButton) {
    return;
  }

  const setProceedPending = (isPending: boolean, label: string) => {
    proceedButton.classList.toggle('pointer-events-none', isPending);
    proceedButton.classList.toggle('opacity-80', isPending);
    proceedButton.setAttribute('aria-disabled', String(isPending));
    proceedButton.setAttribute('aria-busy', String(isPending));

    if (proceedButtonLabel) {
      proceedButtonLabel.innerHTML = isPending
        ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8m0 0a8 8 0 018 8m-8-8v8" /></svg>' + label
        : '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>' + label;
    }
  };

  proceedButton.addEventListener('click', async (event) => {
    event.preventDefault();

    if (proceedButton.getAttribute('aria-disabled') === 'true') {
      return;
    }

    if (!validateForm(form, feedbackBox)) {
      setCheckoutFeedback(checkoutFeedback, 'Faltan algunos datos antes de pasar al pago.', 'error');
      return;
    }

    setProceedPending(true, 'Creando pedido...');
    setCheckoutFeedback(checkoutFeedback, 'Estamos guardando tu pedido para que el pago quede trazable.', 'success');

    const formData = new FormData(form);
    const { data, error } = await actions.createOrder(formData);

    if (error || !data) {
      showFormFeedback(feedbackBox, error?.message ?? 'No pudimos crear tu pedido. Revisa los datos e inténtalo de nuevo.');
      setCheckoutFeedback(checkoutFeedback, 'Hubo un problema al guardar el pedido. No continuaremos hasta dejarlo bien registrado.', 'error');
      setProceedPending(false, 'Continuar a medios de pago');
      return;
    }

    setCheckoutFeedback(checkoutFeedback, 'Pedido creado. Te llevamos a la referencia pública de pago.', 'success');
    window.location.href = data.redirectUrl;
  });
}
