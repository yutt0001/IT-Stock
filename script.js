// ==========================================
// ส่วนเชื่อมต่อกับ Backend (Google Apps Script API)
// ==========================================
const API_URL = "วาง_URL_WEB_APP_ของ_APPS_SCRIPT_ที่นี่";

async function callBackend(actionName, payloadData = {}) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: actionName,
                payload: payloadData
            })
        });
        
        const result = await response.json();
        
        if (result.status === "success") {
            return result.data;
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error("Backend Error:", error);
        throw error;
    }
}
// ==========================================


// Global variables
let currentUser = 'เจ้าหน้าที่ IT';
let userRole = 'admin'; // admin, user
let equipmentData = [];
let transactionData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // loadSampleData();
    // setupEventListeners();
    showDashboard();
});

function initializeApp() {
    // Setup sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });
}

function loadSampleData() {
    equipmentData = [...sampleEquipment];
    transactionData = [...sampleTransactions];
    updateDashboardStats();
}

function setupEventListeners() {
    // Add equipment form
    const addEquipmentForm = document.getElementById('addEquipmentForm');
    if (addEquipmentForm) {
        addEquipmentForm.addEventListener('submit', handleAddEquipment);
    }

    // Borrow form
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', handleBorrowEquipment);
    }

    // Return form
    const returnForm = document.getElementById('returnForm');
    if (returnForm) {
        returnForm.addEventListener('submit', handleReturnEquipment);
    }

    // Calculate total value when unit price or quantity changes
    const unitPriceInput = document.getElementById('unitPrice');
    const quantityInput = document.getElementById('quantity');
    
    if (unitPriceInput && quantityInput) {
        unitPriceInput.addEventListener('input', calculateTotalValue);
        quantityInput.addEventListener('input', calculateTotalValue);
    }

    // Search functionality
    const searchInput = document.getElementById('searchEquipment');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchEquipment, 300));
    }
}

// Navigation functions
function showDashboard() {
    hideAllSections();
    document.getElementById('dashboardSection').style.display = 'block';
    setActiveNavLink('แดชบอร์ด');
    // updateDashboardStats();
    // loadCharts();
}

function showEquipmentList() {
    hideAllSections();
    document.getElementById('equipmentListSection').style.display = 'block';
    setActiveNavLink('รายการอุปกรณ์');
    // loadEquipmentTable();
}

function showAddEquipment() {
    hideAllSections();
    document.getElementById('addEquipmentSection').style.display = 'block';
    setActiveNavLink('เพิ่มอุปกรณ์');
    // resetAddEquipmentForm();
}

function showBorrowReturn() {
    hideAllSections();
    document.getElementById('borrowReturnSection').style.display = 'block';
    setActiveNavLink('เบิก-คืนอุปกรณ์');
    // loadTransactionHistory();
}

function showReports() {
    hideAllSections();
    document.getElementById('reportsSection').style.display = 'block';
    setActiveNavLink('รายงาน');
}

function showAuditSchedule() {
    hideAllSections();
    document.getElementById('auditScheduleSection').style.display = 'block';
    setActiveNavLink('ตรวจสอบสินทรัพย์');
    // loadAuditSchedule();
}

function showWarrantyAlert() {
    hideAllSections();
    document.getElementById('warrantyAlertSection').style.display = 'block';
    setActiveNavLink('แจ้งเตือนการรับประกัน');
    // loadWarrantyAlerts();
}
function showLogin() {
    hideAllSections();
    document.getElementById('loginContainer').style.display = 'block';
    setActiveNavLink('เข้าสู่ระบบ');
    // loadWarrantyAlerts();
}

function hideAllSections() {
    const sections = [
        'dashboardSection', 'equipmentListSection', 'addEquipmentSection',
        'borrowReturnSection', 'reportsSection', 'auditScheduleSection',
        'warrantyAlertSection', 'loginContainer'
    ];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) element.style.display = 'none';
    });
}

function setActiveNavLink(text) {
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.trim().includes(text)) {
            link.classList.add('active');
        }
    });
}

