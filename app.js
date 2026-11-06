// DATA SISWA
const siswaList = { "alfajri":1,"ainiya":2,"aji":3,"amira":4,"aurel":5,"bayu":6,"chanisa":7,"charisya":8,"daffa":9,"deidan":10,"dzaky":11,"farizt":12,"fellysita":13,"ivander":14,"jhonatan":15,"kayla":16,"kemal":17,"kiara":18,"lintang":19,"tegar":20,"ayoem":21,"rayhan m":22,"rifqi":23,"roman":24,"alfiara":25,"nazila":26,"neysha":27,"hamidah":28,"raihan w":29,"raisa":30,"rasya a":31,"rasya z":32,"reza":33,"septiana":34,"zaidan":35,"zilfanny":36 };

const jadwal = {
  "Senin": ["Ayoem","Kiara","Lintang","Septiana","Ainiya","Aji","Farizt","Daffa"],
  "Selasa": ["Aurel","Amira","Bayu","Chanisa","Alfajri","Reza","Zaidan"],
  "Rabu": ["Roman","Rifqi","Rasya Z","Dzaky","Kayla","Nazila","Neysha"],
  "Kamis": ["Ivander","Kemal","Charisya","Tegar","Raisa","Hamidah","Rayhan M"],
  "Jumat": ["Rasya A","Raihan W","Fellysita","Deidan","Zilfanny","Jhonatan","Alfiara"]
};

let currentUser = null, role = null, stream = null;

