window.ModList=(function(){
 function mount(el){
  const rows=[...DB.contracts].sort((a,b)=>(b.updated||'').localeCompare(a.updated||''));
  el.innerHTML=`<div class="bar"><h3>Danh sách hợp đồng</h3><button onclick="go('new')">+ Tạo hợp đồng</button></div>
  <table><tr><th>Số</th><th>Bên A (khách hàng)</th><th>Phần mềm</th><th>Tổng giá trị</th><th></th></tr>
  ${rows.map(c=>`<tr><td>${esc(c.so)}</td><td>${esc(c.benA.name)}</td><td>${esc(c.sw)}</td><td class="num">${vnd(calc(c).total)}</td>
  <td><button data-a="edit" data-id="${c.id}">Sửa</button> <button data-a="dup" data-id="${c.id}">Nhân bản</button> <button data-a="del" data-id="${c.id}">Xóa</button></td></tr>`).join('')||'<tr><td colspan="5">Chưa có hợp đồng.</td></tr>'}</table>`;
  el.onclick=async e=>{const b=e.target.closest('button[data-a]');if(!b)return;const c=ContractAPI.get(b.dataset.id);
   if(b.dataset.a==='edit')go('new',c.id);
   if(b.dataset.a==='dup'){const n=JSON.parse(JSON.stringify(c));n.id=uid('hd');n.so+=' (bản sao)';await ContractAPI.upsert(n);mount(el)}
   if(b.dataset.a==='del'&&confirm('Xóa hợp đồng '+c.so+'?')){await ContractAPI.remove(c.id);mount(el)}}}
 return{mount}})();
