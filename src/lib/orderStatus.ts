// Bezeichnungen der Bestellstatus (auch im Browser verwendbar)
export const ORDER_STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Zahlung ausstehend',
  paid: 'Bezahlt – zu versenden',
  payment_failed: 'Zahlung fehlgeschlagen',
  shipped: 'Versendet',
  delivered: 'Zugestellt',
  refunded: 'Erstattet',
  partially_refunded: 'Teilweise erstattet',
  cancelled: 'Storniert',
};

export const ORDER_STATUS_ORDER = ['paid', 'awaiting_payment', 'shipped', 'delivered', 'payment_failed', 'partially_refunded', 'refunded', 'cancelled'];