// LOGIN
function login(){
  const u = document.getElementById('username').value.trim().toLowerCase();
  const p = document.getElementById('password').value.trim();
  const msg = document.getElementById('loginMsg');
  
  if(u === 'aditya' && p === '242510677'){
    role='admin'; currentUser='Aditya';
  } else if(siswaList[u] && String(siswaList[u]) === p){
    role='siswa'; currentUser = Object.keys(siswaList).find(k=>k===u);
    currentUser = currentUser.charAt(0).toUpperCase()+currentUser.slice(1);
    if(currentUser.includes(' ')) currentUser = currentUser.split(' ').map(s=>s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
    // Sesuaikan nama asli
    if(u==='rayhan m') currentUser='Rayhan M';
    if(u==='raihan w') currentUser='Raihan W';
    if(u==='rasya a') currentUser='Rasya A';
    if(u==='rasya z') currentUser='Rasya Z';
  } else {
    msg.innerHTML = '<p style="color:red">Nama atau password salah!</p>'; return;
  }

  localStorage.setItem('piket_user', currentUser);
  localStorage.setItem('piket_role', role);
  
  Notification.requestPermission();
  masukApp();
}

function masukApp(){
  currentUser = localStorage.getItem('piket_user');
  role = localStorage.getItem('piket_role');
  if(!currentUser) return;

  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('mainPage').classList.add('active');
  document.getElementById('userInfo').innerText = `${currentUser} (${role})`;
  if(role==='admin'){
    document.getElementById('recapTabBtn').style.display='block';
    document.getElementById('adminInfoForm').style.display='block';
  }
  renderJadwal(); renderInfo(); renderRecap(); cekJam(); 
  setInterval(cekJam, 60000);
  cekPeringatanTidakPiket();
}

function logout(){ localStorage.clear(); location.reload(); }

// TABS
function showTab(id){
  document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
}

function renderJadwal(){
  const hariMap = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const hariSekarang = hariMap[new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta', weekday:'long'}) === 'Sunday' ? 0 : new Date().getDay()]; // fix
  const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
  const hariIniReal = hariMap[now.getDay()];
  
  let html = '<div class="jadwal-grid">';
  for(let h in jadwal){
    html += `<div class="jadwal-card ${h===hariIniReal?'hariIni':''}"><h4>${h} ${h===hariIniReal?'(Hari Ini)':''}</h4><ol>${jadwal[h].map(n=>`<li>${n}</li>`).join('')}</ol></div>`;
  }
  html+='</div>';
  document.getElementById('jadwal').innerHTML = html;
  document.getElementById('hariIni').innerText = hariIniReal;
}

// CEK JAM WIB 14:20 - 15:45
function cekJam(){
  const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
  const jam = now.getHours() + now.getMinutes()/60;
  const day = now.getDay(); // 0 minggu, 1 senin
  const jamStr = now.toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta'});
  document.getElementById('jamInfo').innerText = `Jam WIB Sekarang: ${jamStr} | Hari: ${["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"][day]}`;
  
  const boleh = (day>=1 && day<=5) && (jam >= 14 + 20/60 && jam <= 15 + 45/60);
  // UNTUK TESTING, UBAH JADI true JIKA INGIN BYPASS JAM
  const bypass = false; // ganti true untuk coba kapan saja
  
  const btnK = document.getElementById('btnKamera');
  const status = document.getElementById('absenStatus');
  
  if(!boleh && !bypass){
    btnK.disabled = true;
    status.innerText = 'Absensi hanya dibuka jam 14:20 - 15:45 WIB Senin-Jumat';
    status.style.color = 'red';
  } else {
    btnK.disabled = false;
    status.innerText = 'Silahkan absen piket hari ini';
    status.style.color = 'green';
  }
  return boleh || bypass;
}

// KAMERA & UPLOAD
async function startCamera(){
  if(!cekJam()) return alert('Di luar jam absensi!');
  try{
    stream = await navigator.mediaDevices.getUserMedia({video:true});
    document.getElementById('video').srcObject = stream;
    document.getElementById('btnKamera').style.display='none';
    document.getElementById('btnFoto').style.display='block';
  }catch(e){ alert('Kamera tidak bisa diakses: '+e.message); }
}

function takePhoto(){
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video,0,0);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  
  document.getElementById('preview').src = dataUrl;
  document.getElementById('preview').style.display='block';
  stream.getTracks().forEach(t=>t.stop());

  // SIMPAN KE RECAP
  const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
  const hariMap = ["Minggu","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
  const data = {
    nama: currentUser,
    hari: hariMap[now.getDay()],
    tanggal: now.toLocaleDateString('id-ID'),
    jam: now.toLocaleTimeString('id-ID'),
    foto: dataUrl
  };
  
  let recap = JSON.parse(localStorage.getItem('piket_recap')||'[]');
  // cek sudah absen hari ini
  if(recap.find(r=>r.nama===currentUser && r.tanggal===data.tanggal)){
    document.getElementById('absenStatus').innerText = 'Kamu sudah absen hari ini!';
    return;
  }
  recap.push(data);
  localStorage.setItem('piket_recap', JSON.stringify(recap));
  
  document.getElementById('absenStatus').innerText = `Berhasil absen! Terima kasih ${currentUser}`;
  renderRecap();
}

// RECAP ADMIN
function renderRecap(){
  let recap = JSON.parse(localStorage.getItem('piket_recap')||'[]');
  const tbody = document.querySelector('#recapTable tbody');
  tbody.innerHTML = recap.map(r=>`<tr><td><img src="${r.foto}" class="thumb"></td><td>${r.nama}</td><td>${r.hari}</td><td>${r.tanggal}</td><td>${r.jam}</td></tr>`).join('');
}

function exportExcel(){
  const recap = JSON.parse(localStorage.getItem('piket_recap')||'[]');
  if(recap.length===0) return alert('Belum ada data');
  const dataForExcel = recap.map(r=>({Nama:r.nama, Hari:r.hari, Tanggal:r.tanggal, Jam:r.jam, Foto:'(Lihat di Aplikasi)'}));
  const ws = XLSX.utils.json_to_sheet(dataForExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Recap Piket");
  XLSX.writeFile(wb, `Recap_PiketIn_${new Date().toLocaleDateString('id-ID')}.xlsx`);
}

function hapusRecap(){ if(confirm('Hapus semua data recap?')){ localStorage.removeItem('piket_recap'); renderRecap(); }}

// INFORMASI & NOTIFIKASI
function kirimInfo(){
  const text = document.getElementById('infoText').value;
  if(!text) return;
  let infos = JSON.parse(localStorage.getItem('piket_info')||'[]');
  infos.unshift({text, tgl: new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}), pengirim: currentUser});
  localStorage.setItem('piket_info', JSON.stringify(infos));
  document.getElementById('infoText').value='';
  renderInfo();
  
  // Kirim Notifikasi Browser
  if(Notification.permission==='granted'){
    new Notification('PiketIn - Info Baru!', {body: text, icon: 'https://cdn-icons-png.flaticon.com/512/1946/1946429.png'});
  }
}

function renderInfo(){
  let infos = JSON.parse(localStorage.getItem('piket_info')||'[]');
  document.getElementById('infoList').innerHTML = infos.map(i=>`<div class="jadwal-card"><small>${i.tgl} - ${i.pengirim}</small><p>${i.text}</p></div>`).join('') || '<p>Belum ada informasi</p>';
  document.getElementById('notifBadge').innerText = infos.length ? infos.length : '';
}

function cekPeringatanTidakPiket(){
  if(role!=='siswa') return;
  const now = new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Jakarta'}));
  if(now.getDay()>=1 && now.getDay()<=5 && now.getHours()>=16){
    let recap = JSON.parse(localStorage.getItem('piket_recap')||'[]');
    const todayStr = now.toLocaleDateString('id-ID');
    const sudah = recap.find(r=>r.nama===currentUser && r.tanggal===todayStr);
    if(!sudah){
      alert(`⚠️ PERINGATAN: ${currentUser}, kamu belum absen piket hari ini! Segera lapor ke admin.`);
      if(Notification.permission==='granted'){
        new Notification('PiketIn - Kamu Belum Piket!', {body: 'Kamu belum melakukan absensi piket hari ini!'});
      }
    }
  }
}

// AUTO LOGIN
window.onload = ()=>{ if(localStorage.getItem('piket_user')) masukApp(); };