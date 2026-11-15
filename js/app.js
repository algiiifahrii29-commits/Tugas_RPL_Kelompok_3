/* SIPSTOK - prototipe front-end. Data demo disimpan pada localStorage browser. */
const STORAGE_KEY = "sipstok_data_v1";
const SESSION_KEY = "sipstok_session";
const {
  formatRupiah: rupiah, escapeHtml: esc, nextId, stockStatus, countLowStock,
  validateCartAdd, cartTotal, validateCheckout, validateStockIn, canAccessPage,
  localDateKey, makeSaleCode
} = window.SipstokLogic;
// Tanggal LOKAL (bukan UTC) agar "hari ini" dan laporan periode tidak meleset di zona WIB/WITA/WIT.
const today = () => localDateKey(new Date());
const fmtDate = iso => new Date(iso).toLocaleString("id-ID");
const session = {
  get() { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(SESSION_KEY, v); } catch {} },
  clear() { try { sessionStorage.removeItem(SESSION_KEY); } catch {} }
};
const dateTime = () => new Date().toISOString();
const seed = {
  users:[
    {id:1,nama:"Administrator",username:"admin",password:"admin123",role:"admin"},
    {id:2,nama:"Kasir Toko",username:"kasir",password:"kasir123",role:"kasir"},
    {id:3,nama:"Pemilik Toko",username:"pemilik",password:"owner123",role:"pemilik"}
  ],
  categories:[{id:1,nama:"Kaos"},{id:2,nama:"Kemeja"},{id:3,nama:"Celana"},{id:4,nama:"Jaket"},{id:5,nama:"Aksesoris"}],
  suppliers:[
    {id:1,nama:"PT Fashion Nusantara",kontak:"081234567890",alamat:"Palu"},
    {id:2,nama:"CV Berkah Garment",kontak:"082198765432",alamat:"Makassar"}
  ],
  products:[
    {kode:"BRG-001",nama:"Kaos Basic Cotton",kategori:1,supplier:1,ukuran:"L",warna:"Hitam",hargaBeli:55000,hargaJual:85000,stok:24,stokMinimum:5},
    {kode:"BRG-002",nama:"Kemeja Oxford",kategori:2,supplier:2,ukuran:"M",warna:"Putih",hargaBeli:90000,hargaJual:135000,stok:12,stokMinimum:4},
    {kode:"BRG-003",nama:"Celana Jeans",kategori:3,supplier:1,ukuran:"32",warna:"Biru",hargaBeli:120000,hargaJual:185000,stok:3,stokMinimum:5},
    {kode:"BRG-004",nama:"Hoodie Fleece",kategori:4,supplier:2,ukuran:"XL",warna:"Abu-abu",hargaBeli:110000,hargaJual:165000,stok:8,stokMinimum:3},
    {kode:"BRG-005",nama:"Topi Casual",kategori:5,supplier:1,ukuran:"All Size",warna:"Navy",hargaBeli:30000,hargaJual:55000,stok:2,stokMinimum:5}
  ],
  stockIns:[],sales:[],stockHistory:[]
};
let db = loadDB(), currentUser = null, cart = [], activePage = "dashboard";
function loadDB(){
  const base=structuredClone(seed);
  let data=null;
  try{data=JSON.parse(localStorage.getItem(STORAGE_KEY))}catch{}
  if(!data||typeof data!=="object")return base;
  // Lengkapi bagian data yang hilang/rusak agar aplikasi tidak error.
  for(const k of Object.keys(base))if(!Array.isArray(data[k]))data[k]=base[k];
  return data;
}
function saveDB(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db))}
  catch{toast("Data gagal disimpan ke browser (penyimpanan penuh atau diblokir).",true)}
  updateNotification();
}
function roleLabel(r){return ({admin:"Admin",kasir:"Kasir",pemilik:"Pemilik Toko"})[r]||r}
function canManage(){return currentUser?.role==="admin"}
function canReport(){return ["admin","pemilik"].includes(currentUser?.role)}
function catName(id){return db.categories.find(x=>x.id===Number(id))?.nama||"-"}
function supplierName(id){return db.suppliers.find(x=>x.id===Number(id))?.nama||"-"}
function productName(code){return db.products.find(x=>x.kode===code)?.nama||code}
function toast(msg,error=false){const el=document.createElement("div");el.className="toast"+(error?" error":"");el.textContent=msg;document.getElementById("toastRoot").append(el);setTimeout(()=>el.remove(),3000)}
function setPage(page){
  if(!canAccessPage(currentUser?.role,page)){toast("Anda tidak memiliki akses ke menu ini.",true);return}
  activePage=page;
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const labels={dashboard:"Dashboard",barang:"Data Barang",kategori:"Kategori",supplier:"Supplier",barangMasuk:"Barang Masuk",penjualan:"Transaksi Penjualan",riwayat:"Riwayat Stok",laporan:"Laporan",pengguna:"Pengguna"};
  document.getElementById("pageTitle").textContent=labels[page]||"Dashboard";document.getElementById("breadcrumbCurrent").textContent=labels[page]||"Dashboard";
  document.getElementById("sidebar").classList.remove("open");renderPage();
}
function showApp(user){
  currentUser=user;document.getElementById("loginPage").classList.add("hidden");document.getElementById("app").classList.remove("hidden");
  document.getElementById("userName").textContent=user.nama;document.getElementById("userRole").textContent=roleLabel(user.role);document.getElementById("userAvatar").textContent=user.nama.charAt(0).toUpperCase();
  document.querySelectorAll(".admin-only").forEach(x=>x.classList.toggle("hidden",!canManage()));
  document.querySelector('[data-page="barangMasuk"]').classList.toggle("hidden",user.role==="kasir");
  document.querySelector('[data-page="kategori"]').classList.toggle("hidden",user.role!=="admin");
  document.querySelector('[data-page="supplier"]').classList.toggle("hidden",user.role!=="admin");
  document.querySelector('[data-page="riwayat"]').classList.toggle("hidden",user.role==="kasir");
  document.querySelector('[data-page="laporan"]').classList.toggle("hidden",!canReport());
  setPage("dashboard");updateNotification();
}
function logout(){
  currentUser=null;cart=[];session.clear();closeModal();
  document.getElementById("app").classList.add("hidden");document.getElementById("loginPage").classList.remove("hidden");
}
document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();const u=document.getElementById("loginUsername").value.trim(),p=document.getElementById("loginPassword").value;
  const found=db.users.find(x=>x.username===u&&x.password===p);
  if(!found){document.getElementById("loginError").textContent="Username atau password tidak sesuai.";return}
  document.getElementById("loginError").textContent="";session.set(String(found.id));showApp(found);
});
document.getElementById("logoutBtn").addEventListener("click",logout);

