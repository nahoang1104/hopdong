window.ModCustomer=(function(){
 let el;
 const F=[['name','Tên đơn vị','w2'],['mstLabel','Nhãn mã số'],['mst','Mã số'],['addr','Địa chỉ','w2'],['headLabel','Nhãn người ký'],['title','Danh xưng'],['head','Họ tên người ký'],['pos','Chức vụ'],['emailLabel','Nhãn email'],['email','Email'],['note','Ghi chú','w2']];
 const blank=()=>({id:uid('kh'),name:'',mstLabel:'Mã số thuế',mst:'',addr:'',headLabel:'Người đại diện',title:'',head:'',pos:'',emailLabel:'',email:'',note:''});
 const fdt=s=>s?new Date(s).toLocaleString('vi-VN'):'';
 const closeModal=()=>document.getElementById('cmodal')?.remove();

 function mount(el_){
  el=el_;
  const rows=[...DB.customers].sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  el.innerHTML=`<div class="bar"><h3>Quản lý khách hàng</h3><button data-a="add">+ Thêm khách hàng</button></div>
  <table><tr><th>Tên đơn vị</th><th>Số hợp đồng</th><th>Email</th><th></th></tr>
  ${rows.map(k=>`<tr><td>${esc(k.name)}</td><td class="num">${ContractAPI.contractsOf(k).length}</td><td>${esc(k.email)}</td>
  <td><button data-a="view" data-id="${k.id}">Xem chi tiết</button></td></tr>`).join('')||'<tr><td colspan="4">Chưa có khách hàng.</td></tr>'}</table>`;
  el.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b)return;
   if(b.dataset.a==='add')openModal(null);
   if(b.dataset.a==='view')openModal(b.dataset.id)};
 }

 function openModal(id){
  closeModal();
  const old=id?DB.customers.find(x=>x.id===id):null,k=old?{...old}:blank(),cons=old?ContractAPI.contractsOf(old).sort((a,b)=>(b.updated||'').localeCompare(a.updated||'')):[];
  const ov=document.createElement('div');ov.id='cmodal';ov.className='cm-overlay';
  ov.innerHTML=`<div class="cm-box"><div class="cm-head"><b>${old?'Chi tiết khách hàng':'Thêm khách hàng'}</b><button data-x>✕</button></div>
  <div class="cm-body"><div class="g">${F.map(([f,l,w])=>`<label class="f ${w||''}">${l}${f==='note'?`<textarea data-f="${f}" rows="3">${esc(k[f])}</textarea>`:`<input data-f="${f}" value="${esc(k[f])}">`}</label>`).join('')}</div>
  <div id="cmMsg" class="warn"></div>
  ${old?`<h4>Hợp đồng của khách (${cons.length})</h4><table><tr><th>Tên phần mềm</th><th>Sửa lần cuối</th><th></th></tr>
   ${cons.map(c=>`<tr><td>${esc(c.sw)}</td><td>${esc(fdt(c.updated))}</td><td><button data-edit="${c.id}">Sửa</button></td></tr>`).join('')||'<tr><td colspan="3">Chưa có hợp đồng.</td></tr>'}</table>`:''}</div>
  <div class="cm-foot"><button data-x>Đóng</button><button data-save>${old?'Lưu thay đổi':'Thêm khách hàng'}</button></div></div>`;
  document.body.appendChild(ov);
  ov.onclick=async e=>{const t=e.target;
   if(t===ov||t.closest('[data-x]'))return closeModal();
   const ed=t.closest('[data-edit]');if(ed){closeModal();return go('new',ed.dataset.edit)}
   if(t.closest('[data-save]')){
    const v={};ov.querySelectorAll('[data-f]').forEach(i=>v[i.dataset.f]=i.value.trim());
    const err=m=>ov.querySelector('#cmMsg').textContent=m;
    if(!v.name)return err('Cần nhập tên đơn vị.');
    const dup=ContractAPI.findCustomer(v.name);if(dup&&dup.id!==k.id)return err('Tên đơn vị này đã có trong hệ thống.');
    try{await ContractAPI.saveCustomer({...k,...v});closeModal();mount(el)}catch(x){err(x.message)}}};
 }
 return{mount}})();
