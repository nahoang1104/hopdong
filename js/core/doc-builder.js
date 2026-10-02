window.buildDoc=function(c){

 const now=new Date();

 const todayDay=String(now.getDate()).padStart(2,'0');
 const todayMonth=String(now.getMonth()+1).padStart(2,'0');
 const todayYear=String(now.getFullYear());

 const k=calc(c);
 const A=c.benA||{};
 const B=c.benB||{};

 const sw=esc(c.sw||'<Tên phần mềm>');
 const pc=n=>fmtPct(n)+'%';

 /*
  * ============================================================
  * RICH TEXT
  * ============================================================
  *
  * Nội dung từ trình soạn thảo trong mod-contract.js có thể
  * chứa:
  *
  *   <strong>...</strong>
  *   <b>...</b>
  *   <em>...</em>
  *   <i>...</i>
  *   <u>...</u>
  *   <br>
  *
  * Chỉ cho phép các tag trên.
  */

 const rich=function(s){
  const raw=String(s??'');
  s=cleanLines(raw);
  const legacy=s!==raw;   // chỉ dữ liệu cũ dính thẻ <li>... mới cần đổi \n thành <br>
  if(!s)return '';
  // Văn bản thường: escape, hỗ trợ **đậm** và xuống dòng
  if(!isRich(s))return esc(s).replace(/\r?\n/g,'<br>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  // HTML từ trình soạn thảo: chỉ giữ strong/b/em/i/u/br
  s=s.replace(/<(?!\/?(?:strong|b|em|i|u|br)\b)[^>]*>/gi,'');
  return legacy?s.replace(/\r?\n/g,'<br>'):s;   // dữ liệu bình thường: giữ nguyên như bản gốc
 };


 /*
  * ============================================================
  * TEXT / PARTY
  * ============================================================
  */

 const line=t=>t?`<p>${t}</p>`:'';


 /*
  * ============================================================
  * ĐIỀU 1 - CHỨC NĂNG
  * ============================================================
  */

 const funcs=c.funcs.map(f=>{

  const desc=cleanLines(f.desc);

  /*
   * Nếu desc là HTML rich text:
   * không tách bằng newline vì editor có thể dùng <br>.
   *
   * Nếu là dữ liệu cũ dạng text:
   * vẫn giữ cách xử lý mỗi dòng thành một bullet.
   */
  const isRichDesc=isRich(desc);

  let body='';

  if(isRichDesc){

   /*
    * Editor tạo các dòng bằng <br>.
    * Chuyển mỗi dòng thành một <li>.
    */
   const parts=desc
    .replace(/<br\s*\/?>/gi,'\n')
    .split(/\r?\n/)
    .map(x=>x.trim())
    .filter(Boolean);

   body=parts
    .map(x=>`<li>${rich(x)}</li>`)
    .join('\n');

  }else{

   body=desc
    .split(/\r?\n/)
    .filter(x=>x.trim())
    .map(x=>`
      <li>
       ${rich(x.trim())}
      </li>
    `)
    .join('');
  }

  return`
   <li>
    <strong>${esc(f.name)}</strong>

    ${body
     ?`
      <ul>
       ${body}
      </ul>
     `
     :''
    }
   </li>
  `;

 }).join('\n');


 /*
  * ============================================================
  * ĐIỀU 5 -> ĐIỀU 9
  * ============================================================
  */

 const art=t=>{

  const heading=esc(t.h||'');

  const paragraphs=(Array.isArray(t.p)?t.p:String(t.p||'').split(/\n+/).filter(Boolean))
   .map(x=>{

    x=String(x??'');

    /*
     * Điều khoản có dạng:
     *
     * 5.1. Nội dung...
     *
     * Tách số điều khoản ra để vẫn in đậm phần 5.1.
     */
    const m=x.match(
     /^(\d+\.\d+\.)\s*([\s\S]*)$/
    );

    if(m){

     return`
      <p>
       <b>${esc(m[1])}</b>
       ${rich(m[2])}
      </p>
     `;
    }

    return`<p>${rich(x)}</p>`;
   })
   .join('\n');

  return`
   <h2>${heading}</h2>
   ${paragraphs}
  `;
 };


 /*
  * ============================================================
  * NỘI DUNG GỐC
  * ============================================================
  */

 const content=`

  <div class="national">
   <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
   <div class="sub">Độc lập – Tự do – Hạnh phúc</div>
  </div>


  <div class="title">
   ${esc(c.title1==null?'HỢP ĐỒNG PHÁT TRIỂN':c.title1)}
  </div>


  ${
   (c.title2==null?'GIẢI PHÁP PHẦN MỀM':c.title2)
    ?`<div class="subtitle">
   ${esc(c.title2==null?'GIẢI PHÁP PHẦN MỀM':c.title2)}
  </div>`
    :''
  }


  <div class="contract-no">
   Số: ${esc(c.so||'')}
  </div>


  <div class="intro">

   <p>
    Căn cứ Bộ luật Dân sự hiện hành và nhu cầu hợp tác
    của hai bên.
   </p>

   <p>
    Hôm nay, ngày
    ${esc(c.day||'......')}
    tháng
    ${esc(c.month||todayMonth)}
    năm
    ${esc(c.year||todayYear)},
    chúng tôi gồm có:
   </p>

  </div>


  <div class="party">

   <p class="party-title">
    BÊN A: ${esc(A.name||'')}
   </p>

   ${
    A.mst||A.name
     ?line(
       `${esc(A.mstLabel||'Mã số')}: ${esc(A.mst||'')}`
      )
     :''
   }

   ${line(`Địa chỉ: ${esc(A.addr||'')}`)}

   ${line(
    `${esc(A.headLabel||'Người đại diện')}: `+
    esc([A.title,A.head].filter(Boolean).join(' '))
   )}

   ${line(
    A.pos
     ?`Chức vụ: ${esc(A.pos)}`
     :''
   )}

   ${line(
    String(A.emailLabel||'').trim()
     ?`${esc(String(A.emailLabel).trim())}: ${esc(A.email||'')}`
     :''
   )}

  </div>


  <div class="party">

   <p class="party-title">
    BÊN B: ${esc(B.name||'')}
   </p>

   <p>
    Mã số thuế: ${esc(B.mst||'')}
   </p>

   <p>
    Số tài khoản: ${esc(B.stk||'')}
   </p>

   <p>
    Địa chỉ: ${esc(B.addr||'')}
   </p>

   <p>
    Đại diện:
    ${esc(B.title||'')}
    ${esc(B.rep||'')}
   </p>

   <p>
    Chức vụ: ${esc(B.pos||'')}
   </p>

  </div>


  <p class="agreement">
   Hai bên cùng thống nhất ký kết Hợp đồng phát triển
   phần mềm với các điều khoản sau:
  </p>


  <h2>
   ĐIỀU 1. NỘI DUNG HỢP ĐỒNG
  </h2>


  <p>
   Bên A đồng ý thuê và Bên B đồng ý triển khai hệ thống
   phần mềm với các nội dung sau:
  </p>


  <p>
   Phần mềm ${sw} có các chức năng theo bản mô tả
   chức năng đính kèm:
  </p>


  <p>
   <strong>
    Phần mềm ${sw} có các chức năng và nội dung công việc
    chính như sau:
   </strong>
  </p>


  <ol${c.funcs.length<2?' style="list-style:none;padding-left:1.5em;margin-left:0"':''}>
   ${funcs}
  </ol>


  <p>
   Các nội dung trên là phạm vi công việc Bên B thực hiện
   theo Hợp đồng. Các yêu cầu phát sinh ngoài phạm vi nêu
   trên sẽ được hai bên trao đổi và thống nhất riêng về
   nội dung, thời gian và chi phí thực hiện (nếu có).
  </p>


  <h2>
   ĐIỀU 2. GIÁ TRỊ HỢP ĐỒNG
  </h2>


  <table>

   <tbody>

    <tr>
     <th>STT</th>
     <th>Hạng mục</th>
     <th>Chi phí</th>
    </tr>

    ${
     c.items.map((r,i)=>`

      <tr>

       <td class="center">
        ${i+1}
       </td>

       <td>
        ${esc(r.name||'')}
       </td>

       <td class="right nowrap">
        ${vnd(money(r.cost))} VNĐ
       </td>

      </tr>

     `).join('\n')
    }


    <tr>

     <td colspan="2" class="right">
      <b>TỔNG CỘNG</b>
     </td>

     <td class="right nowrap">
      <b>${vnd(k.total)} VNĐ</b>
     </td>

    </tr>

   </tbody>

  </table>


  <p>
   (Bằng chữ: ${esc(k.words)})
  </p>


  <h2>
   ĐIỀU 3. TIẾN ĐỘ THANH TOÁN
  </h2>


  <table>

   <tbody>

    <tr>
     <th>Đợt</th>
     <th>Nội dung</th>
     <th>Tỷ lệ</th>
     <th>Số tiền</th>
    </tr>

    ${
     k.pays.map((p,i)=>`

      <tr>

       <td class="center">
        ${i+1}
       </td>

       <td>
        ${rich(p.content)}
       </td>

       <td class="center">
        ${pc(p.pct)}
       </td>

       <td class="right nowrap">
        ${vnd(money(p.amt))} VNĐ
       </td>

      </tr>

     `).join('\n')
    }

   </tbody>

  </table>


  <h2>
   ĐIỀU 4. THỜI GIAN TRIỂN KHAI
  </h2>


  <p>
   Tổng thời gian thực hiện:
   ${rich(c.total||'')}
  </p>


  <table>

   <tbody>

    <tr>
     <th>Giai đoạn</th>
     <th>Thời gian</th>
     <th>Nội dung</th>
    </tr>

    ${
     c.phases.map(p=>`

      <tr>

       <td class="center">
        ${esc(p.name||'')}
       </td>

       <td class="center">
        ${esc(p.time||'')}
       </td>

       <td>
        ${rich(p.content)}
       </td>

      </tr>

     `).join('\n')
    }

   </tbody>

  </table>


  ${
   (c.terms||[])
    .map(art)
    .join('\n')
  }


  <div class="signature">

   <div class="signature-col">

    <div class="signature-title">
     ĐẠI DIỆN BÊN A
    </div>

    <div class="signature-note">
     (Ký, ghi rõ họ tên &amp; đóng dấu)
    </div>

    <div class="signature-space"></div>

    <div class="signature-name">
     ${esc(String(A.head||'').toUpperCase())}
    </div>

   </div>


   <div class="signature-col">

    <div class="signature-title">
     ĐẠI DIỆN BÊN B
    </div>

    <div class="signature-note">
     (Ký, ghi rõ họ tên &amp; đóng dấu)
    </div>

    <div class="signature-space"></div>

    <div class="signature-name">
     ${esc(String(B.rep||'').toUpperCase())}
    </div>

   </div>

  </div>

 `;


 /*
  * ============================================================
  * PAGINATION
  * ============================================================
  *
  * Nguyên tắc:
  *
  * 1. Không dùng space-between cho trang nội dung.
  * 2. Nội dung chảy liên tục từ trên xuống dưới.
  * 3. p / h2 / div là block.
  * 4. ol được tách theo từng li.
  * 5. table được tách theo từng tr.
  * 6. Header table được lặp lại khi sang trang.
  * 7. OL tiếp tục số thứ tự khi sang trang.
  */


 const paginationScript=`

(function(){

 /*
  * ----------------------------------------------------------
  * TẠO TRANG
  * ----------------------------------------------------------
  */

 function createPage(root){

  const page=document.createElement('section');

  page.className='page';

  /*
   * Rất quan trọng:
   *
   * DOC_CSS gốc có thể chứa:
   *
   * justify-content:space-between
   *
   * Điều này làm trình duyệt kéo giãn khoảng trống.
   *
   * Với pagination động, phải ép nội dung chảy liên tục.
   */
  page.style.justifyContent='flex-start';

  root.appendChild(page);

  return page;
 }


 /*
  * ----------------------------------------------------------
  * KIỂM TRA CHIỀU CAO
  * ----------------------------------------------------------
  */

 function fits(page){

  return page.scrollHeight <= page.clientHeight + 1;
 }


 /*
  * ----------------------------------------------------------
  * THÊM BLOCK THƯỜNG
  * ----------------------------------------------------------
  */

 /*
  * Tạo trang mới nhưng KÉO THEO tiêu đề Điều đang nằm cuối trang cũ
  * (pair=true: kéo cả dòng dẫn ngay sau tiêu đề, dùng cho bảng),
  * để tiêu đề Điều luôn đi cùng nội dung của nó.
  */
 function pageWithLead(state,pair){

  var pg=state.page;
  var lead=[];
  var l=pg.lastElementChild;

  if(
   pair&&l&&l.tagName==='P'&&
   l.previousElementSibling&&
   l.previousElementSibling.tagName==='H2'
  ){
   lead=[l.previousElementSibling,l];
  }else if(l&&l.tagName==='H2'){
   lead=[l];
  }

  // Trang cũ chỉ có đúng phần tiêu đề thì không đẩy (tránh trang trống)
  if(lead.length&&pg.children.length<=lead.length){
   lead=[];
  }

  lead.forEach(function(x){pg.removeChild(x);});

  var np=createPage(state.root);
  state.page=np;

  lead.forEach(function(x){np.appendChild(x);});

  return np;
 }


 function addBlock(state,node){

  let page=state.page;

  const clone=node.cloneNode(true);

  page.appendChild(clone);

  if(fits(page)){
   return;
  }


  /*
   * Nếu block này là phần tử đầu tiên trên trang
   * mà vẫn cao hơn trang:
   *
   * giữ nguyên để tránh vòng lặp vô hạn.
   */
  if(page.children.length===1){
   return;
  }


  page.removeChild(clone);


  page=pageWithLead(state,false);

  page.appendChild(clone);
 }


 /*
  * ----------------------------------------------------------
  * ORDERED LIST
  * ----------------------------------------------------------
  */

 function addOrderedList(state,sourceList){

  const items=Array.from(sourceList.children)
   .filter(x=>x.tagName==='LI');


  if(!items.length){

   addBlock(state,sourceList);

   return;
  }


  let page=state.page;
  let list=null;
  let startNumber=1;


  function newList(){

   list=document.createElement('ol');


   /*
    * Copy thuộc tính của OL gốc.
    */
   for(const attr of sourceList.attributes){

    list.setAttribute(
     attr.name,
     attr.value
    );
   }


   /*
    * Nếu sang trang mới:
    * tiếp tục số thứ tự.
    */
   if(startNumber!==1){

    list.setAttribute(
     'start',
     String(startNumber)
    );
   }


   page.appendChild(list);
  }


  newList();


  for(let i=0;i<items.length;i++){

   const li=items[i].cloneNode(true);

   list.appendChild(li);


   if(fits(page)){

    startNumber=i+2;

    continue;
   }


   /*
    * Không vừa.
    */
   list.removeChild(li);


   /*
    * Nếu list hiện tại chưa có item:
    * li quá cao.
    */
   if(list.children.length===0){

    list.remove();


    page=pageWithLead(state,false);


    startNumber=i+1;

    newList();

    list.appendChild(li);

    startNumber=i+2;

    continue;
   }


   /*
    * Sang trang mới.
    */
   page=createPage(state.root);

   state.page=page;


   startNumber=i+1;

   newList();

   list.appendChild(li);

   startNumber=i+2;
  }
 }


 /*
  * ----------------------------------------------------------
  * TABLE
  * ----------------------------------------------------------
  */

 function addTable(state,sourceTable){

  /*
   * Ưu tiên giữ NGUYÊN BẢNG trên một trang:
   *
   * 1. Thử đặt cả bảng vào trang hiện tại.
   * 2. Không vừa -> chuyển cả bảng (kèm tiêu đề Điều và dòng dẫn
   *    đứng ngay trước nó) sang trang kế tiếp rồi thử lại.
   * 3. Trang mới vẫn không đủ chỗ -> mới tách các dòng của bảng
   *    sang trang kế tiếp (code bên dưới).
   */
  var whole=sourceTable.cloneNode(true);
  var pg=state.page;

  pg.appendChild(whole);

  if(fits(pg)){
   return;
  }

  pg.removeChild(whole);

  var lead=[];
  var last=pg.lastElementChild;

  if(
   last&&last.tagName==='P'&&
   last.previousElementSibling&&
   last.previousElementSibling.tagName==='H2'
  ){
   lead=[last.previousElementSibling,last];
  }else if(last&&last.tagName==='H2'){
   lead=[last];
  }

  if(pg.children.length>lead.length){

   lead.forEach(function(x){pg.removeChild(x);});

   pg=createPage(state.root);
   state.page=pg;

   lead.forEach(function(x){pg.appendChild(x);});

   var whole2=sourceTable.cloneNode(true);
   pg.appendChild(whole2);

   if(fits(pg)){
    return;
   }

   pg.removeChild(whole2);
  }


  let rows=[];


  /*
   * Trường hợp table có tbody.
   */
  const tbodySource=sourceTable.querySelector(
   ':scope > tbody'
  );


  if(tbodySource){

   rows=Array.from(
    tbodySource.children
   ).filter(
    x=>x.tagName==='TR'
   );
  }


  /*
   * Fallback nếu TR nằm trực tiếp trong table.
   */
  if(!rows.length){

   rows=Array.from(
    sourceTable.children
   ).filter(
    x=>x.tagName==='TR'
   );
  }


  /*
   * Fallback cuối cùng.
   */
  if(!rows.length){

   rows=Array.from(
    sourceTable.querySelectorAll('tr')
   );
  }


  if(!rows.length){

   addBlock(state,sourceTable);

   return;
  }


  /*
   * Header là hàng đầu tiên có TH.
   */
  const header=
   rows[0].querySelector('th')
    ?rows[0]
    :null;


  let page=state.page;
  let table=null;
  let tbody=null;

  /*
   * Đo độ rộng các cột của CẢ bảng (khi đủ nội dung) rồi áp cố định
   * cho mọi phần của bảng ở các trang khác nhau, để cột không bị
   * tính lại theo từng trang.
   */
  var colPct=null;
  var prevTbody=null;   // mảnh bảng ngay trước mảnh hiện tại

  (function(){
   var m=sourceTable.cloneNode(true);
   page.appendChild(m);

   var best=null;
   var mr=m.querySelectorAll('tr');

   for(var q=0;q<mr.length;q++){
    if(!best||mr[q].cells.length>best.cells.length){
     best=mr[q];
    }
   }

   if(best&&best.cells.length>1){
    var ws=[];
    var tot=0;

    for(var q2=0;q2<best.cells.length;q2++){
     var w=best.cells[q2].getBoundingClientRect().width;
     ws.push(w);
     tot+=w;
    }

    if(tot>0){
     colPct=ws.map(function(w){return (w/tot*100).toFixed(3);});
    }
   }

   page.removeChild(m);
  })();


  function newTable(includeHeader){

   table=document.createElement('table');


   /*
    * Copy toàn bộ thuộc tính table.
    */
   for(const attr of sourceTable.attributes){

    table.setAttribute(
     attr.name,
     attr.value
    );
   }


   if(colPct){
    table.style.tableLayout='fixed';
    table.style.width='100%';

    var cg=document.createElement('colgroup');

    colPct.forEach(function(w){
     var cl=document.createElement('col');
     cl.style.width=w+'%';
     cg.appendChild(cl);
    });

    table.appendChild(cg);
   }

   tbody=document.createElement('tbody');

   table.appendChild(tbody);

   page.appendChild(table);


   if(includeHeader&&header){

    var hc=header.cloneNode(true);
    hc.__h=true;   // đánh dấu dòng tiêu đề lặp lại (không tính là dòng dữ liệu)
    tbody.appendChild(hc);
   }
  }


  newTable(true);


  const firstDataIndex=
   header
    ?1
    :0;


  for(
   let i=firstDataIndex;
   i<rows.length;
   i++
  ){

   const row=rows[i].cloneNode(true);

   tbody.appendChild(row);


   if(fits(page)){

    continue;
   }


   /*
    * Không vừa -> lấy row ra.
    */
   tbody.removeChild(row);


   /*
    * Kiểm tra bảng hiện tại có dữ liệu hay chưa.
    *
    * Không tính header.
    */
   const dataRows=
    Array.from(tbody.children)
     .filter(
      tr=>!tr.__h
     );


   /*
    * Nếu trang hiện tại mới chỉ có header:
    * row quá cao hoặc header + row không vừa.
    */
   if(dataRows.length===0){

    table.remove();


    page=pageWithLead(state,true);


    newTable(true);

    tbody.appendChild(row);

    continue;
   }


   /*
    * Sang trang mới.
    */
   page=createPage(state.root);

   state.page=page;

   prevTbody=tbody;

   newTable(true);

   tbody.appendChild(row);
  }

  /*
   * Mảnh cuối của bảng chỉ có đúng 1 dòng dữ liệu:
   * mang thêm 1 dòng cuối của mảnh trước sang cùng.
   */
  if(prevTbody){

   var dataOf=function(tb){
    return Array.from(tb.children).filter(function(tr){return !tr.__h;});
   };

   var curRows=dataOf(tbody);
   var prevRows=dataOf(prevTbody);

   if(curRows.length===1&&prevRows.length>1){

    var moved=prevRows[prevRows.length-1];

    tbody.insertBefore(moved,curRows[0]);

    if(!fits(page)){
     prevTbody.appendChild(moved);   // không đủ chỗ -> hoàn tác
    }
   }
  }
 }


 /*
  * ----------------------------------------------------------
  * XỬ LÝ NGUỒN
  * ----------------------------------------------------------
  */

 function paginate(){

  const source=document.getElementById('source');
  const root=document.getElementById('document');


  if(!source||!root)return;


  root.innerHTML='';


  const nodes=
   Array.from(source.children);


  if(!nodes.length)return;


  const state={
   root:root,
   page:createPage(root)
  };


  for(const node of nodes){

   if(node.tagName==='OL'){

    addOrderedList(
     state,
     node
    );

    continue;
   }


   if(node.tagName==='TABLE'){

    addTable(
     state,
     node
    );

    continue;
   }


   addBlock(
    state,
    node
   );
  }
 }


 /*
  * ----------------------------------------------------------
  * CHỜ FONT
  * ----------------------------------------------------------
  */

 function start(){

  if(
   document.fonts&&
   document.fonts.ready
  ){

   document.fonts.ready.then(function(){

    requestAnimationFrame(function(){

     requestAnimationFrame(function(){

      paginate();

     });

    });

   });

  }else{

   requestAnimationFrame(function(){

    requestAnimationFrame(function(){

     paginate();

    });

   });

  }
 }


 if(
  document.readyState==='loading'
 ){

  document.addEventListener(
   'DOMContentLoaded',
   start
  );

 }else{

  start();

 }


 /*
  * ----------------------------------------------------------
  * RESIZE
  * ----------------------------------------------------------
  */

 let resizeTimer=0;


 window.addEventListener(
  'resize',
  function(){

   clearTimeout(resizeTimer);


   resizeTimer=setTimeout(
    function(){

     paginate();

    },
    150
   );

  }
 );


})();

`;


 /*
  * ============================================================
  * CSS OVERRIDE CHO PAGINATION
  * ============================================================
  *
  * Không sửa trực tiếp DOC_CSS để tránh ảnh hưởng các chỗ
  * khác đang sử dụng.
  */

 const paginationCss=`

/*
 * Trang được tạo bởi pagination động.
 */
.page{
 justify-content:flex-start !important;
}

/*
 * Không để flex tự giãn khoảng trống.
 */
.page > *{
 flex-shrink:0;
}

/*
 * Giữ khoảng cách thực tế của văn bản,
 * thay vì để space-between tạo khoảng trống lớn.
 */
.page h2{
 margin-top:7px;
 margin-bottom:4px;
}

.page p{
 margin-top:3px;
 margin-bottom:3px;
}

.page table{
 margin-top:5px;
 margin-bottom:5px;
}

.page ol{
 margin-top:3px;
 margin-bottom:4px;
}

.page ul{
 margin-top:3px;
 margin-bottom:4px;
}

.page .party{
 margin-top:5px;
 margin-bottom:5px;
}

.page .agreement{
 margin-top:7px;
}

.page .signature{
 margin-top:24px;
}

/*
 * Không để các trang nội dung kế tiếp bị đẩy khoảng trống
 * như bản CSS gốc.
 */
.page:not(:first-child){
 justify-content:flex-start !important;
}

/*
 * Khi in, vẫn giữ đúng A4 và margin của DOC_CSS.
 */
@media print{

 .page{
  justify-content:flex-start !important;
 }

}

`;


 /*
  * ============================================================
  * HTML CUỐI
  * ============================================================
  */

 return `<!DOCTYPE html>

<html lang="vi">

<head>

<meta charset="utf-8">

<title>
 Hợp đồng phát triển phần mềm - ${esc(c.so||'')}
</title>


<style>

${DOC_CSS}

${paginationCss}

</style>

</head>


<body>


<!--
 Nguồn liên tục.
 Pagination script sẽ chia thành các page A4.
-->

<div id="source">

${content}

</div>


<!--
 Các trang A4 sau khi phân trang.
-->

<div id="document"></div>


<script>

${paginationScript}

</script>


</body>

</html>`;
};