function showProfile() {
  const statusUser = sessionStorage.getItem("statusUser")?.split(",") || [];
  const status = statusUser[4] || "";
  const fullname = statusUser[3] || "";
  const photo = statusUser[5] || "";

  Swal.fire({
    title: 'โปรไฟล์ผู้ใช้',
    html: `
      <div class="text-center">
        <img id="userPhoto" src="${photo}" alt="user photo" 
             style="width:70px; height:auto; border-radius:50%; display:block; margin:0 auto 10px;">
        <p class="text-start"><strong>ชื่อ:</strong> ${fullname}</p>
        <p class="text-start"><strong>สิทธิ์การใช้งาน:</strong> ${status}</p>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'ปิด'
  });
}
        
// function showProfile() {
//   const statusUser = sessionStorage.getItem("statusUser")?.split(",") || [];
//   const status = statusUser[4] || "";
//   const fullname = statusUser[3] || "";
//   const photo = statusUser[5] || "";

//   Swal.fire({
//     title: 'โปรไฟล์ผู้ใช้',
//     html: `
//       <div class="text-start">
//         <img id="userPhoto" src="${photo}" alt="user photo" style="align:center; width:50px; height:auto; border-radius:50%; margin-bottom:10px;">
//         <p><strong>ชื่อ:</strong> ${fullname}</p>
//         <p><strong>สิทธิ์การใช้งาน:</strong> ${status}</p>
//       </div>
//     `,
//     icon: 'info',
//     confirmButtonText: 'ปิด'
//   });
// }

// User management functions
// function showProfile() {
//   const statusUser = sessionStorage.getItem("statusUser")?.split(",") || [];
// const status = statusUser[4] || "";
// const fullname = statusUser[3] || "";
// const photo = statusUser[5] || "";
//   Swal.fire({
//       title: 'โปรไฟล์ผู้ใช้',
//       html: `
//           <div class="text-start">
//           <img id="userPhoto" src="${photo}" alt="user photo width="50" height=auto>
//               <p><strong>ชื่อ:</strong> ${fullname}</p>
//               <p><strong>สิทธิ์การใช้งาน:</strong> ${status}</p>
//           </div>
//       `,
//       icon: 'info',
//       confirmButtonText: 'ปิด'
//   });
// }

// function showProfile() {
//     Swal.fire({
//         title: 'โปรไฟล์ผู้ใช้',
//         html: `
//             <div class="text-start">
//                 <p><strong>ชื่อ:</strong> ${currentUser}</p>
//                 <p><strong>ตำแหน่ง:</strong> เจ้าหน้าที่ IT</p>
//                 <p><strong>แผนก:</strong> เทคโนโลยีสารสนเทศ</p>
//                 <p><strong>คณะ:</strong> ครุศาสตร์อุตสาหกรรมและเทคโนโลยี</p>
//                 <p><strong>สิทธิ์การใช้งาน:</strong> ผู้ดูแลระบบ</p>
//             </div>
//         `,
//         icon: 'info',
//         confirmButtonText: 'ปิด'
//     });
// }

function showSettings() {
    Swal.fire({
        title: 'ตั้งค่าระบบ',
        html: `
            <div class="text-start">
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="emailNotification" checked>
                    <label class="form-check-label" for="emailNotification">
                        แจ้งเตือนทาง Email
                    </label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="lineNotification">
                    <label class="form-check-label" for="lineNotification">
                        แจ้งเตือนทาง Line Notify
                    </label>
                </div>
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" id="autoBackup" checked>
                    <label class="form-check-label" for="autoBackup">
                        สำรองข้อมูลอัตโนมัติ
                    </label>
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'บันทึกการตั้งค่าแล้ว!',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
}

function logout() {
    Swal.fire({
        title: 'ออกจากระบบ',
        text: 'คุณต้องการออกจากระบบหรือไม่?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก'
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'ออกจากระบบแล้ว!',
                text: 'ขอบคุณที่ใช้งานระบบ',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                // In real implementation, redirect to login page
                // location.reload();
                sessionStorage.clear()
                document.getElementById('webSection').style.display = 'block';
                openLoginModal();
            });
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showPage(pageId) {
    // 1. ลบคลาส 'page-active' ออกจากทุก Section ก่อน (เป็นการรีเซ็ต)
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('page-active');
    });

    // 2. แสดงเฉพาะ Section ที่เราต้องการโดยการเพิ่มคลาส 'page-active'
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.add('page-active');
        console.log(`Showing page: #${pageId}`);

        // 3. จัดการ Active Class ของเมนู
        document.querySelectorAll('#main-nav .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const clickedNavLink = document.querySelector(`#main-nav .nav-link[onclick="showPage('${pageId}')"]`);
        if (clickedNavLink) {
            clickedNavLink.classList.add('active');
        }

        // 4. (สำคัญ) ถ้าหน้าที่แสดงคือ Dashboard ให้ทำการโหลดข้อมูลใหม่เสมอ
        if (pageId === 'dashboardSection' && typeof refreshDashboard === 'function') {
            refreshDashboard();
        }

    } else {
        console.error(`Error: Page with ID #${pageId} not found.`);
    }
}

// ฟังก์ชันที่จะทำงานเมื่อหน้าเว็บโหลดเสร็จครั้งแรก
document.addEventListener('DOMContentLoaded', () => {
    // แสดงหน้า Dashboard เป็นหน้าแรกเสมอ
    showPage('dashboardSection');
});

// /** ฟังก์ชั่นรีโหลดหน้าเว็บ */
// function reLoadWeb() {
//  console.log("กำลังรีโหลดหน้า...");
//  window.location.href = "https://script.google.com/a/macros/kmitl.ac.th/s/AKfycbwKDYqTdeCawluv_YYWdzKw0mQGNvyFcpWfEWXZsfbVw_vAnloDmPIS_wpmYu_xj7Np/exec"; // เปลี่ยน URL ไปหน้า Home
// }

window.addEventListener("load", () => {
    loadAdmin = sessionStorage.getItem("statusUser");
    console.log("ข้อมูล admin", loadAdmin);

    // showCalendar();
    // showTable();
    // showTable2();
    // agency();
    // room();

    if (loadAdmin != null) {
      data = loadAdmin.split(",");
      id = data[0];
      usename = data[1];
      pass = data[2];
      fullname = data[3];
      status = data[4];
      photo = data[5];

      /** LogFile */
      console.log("ข้อมูล Load admin", loadAdmin);
      console.log("ไอดี>> ", id);
      console.log("ชื่อ>> ", usename);
      console.log("รหัสผ่าน>> ", pass);
      console.log("ชื่อเต็ม>> ", fullname);
      console.log("สถานะ>> ", status);
      console.log("รูปภาพ>> ", photo);
      /**---------*/

        document.getElementById('webSection').style.display = 'block';
        document.getElementById("currentUser").innerText = fullname; 
      // if (status == "User") {
      //   openLoginModal(); // แสดง modal login อยู่หน้า dashboard
      //   document.getElementById('webSection').style.display = 'block'; 
      // }

      // if (status == "Approver1" || status === "Approver2" || status === "Approver3"  || status === "Approver4") {
      //   $("#menuAdmin").show();
      //   $("#menuUser").hide();
      //   $("#permision").show();
      //   $("#linkSetting").hide();
      //   $("#linkTable").hide();
      //   $("#linkAdd2").show();
      //   $("#linkmeTable").show();
      // }
      // if (status == "Admin") {
      //   // openLoginModal(); // แสดง modal login อยู่หน้า dashboard
      //   document.getElementById('webSection').style.display = 'block';
      //   document.getElementById("currentUser").innerText = fullname; 
      //   // $("#menuAdmin").show();
      //   // $("#menuUser").hide();
      //   // $("#permision").show();
      //   // $("#linkSetting").hide();
      //   // $("#linkTable").hide();
      //   // $("#linkmeTable").show();
      // }

      // if (status == "Superuser") {
      //   $("#menuAdmin").show();
      //   $("#menuUser").hide();
      //   $("#permision").show();
      //   $("#linkSetting").show();
      //   $("#linkmeTable").hide();        
      //   $("#linkpendTable").hide();        
      // }

      // $("#linkLogin").hide();
      // $("#pageLogin").hide();
      // $("#pageHome").show();
      // $("#showCalendar").show();
      // $("#logOut").show();
      // $("#formLogin")[0].reset();
      // $("#showFullname").show();
      // $("#fullname").html(fullname);
      // $("#status").html(status);
      // $("#photo").attr("src", data[5]).show();

        // openLoginModal(); // แสดง modal login อยู่หน้า dashboard
        // document.getElementById('webSection').style.display = 'block';
    }
    else{
        openLoginModal(); // แสดง modal login อยู่หน้า dashboard
        document.getElementById('webSection').style.display = 'block';
    }
});