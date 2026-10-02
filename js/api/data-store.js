// Lớp lưu trữ duy nhất của app: chọn local hoặc KIO. Module nghiệp vụ chỉ gọi DataStore.load/save.
// Bản ghi là object thuần có `id` (KioStore.keyOf dùng id làm khóa nghiệp vụ).
window.DataStore=(function(){
 const lk=t=>'hopdong:store:'+t,keyOf=r=>String(r.id),known={},queue={};
 const unwrap=r=>r&&r.id!=null&&r.payload&&typeof r.payload==='object'&&Object.keys(r).length===2?r.payload:r; // định dạng localStorage cũ {id,payload}
 const local={async load(t){try{return JSON.parse(localStorage.getItem(lk(t))||'[]').map(unwrap)}catch(e){return[]}},
  async save(t,items){localStorage.setItem(lk(t),JSON.stringify(items))}};
 // KioStore.syncCollection chỉ thêm/thay, KHÔNG xóa. Nên xóa được xử lý ở đây, và CHỈ với các khóa
 // client này đã đọc/ghi trước đó rồi người dùng bỏ đi — không đụng record do máy khác mới thêm.
 const kio={async load(t){const items=await KioStore.listCollection(t,{force:true});known[t]=new Set(items.map(keyOf));return items},
  async save(t,items){const cur=new Set(items.map(keyOf)),gone=[...(known[t]||[])].filter(k=>!cur.has(k));
   await KioStore.syncCollection(t,items);if(gone.length)await KioStore.deleteKeys(t,gone);known[t]=cur}};
 const drv=()=>HD_CONFIG.driver==='kio'?kio:local;
 return{load:t=>drv().load(t),
  save(t,items){const snap=JSON.parse(JSON.stringify(items)),d=drv(); // chụp lúc gọi; ghi tuần tự theo bảng để các lần lưu không đè nhau
   const p=(queue[t]||Promise.resolve()).catch(()=>{}).then(()=>d.save(t,snap));queue[t]=p;return p}};
})();
