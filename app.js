const DB_KEY='tgb_followup_db_v1';
const defaultTemplates=[{id:'tpl1',name:'After Service - Umum',text:'Selamat pagi/siang Bapak/Ibu {customer}. Kami dari Agung Toyota ingin melakukan follow up setelah servis kendaraan {model} dengan no. polisi {plat}. Bagaimana kondisi kendaraan setelah servis? Apakah ada hal yang perlu kami bantu? Terima kasih.'},{id:'tpl2',name:'Reminder Booking',text:'Selamat pagi/siang Bapak/Ibu {customer}. Kami ingin membantu menjadwalkan kunjungan berikutnya untuk kendaraan {plat}. Jika berkenan, kami dapat bantu booking servis. Silakan informasikan tanggal yang diinginkan. Terima kasih.'}];
let db=loadDB(); let selectedWorkbook=null; let selectedFile=null; let charts={};
function loadDB(){try{return JSON.parse(localStorage.getItem(DB_KEY))||{records:[],batches:[],templates:defaultTemplates}}catch{return{records:[],batches:[],templates:defaultTemplates}}}
function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(db));renderAll()}
function uid(p='id'){return p+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function clean(v){return v==null?'':String(v).trim()}
function phone(v){let s=clean(v).replace(/[^0-9]/g,'');if(s.startsWith('0'))s='62'+s.slice(1);if(s && !s.startsWith('62'))s='62'+s;return s}
function get(row,names){for(const n of names){if(row[n]!=null&&clean(row[n])!=='')return row[n]}return ''}
function normalize(row,batchId){return{id:uid('rec'),batchId,sourceData:{...row},plate:clean(get(row,['POLICE_NO','PLAT','PLAT_NO','NOPOL'])),customer:clean(get(row,['CUSTOMER','CUSTOMER_NAME','NAMA'])),model:clean(get(row,['MODEL','VEHICLE_MODEL'])),vin:clean(get(row,['VIN','RANGKA','NO_RANGKA'])),so:clean(get(row,['SERVICE_ORDER','SERVICE_ORDER_2','NO_ORDER'])),sa:clean(get(row,['SERVICE_ADVISOR','SA_SHEET2','SA'])),mobile:phone(get(row,['wa_cp','HANDPHONE','TELEPHONE_CP','TELEPHONE'])),serviceDate:clean(get(row,['Tgl_Invoice','TGL_MASUK','Arrival_Date'])),battery:clean(get(row,['BATTERY_CHECK'])),followedAt:'',result:'',reason:'',booking:false,bookingDate:'',bookingTime:''}}
function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function navigate(id){
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id===id));
 document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
 if(id==='dashboard')renderDashboard();
 if(id==='download'){
   db=loadDB();
   renderDownload();
 }
}
document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
document.getElementById('menuToggle').onclick=()=>document.getElementById('sidebar').classList.toggle('open');
function renderAll(){renderFollow();renderBatches();renderTemplates();renderDashboard();renderSAFilter();renderDownload()}
function renderDashboard(){
 const total=db.records.length;
 const followed=db.records.filter(r=>r.followedAt).length;
 const booking=db.records.filter(r=>r.booking).length;
 const success=db.records.filter(r=>r.followedAt&&(r.result==='Berhasil dihubungi'||r.result==='Booking'||r.booking)).length;
 const pending=Math.max(total-followed,0);
 set('kpiTotal',total);set('kpiFollowed',followed);set('kpiSuccess',success);set('kpiBooking',booking);set('kpiPending',pending);
 set('kpiFollowRate',pct(followed,total));set('kpiSuccessRate',pct(success,followed));set('kpiBookingRate',pct(booking,followed));
 makeStatusChart(followed,pending);
 makeResultChart();
 makeSAChart();
}
function pct(a,b){return b?Math.round(a/b*100)+'%':'0%'}
function set(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function makeStatusChart(followed,pending){
 const total=followed+pending;
 const fuPct=total?Math.round(followed/total*100):0;
 const el=document.getElementById('statusVisual');
 if(el)el.innerHTML=`<div class="css-donut" style="--fu:${fuPct}deg"><div class="donut-hole"><strong>${fuPct}%</strong><span>Sudah FU</span></div></div>`;
 const summary=document.getElementById('statusSummary');
 if(summary)summary.innerHTML=`<span><i class="dot-blue"></i><b>${followed}</b> Sudah FU</span><span><i class="dot-orange"></i><b>${pending}</b> Belum FU</span>`;
}
function makeResultChart(){
 const followed=db.records.filter(r=>r.followedAt);
 const resultMap={}; followed.forEach(r=>{const k=r.booking?'Booking':(r.result||'Tanpa hasil');resultMap[k]=(resultMap[k]||0)+1});
 const rows=Object.entries(resultMap).sort((a,b)=>b[1]-a[1]);
 const empty=document.getElementById('resultEmpty'),el=document.getElementById('resultVisual');
 if(!rows.length){if(empty)empty.classList.remove('hidden');if(el)el.innerHTML='';return}else if(empty)empty.classList.add('hidden');
 const max=Math.max(...rows.map(x=>x[1]),1);
 if(el)el.innerHTML=rows.map(([label,val])=>`<div class="result-row"><div class="result-label"><span>${esc(label)}</span><b>${val}</b></div><div class="result-track"><div class="result-fill" style="width:${Math.max(8,Math.round(val/max*100))}%"></div></div></div>`).join('');
}
function makeSAChart(){
 const sa={}; db.records.forEach(r=>{const k=r.sa||'Tanpa SA';if(!sa[k])sa[k]={total:0,follow:0,success:0,book:0};sa[k].total++;if(r.followedAt)sa[k].follow++;if(r.followedAt&&(r.result==='Berhasil dihubungi'||r.result==='Booking'||r.booking))sa[k].success++;if(r.booking)sa[k].book++});
 const el=document.getElementById('saVisual'); const rows=Object.entries(sa).sort((a,b)=>b[1].total-a[1].total);
 if(!rows.length){if(el)el.innerHTML='<div class="chart-empty">Belum ada data SA.</div>';return}
 if(el)el.innerHTML=`<div class="sa-head"><span>SA</span><span>Total</span><span>Sudah FU</span><span>Berhasil</span><span>Booking</span><span>FU %</span></div>`+rows.map(([name,v])=>{const rate=v.total?Math.round(v.follow/v.total*100):0;return `<div class="sa-row"><strong>${esc(name)}</strong><span>${v.total}</span><span>${v.follow}</span><span>${v.success}</span><span>${v.book}</span><span><b>${rate}%</b><i class="sa-meter"><em style="width:${rate}%"></em></i></span></div>`}).join('');
}
function filteredRecords(){const q=document.getElementById('searchInput').value.toLowerCase(),st=document.getElementById('statusFilter').value,sa=document.getElementById('saFilter').value;return db.records.filter(r=>{const text=[r.plate,r.customer,r.vin,r.so,r.model].join(' ').toLowerCase();const okQ=!q||text.includes(q);const okSt=st==='all'||(st==='pending'&&!r.followedAt)||(st==='followed'&&r.followedAt)||(st==='booking'&&r.booking);const okSa=sa==='all'||r.sa===sa;return okQ&&okSt&&okSa})}
function renderFollow(){const tbody=document.getElementById('followTableBody');const rows=filteredRecords();tbody.innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${esc(r.plate||'-')}</strong></td><td>${esc(r.customer||'-')}</td><td>${esc(r.model||'-')}</td><td>${esc(r.sa||'-')}</td><td>${esc(r.mobile||'-')}</td><td>${r.booking?'<span class="badge booking">Booking</span>':r.followedAt&&r.result==='Berhasil dihubungi'?'<span class="badge success">Berhasil</span>':r.followedAt?'<span class="badge done">Sudah FU</span>':'<span class="badge pending">Belum FU</span>'}</td><td>${esc(r.result||r.reason||'-')}</td><td>${r.booking?esc((r.bookingDate||'')+' '+(r.bookingTime||'')):'-'}</td><td><button class="mini-btn" onclick="openFollow('${r.id}')">Follow Up</button></td></tr>`).join(''):`<tr><td colspan="9" style="text-align:center;padding:30px;color:#64748b">Belum ada data sesuai filter.</td></tr>`}
['searchInput','statusFilter','saFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='searchInput'?'input':'change',renderFollow));
function renderSAFilter(){const el=document.getElementById('saFilter'),cur=el.value;const vals=[...new Set(db.records.map(r=>r.sa).filter(Boolean))].sort();el.innerHTML='<option value="all">Semua SA</option>'+vals.map(v=>`<option>${esc(v)}</option>`).join('');el.value=vals.includes(cur)?cur:'all'}
window.openFollow=function(id){const r=db.records.find(x=>x.id===id);if(!r)return;set('dlgCustomer',r.customer||'Customer');set('dlgVehicle',[r.plate,r.model,r.sa&&'SA '+r.sa].filter(Boolean).join(' • '));document.getElementById('dlgRecordId').value=r.id;document.getElementById('dlgResult').value=r.result||'';setReasonFields(r.reason||'');document.getElementById('dlgBooking').checked=!!r.booking||r.result==='Booking';document.getElementById('dlgBookingDate').value=r.bookingDate||'';document.getElementById('dlgBookingTime').value=r.bookingTime||'';fillDlgTemplates();toggleBooking();refreshMessage();document.getElementById('followDialog').showModal()}
function fillDlgTemplates(){const s=document.getElementById('dlgTemplate');s.innerHTML=db.templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}
function refreshMessage(){const r=db.records.find(x=>x.id===document.getElementById('dlgRecordId').value),t=db.templates.find(x=>x.id===document.getElementById('dlgTemplate').value);if(!r||!t)return;document.getElementById('dlgMessage').value=t.text.replaceAll('{customer}',r.customer||'Bapak/Ibu').replaceAll('{plat}',r.plate||'-').replaceAll('{model}',r.model||'-').replaceAll('{sa}',r.sa||'-').replaceAll('{tanggal_servis}',r.serviceDate||'-')}
document.getElementById('dlgTemplate').onchange=refreshMessage;
document.getElementById('dlgBooking').onchange=toggleBooking;
document.getElementById('dlgResult').onchange=()=>{if(document.getElementById('dlgResult').value==='Booking')document.getElementById('dlgBooking').checked=true;toggleBooking()};
document.getElementById('dlgReasonQuick').onchange=toggleReasonOther;
const quickReasons=['Kendaraan baik / tidak ada keluhan','Ada keluhan setelah servis','Customer minta dihubungi kembali','Tidak diangkat','Tidak dibalas','Nomor tidak aktif','WA centang satu','Sudah service di dealer lain','Belum waktunya servis','Customer menolak'];
function setReasonFields(reason){const q=document.getElementById('dlgReasonQuick'),other=document.getElementById('dlgReason');if(!reason){q.value='';other.value=''}else if(quickReasons.includes(reason)){q.value=reason;other.value=''}else{q.value='Lainnya';other.value=reason}toggleReasonOther()}
function toggleReasonOther(){document.getElementById('dlgReasonOtherWrap').classList.toggle('hidden',document.getElementById('dlgReasonQuick').value!=='Lainnya')}
function toggleBooking(){const isBooking=document.getElementById('dlgBooking').checked||document.getElementById('dlgResult').value==='Booking';if(document.getElementById('dlgResult').value==='Booking')document.getElementById('dlgBooking').checked=true;document.getElementById('bookingFields').classList.toggle('hidden',!isBooking)}
document.getElementById('openWaBtn').onclick=()=>{const r=db.records.find(x=>x.id===document.getElementById('dlgRecordId').value);if(!r?.mobile)return alert('Nomor WhatsApp tidak tersedia.');const msg=encodeURIComponent(document.getElementById('dlgMessage').value);window.open(`https://wa.me/${r.mobile}?text=${msg}`,'_blank')}
document.getElementById('saveFollowBtn').onclick=()=>{const r=db.records.find(x=>x.id===document.getElementById('dlgRecordId').value);if(!r)return;const result=document.getElementById('dlgResult').value;if(!result)return alert('Pilih status hasil follow up terlebih dahulu.');const booking=document.getElementById('dlgBooking').checked||result==='Booking';const bookingDate=document.getElementById('dlgBookingDate').value,bookingTime=document.getElementById('dlgBookingTime').value;if(booking&&(!bookingDate||!bookingTime))return alert('Untuk booking, tanggal dan jam booking wajib diisi.');const quick=document.getElementById('dlgReasonQuick').value;const other=document.getElementById('dlgReason').value.trim();r.followedAt=new Date().toISOString();r.result=result;r.reason=quick==='Lainnya'?other:(quick||other);r.booking=booking;r.bookingDate=booking?bookingDate:'';r.bookingTime=booking?bookingTime:'';saveDB();document.getElementById('followDialog').close()}
const fileInput=document.getElementById('excelFile');
fileInput.onchange=async()=>{selectedFile=fileInput.files[0];if(!selectedFile)return;const buf=await selectedFile.arrayBuffer();selectedWorkbook=XLSX.read(buf,{type:'array',cellDates:true});const ws=selectedWorkbook.Sheets[selectedWorkbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''});document.getElementById('fileInfo').textContent=`${selectedFile.name} • Sheet: ${selectedWorkbook.SheetNames[0]} • ${rows.length} baris`;document.getElementById('importBtn').disabled=false}
document.getElementById('importBtn').onclick=()=>{if(!selectedWorkbook)return;const ws=selectedWorkbook.Sheets[selectedWorkbook.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''});const batchId=uid('batch');const batch={id:batchId,name:selectedFile.name,uploadedAt:new Date().toISOString(),count:rows.length};const records=rows.map(r=>normalize(r,batchId)).filter(r=>r.plate||r.customer||r.vin||r.so);if(document.getElementById('importMode').value==='replace'){db.records=[];db.batches=[]}db.batches.unshift({...batch,count:records.length});db.records.push(...records);selectedWorkbook=null;selectedFile=null;fileInput.value='';document.getElementById('fileInfo').textContent=`Import berhasil: ${records.length} data.`;document.getElementById('importBtn').disabled=true;saveDB()}
function renderBatches(){const el=document.getElementById('batchList');el.innerHTML=db.batches.length?db.batches.map(b=>`<div class="batch-item"><div><strong>${esc(b.name)}</strong><small>${new Date(b.uploadedAt).toLocaleString('id-ID')} • ${b.count} data</small></div><button class="danger" onclick="deleteBatch('${b.id}')">Hapus Batch</button></div>`).join(''):'<div class="hint">Belum ada riwayat upload.</div>'}
window.deleteBatch=function(id){const b=db.batches.find(x=>x.id===id);if(!confirm(`Hapus batch ${b?.name||''} beserta data follow up-nya?`))return;db.records=db.records.filter(r=>r.batchId!==id);db.batches=db.batches.filter(x=>x.id!==id);saveDB()}
function renderTemplates(){const el=document.getElementById('templateList');el.innerHTML=db.templates.map(t=>`<div class="template-item"><div><strong>${esc(t.name)}</strong><div class="txt">${esc(t.text)}</div></div><div><button class="mini-btn" onclick="editTemplate('${t.id}')">Edit</button> <button class="danger" onclick="deleteTemplate('${t.id}')">Hapus</button></div></div>`).join('')}
window.editTemplate=function(id){const t=db.templates.find(x=>x.id===id);if(!t)return;document.getElementById('templateName').value=t.name;document.getElementById('templateText').value=t.text;document.getElementById('editingTemplateId').value=t.id}
window.deleteTemplate=function(id){if(db.templates.length<=1)return alert('Minimal satu template harus tersedia.');if(confirm('Hapus template ini?')){db.templates=db.templates.filter(t=>t.id!==id);saveDB()}}
document.getElementById('cancelTemplateBtn').onclick=clearTemplateForm;
function clearTemplateForm(){document.getElementById('templateName').value='';document.getElementById('templateText').value='';document.getElementById('editingTemplateId').value=''}
document.getElementById('saveTemplateBtn').onclick=()=>{const name=document.getElementById('templateName').value.trim(),text=document.getElementById('templateText').value.trim(),id=document.getElementById('editingTemplateId').value;if(!name||!text)return alert('Nama dan isi template wajib diisi.');if(id){const t=db.templates.find(x=>x.id===id);t.name=name;t.text=text}else db.templates.push({id:uid('tpl'),name,text});clearTemplateForm();saveDB()}

