// ==========================================
// 1. การตั้งค่าระบบ API
// ==========================================
// *** นำ URL ของ Web App ใหม่มาใส่ตรงนี้ ***
const API_URL = "https://script.google.com/macros/s/AKfycbwdXiJ8jXtp_bLPj-qehDmsVMPMD6AzyiS4LmS1ty9Ck-qn3ZZn5gSYmKxnrczjAvSn-w/exec";

async function callBackend(actionName, payloadData = {}) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: actionName, payload: payloadData })
        });
        const result = await response.json();
        if (result.status === "success") {
            return result.data;
        } else {
            throw new Error(result.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
        }
    } catch (error) {
        console.error("Backend Error:", error);
        throw error;
    }
}

// Global Variables
let allData = []; 
let fullInventoryData = [];
let chartInstances = {};

// ฟังก์ชันตรวจจับการเปิดผ่านแอปพลิเคชัน LINE
function checkLineBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (ua.indexOf("Line") > -1) {
        Swal.fire({
            icon: 'warning',
            title: 'ข้อจำกัดของแอป LINE',
            html: 'เบราว์เซอร์ของ LINE ไม่รองรับการเปิดกล้องถ่ายภาพ<br><br><b>กรุณากดปุ่ม 3 จุด (มุมขวาบน หรือมุมขวาล่าง)</b><br>แล้วเลือก <b>"เปิดในเบราว์เซอร์อื่น"</b> (Open in Browser) หรือ <b>"เปิดใน Safari"</b> ครับ',
            confirmButtonText: 'รับทราบ',
            confirmButtonColor: '#f39c12'
        });
    }
}

// นำไปใส่ไว้ในฟังก์ชัน  หรือตอนโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    checkLineBrowser(); // เรียกใช้งานเช็ก LINE
    // ... โค้ดเดิมของคุณ ...
});

// ==========================================
// 2. ระบบเริ่มต้น & การนำทาง (Navigation)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    const statusUser = sessionStorage.getItem("statusUser");
    if (statusUser) {
        document.getElementById('webSection').style.display = 'block';
        const data = statusUser.split(",");
        document.getElementById("currentUser").innerText = data[3] || "N/A";
        showPage('dashboardSection'); 
    } else {
        document.getElementById('webSection').style.display = 'block';
        openLoginModal();
    }
});

// ฟังก์ชันตรวจจับการเปิดผ่านแอปพลิเคชัน LINE เพื่อซ่อนกล้องสด
function optimizeForLine() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    // ถ้าตรวจพบว่าเป็นแอป LINE
    if (ua.indexOf("Line") > -1) {
        // ซ่อนปุ่มสลับแท็บถ่ายภาพ (แท็บกล้องสด)
        const cameraTabBtn = document.querySelector('[data-bs-target="#cameraTab"]');
        if (cameraTabBtn) {
            cameraTabBtn.parentElement.style.display = 'none';
        }
        
        // บังคับให้คลิกแสดงแค่แท็บอัปโหลดเป็นค่าเริ่มต้น
        const uploadTabBtn = document.querySelector('[data-bs-target="#uploadTab"]');
        if (uploadTabBtn) {
            uploadTabBtn.click(); 
            // เปลี่ยนข้อความปุ่มให้รู้ว่ากดถ่ายรูปได้
            uploadTabBtn.innerHTML = '📸 ถ่ายภาพ / เลือกรูป';
        }
    }
}

function initializeApp() {
    // 1. เรียกใช้ฟังก์ชันตรวจจับ LINE ทันทีที่เริ่มโหลดระบบ
    optimizeForLine();

   // 2. ระบบเมนูด้านข้าง (Sidebar) 
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('show'));
    }
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });

    // Event Listeners สำหรับฟอร์มต่างๆ
    document.getElementById("unitPrice").addEventListener("input", calcTotal);
    document.getElementById("quantity").addEventListener("input", calcTotal);
    document.getElementById("keyword").addEventListener("keydown", e => { if(e.key === "Enter") loadData(); });
    
    document.getElementById("addEquipmentForm").addEventListener("submit", handleAddEquipment);
    document.getElementById('editEquipmentForm').addEventListener('submit', handleEditEquipment);
    document.getElementById('customReportForm').addEventListener('submit', handleCustomReport);
}

// function initializeApp() {
//     optimizeForLine(); // ฟังก์ชันซ่อนกล้องสดของ LINE

//     const sidebarToggle = document.getElementById('sidebarToggle');
//     const sidebar = document.getElementById('sidebar');
//     if (sidebarToggle) {
//         sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('show'));
//     }
//     document.addEventListener('click', (e) => {
//         if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
//             sidebar.classList.remove('show');
//         }
//     });

//     // Event Listeners สำหรับฟอร์มต่างๆ
//     document.getElementById("unitPrice").addEventListener("input", calcTotal);
//     document.getElementById("quantity").addEventListener("input", calcTotal);
//     document.getElementById("keyword").addEventListener("keydown", e => { if(e.key === "Enter") loadData(); });
    
//     document.getElementById("addEquipmentForm").addEventListener("submit", handleAddEquipment);
//     document.getElementById('editEquipmentForm').addEventListener('submit', handleEditEquipment);
//     document.getElementById('customReportForm').addEventListener('submit', handleCustomReport);

//     // ==========================================
//     // ⭐️ เพิ่มโค้ดพรีวิวรูปภาพตรงนี้ครับ ⭐️
//     // ==========================================
//     const eqImageInput = document.getElementById('equipmentImage');
//     if (eqImageInput) {
//         eqImageInput.addEventListener('change', function(e) {
//             const file = e.target.files[0];
//             const previewContainer = document.getElementById('imagePreviewContainer');
//             const previewImage = document.getElementById('imagePreview');

