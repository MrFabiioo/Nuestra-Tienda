import { cartItems } from 'src/store/cart.store';
import { CartCookiesClient } from '@utils/cart-cookies';
import { emitCartFeedback } from '@utils/cart-feedback';

type FeedbackTone = 'default' | 'error' | 'success';

function setFeedback(messageNode: HTMLParagraphElement | null, message: string, tone: FeedbackTone = 'default') {
  if (!messageNode) {
    return;
  }

  messageNode.textContent = message;
  messageNode.classList.remove('theme-text-muted', 'text-red-500', 'text-guacamole-b');

  if (tone === 'error') {
    messageNode.classList.add('text-red-500');
    return;
  }

  if (tone === 'success') {
    messageNode.classList.add('text-guacamole-b');
    return;
  }

  messageNode.classList.add('theme-text-muted');
}

function getSelectedSize(root: HTMLElement) {
  return root.querySelector<HTMLButtonElement>('[data-size-option].selected-size')?.dataset.sizeValue?.trim() ?? '';
}

function syncActionState(root: HTMLElement, addButton: HTMLButtonElement, addLabel: HTMLSpanElement | null) {
  const selectedSize = getSelectedSize(root);
  const isReady = selectedSize.length > 0;

  addButton.disabled = !isReady;
  addButton.setAttribute('aria-disabled', String(!isReady));

  if (addLabel) {
    addLabel.textContent = isReady ? 'Agregar al carrito' : 'Elegí un tamaño';
  }
}

export function initProductDetailPage(rootNode: ParentNode = document) {
  const root = rootNode.querySelector<HTMLElement>('[data-product-purchase]');
  if (!root || root.dataset.purchaseReady === 'true') {
    return;
  }

  const quantityInput = root.querySelector<HTMLInputElement>('#quantity-input');
  const incrementButton = root.querySelector<HTMLButtonElement>('#increment');
  const decrementButton = root.querySelector<HTMLButtonElement>('#decrement');
  const addButton = root.querySelector<HTMLButtonElement>('#add-card');
  const addLabel = root.querySelector<HTMLSpanElement>('#add-card-label');
  const feedbackNote = root.querySelector<HTMLParagraphElement>('#cart-feedback-note');

  if (!quantityInput || !incrementButton || !decrementButton || !addButton) {
    return;
  }

  root.dataset.purchaseReady = 'true';

  let quantity = Number.parseInt(quantityInput.value, 10) || 1;

  const syncQuantityButtons = () => {
    quantityInput.value = String(quantity);
    decrementButton.disabled = quantity <= 1;
    incrementButton.disabled = quantity >= 5;
  };

  syncQuantityButtons();
  syncActionState(root, addButton, addLabel);

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const sizeButton = target.closest<HTMLButtonElement>('[data-size-option]');
    if (sizeButton) {
      root.querySelectorAll<HTMLButtonElement>('[data-size-option]').forEach((button) => {
        const isActive = button === sizeButton;
        button.classList.toggle('selected-size', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });

      syncActionState(root, addButton, addLabel);
      setFeedback(feedbackNote, 'Tamaño listo. Si querés, te llevamos directo al checkout.', 'success');
      return;
    }

    const controlButton = target.closest<HTMLButtonElement>('#increment, #decrement');
    if (controlButton) {
      quantity = controlButton.id === 'increment'
        ? Math.min(quantity + 1, 5)
        : Math.max(quantity - 1, 1);

      syncQuantityButtons();
      return;
    }

    const addToCartButton = target.closest<HTMLButtonElement>('#add-card');
    if (!addToCartButton || addToCartButton.disabled) {
      return;
    }

    const selectedSize = getSelectedSize(root);
    if (!selectedSize) {
      setFeedback(feedbackNote, 'Elegí un tamaño antes de pasar al checkout.', 'error');
      syncActionState(root, addButton, addLabel);
      return;
    }

    const productId = root.dataset.productId ?? '';
    const productName = root.dataset.productName ?? '';
    const productImage = root.dataset.productImage ?? '';
    const productPrice = Number.parseFloat(root.dataset.productPrice ?? '0');

    if (!productId || !productName || Number.isNaN(productPrice)) {
      setFeedback(feedbackNote, 'No pudimos preparar este producto. Recargá la página e inténtalo de nuevo.', 'error');
      return;
    }

    setFeedback(feedbackNote, 'Preparando tu selección para el checkout...', 'success');
    addToCartButton.disabled = true;
    addToCartButton.setAttribute('aria-busy', 'true');
    addToCartButton.setAttribute('aria-disabled', 'true');

    if (addLabel) {
      addLabel.textContent = 'Preparando checkout...';
    }

    try {
      const cart = CartCookiesClient.addItem({
        productId,
        size: selectedSize,
        quantity,
        name: productName,
        price: productPrice,
        image: productImage,
      });

      cartItems.set(cart);
      emitCartFeedback({
        type: 'add',
        productName,
        quantity,
        size: selectedSize,
        totalItems: cart.reduce((total, item) => total + item.quantity, 0),
        message: 'Te llevamos al checkout con esta selección lista.',
      });

      window.location.assign('/checkout');
    } catch {
      addToCartButton.removeAttribute('aria-busy');
      setFeedback(feedbackNote, 'No pudimos actualizar el carrito. Probá de nuevo en un instante.', 'error');
      syncActionState(root, addButton, addLabel);
    }
  });
}