// Tombol untuk menampilkan atau menyembunyikan username.
const usernameInput = document.getElementById("loginUsername");
const toggleUsername = document.getElementById("toggleUsername");
toggleUsername.addEventListener("click", () => {
  const isVisible = usernameInput.type === "text";
  usernameInput.type = isVisible ? "password" : "text";
  toggleUsername.classList.toggle("is-visible", !isVisible);
  toggleUsername.setAttribute("aria-label", isVisible ? "Tampilkan username" : "Sembunyikan username");
  toggleUsername.title = isVisible ? "Tampilkan username" : "Sembunyikan username";
});

// Tombol untuk menampilkan atau menyembunyikan password.
const passwordInput = document.getElementById("loginPassword");
const togglePassword = document.getElementById("togglePassword");
togglePassword.addEventListener("click", () => {
  const isVisible = passwordInput.type === "text";
  passwordInput.type = isVisible ? "password" : "text";
  togglePassword.classList.toggle("is-visible", !isVisible);
  togglePassword.setAttribute("aria-label", isVisible ? "Tampilkan password" : "Sembunyikan password");
  togglePassword.title = isVisible ? "Tampilkan password" : "Sembunyikan password";
});
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.getElementById("notificationBtn").addEventListener("click",()=>setPage("barang"));
function updateNotification(){const low=countLowStock(db.products);document.getElementById("notificationDot").style.display=low?"block":"none"}
function heading(title,desc,actions=""){return `<div class="page-heading"><div><h1>${title}</h1><p>${desc}</p></div><div class="heading-actions">${actions}</div></div>`}
function stat(label,value,note,icon,color=""){return `<div class="stat-card"><div><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div><div class="stat-icon ${color}">${icon}</div></div>`}
function productStatus(p){const s=stockStatus(p);return s==="habis"?'<span class="badge red">Habis</span>':s==="menipis"?'<span class="badge orange">Menipis</span>':'<span class="badge green">Tersedia</span>'}
function productRows(list){if(!list.length)return `<tr><td colspan="8"><div class="empty-state">Belum ada data barang.</div></td></tr>`;
 return list.map(p=>`<tr><td><div class="product-cell"><div class="product-thumb">♧</div><div><strong>${esc(p.nama)}</strong><small>${esc(p.kode)}</small></div></div></td><td>${esc(catName(p.kategori))}</td><td>${esc(p.ukuran)} / ${esc(p.warna)}</td><td>${rupiah(p.hargaJual)}</td><td><strong>${p.stok}</strong></td><td>${p.stokMinimum}</td><td>${productStatus(p)}</td><td><div class="action-group">${canManage()?`<button class="action-btn" data-action="edit-product" data-id="${esc(p.kode)}">Ubah</button><button class="action-btn delete" data-action="delete-product" data-id="${esc(p.kode)}">Hapus</button>`:`<span class="muted">-</span>`}</div></td></tr>`).join("")}
