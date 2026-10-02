window.ContractAPI=(function(){
 const T=HD_CONFIG.tables,S=DataStore;
 // Các trường thông tin khách hàng (giống Bên A ở màn hình tạo hợp đồng) + ghi chú (chỉ có ở bảng khách hàng)
 const FIELDS=[['mstLabel','Nhãn mã số'],['mst','Mã số'],['addr','Địa chỉ'],['headLabel','Nhãn người ký'],['title','Danh xưng'],['head','Họ tên người ký'],['pos','Chức vụ'],['emailLabel','Nhãn email'],['email','Email']];
 const norm=s=>String(s??'').trim().replace(/\s+/g,' ').toLowerCase();
 const val=s=>String(s??'').trim();
 const pick=b=>{const o={};FIELDS.forEach(([k])=>o[k]=val(b[k]));return o};
 return{
  FIELDS,norm,
  async boot(){
   for(const n of['contracts','customers'])DB[n]=await S.load(T[n]);
   // Hợp đồng cũ chưa có customerId: liên kết theo tên đơn vị
   let dirty=false;
   DB.contracts.forEach(c=>{if(!c.customerId&&c.benA?.name){const k=this.findCustomer(c.benA.name);if(k){c.customerId=k.id;dirty=true}}});
   if(dirty)try{await this.saveContracts()}catch(e){}
  },
  saveContracts:()=>S.save(T.contracts,DB.contracts),
  saveCustomers:()=>S.save(T.customers,DB.customers),
  findCustomer:name=>DB.customers.find(k=>norm(k.name)===norm(name)&&norm(name)),
  contractsOf:k=>DB.contracts.filter(c=>c.customerId===k.id||(!c.customerId&&norm(c.benA?.name)===norm(k.name))),
  async upsert(c){c=JSON.parse(JSON.stringify(c));c.updated=new Date().toISOString();
   const i=DB.contracts.findIndex(x=>x.id===c.id);i<0?DB.contracts.push(c):DB.contracts[i]=c;
   await this.saveContracts()},
  // Lưu hợp đồng + đối chiếu khách hàng:
  //  - chưa có tên đơn vị -> thêm khách hàng mới
  //  - đã có và thông tin khác lần trước -> hỏi (confirmFn) có cập nhật bảng khách hàng không
  async saveWithCustomer(c,confirmFn){
   const b=c.benA,res={created:false,updated:false};let k=this.findCustomer(b.name);
   if(!k){k={id:uid('kh'),name:val(b.name),...pick(b),note:''};DB.customers.push(k);res.created=true}
   else{
    const d=FIELDS.filter(([f])=>val(k[f])!==val(b[f])).map(([f,label])=>({field:f,label,old:val(k[f]),now:val(b[f])}));
    if(d.length&&confirmFn(k,d)){Object.assign(k,pick(b));res.updated=true}
   }
   c.customerId=k.id;
   await this.upsert(c);
   if(res.created||res.updated)await this.saveCustomers();
   return res},
  async saveCustomer(k){k=JSON.parse(JSON.stringify(k));const i=DB.customers.findIndex(x=>x.id===k.id);i<0?DB.customers.push(k):DB.customers[i]=k;await this.saveCustomers()},
  async remove(id){DB.contracts=DB.contracts.filter(x=>x.id!==id);await this.saveContracts()},
  get:id=>DB.contracts.find(x=>x.id===id)};
})();
