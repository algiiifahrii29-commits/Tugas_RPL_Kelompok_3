const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const L = require("../js/logic.js");

const produk = { kode: "BRG-001", nama: "Kaos Basic Cotton", stok: 10, stokMinimum: 5 };

test("formatRupiah memformat angka ke Rupiah", () => {
  assert.equal(L.formatRupiah(85000).replace(/\s/g, " "), "Rp 85.000");
  assert.equal(L.formatRupiah("abc").replace(/\s/g, " "), "Rp 0");
});

test("escapeHtml menetralkan karakter berbahaya (XSS)", () => {
  assert.equal(L.escapeHtml('<img src=x onerror="a">'), "&lt;img src=x onerror=&quot;a&quot;&gt;");
  assert.equal(L.escapeHtml(null), "");
});

test("nextId menghasilkan id berikutnya", () => {
  assert.equal(L.nextId([]), 1);
  assert.equal(L.nextId([{ id: 1 }, { id: 7 }, { id: 3 }]), 8);
});

test("stockStatus: habis, menipis, tersedia", () => {
  assert.equal(L.stockStatus({ stok: 0, stokMinimum: 5 }), "habis");
  assert.equal(L.stockStatus({ stok: 5, stokMinimum: 5 }), "menipis");
  assert.equal(L.stockStatus({ stok: 6, stokMinimum: 5 }), "tersedia");
});

test("countLowStock menghitung barang di bawah/sama dengan minimum", () => {
  const list = [{ stok: 24, stokMinimum: 5 }, { stok: 3, stokMinimum: 5 }, { stok: 2, stokMinimum: 5 }];
  assert.equal(L.countLowStock(list), 2);
});

test("validateCartAdd: jumlah tepat sama dengan stok diperbolehkan", () => {
  const r = L.validateCartAdd(produk, 0, 10);
  assert.equal(r.ok, true);
  assert.equal(r.newQty, 10);
});

test("validateCartAdd: menolak jumlah melebihi stok (termasuk yang sudah di keranjang)", () => {
  assert.equal(L.validateCartAdd(produk, 8, 3).ok, false);
  assert.equal(L.validateCartAdd(produk, 0, 11).ok, false);
});

test("validateCartAdd: menolak jumlah tidak valid dan barang kosong", () => {
  assert.equal(L.validateCartAdd(produk, 0, 0).ok, false);
  assert.equal(L.validateCartAdd(produk, 0, 1.5).ok, false);
  assert.equal(L.validateCartAdd(null, 0, 1).ok, false);
});

test("cartTotal menjumlahkan qty x harga", () => {
  assert.equal(L.cartTotal([{ qty: 2, price: 85000 }, { qty: 1, price: 135000 }]), 305000);
  assert.equal(L.cartTotal([]), 0);
});

test("validateCheckout menolak jika stok sudah berkurang", () => {
  const cart = [{ kode: "BRG-001", qty: 4 }];
  assert.equal(L.validateCheckout(cart, [{ ...produk, stok: 4 }]).ok, true);
  assert.equal(L.validateCheckout(cart, [{ ...produk, stok: 3 }]).ok, false);
});

test("validateStockIn menolak jumlah <= 0 dan faktur ganda", () => {
  assert.equal(L.validateStockIn(0, "F-1", []).ok, false);
  assert.equal(L.validateStockIn(5, "F-1", [{ faktur: "F-1" }]).ok, false);
  assert.equal(L.validateStockIn(5, "F-2", [{ faktur: "F-1" }]).ok, true);
});

test("canAccessPage membatasi menu berdasarkan role", () => {
  assert.equal(L.canAccessPage("kasir", "laporan"), false);
  assert.equal(L.canAccessPage("kasir", "barangMasuk"), false);
  assert.equal(L.canAccessPage("pemilik", "laporan"), true);
  assert.equal(L.canAccessPage("pemilik", "pengguna"), false);
  assert.equal(L.canAccessPage("admin", "pengguna"), true);
  assert.equal(L.canAccessPage("kasir", "penjualan"), true);
});

test("index.html memuat logic.js sebelum app.js", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  assert.ok(html.indexOf("js/logic.js") > -1 && html.indexOf("js/logic.js") < html.indexOf("js/app.js"));
});