function renderPage(){const root=document.getElementById("pageContent");const map={dashboard:renderDashboard,barang:renderBarang,kategori:renderKategori,supplier:renderSupplier,barangMasuk:renderBarangMasuk,penjualan:renderPenjualan,riwayat:renderRiwayat,laporan:renderLaporan,pengguna:renderPengguna};root.innerHTML=(map[activePage]||renderDashboard)();bindPageEvents()}
function renderDashboard(){
 const low=db.products.filter(p=>p.stok<=p.stokMinimum),todaySales=db.sales.filter(s=>localDateKey(s.tanggal)===today()),sold=todaySales.reduce((a,s)=>a+s.total,0),count=db.products.reduce((a,p)=>a+p.stok,0),salesToday=todaySales.length;
 const top=db.products.slice().sort((a,b)=>b.stok-a.stok).slice(0,5),recent=db.sales.slice().sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).slice(0,5);
 return `${heading("Dashboard","Ringkasan kondisi persediaan dan aktivitas toko hari ini.")}
 <div class="stats-grid">${stat("Jenis Barang",db.products.length,"Total SKU terdaftar","▤")}${stat("Total Stok",count,"Akumulasi seluruh barang","▦","green")}${stat("Penjualan Hari Ini",rupiah(sold),`${salesToday} transaksi tercatat`,"↗","orange")}${stat("Stok Menipis",low.length,"Barang mencapai batas minimum","!","red")}</div>
 <div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>Ringkasan Stok Barang</h3><small>5 barang dengan stok terbanyak</small></div><div class="stock-bars">${top.map(p=>`<div class="stock-row"><span>${esc(p.nama)}</span><div class="stock-track"><div class="stock-fill" style="width:${Math.max(3,Math.min(100,p.stok/Math.max(1,top[0]?.stok)*100))}%"></div></div><strong>${p.stok}</strong></div>`).join("")||'<div class="empty-state">Belum ada data.</div>'}</div></section>
 <section class="panel"><div class="panel-head"><h3>Notifikasi Stok Menipis</h3><span class="badge ${low.length?"orange":"green"}">${low.length} barang</span></div><div class="alert-list">${low.slice(0,5).map(p=>`<div class="alert-item"><div><strong>${esc(p.nama)}</strong><small>${esc(p.kode)}</small></div><span>${p.stok} / min. ${p.stokMinimum}</span></div>`).join("")||'<div class="empty-state">Tidak ada stok yang menipis.</div>'}</div></section></div>
 <section class="table-card"><div class="table-toolbar"><h3>Transaksi Penjualan Terbaru</h3><button class="btn btn-secondary" data-page-link="penjualan">Lihat Transaksi</button></div><div class="table-scroll"><table><thead><tr><th>No. Transaksi</th><th>Tanggal</th><th>Kasir</th><th>Total</th><th>Status</th></tr></thead><tbody>${recent.map(s=>`<tr><td>${esc(s.kode)}</td><td>${fmtDate(s.tanggal)}</td><td>${esc(s.kasir)}</td><td><strong>${rupiah(s.total)}</strong></td><td><span class="badge green">Selesai</span></td></tr>`).join("")||'<tr><td colspan="5"><div class="empty-state">Belum ada transaksi penjualan.</div></td></tr>'}</tbody></table></div></section>`;
}
function renderBarang(){return `${heading("Data Barang","Kelola informasi barang, harga, dan jumlah stok.",canManage()?'<button class="btn btn-primary" data-action="add-product">＋ Tambah Barang</button>':"")}
 <section class="table-card"><div class="table-toolbar"><h3>Daftar Barang</h3><div class="toolbar-controls"><input class="search-input" id="tableSearch" placeholder="Cari kode atau nama barang..."><select class="filter-select" id="categoryFilter"><option value="">Semua kategori</option>${db.categories.map(c=>`<option value="${c.id}">${esc(c.nama)}</option>`).join("")}</select></div></div>
 <div class="table-scroll"><table><thead><tr><th>Nama Barang</th><th>Kategori</th><th>Ukuran / Warna</th><th>Harga Jual</th><th>Stok</th><th>Stok Minimum</th><th>Status</th><th>Aksi</th></tr></thead><tbody id="productTableBody">${productRows(db.products)}</tbody></table></div></section>`}
