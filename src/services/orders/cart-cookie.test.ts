import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCartCookie } from './cart-cookie';

test('parsea el carrito cuando la cookie contiene un array JSON válido', () => {
  const cart = parseCartCookie('[{"productId":"prod-1","quantity":2,"size":"M"}]');

  assert.deepEqual(cart, [
    {
      productId: 'prod-1',
      quantity: 2,
      size: 'M',
    },
  ]);
});

test('devuelve array vacío cuando la cookie no existe o viene vacía', () => {
  assert.deepEqual(parseCartCookie(undefined), []);
  assert.deepEqual(parseCartCookie(''), []);
});

test('devuelve array vacío cuando el JSON es inválido o no representa un array', () => {
  assert.deepEqual(parseCartCookie('{"productId":"prod-1"}'), []);
  assert.deepEqual(parseCartCookie('not-json'), []);
});
