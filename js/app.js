const TABS={list:['Danh sách hợp đồng',ModList],new:['Tạo hợp đồng',ModContract]};
function go(t,id){const v=document.getElementById('view');v.replaceWith(v.cloneNode(false));TABS[t][1].mount(document.getElementById('view'),id)}
function buildNav(){document.getElementById('nav').innerHTML=Object.entries(TABS).map(([k,v])=>`<button onclick="go('${k}')">${v[0]}</button>`).join('')}
async function start(){try{await ContractAPI.boot()}catch(e){document.getElementById('view').innerHTML='<p style="color:#c00">Không tải được dữ liệu: '+esc(e.message)+'</p><button onclick="start()">Thử lại</button>';return}
 buildNav();go('list')}
start();
