export const STAGES = [
  'placed',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered_paid',
];

export const STAGE_LABELS = {
  placed: 'Order Placed',
  preparing: 'Seller Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered_paid: 'Delivered & Paid',
};

export const stageIndex = (s) => STAGES.indexOf(s);

export const formatMoney = (n) => `ETB ${Number(n || 0).toLocaleString()}`;

export const haversineKm = (a, b) => {
  if (!a || !b) return null;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const etaMinutes = (km, speedKmh = 25) => {
  if (km == null) return null;
  return Math.max(1, Math.round((km / speedKmh) * 60));
};
