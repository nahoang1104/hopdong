window.ContractAPI=(function(){
 const T=HD_CONFIG.tables,S=DataStore;
 return{
  async boot(){for(const n of['contracts','customers'])DB[n]=await S.load(T[n])},
  saveContracts:()=>S.save(T.contracts,DB.contracts),
  saveCustomers:()=>S.save(T.customers,DB.customers),
  async upsert(c){c=JSON.parse(JSON.stringify(c));c.updated=new Date().toISOString();
   const i=DB.contracts.findIndex(x=>x.id===c.id);i<0?DB.contracts.push(c):DB.contracts[i]=c;
   const b=c.benA;if(b.name){const k=DB.customers.findIndex(x=>x.name===b.name);const r={...b,id:k<0?uid('kh'):DB.customers[k].id};k<0?DB.customers.push(r):DB.customers[k]=r}
   await Promise.all([this.saveContracts(),this.saveCustomers()])},
  async remove(id){DB.contracts=DB.contracts.filter(x=>x.id!==id);await this.saveContracts()},
  get:id=>DB.contracts.find(x=>x.id===id)};
})();