function renderKategori(){return `${heading("Kategori Barang","Kelompokkan barang berdasarkan jenis pakaian.",'<button class="btn btn-primary" data-action="add-category">＋ Tambah Kategori</button>')}<section class="table-card"><div class="table-toolbar"><h3>Daftar Kategori</h3></div><div class="table-scroll"><table><thead><tr><th>ID</th><th>Nama Kategori</th><th>Jumlah Barang</th><th>Aksi</th></tr></thead><tbody>${db.categories.map(c=>`<tr><td>${c.id}</td><td><strong>${esc(c.nama)}</strong></td><td>${db.products.filter(p=>p.kategori===c.id).length}</td><td><button class="action-btn" data-action="edit-category" data-id="${c.id}">Ubah</button> <button class="action-btn delete" data-action="delete-category" data-id="${c.id}">Hapus</button></td></tr>`).join("")}</tbody></table></div></section>`}
function renderSupplier(){return `${heading("Data Supplier","Kelola informasi pemasok barang toko.",'<button class="btn btn-primary" data-action="add-supplier">＋ Tambah Supplier</button>')}<section class="table-card"><div class="table-toolbar"><h3>Daftar Supplier</h3></div><div class="table-scroll"><table><thead><tr><th>ID</th><th>Nama Supplier</th><th>Kontak</th><th>Alamat</th><th>Aksi</th></tr></thead><tbody>${db.suppliers.map(s=>`<tr><td>${s.id}</td><td><strong>${esc(s.nama)}</strong></td><td>${esc(s.kontak)}</td><td>${esc(s.alamat)}</td><td><button class="action-btn" data-action="edit-supplier" data-id="${s.id}">Ubah</button> <button class="action-btn delete" data-action="delete-supplier" data-id="${s.id}">Hapus</button></td></tr>`).join("")}</tbody></table></div></section>`}
function renderBarangMasuk(){return `${heading("Barang Masuk","Catat penerimaan barang dari supplier beserta nomor faktur.",'<button class="btn btn-primary" data-action="add-stockin">＋ Catat Barang Masuk</button>')}<div class="summary-strip"><div class="summary-pill">Total penerimaan<strong>${db.stockIns.length} transaksi</strong></div><div class="summary-pill">Unit diterima<strong>${db.stockIns.reduce((a,x)=>a+x.items.reduce((b,i)=>b+i.qty,0),0)} unit</strong></div></div><section class="table-card"><div class="table-toolbar"><h3>Riwayat Barang Masuk</h3></div><div class="table-scroll"><table><thead><tr><th>No. Faktur</th><th>Tanggal</th><th>Supplier</th><th>Jumlah Jenis</th><th>Total Unit</th><th>Admin</th></tr></thead><tbody>${db.stockIns.slice().reverse().map(x=>`<tr><td><strong>${esc(x.faktur)}</strong></td><td>${fmtDate(x.tanggal)}</td><td>${esc(supplierName(x.supplier))}</td><td>${x.items.length}</td><td>${x.items.reduce((a,i)=>a+i.qty,0)}</td><td>${esc(x.user)}</td></tr>`).join("")||'<tr><td colspan="6"><div class="empty-state">Belum ada penerimaan barang.</div></td></tr>'}</tbody></table></div></section>`}
function renderPenjualan(){syncCart();return `${heading("Transaksi Penjualan","Pilih barang, tentukan jumlah, lalu simpan transaksi penjualan.",'<button class="btn btn-secondary" data-action="clear-cart">Kosongkan Keranjang</button>')}<div class="cart-layout"><section class="panel"><div class="panel-head"><h3>Pilih Barang</h3><small>Stok tersedia akan divalidasi otomatis</small></div><div class="form-field"><label for="saleProduct">Barang</label><select id="saleProduct"><option value="">Pilih barang...</option>${db.products.filter(p=>p.stok>0).map(p=>`<option value="${esc(p.kode)}">${esc(p.kode)} — ${esc(p.nama)} (stok ${p.stok})</option>`).join("")}</select></div><div class="form-grid"><div class="form-field"><label for="saleQty">Jumlah</label><input type="number" id="saleQty" min="1" value="1"></div><div class="form-field" style="display:flex;align-items:end"><button class="btn btn-primary" id="addCartBtn" style="width:100%">＋ Tambahkan</button></div></div><div class="panel-head" style="margin-top:20px"><h3>Keranjang Penjualan</h3><span class="badge blue">${cart.length} jenis</span></div><div class="cart-list">${cart.map((x,i)=>`<div class="cart-item"><div><strong>${esc(productName(x.kode))}</strong><small>${rupiah(x.price)} × ${x.qty}</small></div><div class="qty-control"><button data-action="cart-minus" data-index="${i}">−</button><strong>${x.qty}</strong><button data-action="cart-plus" data-index="${i}">＋</button><button class="action-btn delete" data-action="cart-remove" data-index="${i}">×</button></div></div>`).join("")||'<div class="empty-state">Keranjang masih kosong. Tambahkan barang untuk memulai transaksi.</div>'}</div></section>
 <aside class="panel"><div class="panel-head"><h3>Ringkasan Pembayaran</h3></div><div class="total-box"><div class="total-line"><span>Jumlah jenis barang</span><strong>${cart.length}</strong></div><div class="total-line"><span>Total unit</span><strong>${cart.reduce((a,x)=>a+x.qty,0)}</strong></div><div class="total-line final"><span>Total bayar</span><strong>${rupiah(cartTotal(cart))}</strong></div></div><button class="btn btn-primary btn-full" id="checkoutBtn" ${cart.length?"":"disabled"}>Simpan Transaksi</button><p class="help-text">Stok akan dikurangi otomatis setelah transaksi berhasil disimpan.</p></aside></div>
 <section class="table-card" style="margin-top:18px"><div class="table-toolbar"><h3>Transaksi Terakhir</h3></div><div class="table-scroll"><table><thead><tr><th>Kode Transaksi</th><th>Tanggal</th><th>Jumlah Item</th><th>Total Bayar</th><th>Kasir</th><th>Aksi</th></tr></thead><tbody>${db.sales.slice().reverse().slice(0,8).map(s=>`<tr><td>${esc(s.kode)}</td><td>${fmtDate(s.tanggal)}</td><td>${s.items.reduce((a,x)=>a+x.qty,0)} unit</td><td><strong>${rupiah(s.total)}</strong></td><td>${esc(s.kasir)}</td><td><button class="action-btn" data-action="receipt" data-id="${esc(s.kode)}">Lihat Struk</button></td></tr>`).join("")||'<tr><td colspan="6"><div class="empty-state">Belum ada transaksi.</div></td></tr>'}</tbody></table></div></section>`}
function renderRiwayat(){return `${heading("Riwayat Stok","Log perubahan stok akibat penerimaan barang dan transaksi penjualan.")}<section class="table-card"><div class="table-toolbar"><h3>Aktivitas Perubahan Stok</h3><input id="historySearch" class="search-input" placeholder="Cari nama atau kode barang..."></div><div class="table-scroll"><table><thead><tr><th>Tanggal</th><th>Kode Barang</th><th>Nama Barang</th><th>Jenis</th><th>Jumlah</th><th>Stok Setelah</th><th>Keterangan</th></tr></thead><tbody id="historyBody">${historyRows(db.stockHistory)}</tbody></table></div></section>`}
function historyRows(list){return list.slice().reverse().map(h=>`<tr><td>${fmtDate(h.tanggal)}</td><td>${esc(h.kode)}</td><td>${esc(productName(h.kode))}</td><td><span class="badge ${h.jenis==="masuk"?"green":"orange"}">${h.jenis==="masuk"?"Barang Masuk":"Barang Keluar"}</span></td><td>${h.jenis==="masuk"?"+":"−"}${h.jumlah}</td><td>${h.stokSetelah}</td><td>${esc(h.keterangan)}</td></tr>`).join("")||'<tr><td colspan="7"><div class="empty-state">Belum ada riwayat perubahan stok.</div></td></tr>'}
function renderLaporan(){const month=today().slice(0,7),sales=db.sales.filter(s=>localDateKey(s.tanggal).slice(0,7)===month),revenue=sales.reduce((a,s)=>a+s.total,0),units=sales.reduce((a,s)=>a+s.items.reduce((b,i)=>b+i.qty,0),0);
 return `${heading("Laporan Stok dan Penjualan","Rekapitulasi data barang dan penjualan berdasarkan periode.",'<button class="btn btn-secondary" id="printReport">Cetak Laporan</button>')}<div class="report-cards"><div class="report-card"><small>Penjualan bulan ini</small><strong>${rupiah(revenue)}</strong></div><div class="report-card"><small>Jumlah transaksi bulan ini</small><strong>${sales.length}</strong></div><div class="report-card"><small>Barang terjual bulan ini</small><strong>${units} unit</strong></div></div><section class="panel no-print" style="margin-bottom:18px"><div class="panel-head"><h3>Filter Periode Laporan</h3></div><div class="form-grid"><div class="form-field"><label for="reportStart">Tanggal Mulai</label><input type="date" id="reportStart" value="${month}-01"></div><div class="form-field"><label for="reportEnd">Tanggal Akhir</label><input type="date" id="reportEnd" value="${today()}"></div></div><button class="btn btn-primary" id="filterReport">Tampilkan Laporan</button></section><div id="reportResult">${reportTables(today().slice(0,7)+"-01",today())}</div>`}
