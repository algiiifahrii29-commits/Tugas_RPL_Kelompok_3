/* SIPSTOK - logika bisnis murni (tanpa DOM) agar dapat diuji otomatis oleh pipeline CI.
 * Dipakai di browser (window.SipstokLogic) dan di Node.js (require). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SipstokLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const formatRupiah = n =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(n) || 0);

  const escapeHtml = s =>
    String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const nextId = arr => arr.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;

  /** Status stok: habis (<=0), menipis (<= stok minimum), selain itu tersedia. */
  function stockStatus(p) {
    if (p.stok <= 0) return "habis";
    if (p.stok <= p.stokMinimum) return "menipis";
    return "tersedia";
  }

  const countLowStock = products => products.filter(p => p.stok <= p.stokMinimum).length;

  /** Validasi penambahan barang ke keranjang penjualan. */
  function validateCartAdd(product, existingQty, qty) {
    if (!product) return { ok: false, message: "Pilih barang terlebih dahulu." };
    if (!Number.isInteger(qty) || qty < 1) return { ok: false, message: "Jumlah pembelian tidak valid." };
    if ((existingQty || 0) + qty > product.stok) return { ok: false, message: "Jumlah melebihi stok yang tersedia." };
    return { ok: true, newQty: (existingQty || 0) + qty };
  }

  const cartTotal = cart => cart.reduce((a, x) => a + x.qty * x.price, 0);

  /** Pastikan semua item keranjang masih tersedia stoknya. */
  function validateCheckout(cart, products) {
    for (const item of cart) {
      const p = products.find(x => x.kode === item.kode);
      if (!p || p.stok < item.qty) return { ok: false, message: `Stok ${item.kode} tidak mencukupi.` };
    }
    return { ok: true };
  }

  /** Validasi form barang masuk. */
  function validateStockIn(qty, faktur, stockIns) {
    if (!(qty > 0)) return { ok: false, message: "Jumlah harus lebih dari 0." };
    if (stockIns.some(x => x.faktur === faktur)) return { ok: false, message: "Nomor faktur sudah pernah digunakan." };
    return { ok: true };
  }

  /** Hak akses menu berdasarkan role. */
  function canAccessPage(role, page) {
    if (page === "pengguna") return role === "admin";
    if (page === "laporan") return role === "admin" || role === "pemilik";
    if (["kategori", "supplier"].includes(page)) return role === "admin";
    if (["barangMasuk", "riwayat"].includes(page)) return role !== "kasir";
    return true;
  }

  return { formatRupiah, escapeHtml, nextId, stockStatus, countLowStock, validateCartAdd, cartTotal, validateCheckout, validateStockIn, canAccessPage };
});