//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = function(event) {
//                     previewImage.src = event.target.result;
//                     previewContainer.style.display = 'block'; // โชว์กรอบรูป
//                 };
//                 reader.readAsDataURL(file);
//             } else {
//                 clearImagePreview();
//             }
//         });
//     }
// }

function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('page-active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('page-active');
        document.querySelectorAll('#main-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('onclick').includes(pageId)) link.classList.add('active');
        });

        // Trigger Data Load on page visit
        if (pageId === 'dashboardSection') refreshDashboard();
        if (pageId === 'equipmentListSection') loadData();
        if (pageId === 'addEquipmentSection') loadCategories();
        if (pageId === 'borrowReturnSection') initBorrowReturn();
    }
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('show');
}

// ==========================================
// 3. ระบบยืนยันตัวตน (Login/Logout)
// ==========================================
function openLoginModal() {
    Swal.fire({
        title: '<h2 style="color:#333; font-weight:600;">🔐 เข้าสู่ระบบ</h2>',
        html: `
            <div style="display:flex; flex-direction:column; gap:15px; padding:10px 0;">
                <input id="swal-username" class="swal2-input m-0" placeholder="👤 Username">
                <input id="swal-password" type="password" class="swal2-input m-0" placeholder="🔑 Password">
            </div>`,
        confirmButtonText: '🚀 เข้าสู่ระบบ',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
        preConfirm: () => {
            const u = document.getElementById('swal-username').value.trim();
            const p = document.getElementById('swal-password').value.trim();
            if (!u || !p) { Swal.showValidationMessage('⚠ กรุณากรอกข้อมูลให้ครบถ้วน'); return false; }
            return { u, p };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({ title: 'กำลังตรวจสอบ', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const res = await callBackend('checkLogin', { username: result.value.u, password: result.value.p });
                if (res && res.success) {
                    const sessionStr = `${res.id||"id"},${result.value.u},- ,${res.fullname},${res.status},${res.photo||""}`;
                    sessionStorage.setItem("statusUser", sessionStr);
                    document.getElementById("currentUser").innerText = res.fullname;
                    Swal.fire({ icon: 'success', title: 'ยินดีต้อนรับ ' + res.fullname, timer: 1500, showConfirmButton: false });
                    showPage('dashboardSection');
                } else {
                    Swal.fire({ icon: 'error', title: 'ไม่สำเร็จ', text: res.message || 'รหัสไม่ถูกต้อง' }).then(() => openLoginModal());
                }
            } catch(e) {
                Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: e.message }).then(() => openLoginModal());
            }
        }
    });
}

function logout() {
    Swal.fire({
        title: 'ออกจากระบบ?', icon: 'question', showCancelButton: true, confirmButtonText: 'ออกจากระบบ'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            document.getElementById('webSection').style.display = 'none';
            openLoginModal();
        }
    });
}

function showProfile() {
    const d = sessionStorage.getItem("statusUser")?.split(",") || [];
    Swal.fire({
        title: 'โปรไฟล์',
        html: `<img src="${d[5]||'https://via.placeholder.com/70'}" style="width:70px; border-radius:50%; margin-bottom:15px;">
               <p><strong>ชื่อ:</strong> ${d[3]||'-'}</p><p><strong>สิทธิ์:</strong> ${d[4]||'-'}</p>`,
        icon: 'info'
    });
}

function showSettings() {
    Swal.fire({ icon: 'info', title: 'ตั้งค่าระบบ', text: 'กำลังพัฒนาระบบตั้งค่า...', confirmButtonText: 'รับทราบ' });
}