function reportTables(start,end){const inRange=t=>{const d=localDateKey(t);return d>=start&&d<=end},sales=db.sales.filter(s=>inRange(s.tanggal)),history=db.stockHistory.filter(h=>inRange(h.tanggal));
 return `<section class="table-card"><div class="table-toolbar"><h3>Laporan Penjualan (${start} s.d. ${end})</h3><strong>${rupiah(sales.reduce((a,s)=>a+s.total,0))}</strong></div><div class="table-scroll"><table><thead><tr><th>Tanggal</th><th>Kode Transaksi</th><th>Kasir</th><th>Jumlah Unit</th><th>Total</th></tr></thead><tbody>${sales.map(s=>`<tr><td>${fmtDate(s.tanggal)}</td><td>${esc(s.kode)}</td><td>${esc(s.kasir)}</td><td>${s.items.reduce((a,x)=>a+x.qty,0)}</td><td>${rupiah(s.total)}</td></tr>`).join("")||'<tr><td colspan="5"><div class="empty-state">Tidak ada penjualan pada periode ini.</div></td></tr>'}</tbody></table></div></section>
 <section class="table-card"><div class="table-toolbar"><h3>Laporan Posisi Stok</h3><small>Stok saat ini</small></div><div class="table-scroll"><table><thead><tr><th>Kode</th><th>Nama Barang</th><th>Kategori</th><th>Stok</th><th>Stok Minimum</th><th>Status</th></tr></thead><tbody>${db.products.map(p=>`<tr><td>${esc(p.kode)}</td><td>${esc(p.nama)}</td><td>${esc(catName(p.kategori))}</td><td>${p.stok}</td><td>${p.stokMinimum}</td><td>${productStatus(p)}</td></tr>`).join("")}</tbody></table></div></section>
 <section class="table-card"><div class="table-toolbar"><h3>Riwayat Perubahan Stok</h3><small>${history.length} aktivitas</small></div><div class="table-scroll"><table><thead><tr><th>Tanggal</th><th>Barang</th><th>Jenis</th><th>Jumlah</th><th>Stok Setelah</th></tr></thead><tbody>${history.map(h=>`<tr><td>${fmtDate(h.tanggal)}</td><td>${esc(productName(h.kode))}</td><td>${h.jenis==="masuk"?"Barang Masuk":"Barang Keluar"}</td><td>${h.jenis==="masuk"?"+":"−"}${h.jumlah}</td><td>${h.stokSetelah}</td></tr>`).join("")||'<tr><td colspan="5"><div class="empty-state">Tidak ada perubahan stok pada periode ini.</div></td></tr>'}</tbody></table></div></section>`}