/* ===== DOWNLOAD SEMUA DATA EXCEL ===== */
function renderDownload(){
 // Selalu baca ulang DB yang sama persis dengan menu Follow Up.
 db=loadDB();
 const records=Array.isArray(db?.records)?db.records:[];
 const total=records.length;
 const followed=records.filter(r=>!!r.followedAt).length;
 const pending=Math.max(total-followed,0);
 set('dlTotal',total);
 set('dlFollowed',followed);
 set('dlPending',pending);
 const btn=document.getElementById('downloadAllBtn');
 if(btn)btn.disabled=!total;
 const info=document.getElementById('downloadInfo');
 if(info){
   info.textContent=total
     ? `Siap download ${total} data: ${followed} sudah follow up dan ${pending} belum follow up.`
     : 'Belum ada data yang terbaca. Buka menu Follow Up lalu kembali ke Download Excel.';
 }
}
function formatFollowDate(value){
 if(!value)return '';
 const d=new Date(value);
 if(Number.isNaN(d.getTime()))return value;
 const pad=n=>String(n).padStart(2,'0');
 return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function exportBaseRow(r){
 if(r.sourceData && typeof r.sourceData==='object' && Object.keys(r.sourceData).length)return {...r.sourceData};
 return {
   POLICE_NO:r.plate||'',
   CUSTOMER:r.customer||'',
   MODEL:r.model||'',
   VIN:r.vin||'',
   SERVICE_ORDER:r.so||'',
   SERVICE_ADVISOR:r.sa||'',
   HANDPHONE:r.mobile||'',
   Tgl_Invoice:r.serviceDate||'',
   BATTERY_CHECK:r.battery||''
 };
}
function buildExportRow(r){
 const base=exportBaseRow(r);
 return {
   ...base,
   STATUS_FOLLOW_UP:r.followedAt?'SUDAH FOLLOW UP':'BELUM FOLLOW UP',
   HASIL_FOLLOW_UP:r.followedAt?(r.result||''):'',
   REASON_FOLLOW_UP:r.followedAt?(r.reason||''):'',
   TANGGAL_FOLLOW_UP:r.followedAt?formatFollowDate(r.followedAt):'',
   BOOKING:r.booking?'YA':'TIDAK',
   TANGGAL_BOOKING:r.booking?(r.bookingDate||''):'',
   JAM_BOOKING:r.booking?(r.bookingTime||''):''
 };
}
document.getElementById('downloadAllBtn').onclick=()=>{
 db=loadDB();
 const records=Array.isArray(db?.records)?db.records:[];
 if(!records.length)return alert('Belum ada data untuk di-download.');
 try{
   const rows=records.map(buildExportRow);
   const ws=XLSX.utils.json_to_sheet(rows);
   const range=XLSX.utils.decode_range(ws['!ref']);
   ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:range.e.r,c:range.e.c}})};
   const headers=Object.keys(rows[0]||{});
   ws['!cols']=headers.map(h=>({wch:Math.min(Math.max(h.length+2,14),38)}));
   const wb=XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(wb,ws,'HASIL FOLLOW UP');
   const now=new Date();
   const pad=n=>String(n).padStart(2,'0');
   const filename=`HASIL_FOLLOW_UP_TGB_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}.xlsx`;
   XLSX.writeFile(wb,filename);
   document.getElementById('downloadInfo').textContent=`Download berhasil: ${rows.length} data (${records.filter(r=>r.followedAt).length} sudah FU, ${records.filter(r=>!r.followedAt).length} belum FU).`;
 }catch(err){
   console.error(err);
   alert('Gagal membuat file Excel. Silakan coba lagi.');
 }
};

// Sinkronisasi tambahan: berguna bila browser menahan halaman/cache lama.
window.addEventListener('pageshow',()=>{db=loadDB();renderAll();});
window.addEventListener('storage',(e)=>{if(e.key===DB_KEY){db=loadDB();renderAll();}});

renderAll();
