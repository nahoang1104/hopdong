window.ModContract=(function(){
 let el,c,tm;
 let lastAutoSoftwareName='';
 let lastAutoSo='';   // số hợp đồng đang là giá trị tự sinh (MM/YYYY/HĐPM--QT) thì tự cập nhật khi đổi tháng/năm

 const now=new Date();
 const currentDay=String(now.getDate()).padStart(2,'0');
 const currentMonth=String(now.getMonth()+1).padStart(2,'0');
 const currentYear=String(now.getFullYear());

 const get=(o,p)=>p.split('.').reduce((a,k)=>a?.[k],o);
 const set=(o,p,v)=>{
  const ks=p.split('.'),l=ks.pop();
  ks.reduce((a,k)=>a[k],o)[l]=v;
 };

 const MONEY=['cost','amt'];

 /*
  * =========================
  *  HỖ TRỢ NỘI DUNG RICH TEXT
  * =========================
  */

 // Kiểm tra chuỗi có phải HTML đã được lưu từ trình soạn thảo hay không.
 const hasHtml=s=>isRich(s);

 // Chuyển nội dung đang lưu thành HTML để đưa vào contenteditable.
 const toEditorHtml=s=>{
  s=cleanLines(s);
  if(!s)return '';
  if(isRich(s))return s.replace(/\r?\n/g,'<br>');
  return esc(s).replace(/\r?\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
 };

 // Chuyển HTML về text để hiển thị lại trong textarea.
 const htmlToText=s=>{
  const box=document.createElement('div');
  box.innerHTML=String(s??'');
  return box.innerText||box.textContent||'';
 };

 // Chuyển DOM của trình soạn thảo (hoặc nội dung dán vào) thành HTML sạch: chỉ strong/em/u/br.
 // Mỗi khối (div/p/li...) thành một dòng; không còn thẻ <li style=...> hay <div>.
 const BLOCK=new Set(['DIV','P','LI','UL','OL','H1','H2','H3','H4','H5','H6','TR','TABLE','BLOCKQUOTE','SECTION','ARTICLE']);
 function editorToHtml(root){
  const wrap=(t,f)=>{if(!t)return '';if(f.u)t='<u>'+t+'</u>';if(f.i)t='<em>'+t+'</em>';if(f.b)t='<strong>'+t+'</strong>';return t};
  const walk=(n,fmt)=>{
   let out='';
   n.childNodes.forEach(ch=>{
    if(ch.nodeType===3){
     let t=ch.nodeValue.replace(/\u00a0/g,' ');
     if(/^\s*$/.test(t)&&/\n/.test(t))return;
     out+=wrap(esc(t.replace(/\s*\n\s*/g,' ')),fmt);
     return;
    }
    if(ch.nodeType!==1)return;
    const tag=ch.tagName,st=ch.style||{};
    if(tag==='BR'){out+='<br>';return}
    if(tag==='SCRIPT'||tag==='STYLE')return;
    const f={
     b:fmt.b||tag==='STRONG'||tag==='B'||/^(bold|[6-9]00)$/.test(st.fontWeight),
     i:fmt.i||tag==='EM'||tag==='I'||st.fontStyle==='italic',
     u:fmt.u||tag==='U'||/underline/.test(st.textDecoration||st.textDecorationLine||'')
    };
    const inner=walk(ch,f);
    // khối (div/p/li...) luôn nằm trên dòng riêng: thêm ngắt dòng TRƯỚC nếu phía trước đã có chữ
    if(BLOCK.has(tag)&&inner&&out&&!/<br>$/.test(out))out+='<br>';
    out+=inner;
    if(BLOCK.has(tag)&&inner&&!/<br>$/.test(inner))out+='<br>';
   });
   return out;
  };
  return walk(root,{}).replace(/(<br>){2,}/g,'<br>').replace(/^(<br>)+|(<br>)+$/g,'');   // bỏ dòng trống thừa (không tạo khoảng cách lạ)
 }

 let editorTarget=null;

 function editorCss(){
  return `
  <style id="contract-editor-css">
   .ce-overlay{
    position:fixed;
    inset:0;
    z-index:99999;
    background:rgba(0,0,0,.45);
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
   }

   .ce-modal{
    width:min(1100px,96vw);
    height:min(760px,92vh);
    background:#fff;
    border-radius:10px;
    box-shadow:0 20px 60px rgba(0,0,0,.35);
    display:flex;
    flex-direction:column;
    overflow:hidden;
   }

   .ce-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    padding:10px 14px;
    border-bottom:1px solid #ccc;
    background:#f5f6f8;
   }

   .ce-title{
    font-weight:700;
    color:#1f6f5c;
   }

   .ce-toolbar{
    display:flex;
    gap:5px;
    align-items:center;
    padding:8px 10px;
    border-bottom:1px solid #ddd;
    background:#fafafa;
   }

   .ce-toolbar button{
    min-width:38px;
    height:34px;
    padding:4px 10px;
    border:1px solid #bbb;
    border-radius:5px;
    background:#fff;
    cursor:pointer;
    font:inherit;
   }

   .ce-toolbar button:hover{
    background:#eef5f2;
   }

   .ce-toolbar .ce-bold{
    font-weight:700;
   }

   .ce-toolbar .ce-italic{
    font-style:italic;
   }

   .ce-toolbar .ce-underline{
    text-decoration:underline;
   }

   .ce-body{
    flex:1;
    min-height:0;
    padding:12px;
    background:#eee;
   }

   .ce-editor{
    width:100%;
    height:100%;
    box-sizing:border-box;
    overflow:auto;
    padding:16px;
    background:#fff;
    border:1px solid #bbb;
    border-radius:5px;
    font:14px/1.6 "Times New Roman",Times,serif;
    color:#000;
    outline:none;
   }

   .ce-editor:focus{
    border-color:#1f6f5c;
    box-shadow:0 0 0 2px rgba(31,111,92,.12);
   }

   .ce-editor:empty:before{
    content:attr(data-placeholder);
    color:#999;
   }

   .ce-foot{
    display:flex;
    justify-content:flex-end;
    gap:8px;
    padding:10px 14px;
    border-top:1px solid #ccc;
    background:#f5f6f8;
   }

   .ce-foot button{
    padding:7px 16px;
    cursor:pointer;
   }

   .ce-open{
    flex:none;
    padding:4px 8px;
    cursor:pointer;
    white-space:nowrap;
   }

   .content-editor-row{
    display:flex;
    gap:5px;
    align-items:flex-start;
    width:100%;
   }

   .content-editor-row textarea{
    flex:1;
    min-width:0;
   }

   .content-editor-row .ce-open{
    height:30px;
   }
  </style>`;
 }

 function getRich(spec){const p=spec.split(',');return p[0]==='terms'?c.terms[p[1]].p[p[2]]:c[p[0]][p[1]][p[2]]}
 function setRich(spec,v){const p=spec.split(',');if(p[0]==='terms')c.terms[p[1]].p[p[2]]=v;else c[p[0]][p[1]][p[2]]=v}

 function openEditor(spec,title){
  const overlay=document.createElement('div');
  overlay.className='ce-overlay';
  overlay.innerHTML=`
   <div class="ce-modal">
    <div class="ce-head"><div class="ce-title">${esc(title||'Soạn thảo nội dung')}</div><button type="button" data-ce-close>✕</button></div>
    <div class="ce-toolbar">
     <button type="button" class="ce-bold" data-ce-cmd="bold" title="Đậm">B</button>
     <button type="button" class="ce-italic" data-ce-cmd="italic" title="Nghiêng">I</button>
     <button type="button" class="ce-underline" data-ce-cmd="underline" title="Gạch chân">U</button>
    </div>
    <div class="ce-body"><div class="ce-editor" id="contractEditor" contenteditable="true" spellcheck="false" data-placeholder="Nhập nội dung... (mỗi dòng là một gạch đầu dòng ở Điều 1)"></div></div>
    <div class="ce-foot"><button type="button" data-ce-cancel>Hủy</button><button type="button" data-ce-save>Lưu nội dung</button></div>
   </div>`;
  el.appendChild(overlay);
  const ed=overlay.querySelector('#contractEditor');
  ed.innerHTML=toEditorHtml(getRich(spec));
  try{document.execCommand('defaultParagraphSeparator',false,'br')}catch(e){}   // Enter = xuống dòng bằng <br>
  // Giữ vùng chọn khi bấm B/I/U
  overlay.addEventListener('mousedown',e=>{const b=e.target.closest('[data-ce-cmd]');if(!b)return;e.preventDefault();ed.focus();document.execCommand(b.dataset.ceCmd,false,null)});
  // Dán: luôn làm sạch (bỏ <li style=...>, <div>, màu, font...), giữ xuống dòng + đậm/nghiêng/gạch chân
  ed.addEventListener('paste',e=>{
   e.preventDefault();
   const cd=e.clipboardData,h=cd.getData('text/html'),t=cd.getData('text/plain');
   let out;
   if(h){const tmp=document.createElement('div');tmp.innerHTML=h;out=editorToHtml(tmp)}
   else out=cleanLines(t)===t?esc(t).replace(/\r?\n/g,'<br>'):editorToHtml(Object.assign(document.createElement('div'),{innerHTML:esc(cleanLines(t)).replace(/&lt;(\/?(?:strong|b|em|i|u))&gt;/g,'<$1>').replace(/\n/g,'<br>')}));
   document.execCommand('insertHTML',false,out);
  });
  overlay.addEventListener('click',e=>{
   if(e.target.closest('[data-ce-close],[data-ce-cancel]')){overlay.remove();return}
   if(e.target.closest('[data-ce-save]')){setRich(spec,editorToHtml(ed));overlay.remove();render()}
  });
  ed.focus();
 }

 /*
  * =========================
  *  KHÁCH HÀNG
  * =========================
  */

 const custs=()=>{
  const m=new Map();
  [...SEED.customers,...DB.customers].forEach(k=>m.set(k.name,k));
  return[...m.values()];
 };

 /*
  * =========================
  *  TIỀN
  * =========================
  */

 function fmtMoney(t){
  const v=money(t.value);
  return v;
 }

 /*
  * =========================
  *  TỰ ĐỘNG ĐIỀN ĐIỀU 2
  * =========================
  */

 function syncSoftwareItem(){
  if(!c.items||!c.items.length)return;

  const item=c.items[0];
  const sw=String(c.sw||'').trim();

  if(!sw)return;

  const auto=`Phần mềm ${sw}`;

  /*
   * Chỉ tự động thay đổi nếu:
   * - dòng đầu đang trống; hoặc
   * - dòng đầu chính là giá trị tự động được tạo trước đó.
   *
   * Nếu người dùng đã tự sửa thành tên khác thì không ghi đè.
   */
  if(!item.name||item.name===lastAutoSoftwareName){
   item.name=auto;
   lastAutoSoftwareName=auto;
  }
 }

 /*
  * =========================
  *  INPUT
  * =========================
  */

 const inp=(p,lbl,w)=>`
  <label class="f ${w||''}">
   ${lbl}
   <input data-k="${p}" value="${esc(get(c,p))}">
  </label>`;

 /*
  * Input của các danh sách.
  */
 const ci=(l,i,f,ph,cls,ro)=>{
  const v=c[l][i][f];

  let sh='';

  if(f==='pct'){
   sh=v?fmtPct(v):'';
  }else if(MONEY.includes(f)){
   sh=money(v)?vnd(money(v)):'';
  }else{
   sh=String(v??'');
  }

  return `
   <input
    data-l="${l}"
    data-i="${i}"
    data-f="${f}"
    placeholder="${esc(ph)}"
    value="${esc(sh)}"
    class="${cls||''}${ro?' ro':''}"
    ${ro?'readonly':''}
   >`;
 };

 /*
  * Textarea + nút mở trình soạn thảo.
  */
 const contentInput=(spec,label,ph)=>`
  <div class="content-editor-row">
   <button type="button" class="ce-open" data-editor="${spec}" data-editor-title="${esc(ph)}" title="${esc(htmlToText(cleanLines(getRich(spec)||'')).slice(0,300))}">✎ ${esc(label)}</button>
  </div>`;

 const rows=(l,cols)=>{
  return c[l].map((r,i)=>`
   <div class="row">
    ${cols.map(([f,ph,cls,ro])=>{
     if(cls==='ta')return contentInput(l+','+i+','+f,'Soạn thảo '+ph.toLowerCase(),ph);
     return ci(l,i,f,ph,cls,ro);
    }).join('')}

    <button data-del="${l}" data-i="${i}">✕</button>
   </div>
  `).join('')+`<button data-add="${l}">+ Thêm dòng</button>`;
 };

 /*
  * =========================
  *  BÊN A / BÊN B
  * =========================
  */

 const party=(p,lbl)=>`
  <fieldset>
   <legend>${lbl}</legend>

   ${p==='benA'
    ?`
     <label class="f">
      Chọn khách hàng đã lưu
      <input list="kh" id="khPick" placeholder="Gõ tên để chọn…">
     </label>

     <datalist id="kh">
      ${custs().map(k=>`<option value="${esc(k.name)}">`).join('')}
     </datalist>
    `
    :''
   }

   <div class="g">
    ${inp(p+'.name','Tên đơn vị','w2')}

    ${p==='benA'
     ?`
      ${inp('benA.mstLabel','Nhãn mã số')}
      ${inp('benA.mst','Mã số')}
      ${inp('benA.addr','Địa chỉ','w2')}
      ${inp('benA.headLabel','Nhãn người ký')}
      ${inp('benA.title','Danh xưng')}
      ${inp('benA.head','Họ tên người ký')}
      ${inp('benA.pos','Chức vụ (bỏ trống = ẩn)')}
      ${inp('benA.emailLabel','Nhãn email (bỏ trống = ẩn)')}
      ${inp('benA.email','Email')}
     `
     :`
      ${inp('benB.mst','Mã số thuế')}
      ${inp('benB.stk','Số tài khoản - Ngân hàng')}
      ${inp('benB.addr','Địa chỉ','w2')}
      ${inp('benB.title','Danh xưng')}
      ${inp('benB.rep','Đại diện')}
      ${inp('benB.pos','Chức vụ')}
     `
    }
   </div>
  </fieldset>`;

 /*
  * =========================
  *  FORM
  * =========================
  */

 function form(){
  const pm=c.payMode;

  return`
   <fieldset>
    <legend>Thông tin chung</legend>

    <div class="g">
     ${inp('so','Số hợp đồng','w2')}
     ${inp('day','Ngày')}
     ${inp('month','Tháng')}
     ${inp('year','Năm')}
     ${inp('title1','Tên hợp đồng — dòng 1','w2')}
     ${inp('title2','Tên hợp đồng — dòng 2 (bỏ trống = ẩn)','w2')}
    </div>
   </fieldset>

   ${party('benA','Bên A (khách hàng)')}
   ${party('benB','Bên B')}

   <fieldset>
    <legend>Điều 1. Nội dung hợp đồng</legend>

    ${inp('sw','Tên phần mềm')}

    <div class="hint">
     Nội dung chức năng có thể mở bằng trình soạn thảo để định dạng
     <b>đậm</b>, <i>nghiêng</i>, <u>gạch chân</u>.
    </div>

    ${rows('funcs',[
     ['name','Tên chức năng'],
     ['desc','Các nội dung chức năng','ta']
    ])}
   </fieldset>

   <fieldset>
    <legend>Điều 2. Giá trị hợp đồng</legend>

    ${rows('items',[
     ['name','Hạng mục'],
     ['cost','Chi phí (VNĐ)','n']
    ])}

    <div id="tot" class="hint"></div>
   </fieldset>

   <fieldset>
    <legend>Điều 3. Tiến độ thanh toán</legend>

    <div class="hint">
     Nhập theo:
     <label>
      <input type="radio" name="pm" value="amt"${pm==='amt'?' checked':''}>
      Số tiền (tính tỷ lệ)
     </label>

     <label>
      <input type="radio" name="pm" value="pct"${pm==='pct'?' checked':''}>
      Tỷ lệ % (tính số tiền)
     </label>
    </div>

    ${rows('pays',[
     ['content','Nội dung','ta'],
     ['pct','Tỷ lệ %','s',pm==='amt'],
     ['amt','Số tiền','n',pm==='pct']
    ])}

    <div id="paySum" class="hint"></div>
   </fieldset>

   <fieldset>
    <legend>Điều 4. Thời gian triển khai</legend>

    ${inp('total','Tổng thời gian thực hiện')}

    ${rows('phases',[
     ['name','Giai đoạn'],
     ['time','Thời gian'],
     ['content','Nội dung','ta']
    ])}

    
   </fieldset>

   <fieldset>
    <legend>Điều 5 trở đi (tự điền, có thể sửa)</legend>

    ${c.terms.map((t,a)=>`
     <div class="term">

      <div class="row">
       <input
        data-th="${a}"
        value="${esc(t.h)}"
        class="b"
       >

       <button data-tdel="${a}">✕ Điều</button>
      </div>

      ${t.p.map((x,b)=>`
       <div class="row">
        ${contentInput('terms,'+a+','+b,'Soạn thảo '+((String(x).match(/^(\d+\.\d+\.)/)||[])[1]||('khoản '+(b+1))),'Khoản '+(b+1))}
        <button data-pdel="${a},${b}">✕</button>
       </div>
      `).join('')}

      <button data-padd="${a}">+ Thêm khoản</button>
     </div>
    `).join('')}

    <button data-tadd>+ Thêm điều</button>
    <button data-treset>Khôi phục điều khoản gốc</button>
   </fieldset>`;
 }

 /*
  * =========================
  *  PREVIEW
  * =========================
  */

 function preview(){
  const k=calc(c);

  c.pays.forEach((p,i)=>{
   const pi=el.querySelector(
    `[data-l=pays][data-i="${i}"][data-f=pct]`
   );

   const ai=el.querySelector(
    `[data-l=pays][data-i="${i}"][data-f=amt]`
   );

   if(pi&&pi!==document.activeElement)
    pi.value=p.pct?fmtPct(p.pct):'';

   if(ai&&ai!==document.activeElement)
    ai.value=money(p.amt)?vnd(p.amt):'';
  });

  const tot=el.querySelector('#tot');

  if(tot){
   tot.textContent=
    'Tổng cộng: '+vnd(k.total)+' VNĐ — '+k.words;
  }

  const s=el.querySelector('#paySum');

  if(s){
   const ok=k.amtSum===k.total&&k.pctSum===100;

   s.textContent=
    `Tổng các đợt: ${vnd(k.amtSum)} VNĐ (${fmtPct(k.pctSum)}%)`+
    (ok?'':' ⚠ chưa khớp tổng giá trị hợp đồng / 100%');

   s.className='hint'+(ok?'':' warn');
  }

  clearTimeout(tm);
  tm=setTimeout(paint,150);
 }

 /*
  * =========================
  *  PREVIEW SCALE
  * =========================
  */

 function fit(){
  const w=el.querySelector('#pvw');
  const f=el.querySelector('#fr');

  if(!w||!f)return;

  const s=Math.min(1,w.clientWidth/880);

  f.style.transform=`scale(${s})`;
  f.style.height=(w.clientHeight/s)+'px';
  f.style.marginLeft=
   Math.max(0,(w.clientWidth-880*s)/2)+'px';
 }

 function paint(){
  const fr=el.querySelector('#fr');

  if(!fr)return;

  const y=fr.contentWindow?fr.contentWindow.scrollY:0;

  fr.onload=()=>{
   try{
    fr.contentWindow.scrollTo(0,y);
   }catch(e){}
  };

  fr.srcdoc=buildDoc(c);
 }

 function render(){
  el.querySelector('#fm').innerHTML=form();
  preview();
 }

 /*
  * =========================
  *  DOWNLOAD
  * =========================
  */

 const dl=(name,type,txt)=>{
  const a=document.createElement('a');

  a.href=URL.createObjectURL(
   new Blob([txt],{type})
  );

  a.download=name;
  a.click();

  setTimeout(()=>{
   URL.revokeObjectURL(a.href);
  },1000);
 };

 const fname=ext=>
  'Hop_dong_'+
  (c.so||'hop-dong')
   .replace(/[\/\\:*?"<>|\s]+/g,'-')+
  '.'+ext;

 const msg=(t,bad)=>{
  const m=el.querySelector('#msg');

  m.textContent=t;
  m.style.color=bad?'#c00':'#1f6f5c';
 };

 /*
  * =========================
  *  MOUNT
  * =========================
  */

 function mount(el_,id){
  el=el_;

  /*
   * Khi tạo hợp đồng mới:
   * - ngày = ngày hiện tại
   * - tháng = tháng hiện tại
   * - năm = năm hiện tại
   *
   * Khi sửa hợp đồng cũ:
   * - giữ nguyên ngày tháng năm đã lưu.
   */
  c=id
   ?JSON.parse(JSON.stringify(ContractAPI.get(id)))
   :SEED.blank();

  // Mới: ngày để trống (......), tháng/năm = hôm nay (do SEED.blank() điền). Sửa hợp đồng cũ: giữ nguyên.
  c.terms=(c.terms||[]).map(t=>({...t,p:Array.isArray(t.p)?t.p:String(t.p||'').split(/\n+/).filter(Boolean)}));
  lastAutoSo=id?'':c.so;
  if(c.title1==null)c.title1='HỢP ĐỒNG PHÁT TRIỂN';   // hợp đồng cũ chưa có trường này
  if(c.title2==null)c.title2='GIẢI PHÁP PHẦN MỀM';

   /*
   * Điều 2:
   * Tự động tạo dòng đầu là "Phần mềm + tên phần mềm"
   * nếu dữ liệu hiện tại chưa có tên.
   */
  if(c.items?.length){
   const old=c.items[0].name;

   if(!old&&c.sw){
    c.items[0].name=`Phần mềm ${String(c.sw).trim()}`;
    lastAutoSoftwareName=c.items[0].name;
   }else{
    lastAutoSoftwareName=old||'';
   }
  }

  el.innerHTML=`
   ${editorCss()}

   <div class="bar">
    <button id="save">Lưu hợp đồng</button>
    <button id="print">In / Lưu PDF</button>
    <button id="html">Xuất HTML</button>
    <button onclick="go('list')">Về danh sách</button>
    <span id="msg"></span>
   </div>

   <div class="split">
    <div id="fm"></div>

    <div id="pvw">
     <iframe
      id="fr"
      title="Xem trước hợp đồng"
     ></iframe>
    </div>
   </div>
  `;

  render();
  fit();

  new ResizeObserver(fit).observe(
   el.querySelector('#pvw')
  );

  /*
   * =========================
   *  INPUT
   * =========================
   */

  el.oninput=e=>{
   const t=e.target;

   /*
    * Chọn khách hàng đã lưu.
    */
   if(t.id==='khPick'){
    const k=custs().find(x=>x.name===t.value);

    if(k){
     c.benA={...c.benA,...k};
     delete c.benA.id;delete c.benA.note;
     render();
    }

    return;
   }

   /*
    * Input đơn.
    */
   if(t.dataset.k){
    set(c,t.dataset.k,t.value);

    if((t.dataset.k==='month'||t.dataset.k==='year')&&c.so===lastAutoSo){
     c.so=`${String(c.month||'').trim().padStart(2,'0')}/${String(c.year||'').trim()}/HĐPM--QT`;
     lastAutoSo=c.so;
     const so=el.querySelector('[data-k=so]');
     if(so)so.value=c.so;
    }
    if(t.dataset.k==='so')lastAutoSo='';

    /*
     * Khi thay đổi tên phần mềm, cập nhật dòng đầu Điều 2
     * nếu dòng đó vẫn đang dùng tên tự động.
     */
    if(t.dataset.k==='sw'){
     syncSoftwareItem();

     const first=el.querySelector(
      `[data-l=items][data-i="0"][data-f="name"]`
     );

     if(first){
      first.value=c.items[0].name||'';
     }
    }
   }

   /*
    * Các dòng danh sách.
    */
   else if(t.dataset.l){
    const f=t.dataset.f;
    const row=c[t.dataset.l][t.dataset.i];

    let v=t.value;

    if(MONEY.includes(f)){
     /*
      * Không format lại value trong lúc đang gõ.
      * Điều này tránh lỗi caret/composition với Vietnamese IME
      * trên Windows.
      */
     v=money(t.value);
    }
    else if(f==='pct'){
     v=parseFloat(
      String(v).replace(',','.')
     )||0;
    }
    else if(
     t.dataset.l==='funcs' ||
     t.dataset.l==='pays' ||
     t.dataset.l==='phases'
    ){
     /*
      * Nếu đây là textarea nội dung thì giữ plain text
      * trong lúc gõ trực tiếp.
      *
      * Nội dung có định dạng sẽ được lưu khi dùng
      * nút "Soạn thảo".
      */
     if(t.tagName==='TEXTAREA'){
      v=t.value;
     }
    }

    row[f]=v;

    if(
     t.dataset.l==='pays'&&
     f==='amt'
    ){
     row.lock=true;
    }
   }

   /*
    * Tiêu đề Điều.
    */
   else if(t.dataset.th!=null){
    c.terms[t.dataset.th].h=t.value;
   }

   /*
    * Nội dung Điều.
    */
   else if(t.dataset.tp!=null){
    const[a,b]=t.dataset.tp.split(',');
    c.terms[a].p[b]=t.value;
   }

   preview();
  };

  /*
   * =========================
   *  BLUR TIỀN
   * =========================
   */

  el.addEventListener('focusout',e=>{
   const t=e.target;

   if(!t.dataset.l)return;

   const f=t.dataset.f;

   if(!MONEY.includes(f))return;

   const row=c[t.dataset.l][t.dataset.i];
   const v=money(t.value);

   row[f]=v;
   t.value=v?vnd(v):'';

   preview();
  });

  /*
   * =========================
   *  CHANGE
   * =========================
   */

  el.onchange=e=>{
   if(e.target.name==='pm'){
    c.payMode=e.target.value;

    if(c.payMode==='amt'){
     c.pays.forEach(p=>p.lock=true);
    }

    render();
   }
  };

  /*
   * =========================
   *  CLICK
   * =========================
   */

  el.onclick=async e=>{
   const b=e.target.closest('button');

   if(!b)return;

   const d=b.dataset;

   /*
    * Mở trình soạn thảo rich text.
    */
   if(d.editor){
    openEditor(d.editor,d.editorTitle);

    return;
   }

   /*
    * Các dòng dữ liệu.
    */
   const tpl={
    funcs:{
     name:'',
     desc:''
    },

    items:{
     name:'',
     cost:0
    },

    pays:{
     content:'',
     pct:0,
     amt:0,
     lock:c.payMode==='amt'
    },

    phases:{
     // Tự điền tên giai đoạn kế tiếp (Giai đoạn 4, 5, ...)
     name:'Giai đoạn '+(c.phases.length+1),
     time:'',
     content:''
    }
   };

   /*
    * Thêm dòng.
    */
   if(d.add){
    c[d.add].push({
     ...tpl[d.add]
    });

    /*
     * Nếu thêm dòng đầu tiên của Điều 2,
     * tự điền tên phần mềm.
     */
    if(
     d.add==='items'&&
     c.items.length===1
    ){
     syncSoftwareItem();
    }

    render();
   }

   /*
    * Xóa dòng.
    */
   else if(d.del){
    if(c[d.del].length>1){
     c[d.del].splice(+d.i,1);
     render();
    }
   }

   /*
    * Thêm khoản trong Điều.
    */
   else if(d.padd!=null){
    c.terms[d.padd].p.push('');
    render();
   }

   /*
    * Xóa khoản trong Điều.
    */
   else if(d.pdel){
    const[a,p]=d.pdel.split(',');

    c.terms[a].p.splice(+p,1);

    render();
   }

   /*
    * Xóa Điều.
    */
   else if(d.tdel!=null){
    c.terms.splice(+d.tdel,1);
    render();
   }

   /*
    * Thêm Điều.
    */
   else if(d.tadd!=null){
    c.terms.push({
     h:'ĐIỀU '+(c.terms.length+5)+'. ',
     p:['']
    });

    render();
   }

   /*
    * Khôi phục Điều 5–9.
    */
   else if(d.treset!=null){
    if(confirm(
     'Khôi phục toàn bộ Điều 5–9 về nội dung gốc?'
    )){
     c.terms=
      JSON.parse(JSON.stringify(TERMS));

     render();
    }
   }

   /*
    * Lưu.
    */
   else if(b.id==='save'){
    if(!c.benA.name||!c.sw){
     return msg(
      'Cần nhập tên Bên A và tên phần mềm.',
      true
     );
    }

    try{
     const r=await ContractAPI.saveWithCustomer(c,(k,diffs)=>confirm(
      'Đơn vị "'+k.name+'" đã có trong Quản lý khách hàng nhưng có thông tin khác lần trước:\n\n'+
      diffs.map(d=>'• '+d.label+': "'+(d.old||'(trống)')+'" → "'+(d.now||'(trống)')+'"').join('\n')+
      '\n\nBấm OK: cập nhật thông tin mới vào Quản lý khách hàng.\nBấm Hủy: giữ nguyên khách hàng, thông tin khác chỉ áp dụng riêng cho hợp đồng này.'));
     msg(r.created?'Đã lưu. Đã thêm khách hàng mới vào Quản lý khách hàng.':r.updated?'Đã lưu. Đã cập nhật thông tin khách hàng.':'Đã lưu.');
    }catch(x){
     msg(x.message,true);
    }
   }

   /*
    * In / PDF.
    */
   else if(b.id==='print'){
    paint();

    setTimeout(()=>{
     el.querySelector('#fr')
      .contentWindow
      .print();
    },300);
   }

   /*
    * HTML.
    */
   else if(b.id==='html'){
    dl(
     fname('html'),
     'text/html;charset=utf-8',
     buildDoc(c)
    );
   }

  };
 }

 return{mount};
})();