function renderPengguna(){return `${heading("Pengguna Sistem","Kelola akun dan hak akses Admin, Kasir, serta Pemilik Toko.",'<button class="btn btn-primary" data-action="add-user">＋ Tambah Pengguna</button>')}<section class="table-card"><div class="table-toolbar"><h3>Daftar Pengguna</h3></div><div class="table-scroll"><table><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead><tbody>${db.users.map(u=>`<tr><td><strong>${esc(u.nama)}</strong></td><td>${esc(u.username)}</td><td><span class="badge blue">${roleLabel(u.role)}</span></td><td>${u.id===currentUser.id?'<span class="muted">Akun aktif</span>':`<button class="action-btn delete" data-action="delete-user" data-id="${u.id}">Hapus</button>`}</td></tr>`).join("")}</tbody></table></div></section>`}
function closeModal(){document.getElementById("modalRoot").innerHTML="";document.body.classList.remove("print-receipt")}
function bindModalClose(root){
  root.querySelectorAll("[data-modal-close]").forEach(b=>b.onclick=closeModal);
  const bd=root.querySelector(".modal-backdrop");let downOnBackdrop=false;
  // Tutup hanya jika klik DAN tekan mouse sama-sama di latar (bukan saat menyeret teks dari dalam modal).
  bd.addEventListener("mousedown",e=>{downOnBackdrop=e.target===bd});
  bd.addEventListener("click",e=>{if(e.target===bd&&downOnBackdrop)closeModal()});
  root.querySelector("input:not([readonly]),select,textarea")?.focus();
}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.querySelector("#modalRoot .modal-backdrop"))closeModal()});
function openModal(title,body,submitText="Simpan",wide=false,onSubmit=null){
  const root=document.getElementById("modalRoot");
  root.innerHTML=`<div class="modal-backdrop"><div class="modal ${wide?"wide":""}"><div class="modal-head"><h3>${title}</h3><button type="button" class="modal-close" data-modal-close aria-label="Tutup">×</button></div><form id="modalForm"><div class="modal-body">${body}</div><div class="modal-foot"><button type="button" class="btn btn-secondary" data-modal-close>Batal</button><button class="btn btn-primary" type="submit">${submitText}</button></div></form></div></div>`;
  bindModalClose(root);
  root.querySelector("#modalForm").onsubmit=e=>{e.preventDefault();if(onSubmit?.(new FormData(e.target))!==false){closeModal();saveDB();renderPage()}};
}
function field(label,name,value="",type="text",required=true,extra=""){return `<div class="form-field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value)}" ${required?"required":""} ${extra}></div>`}
function selectField(label,name,options,value=""){return `<div class="form-field"><label>${label}</label><select name="${name}" required>${options.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?"selected":""}>${esc(o.label)}</option>`).join("")}</select></div>`}
function productModal(code=null){
  const p=code?db.products.find(x=>x.kode===code):null;
  if(!p&&(!db.categories.length||!db.suppliers.length)){toast("Tambahkan kategori dan supplier terlebih dahulu.",true);return}
  const categories=db.categories.map(c=>({value:c.id,label:c.nama})),suppliers=db.suppliers.map(s=>({value:s.id,label:s.nama}));
  const num='min="0" step="1"';
  openModal(p?"Ubah Data Barang":"Tambah Barang",`<div class="form-grid">${field("Kode Barang / SKU","kode",p?.kode||"","text",true,p?'readonly':'')}${field("Nama Barang","nama",p?.nama||"")}${selectField("Kategori","kategori",categories,p?.kategori??db.categories[0]?.id)}${selectField("Supplier","supplier",suppliers,p?.supplier??db.suppliers[0]?.id)}${field("Ukuran","ukuran",p?.ukuran||"M")}${field("Warna","warna",p?.warna||"Hitam")}${field("Harga Beli (Rp)","hargaBeli",p?.hargaBeli??"","number",true,num)}${field("Harga Jual (Rp)","hargaJual",p?.hargaJual??"","number",true,num)}${field(p?"Stok":"Stok Awal","stok",p?.stok??0,"number",true,num)}${field("Stok Minimum","stokMinimum",p?.stokMinimum??5,"number",true,num)}</div>`,"Simpan",true,f=>{
    const v=Object.fromEntries(f);
    for(const k of ["kode","nama","ukuran","warna"])v[k]=String(v[k]??"").trim();
    for(const k of ["hargaBeli","hargaJual","stok","stokMinimum","kategori","supplier"])v[k]=Number(v[k]);
    if(!v.kode||!v.nama){toast("Kode dan nama barang wajib diisi.",true);return false}
    if(!["hargaBeli","hargaJual","stok","stokMinimum"].every(k=>Number.isInteger(v[k])&&v[k]>=0)){toast("Harga dan stok harus berupa bilangan bulat, tidak boleh negatif.",true);return false}
    if(p){
      const diff=v.stok-p.stok;v.kode=p.kode;Object.assign(p,v);
      if(diff!==0)db.stockHistory.push({kode:p.kode,jenis:diff>0?"masuk":"keluar",jumlah:Math.abs(diff),tanggal:dateTime(),stokSetelah:p.stok,keterangan:"Koreksi stok manual"});
    }else{
      if(db.products.some(x=>x.kode.toLowerCase()===v.kode.toLowerCase())){toast("Kode barang sudah digunakan.",true);return false}
      db.products.push(v);
      if(v.stok>0)db.stockHistory.push({kode:v.kode,jenis:"masuk",jumlah:v.stok,tanggal:dateTime(),stokSetelah:v.stok,keterangan:"Stok awal barang"});
    }
    toast("Data barang berhasil disimpan.");return true});
}
function categoryModal(id=null){const c=db.categories.find(x=>x.id===Number(id));openModal(c?"Ubah Kategori":"Tambah Kategori",field("Nama Kategori","nama",c?.nama||""),"Simpan",false,f=>{const nama=f.get("nama").trim();if(!nama){toast("Nama kategori wajib diisi.",true);return false}if(db.categories.some(x=>x.nama.toLowerCase()===nama.toLowerCase()&&x.id!==c?.id)){toast("Kategori sudah ada.",true);return false}if(c)c.nama=nama;else db.categories.push({id:nextId(db.categories),nama});toast("Kategori disimpan.");return true})}
function supplierModal(id=null){const s=db.suppliers.find(x=>x.id===Number(id));openModal(s?"Ubah Supplier":"Tambah Supplier",`<div class="form-grid">${field("Nama Supplier","nama",s?.nama||"")}${field("Nomor Kontak","kontak",s?.kontak||"")}${`<div class="form-field full"><label>Alamat</label><textarea name="alamat" rows="2" required>${esc(s?.alamat||"")}</textarea></div>`}</div>`,"Simpan",false,f=>{const v={nama:f.get("nama").trim(),kontak:f.get("kontak").trim(),alamat:f.get("alamat").trim()};if(!v.nama||!v.kontak||!v.alamat){toast("Semua data supplier wajib diisi.",true);return false}if(s)Object.assign(s,v);else db.suppliers.push({id:nextId(db.suppliers),...v});toast("Data supplier disimpan.");return true})}
function userModal(){openModal("Tambah Pengguna",`<div class="form-grid">${field("Nama Pengguna","nama")}${field("Username","username")}${field("Password","password","","password")}${selectField("Hak Akses","role",[{value:"admin",label:"Admin"},{value:"kasir",label:"Kasir"},{value:"pemilik",label:"Pemilik Toko"}])}</div>`,"Tambah",false,f=>{const v=Object.fromEntries(f);v.nama=v.nama.trim();v.username=v.username.trim();if(!v.nama||!v.username||!v.password){toast("Nama, username, dan password wajib diisi.",true);return false}if(db.users.some(u=>u.username.toLowerCase()===v.username.toLowerCase())){toast("Username sudah digunakan.",true);return false}db.users.push({id:nextId(db.users),...v});toast("Pengguna berhasil ditambahkan.");return true})}
function stockInModal(){if(!db.suppliers.length||!db.products.length){toast("Tambahkan supplier dan barang terlebih dahulu.",true);return}
 openModal("Catat Barang Masuk",`<div class="form-grid">${field("Nomor Faktur","faktur")}${selectField("Supplier","supplier",db.suppliers.map(s=>({value:s.id,label:s.nama})))}${selectField("Barang","kode",db.products.map(p=>({value:p.kode,label:`${p.kode} - ${p.nama}`})))}${field("Jumlah Diterima","jumlah",1,"number",true,'min="1" step="1"')}</div><p class="help-text">Stok barang akan bertambah setelah data penerimaan disimpan.</p>`,"Simpan Penerimaan",false,f=>{
    const v=Object.fromEntries(f),qty=Number(v.jumlah),faktur=v.faktur.trim(),p=db.products.find(x=>x.kode===v.kode);
    const check=validateStockIn(qty,faktur,db.stockIns);if(!check.ok){toast(check.message,true);return false}
    if(!p){toast("Barang tidak ditemukan.",true);return false}
    p.stok+=qty;
    const tx={id:nextId(db.stockIns),faktur,supplier:Number(v.supplier),user:currentUser.nama,tanggal:dateTime(),items:[{kode:v.kode,qty}]};
    db.stockIns.push(tx);
    db.stockHistory.push({kode:v.kode,jenis:"masuk",jumlah:qty,tanggal:tx.tanggal,stokSetelah:p.stok,keterangan:`Faktur ${faktur}`});
    toast("Penerimaan barang berhasil dicatat.");return true})}
// Samakan keranjang dengan data terbaru: buang barang yang sudah dihapus, ikuti harga terbaru, batasi jumlah ke stok.
function syncCart(){
  cart=cart.filter(x=>db.products.some(p=>p.kode===x.kode));
  cart.forEach(x=>{const p=db.products.find(y=>y.kode===x.kode);x.price=p.hargaJual;if(x.qty>p.stok)x.qty=p.stok});
  cart=cart.filter(x=>x.qty>0);
}
function addToCart(){
  const kode=document.getElementById("saleProduct").value,qty=Number(document.getElementById("saleQty").value),p=db.products.find(x=>x.kode===kode);
  const existing=cart.find(x=>x.kode===kode),check=validateCartAdd(p,existing?.qty,qty);
  if(!check.ok){toast(check.message,true);return}
  if(existing)existing.qty=check.newQty;else cart.push({kode,qty,price:p.hargaJual});
  renderPage();
}
function checkout(){
  syncCart();if(!cart.length){renderPage();return}
  const check=validateCheckout(cart,db.products);if(!check.ok){toast(check.message,true);return}
  const now=dateTime(),kode=makeSaleCode(db.sales),items=cart.map(x=>({kode:x.kode,nama:productName(x.kode),qty:x.qty,price:x.price,subtotal:x.qty*x.price})),total=cartTotal(cart);
  const sale={id:nextId(db.sales),kode,tanggal:now,kasir:currentUser.nama,userId:currentUser.id,items,total};db.sales.push(sale);
  items.forEach(i=>{const p=db.products.find(x=>x.kode===i.kode);p.stok-=i.qty;db.stockHistory.push({kode:i.kode,jenis:"keluar",jumlah:i.qty,tanggal:now,stokSetelah:p.stok,keterangan:`Penjualan ${kode}`})});
  cart=[];saveDB();renderPage();toast("Transaksi berhasil disimpan.");receiptModal(sale);
}
function receiptHtml(s){
  const units=s.items.reduce((a,x)=>a+x.qty,0);
  const rows=s.items.map(i=>`<div class="r-item"><div class="r-name">${esc(i.nama||productName(i.kode))}</div><div class="r-line"><span>${i.qty} x ${rupiah(i.price)}</span><span>${rupiah(i.subtotal??i.qty*i.price)}</span></div></div>`).join("");
  return `<div class="receipt" id="receiptPaper"><h3>SIPSTOK QUALITY DISTRO</h3><p class="r-sub">Toko Baju<br>Bukti Transaksi Penjualan</p><div class="r-sep"></div><div class="r-line"><span>No.</span><span>${esc(s.kode)}</span></div><div class="r-line"><span>Tanggal</span><span>${fmtDate(s.tanggal)}</span></div><div class="r-line"><span>Kasir</span><span>${esc(s.kasir)}</span></div><div class="r-sep"></div>${rows}<div class="r-sep"></div><div class="r-line"><span>Total item</span><span>${units}</span></div><div class="r-line r-total"><span>TOTAL</span><span>${rupiah(s.total)}</span></div><div class="r-sep"></div><p class="r-thanks">Terima kasih telah berbelanja.</p></div>`;
}
function receiptModal(s){
  const root=document.getElementById("modalRoot");
  root.innerHTML=`<div class="modal-backdrop"><div class="modal receipt-modal"><div class="modal-head"><h3>Struk Transaksi</h3><button type="button" class="modal-close" data-modal-close aria-label="Tutup">×</button></div><div class="modal-body">${receiptHtml(s)}</div><div class="modal-foot"><button type="button" class="btn btn-secondary" data-modal-close>Tutup</button><button type="button" class="btn btn-primary" id="printReceiptBtn">Cetak Struk</button></div></div></div>`;
  bindModalClose(root);
  root.querySelector("#printReceiptBtn").onclick=printReceipt;
}
// Mencetak hanya struk: kelas pada <body> mengaktifkan CSS cetak khusus struk (lihat style.css).
function printReceipt(){
  document.body.classList.add("print-receipt");
  const done=()=>{document.body.classList.remove("print-receipt");window.removeEventListener("afterprint",done)};
  window.addEventListener("afterprint",done);
  window.print();
}
function bindPageEvents(){
 const root=document.getElementById("pageContent");
 root.querySelectorAll("[data-page-link]").forEach(b=>b.onclick=()=>setPage(b.dataset.pageLink));
 root.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>handleAction(b.dataset.action,b.dataset.id,b.dataset.index));
 const search=document.getElementById("tableSearch"),filter=document.getElementById("categoryFilter");
 function applyProductFilter(){const q=(search?.value||"").toLowerCase(),cat=filter?.value||"";const list=db.products.filter(p=>(p.kode+" "+p.nama).toLowerCase().includes(q)&&(!cat||String(p.kategori)===cat));const body=document.getElementById("productTableBody");if(body)body.innerHTML=productRows(list);body?.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>handleAction(b.dataset.action,b.dataset.id,b.dataset.index))}
 search?.addEventListener("input",applyProductFilter);filter?.addEventListener("change",applyProductFilter);
 document.getElementById("addCartBtn")?.addEventListener("click",addToCart);document.getElementById("saleQty")?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();addToCart()}});document.getElementById("checkoutBtn")?.addEventListener("click",checkout);
 document.getElementById("filterReport")?.addEventListener("click",()=>{const a=document.getElementById("reportStart").value,b=document.getElementById("reportEnd").value;if(!a||!b||a>b){toast("Rentang tanggal tidak valid.",true);return}document.getElementById("reportResult").innerHTML=reportTables(a,b)});
 document.getElementById("printReport")?.addEventListener("click",()=>window.print());
 document.getElementById("historySearch")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();document.getElementById("historyBody").innerHTML=historyRows(db.stockHistory.filter(h=>(h.kode+" "+productName(h.kode)).toLowerCase().includes(q)))});
}
const MANAGE_ACTIONS=["add-product","edit-product","delete-product","add-category","edit-category","delete-category","add-supplier","edit-supplier","delete-supplier","add-user","delete-user"];
function handleAction(action,id,index){
 if(MANAGE_ACTIONS.includes(action)&&!canManage()){toast("Aksi ini hanya dapat dilakukan Admin.",true);return}
 if(action==="add-stockin"&&!canAccessPage(currentUser?.role,"barangMasuk")){toast("Anda tidak memiliki akses ke menu ini.",true);return}
 if(action==="add-product")productModal();if(action==="edit-product")productModal(id);
 if(action==="delete-product"){const p=db.products.find(x=>x.kode===id);if(confirm(`Hapus barang ${p?.nama}?`)){if(db.stockIns.some(t=>t.items.some(i=>i.kode===id))||db.sales.some(t=>t.items.some(i=>i.kode===id))){toast("Barang memiliki riwayat transaksi sehingga tidak dapat dihapus.",true);return}db.products=db.products.filter(x=>x.kode!==id);cart=cart.filter(x=>x.kode!==id);saveDB();renderPage();toast("Barang dihapus.")}}
 if(action==="add-category")categoryModal();if(action==="edit-category")categoryModal(id);
 if(action==="delete-category"){if(db.products.some(p=>p.kategori===Number(id))){toast("Kategori masih digunakan oleh barang.",true);return}if(confirm("Hapus kategori ini?")){db.categories=db.categories.filter(c=>c.id!==Number(id));saveDB();renderPage()}}
 if(action==="add-supplier")supplierModal();if(action==="edit-supplier")supplierModal(id);
 if(action==="delete-supplier"){if(db.products.some(p=>p.supplier===Number(id))||db.stockIns.some(t=>t.supplier===Number(id))){toast("Supplier masih terhubung dengan data barang/transaksi.",true);return}if(confirm("Hapus supplier ini?")){db.suppliers=db.suppliers.filter(s=>s.id!==Number(id));saveDB();renderPage()}}
 if(action==="add-stockin")stockInModal();if(action==="add-user")userModal();
 if(action==="delete-user"&&Number(id)!==currentUser.id&&confirm("Hapus pengguna ini?")){db.users=db.users.filter(u=>u.id!==Number(id));saveDB();renderPage()}
 if(action==="clear-cart"){cart=[];renderPage()}
 if(action==="cart-minus"||action==="cart-plus"){const x=cart[Number(index)],p=x&&db.products.find(y=>y.kode===x.kode);if(!x||!p){renderPage();return}if(action==="cart-minus")x.qty--;else if(x.qty<p.stok)x.qty++;else toast("Jumlah sudah mencapai stok tersedia.",true);if(x.qty<=0)cart.splice(Number(index),1);renderPage()}
 if(action==="cart-remove"){cart.splice(Number(index),1);renderPage()}
 if(action==="receipt"){const s=db.sales.find(x=>x.kode===id);if(s)receiptModal(s)}
}
const sessionId=session.get();if(sessionId){const user=db.users.find(u=>u.id===Number(sessionId));if(user)showApp(user);else logout()}else updateNotification();