// ==========================================
// 4. แดชบอร์ด (Dashboard)
// ==========================================
async function refreshDashboard() {
    Swal.fire({ title: 'กำลังโหลดแดชบอร์ด', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const inventory = await callBackend('getInventory');
        const transactions = await callBackend('getTransactionLog');
        
        dashboardUpdateStatsCards(inventory, transactions);
        dashboardRenderMonthlyChart(transactions);
        dashboardRenderStatusChart(inventory);
        dashboardRenderPopularChart(transactions);
        dashboardRenderValueChart(inventory);
        
        Swal.close();
    } catch(e) {
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้', 'error');
    }
}

function dashboardUpdateStatsCards(inventory, transactions) {
    const stock = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const borrowed = transactions.reduce((acc, tx) => acc + (tx.transactionType === 'เบิก' ? Number(tx.quantityChange) : (tx.transactionType === 'คืน' ? -Number(tx.quantityChange) : 0)), 0);
    const total = stock + borrowed;
    const value = inventory.reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
    
    document.getElementById('dashboardTotalCount').textContent = total.toLocaleString('th-TH');
    document.getElementById('availableEquipment').textContent = (total - borrowed).toLocaleString('th-TH');
    document.getElementById('borrowedEquipment').textContent = borrowed.toLocaleString('th-TH');
    document.getElementById('totalValue').textContent = value.toLocaleString('th-TH');
}

function parseThaiDate(dateString) {
    if (!dateString) return null;
    if (dateString.includes('T')) return new Date(dateString);
    const match = dateString.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
    if (match) {
        let y = parseInt(match[3]); if(y > 2500) y -= 543;
        return new Date(y, parseInt(match[2])-1, parseInt(match[1]));
    }
    return new Date(dateString);
}

function dashboardRenderMonthlyChart(transactions) {
    if (chartInstances.monthly) chartInstances.monthly.destroy();
    const ctx = document.getElementById('dashboardMonthlyBorrowChart').getContext('2d');
    const data = { 'เบิก': Array(12).fill(0), 'คืน': Array(12).fill(0) };
    const curYear = new Date().getFullYear();
    transactions.forEach(tx => {
        const d = parseThaiDate(tx.timestamp);
        if (d && d.getFullYear() === curYear && data[tx.transactionType]) {
            data[tx.transactionType][d.getMonth()] += Number(tx.quantityChange)||0;
        }
    });
    chartInstances.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
            datasets: [{label: 'เบิก', data: data['เบิก'], borderColor: '#ff9a9e', fill: false},
                       {label: 'คืน', data: data['คืน'], borderColor: '#11998e', fill: false}]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dashboardRenderStatusChart(inventory) {
    if (chartInstances.status) chartInstances.status.destroy();
    const counts = inventory.reduce((acc, it) => { acc[it.status||'ไม่ระบุ'] = (acc[it.status||'ไม่ระบุ']||0) + (Number(it.quantity)||0); return acc; }, {});
    chartInstances.status = new Chart(document.getElementById('dashboardStatusChart'), {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: ['#38ef7d', '#ff9a9e', '#f39c12', '#667eea'] }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function dashboardRenderPopularChart(transactions) {
    if (chartInstances.popular) chartInstances.popular.destroy();
    const counts = transactions.filter(t=>t.transactionType==='เบิก').reduce((acc, t) => { acc[t.itemName||'ไม่ระบุ'] = (acc[t.itemName||'ไม่ระบุ']||0) + (Number(t.quantityChange)||0); return acc; }, {});
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    chartInstances.popular = new Chart(document.getElementById('dashboardPopularEquipmentChart'), {
        type: 'bar',
        data: { labels: top.map(i=>i[0]), datasets: [{ label: 'ครั้ง', data: top.map(i=>i[1]), backgroundColor: '#667eea' }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function dashboardRenderValueChart(inventory) {
    if (chartInstances.value) chartInstances.value.destroy();
    const vals = inventory.reduce((acc, it) => { acc[it.type||'ไม่ระบุ'] = (acc[it.type||'ไม่ระบุ']||0) + (Number(it.totalValue)||0); return acc; }, {});
    chartInstances.value = new Chart(document.getElementById('dashboardValueByTypeChart'), {
        type: 'bar',
        data: { labels: Object.keys(vals), datasets: [{ label: 'มูลค่า (บาท)', data: Object.values(vals), backgroundColor: '#fcb69f' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// ==========================================
// 5. ระบบจัดการอุปกรณ์ (Inventory)
// ==========================================
async function loadData() {
    const filters = {
        keyword: document.getElementById("keyword").value.trim(),
        category: document.getElementById("category").value,
        status: document.getElementById("status").value,
        location: document.getElementById("location").value
    };
    document.getElementById("tableBody").innerHTML = `<tr><td colspan="10">กำลังโหลด...</td></tr>`;
    try {
        const data = await callBackend('getInventoryData', { filters });
        displayData(data);
    } catch(e) {
        Swal.fire('ข้อผิดพลาด', e.message, 'error');
    }
}

// function displayData(data) {
//     allData = Array.isArray(data) ? data : [];
//     const tbody = document.getElementById("tableBody");
//     if (!allData.length) { tbody.innerHTML = `<tr><td colspan="10">ไม่พบข้อมูล</td></tr>`; return; }
    
//     // Set filter options
//     const setOpt = (id, vals) => { const el=document.getElementById(id), cur=el.value; el.innerHTML='<option>ทั้งหมด</option>'+vals.map(v=>`<option>${v}</option>`).join(''); el.value=cur; };
//     setOpt("category", [...new Set(allData.map(d=>d.Category).filter(Boolean))]);
//     setOpt("status", [...new Set(allData.map(d=>d.Status).filter(Boolean))]);
//     setOpt("location", [...new Set(allData.map(d=>d.Location).filter(Boolean))]);

//     let html = "";
//     allData.forEach(item => {
//         const img = item.ImageURL || "https://via.placeholder.com/60";
//         html += `<tr>
//             <td><img src="${img}" style="max-width:50px"></td>
//             <td class="text-start">${item.Name||''}</td><td>${item.Category||''}</td><td>${item.SerialNumber||''}</td>
//             <td>${item.Status||''}</td><td>${item.Quantity||'0'}</td><td>${item.Location||''}</td>
//             <td>${item.Custodian||''}</td><td>${item.WarrantyExpireDate||'-'}</td>
//             <td>
//                 <button class="btn btn-sm btn-outline-primary" onclick="viewEquipmentDetail('${item.ItemID}')"><i class="fas fa-eye"></i></button>
//                 <button class="btn btn-sm btn-outline-warning" onclick="editEquipment('${item.ItemID}')"><i class="fas fa-edit"></i></button>
//                 <button class="btn btn-sm btn-outline-danger" onclick="deleteEquipment('${item.ItemID}')"><i class="fas fa-trash"></i></button>
//             </td>
//         </tr>`;
//     });
//     tbody.innerHTML = html;
// }

function displayData(data) {
    allData = Array.isArray(data) ? data : [];
    
    const tbody = document.getElementById("tableBody"); // ตาราง (PC)
    const cardView = document.getElementById("cardView"); // การ์ด (มือถือ)
    
    // ถ้าไม่มีข้อมูล ให้ขึ้นข้อความแจ้งเตือนทั้ง 2 หน้าจอ
    if (!allData.length) { 
        tbody.innerHTML = `<tr><td colspan="10">ไม่พบข้อมูล</td></tr>`; 
        cardView.innerHTML = `<div class="alert alert-secondary text-center">ไม่พบข้อมูล</div>`;
        return; 
    }
    
    // อัปเดตตัวกรอง Dropdown
    const setOpt = (id, vals) => { 
        const el = document.getElementById(id);
        const cur = el.value; 
        el.innerHTML = '<option value="ทั้งหมด">ทั้งหมด</option>' + vals.map(v => `<option value="${v}">${v}</option>`).join(''); 
        el.value = cur; 
    };
    setOpt("category", [...new Set(allData.map(d=>d.Category).filter(Boolean))]);
    setOpt("status", [...new Set(allData.map(d=>d.Status).filter(Boolean))]);
    setOpt("location", [...new Set(allData.map(d=>d.Location).filter(Boolean))]);

    let tableHtml = ""; // สำหรับเก็บ HTML ตาราง (PC)
    let cardHtml = "";  // สำหรับเก็บ HTML การ์ด (Mobile)

    allData.forEach(item => {
        const img = item.ImageURL || "https://via.placeholder.com/60";
        const itemName = item.Name || 'ไม่ระบุชื่อ';
        
        // 1. สร้าง HTML สำหรับตาราง (PC) ---------------------------
        tableHtml += `<tr>
            <td><img src="${img}" style="max-width:50px; border-radius:4px;"></td>
            <td class="text-start fw-bold text-primary">${itemName}</td>
            <td>${item.Category||''}</td>
            <td>${item.SerialNumber||''}</td>
            <td><span class="badge bg-secondary">${item.Status||''}</span></td>
            <td>${item.Quantity||'0'}</td>
            <td>${item.Location||''}</td>
            <td>${item.Custodian||''}</td>
            <td>${item.WarrantyExpireDate||'-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewEquipmentDetail('${item.ItemID}')"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-outline-warning" onclick="editEquipment('${item.ItemID}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteEquipment('${item.ItemID}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;

        // 2. สร้าง HTML สำหรับการ์ด (มือถือ) --------------------------
        cardHtml += `
        <div class="card mb-3 shadow-sm border-0">
            <div class="row g-0">
                <div class="col-4 d-flex align-items-center justify-content-center bg-light p-2" style="border-radius: 8px 0 0 8px;">
                    <img src="${img}" class="img-fluid rounded" style="max-height: 90px; object-fit: contain;">
                </div>
                <div class="col-8">
                    <div class="card-body p-2 pl-3">
                        <h6 class="card-title mb-1 fw-bold text-primary text-truncate">${itemName}</h6>
                        <p class="card-text mb-2" style="font-size: 0.85rem; line-height: 1.4;">
                            <strong>S/N:</strong> ${item.SerialNumber||'-'}<br>
                            <strong>ประเภท:</strong> ${item.Category||'-'}<br>
                            <strong>สถานะ:</strong> <span class="badge bg-secondary">${item.Status||''}</span><br>
                            <strong>คงเหลือ:</strong> <span class="text-success fw-bold">${item.Quantity||'0'}</span> ${item.Unit||''}
                        </p>
                        <div class="d-flex justify-content-end gap-1 mt-1">
                            <button class="btn btn-sm btn-primary" onclick="viewEquipmentDetail('${item.ItemID}')"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-sm btn-warning text-dark" onclick="editEquipment('${item.ItemID}')"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteEquipment('${item.ItemID}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    // นำข้อมูลที่สร้างเสร็จแล้วไปแสดงผลตามหน้าจอที่ถูกต้อง
    tbody.innerHTML = tableHtml;
    cardView.innerHTML = cardHtml;
}

function resetFilters() {
    ['keyword'].forEach(id => document.getElementById(id).value = '');
    ['category','status','location'].forEach(id => document.getElementById(id).value = 'ทั้งหมด');
    loadData();
}

function viewEquipmentDetail(itemId) {
    const item = allData.find(d => d.ItemID === itemId);
    if (!item) return;
    document.getElementById('equipmentDetailContent').innerHTML = `
        <div class="row">
            <div class="col-md-4 text-center"><img src="${item.ImageURL||'https://via.placeholder.com/200'}" class="img-fluid rounded mb-3"></div>
            <div class="col-md-8">
                <h4>${item.Name}</h4>
                <table class="table table-bordered">
                    <tr><th>รหัส</th><td>${item.ItemID}</td></tr><tr><th>ประเภท</th><td>${item.Category}</td></tr>
                    <tr><th>S/N</th><td>${item.SerialNumber}</td></tr><tr><th>สถานะ</th><td>${item.Status}</td></tr>
                    <tr><th>คงเหลือ</th><td>${item.Quantity} ${item.Unit||''}</td></tr><tr><th>สถานที่เก็บ</th><td>${item.Location}</td></tr>
                    <tr><th>ผู้รับผิดชอบ</th><td>${item.Custodian}</td></tr><tr><th>หมายเหตุ</th><td>${item.Notes}</td></tr>
                </table>
            </div>
        </div>`;
    new bootstrap.Modal(document.getElementById('equipmentDetailModal')).show();
}

function editEquipment(itemId) {
    const item = allData.find(d => d.ItemID === itemId);
    if (!item) return;
    const opts = ['ใหม่', 'ใช้งานได้', 'ชำรุด', 'ส่งซ่อม', 'จำหน่าย'].map(o => `<option ${item.Status===o?'selected':''}>${o}</option>`).join('');
    
    document.getElementById('editEquipmentForm').innerHTML = `
        <input type="hidden" id="editItemId" value="${item.ItemID}">
        <div class="row g-3">
            <div class="col-md-8"><label>ชื่ออุปกรณ์</label><input type="text" class="form-control" id="editName" value="${item.Name}" required></div>
            <div class="col-md-4"><label>ประเภท</label><input type="text" class="form-control" id="editCategory" value="${item.Category}"></div>
            <div class="col-md-6"><label>S/N</label><input type="text" class="form-control" id="editSerialNumber" value="${item.SerialNumber}"></div>
            <div class="col-md-6"><label>สถานะ</label><select class="form-select" id="editStatus">${opts}</select></div>
            <div class="col-md-3"><label>จำนวน</label><input type="number" class="form-control" id="editQuantity" value="${item.Quantity}"></div>
            <div class="col-md-9"><label>สถานที่</label><input type="text" class="form-control" id="editLocation" value="${item.Location}"></div>
            <div class="col-12"><label>ผู้รับผิดชอบ</label><input type="text" class="form-control" id="editCustodian" value="${item.Custodian}"></div>
            <div class="col-12"><label>รายละเอียด</label><textarea class="form-control" id="editNotes" rows="2">${item.Notes}</textarea></div>
        </div>
        <div class="text-end mt-3"><button type="button" class="btn btn-secondary me-2" data-bs-dismiss="modal">ยกเลิก</button><button type="submit" class="btn btn-primary">บันทึก</button></div>`;
    new bootstrap.Modal(document.getElementById('editEquipmentModal')).show();
}

async function handleEditEquipment(e) {
    e.preventDefault();
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const payload = {
            ItemID: document.getElementById('editItemId').value, Name: document.getElementById('editName').value,
            Category: document.getElementById('editCategory').value, SerialNumber: document.getElementById('editSerialNumber').value,
            Status: document.getElementById('editStatus').value, Quantity: document.getElementById('editQuantity').value,
            Location: document.getElementById('editLocation').value, Custodian: document.getElementById('editCustodian').value,
            Notes: document.getElementById('editNotes').value, UpdatedBy: document.getElementById("currentUser").innerText
        };
        await callBackend('updateEquipmentData', { clientData: payload });
        bootstrap.Modal.getInstance(document.getElementById('editEquipmentModal')).hide();
        Swal.fire('สำเร็จ', 'บันทึกแล้ว', 'success');
        loadData();
    } catch(e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
}

async function deleteEquipment(itemId) {
    const res = await Swal.fire({ title: 'ยืนยันลบ?', text: `ลบอุปกรณ์ ${itemId}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบเลย' });
    if(res.isConfirmed) {
        Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        try {
            await callBackend('deleteItemById', { itemId: itemId });
            Swal.fire('สำเร็จ', 'ลบแล้ว', 'success');
            loadData();
        } catch(e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
    }
}

// ==========================================
// 6. การเพิ่มอุปกรณ์ (Add Equipment)
// ==========================================
// async function loadCategories() {
//     try {
//         const res = await callBackend('getCategories');
//         const setSel = (id, arr, p) => { document.getElementById(id).innerHTML = `<option value="">${p}</option>` + arr.map(a=>`<option value="${a}">${a}</option>`).join(''); };
//         setSel('equipmentType', res.ItemCategory, 'เลือกประเภท');
//         setSel('equipmentStatus', res.Status, 'เลือกสถานะ');
//         setSel('Unit', res.Unit, 'เลือกหน่วย');
//         setSel('Location', res.Location, 'เลือกสถานที่');
//     } catch(e) { console.error("โหลด Categories ไม่สำเร็จ", e); }
// }
// ==========================================
// 6. การเพิ่มอุปกรณ์ (Add Equipment)
// ==========================================
// async function loadCategories() {
//     try {
//         const res = await callBackend('getCategories');
        
//         // ข้อมูลจริงๆ ถูกซ้อนอยู่ใน res.data (อ้างอิงจากการ return ในรหัส.gs)
//         // แต่เพื่อความชัวร์ เราเขียนให้รองรับทั้งแบบมี .data และไม่มี
//         const catData = res.data ? res.data : res;

//         // เพิ่ม if (!arr) return; ป้องกันกรณีไม่มีข้อมูลส่งมา จะได้ไม่เกิด Error .map()
//         const setSel = (id, arr, p) => { 
//             if (!arr) return; 
//             document.getElementById(id).innerHTML = `<option value="">${p}</option>` + arr.map(a => `<option value="${a}">${a}</option>`).join(''); 
//         };

//         setSel('equipmentType', catData.ItemCategory, 'เลือกประเภท');
//         setSel('equipmentStatus', catData.Status, 'เลือกสถานะ');
//         setSel('Unit', catData.Unit, 'เลือกหน่วย');
//         setSel('Location', catData.Location, 'เลือกสถานที่');

//     } catch(e) { 
//         console.error("โหลด Categories ไม่สำเร็จ", e); 
//     }
// }

// ==========================================
// 6. การเพิ่มอุปกรณ์ (Add Equipment)
// ==========================================
async function loadCategories() {
    try {
        console.log("✅ โค้ดเวอร์ชันใหม่ทำงานแล้ว: กำลังดึงข้อมูล Categories...");
        const res = await callBackend('getCategories');
        console.log("📌 ข้อมูลที่ได้จากหลังบ้าน:", res); 
        
        // ชี้เป้าข้อมูลที่ถูกซ้อนมาให้ถูกต้อง
        const catData = res.data ? res.data : res;

        // วาด Dropdown (ใส่ if ป้องกัน Error .map() ไว้แล้ว)
        const setSel = (id, arr, p) => { 
            if (!arr || !Array.isArray(arr)) {
                console.warn(`ไม่พบข้อมูลสำหรับช่อง ${id}`);
                return; 
            }
            document.getElementById(id).innerHTML = `<option value="">${p}</option>` + arr.map(a => `<option value="${a}">${a}</option>`).join(''); 
        };

        setSel('equipmentType', catData.ItemCategory, 'เลือกประเภท');
        setSel('equipmentStatus', catData.Status, 'เลือกสถานะ');
        setSel('Unit', catData.Unit, 'เลือกหน่วย');
        setSel('Location', catData.Location, 'เลือกสถานที่');

    } catch(e) { 
        console.error("โหลด Categories ไม่สำเร็จ", e); 
    }
}

function calcTotal() {
    const price = parseFloat(document.getElementById("unitPrice").value) || 0;
    const qty = parseInt(document.getElementById("quantity").value) || 0;
    document.getElementById("totalValue").value = (price * qty).toFixed(2);
}

// async function handleAddEquipment(e) {
//     e.preventDefault();
//     Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
//     try {
//         const eq = {
//             name: document.getElementById("equipmentName").value, type: document.getElementById("equipmentType").value,
//             serial: document.getElementById("serialNumber").value, status: document.getElementById("equipmentStatus").value,
//             unitPrice: document.getElementById("unitPrice").value, quantity: document.getElementById("quantity").value,
//             unit: document.getElementById("Unit").value, totalValue: document.getElementById("totalValue").value,
//             vendor: document.getElementById("vendor").value, responsible: document.getElementById("responsible").value,
//             purchaseDate: document.getElementById("purchaseDate").value, warrantyExpire: document.getElementById("warrantyExpire").value,
//             auditDate: document.getElementById("auditDate").value, location: document.getElementById("Location").value,
//             locationDetail: document.getElementById("equipmentLocation").value, notes: document.getElementById("notes").value,
//             createdBy: document.getElementById("currentUser").innerText, imageUrl: ""
//         };

// // ... โค้ดดึงข้อมูล eq ด้านบนยังเหมือนเดิม ...

//         // เช็กข้อมูลภาพจาก 2 แหล่ง (ไฟล์อัปโหลด หรือ กล้อง)
//         const file = document.getElementById("equipmentImage").files[0];
//         const cameraImageBase64 = document.getElementById("cameraImageData").value;

//         if (cameraImageBase64) {
//             // กรณี: ถ่ายรูปจากกล้อง (มีข้อมูล base64 อยู่แล้ว ส่งเข้า API ได้เลย)
//             const filename = "camera_" + new Date().getTime() + ".jpg";
//             const imgRes = await callBackend('uploadImageAndSave', { base64Data: cameraImageBase64, filename: filename });
//             if (imgRes.success) eq.imageUrl = imgRes.url;
//             await finalizeAdd(eq);
            
//         } else if (file) {
//             // กรณี: อัปโหลดไฟล์ภาพ
//             const reader = new FileReader();
//             reader.onload = async (e) => {
//                 const imgRes = await callBackend('uploadImageAndSave', { base64Data: e.target.result, filename: file.name });
//                 if (imgRes.success) eq.imageUrl = imgRes.url;
//                 await finalizeAdd(eq);
//             };
//             reader.readAsDataURL(file);
            
//         } else {
//             // กรณี: ไม่ได้ใส่รูปภาพ
//             await finalizeAdd(eq);
//         }

//     } catch(e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
// }

async function handleAddEquipment(e) {
    e.preventDefault();
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
        // ⭐️ ฟังก์ชันตัวช่วย: ถ้าหา ID ไม่เจอ ให้คืนค่าเป็นช่องว่างแทนการแจก Error
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : "";
        };

        // ดึงข้อมูลโดยใช้ getVal() ทั้งหมด ป้องกัน error: properties of null (reading 'value')
        const eq = {
            name: getVal("equipmentName"), 
            type: getVal("equipmentType"),
            serial: getVal("serialNumber"), 
            status: getVal("equipmentStatus"),
            unitPrice: getVal("unitPrice"), 
            quantity: getVal("quantity"),
            unit: getVal("Unit"), 
            totalValue: getVal("totalValue"),
            vendor: getVal("vendor"), 
            responsible: getVal("responsible"),
            purchaseDate: getVal("purchaseDate"), 
            warrantyExpire: getVal("warrantyExpire"),
            auditDate: getVal("auditDate"), 
            location: getVal("Location"),
            locationDetail: getVal("equipmentLocation"), 
            notes: getVal("notes"),
            createdBy: document.getElementById("currentUser") ? document.getElementById("currentUser").innerText : "ไม่ระบุ", 
            imageUrl: ""
        };

        // ดึงไฟล์รูปภาพจากช่อง input 
        const fileInput = document.getElementById("equipmentImage");
        const file = fileInput ? fileInput.files[0] : null;

        if (file) {
            // กรณีมีรูปภาพ
            const reader = new FileReader();
            reader.onload = async (event) => {
                const imgRes = await callBackend('uploadImageAndSave', { 
                    base64Data: event.target.result, 
                    filename: file.name || ("camera_" + new Date().getTime() + ".jpg") 
                });
                if(imgRes.success) eq.imageUrl = imgRes.url;
                
                await finalizeAdd(eq);
            };
            reader.readAsDataURL(file);
        } else {
            // กรณีไม่มีรูปภาพ
            await finalizeAdd(eq);
        }
    } catch(err) { 
        Swal.fire('ผิดพลาด', err.message, 'error'); 
        console.error("Add Equipment Error:", err);
    }
}
        

// async function finalizeAdd(eq) {
//     await callBackend('addEquipment', { equipment: eq });
//     Swal.fire('สำเร็จ', 'บันทึกอุปกรณ์ใหม่แล้ว', 'success').then(() => { document.getElementById("addEquipmentForm").reset(); showPage('equipmentListSection'); });
// }

async function finalizeAdd(eq) {
    await callBackend('addEquipment', { equipment: eq });
    Swal.fire('สำเร็จ', 'บันทึกอุปกรณ์ใหม่แล้ว', 'success').then(() => { 
        document.getElementById("addEquipmentForm").reset(); 
        clearImagePreview(); // <--- เพิ่มบรรทัดนี้เพื่อลบรูปพรีวิวออก
        showPage('equipmentListSection'); 
    });
}


// ==========================================
// 7. ระบบเบิก-คืน (Borrow / Return)
// ==========================================
async function initBorrowReturn() {
    try {
        const [logs, inv, borrowed, borrowers] = await Promise.all([
            callBackend('getTransactionLog', { limit: 100 }),
            callBackend('getInventory'),
            callBackend('getBorrowedItems'),
            callBackend('getBorrowers')
        ]);
        
        fullInventoryData = inv;
        renderLog(logs);
        
        // Setup Awesomplete
        const bInput = document.getElementById("borrowItemSearch");
        new Awesomplete(bInput, { list: inv.map(i=>({label:`${i.ItemID} - ${i.name||''}`, value:i.ItemID})), minChars:1 });
        bInput.addEventListener('awesomplete-selectcomplete', e => displayItemDetails('borrow', e.text.value));

        const rInput = document.getElementById("returnItemSearch");
        new Awesomplete(rInput, { list: borrowed.map(i=>({label:`${i.ItemID} - ${i.name||''}`, value:i.ItemID})), minChars:1 });
        rInput.addEventListener('awesomplete-selectcomplete', e => displayItemDetails('return', e.text.value));

        new Awesomplete(document.getElementById("borrower"), { list: borrowers, minChars:1 });

    } catch(e) { console.error("Init Borrow/Return Error:", e); }
}

function displayItemDetails(type, id) {
    const item = fullInventoryData.find(i => String(i.ItemID) === String(id));
    const box = document.getElementById(`${type}ItemDetails`);
    if(item) {
        document.getElementById(`${type}ItemID`).value = item.ItemID;
        box.innerHTML = `<strong>คงเหลือ:</strong> ${item.quantity} ${item.unit||''}<br><strong>ประเภท:</strong> ${item.type}<br><strong>ตำแหน่ง:</strong> ${item.locationDetail||'-'}`;
        box.style.display = 'block';
        if(type === 'return') loadReturnersList(item.ItemID);
    }
}

async function loadReturnersList(itemId) {
    const sel = document.getElementById("returner");
    sel.innerHTML = `<option value="">-- กำลังโหลด --</option>`;
    try {
        const names = await callBackend('getReturners', { itemID: itemId });
        sel.innerHTML = names.length ? `<option value="">-- เลือกผู้คืน --</option>` + names.map(n=>`<option>${n}</option>`).join('') : `<option disabled>ไม่มีผู้ยืมค้าง</option>`;
    } catch(e) { console.error(e); }
}

async function loadBorrowDetail(user) {
    const itemId = document.getElementById("returnItemID").value;
    const box = document.getElementById("borrowDetail");
    if(!user || !itemId) { box.style.display='none'; return; }
    try {
        const d = await callBackend('getBorrowDetail', { itemID: itemId, user: user });
        if(!d) { box.innerHTML = '<span class="text-danger">ไม่พบข้อมูลยืม</span>'; return; }
        box.innerHTML = `<strong>ยอดค้าง: ${d.outstanding}</strong> (ยืม ${d.totalBorrow} / คืน ${d.totalReturn})`;
        box.style.display = 'block';
    } catch(e) {}
}

async function submitTransaction(type) {
    const payload = {
        type: type, fullname: document.getElementById("currentUser").innerText,
        itemID: document.getElementById(type==='เบิก'?"borrowItemID":"returnItemID").value,
        requester: document.getElementById(type==='เบิก'?"borrower":"returner").value,
        quantity: document.getElementById(type==='เบิก'?"borrowQty":"returnQty").value,
        notes: document.getElementById(type==='เบิก'?"borrowNotes":"returnNotes").value,
        condition: type==='คืน' ? document.getElementById("returnCondition").value : null
    };
    if(!payload.itemID || !payload.requester || !payload.quantity) return Swal.fire('แจ้งเตือน', 'กรอกข้อมูลสำคัญให้ครบ', 'warning');
    
    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const res = await callBackend('recordTransaction', { data: payload });
        Swal.fire('สำเร็จ', `ยอดคงเหลือใหม่: ${res.newQty}`, 'success');
        document.getElementById("borrowQty").value = ''; document.getElementById("returnQty").value = '';
        initBorrowReturn(); // รีเฟรชหน้าเบิกคืน
    } catch(e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
}

function renderLog(logs) {
    const tbody = document.querySelector("#logTable tbody");
    if(!logs.length) { tbody.innerHTML = `<tr><td colspan="7">ไม่มีประวัติ</td></tr>`; return; }
    tbody.innerHTML = logs.map(l => `<tr><td>${l.timestamp}</td><td>${l.itemID}</td><td>${l.itemName}</td><td><span class="badge ${l.transactionType==='เบิก'?'bg-danger':'bg-success'}">${l.transactionType}</span></td><td>${l.quantityChange}</td><td>${l.requester}</td><td>${l.notes||'-'}</td></tr>`).join('');
}

// ==========================================
// 8. ระบบรายงาน (Reports)
// ==========================================
async function generateQuickReport(type, format) {
    processReport({ reportType: type, startDate: null, endDate: null, reportFormat: format });
}

async function handleCustomReport(e) {
    e.preventDefault();
    const s = document.getElementById('reportStartDate').value, e_date = document.getElementById('reportEndDate').value;
    if(s && e_date && new Date(s) > new Date(e_date)) return Swal.fire('แจ้งเตือน', 'วันที่เริ่มต้นต้องน้อยกว่าสิ้นสุด', 'warning');
    processReport({ reportType: document.getElementById('reportType').value, startDate: s, endDate: e_date, reportFormat: document.getElementById('reportFormat').value });
}

async function processReport(opts) {
    Swal.fire({ title: 'กำลังสร้างรายงาน...', text: 'อาจใช้เวลาสักครู่', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
        const res = await callBackend('createCustomReport', { options: opts });
        const link = document.createElement("a");
        link.href = `data:${res.mimeType};base64,${res.base64Data}`;
        link.download = res.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Swal.close();
    } catch(e) { Swal.fire('ผิดพลาด', e.message, 'error'); }
}

// ==========================================
// ระบบควบคุมกล้อง (Webcam)
// ==========================================
let videoStream = null;

async function startCamera() {
    const video = document.getElementById('cameraVideo');
    const btnCapture = document.getElementById('btnCapture');
    const canvas = document.getElementById('cameraCanvas');
    const btnRetake = document.getElementById('btnRetake');

    // รีเซ็ต UI
    canvas.style.display = 'none';
    btnRetake.style.display = 'none';
    document.getElementById('cameraImageData').value = "";
    
    try {
        // ขออนุญาตเปิดกล้อง (เน้นกล้องหลังถ้าเป็นมือถือ)
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = videoStream;
        video.style.display = 'block';
        btnCapture.style.display = 'inline-block';
    } catch (err) {
        console.error("Camera error:", err);
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์', 'error');
    }
}

function takeSnapshot() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    
    // กำหนดขนาดความละเอียดรูป
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // วาดภาพจากวีดีโอลงผืนผ้าใบ (Canvas)
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // แปลงรูปเป็นรหัส Base64 (คุณภาพ 80%) และเก็บลง input ซ่อน
    document.getElementById('cameraImageData').value = canvas.toDataURL('image/jpeg', 0.8);
    
    // สลับหน้าจอจากวีดีโอเป็นรูปนิ่ง
    video.style.display = 'none';
    canvas.style.display = 'block';
    document.getElementById('btnCapture').style.display = 'none';
    document.getElementById('btnRetake').style.display = 'inline-block';
    
    stopCamera(); // ปิดกล้องเพื่อประหยัดทรัพยากร
}

function retakePhoto() {
    startCamera();
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

// หยุดกล้องอัตโนมัติเมื่อกดเปลี่ยนไปใช้การ "อัปโหลด" หรือเปลี่ยนหน้า
document.addEventListener('click', (e) => {
    if (e.target.getAttribute('data-bs-target') === '#uploadTab' || e.target.classList.contains('nav-link')) {
        stopCamera();
    }
});

// ==========================================
// ระบบพรีวิวรูปภาพจากกล้อง
// ==========================================

// ตรวจจับเมื่อมีการถ่ายรูป หรือเลือกไฟล์รูปภาพ
document.getElementById('equipmentImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImage = document.getElementById('imagePreview');

    if (file) {
        // ใช้ FileReader อ่านไฟล์ภาพมาแสดงบนหน้าเว็บ
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImage.src = event.target.result;
            previewContainer.style.display = 'block'; // โชว์กรอบรูป
        }
        reader.readAsDataURL(file);
    } else {
        clearImagePreview();
    }
});

// ฟังก์ชันสำหรับลบรูปทิ้ง (กรณีถ่ายเสีย)
function clearImagePreview() {
    document.getElementById('equipmentImage').value = ''; // ล้างค่าไฟล์
    document.getElementById('imagePreviewContainer').style.display = 'none'; // ซ่อนกรอบรูป
    document.getElementById('imagePreview').src = '';
}


// ฟังก์ชันสำหรับลบรูปทิ้ง (กรณีถ่ายเสีย หรือกดยกเลิก)
function clearImagePreview() {
    const eqImageInput = document.getElementById('equipmentImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImage = document.getElementById('imagePreview');
    
    if (eqImageInput) eqImageInput.value = ''; // ล้างค่าไฟล์
    if (previewContainer) previewContainer.style.display = 'none'; // ซ่อนกรอบรูป
    if (previewImage) previewImage.src = '';
}

// ==========================================
// ระบบพรีวิวรูปภาพจากกล้อง (อัปเดตใหม่ การันตี 100%)
// ==========================================

// ใช้การดักจับระดับ Document (Event Delegation) 
document.addEventListener('change', function(e) {
    // เช็กว่าสิ่งที่เปลี่ยนคือ input รูปภาพของเราหรือไม่
    if (e.target && e.target.id === 'equipmentImage') {
        const file = e.target.files[0];
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImage = document.getElementById('imagePreview');

        if (file) {
            // ใช้ FileReader อ่านไฟล์ภาพ
            const reader = new FileReader();
            reader.onload = function(event) {
                if (previewImage && previewContainer) {
                    previewImage.src = event.target.result;
                    previewContainer.style.display = 'block'; // โชว์กรอบพรีวิว
                }
            };
            reader.readAsDataURL(file); // สั่งให้อ่านไฟล์
        } else {
            clearImagePreview();
        }
    }
});

// ฟังก์ชันเคลียร์รูปภาพ
function clearImagePreview() {
    const eqInput = document.getElementById('equipmentImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImage = document.getElementById('imagePreview');
    
    if (eqInput) eqInput.value = ''; // ล้างค่า
    if (previewContainer) previewContainer.style.display = 'none'; // ซ่อนกรอบ
    if (previewImage) previewImage.src = '';
}


// ==========================================
// ฟังก์ชันเด้งเมนูให้เลือก (กล้อง / คลังภาพ)
// ==========================================
function chooseImageSource() {
    Swal.fire({
        title: 'เลือกวิธีเพิ่มรูปภาพ',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-camera me-1"></i> ถ่ายรูปใหม่',
        denyButtonText: '<i class="fas fa-images me-1"></i> เลือกจากคลัง',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3085d6',
        denyButtonColor: '#28a745'
    }).then((result) => {
        const fileInput = document.getElementById('equipmentImage');
        if (result.isConfirmed) {
            // กรณีเลือก "ถ่ายรูปใหม่" -> แอบเติมคำสั่ง capture เพื่อบังคับเปิดกล้อง
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        } else if (result.isDenied) {
            // กรณีเลือก "เลือกจากคลัง" -> ลบคำสั่ง capture ออก เพื่อให้เปิดอัลบั้ม
            fileInput.removeAttribute('capture');
            fileInput.click();
        }
    });
}
