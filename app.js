/* =========================================================
   GOOGLE AUTHENTICATION LOCK
   ========================================================= */

const $=s=>document.querySelector(s);

(function lockPageUntilGoogleLogin(){
  const style=document.createElement("style");
  style.id="atd-auth-lock-style";
  style.textContent=`
    body.atd-auth-locked > *:not(#googleLoginOverlay){
      visibility:hidden !important;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("atd-auth-locked");
})();

// Google Apps Script Web App endpoint. Paste the deployed /exec URL here after deployment.
const DELIVERY_CONFIG={
  webAppUrl:"https://script.google.com/macros/s/AKfycbzMlGpSFI9ZQL40fxq4rWSvCyFHRtzqLjEMT5cKy3lz2XVZw9d9YIrFFQ52XTa7SKBzTA/exec"
};
let counter=Number(localStorage.getItem("atd_service_counter")||"1");
const reportNo=()=>`SR_ATD_22AD0005${String(counter).padStart(3,"0")}`;
$("#reportNo").textContent=reportNo(); $("#reportInput").value=reportNo();

const now=new Date(), localDate=new Date(now-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
document.querySelector('[name="serviceDate"]').value=localDate;
function updateApprovalTime(){const n=new Date();$("#approvalTime").textContent=n.toLocaleString("en-CA",{dateStyle:"medium",timeStyle:"short"});}
updateApprovalTime(); setInterval(updateApprovalTime,30000);

document.querySelectorAll(".type").forEach(b=>b.addEventListener("click",()=>{
 document.querySelectorAll(".type").forEach(x=>x.classList.remove("active"));b.classList.add("active");
 document.querySelector('[name="serviceType"]').value=b.dataset.value;
}));
const statusIcons={
 "Completed":"✓",
 "Unable to Complete":"×",
 "Follow-up Required":"◷",
 "Completed – Further Work Required":"🔧"
};
document.querySelectorAll(".status").forEach(b=>{
 const label=b.textContent.trim();
 b.innerHTML=`<span class="status-icon">${statusIcons[b.dataset.value]||"●"}</span> ${label.replace(/^●\\s*/,"").replace(/^◷\\s*/,"")}`;
 b.addEventListener("click",()=>{
   document.querySelectorAll(".status").forEach(x=>x.classList.remove("active"));
   b.classList.add("active");
   document.querySelector('[name="result"]').value=b.dataset.value;
 });
});

function addEquipment(){
 const w=document.createElement("div");w.className="repeat equipment";
 w.innerHTML=`<div class="grid six">
<label>Equipment / Machine<input name="equipment" placeholder="e.g. Temperature Controller"></label>
<label>Manufacturer<input name="manufacturer" placeholder="e.g. JUMO"></label>
<label>Model<input name="model" placeholder="e.g. dTRON 304"></label>
<label>Serial Number<input name="serial" placeholder="e.g. 12345678"></label>
<label>Part Number<input name="partNumber" placeholder="e.g. 703044/..."></label>
<label>Location / Tag<input name="location" placeholder="e.g. Line 2 – Oven #3"></label>
</div><button type="button" class="remove" onclick="removeRow(this)">🗑</button>`;
 $("#equipmentList").appendChild(w);
}
function addPart(){
 const r=document.createElement("div");r.className="part-row";
 r.innerHTML=`<input placeholder="Part No." name="partNo"><input placeholder="Description" name="partDesc"><input placeholder="Qty" name="qty" type="number" min="0" step="1"><button type="button" onclick="removeRow(this)">×</button>`;
 $("#partsList").appendChild(r);
}
function removeRow(btn){const row=btn.closest(".repeat,.part-row");if(row&&row.parentElement.children.length>1)row.remove();}

const canvas=$("#signature"),ctx=canvas.getContext("2d");let drawing=false,hasSig=false;
function pos(e){const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return[(p.clientX-r.left)*canvas.width/r.width,(p.clientY-r.top)*canvas.height/r.height]}
function start(e){e.preventDefault();drawing=true;hasSig=true;const[x,y]=pos(e);ctx.beginPath();ctx.moveTo(x,y)}
function move(e){if(!drawing)return;e.preventDefault();const[x,y]=pos(e);ctx.lineTo(x,y);ctx.stroke()}
function end(){drawing=false}
ctx.lineWidth=3;ctx.lineCap="round";ctx.lineJoin="round";
["mousedown","mousemove","mouseup","mouseleave"].forEach(ev=>canvas.addEventListener(ev,{mousedown:start,mousemove:move,mouseup:end,mouseleave:end}[ev]));
canvas.addEventListener("touchstart",start,{passive:false});canvas.addEventListener("touchmove",move,{passive:false});canvas.addEventListener("touchend",end);
function clearSignature(){ctx.clearRect(0,0,canvas.width,canvas.height);hasSig=false}

function collect(){
 const fd=new FormData($("#serviceForm")),o=Object.fromEntries(fd.entries());
 o.reportNo=reportNo();
 const readInputs=el=>Object.fromEntries([...el.querySelectorAll("input,select,textarea")].filter(i=>i.name).map(i=>[i.name,i.value]));
 o.equipment=[...document.querySelectorAll(".equipment")].map(readInputs);
 o.parts=[...document.querySelectorAll(".part-row")].map(readInputs).filter(x=>x.partNo||x.partDesc||x.qty);
 o.signature=hasSig?canvas.toDataURL("image/png"):"";o.generatedAt=new Date().toISOString();return o;
}
function renderReview(o,finalized=false){
 const eqRows=(o.equipment||[]).map(e=>`<tr><td>${escapeHtml(e.equipment||"—")}</td><td>${escapeHtml(e.manufacturer||"—")}</td><td>${escapeHtml(e.model||"—")}</td><td>${escapeHtml(e.serial||"—")}</td></tr>`).join("");
 const partRows=(o.parts||[]).map(p=>`<tr><td>${escapeHtml(p.partNo||"—")}</td><td>${escapeHtml(p.partDesc||"—")}</td><td>${escapeHtml(p.qty||"—")}</td></tr>`).join("");
 const statusClass={"Completed":"review-completed","Unable to Complete":"review-unable","Follow-up Required":"review-followup","Completed – Further Work Required":"review-further"}[o.result]||"review-completed";
 const acceptance=finalized
   ? `<div class="review-acceptance confirmed">✓ Customer acceptance has been confirmed for this Service Report.</div>`
   : `<div class="review-acceptance pending">Please review all information carefully. Use <strong>EDIT REPORT</strong> if anything needs to be corrected. Final acceptance is completed only after <strong>SUBMIT &amp; CONFIRM</strong>.</div>`;
 const actions=finalized
   ? `<div class="review-actions"><button type="button" id="editReport" class="secondary-btn">EDIT REPORT</button><button type="button" id="generateCustomerPdf" class="primary-btn">GENERATE CUSTOMER PDF</button><button type="button" id="sendCustomerCopy" class="primary-btn">SEND CUSTOMER COPY</button><button type="button" id="printReview" class="secondary-btn">PRINT REVIEW</button></div><div id="deliveryStatus" class="delivery-status"></div>`
   : `<div class="review-actions"><button type="button" id="editReport" class="secondary-btn">EDIT REPORT</button><button type="button" id="submitConfirm" class="primary-btn">SUBMIT &amp; CONFIRM</button></div>`;
 $("#reviewContent").innerHTML=`
 <div class="review-header"><div><div class="review-kicker">CUSTOMER REVIEW</div><h2>${escapeHtml(o.reportNo)}</h2></div><div class="review-status ${statusClass}">${escapeHtml(o.result||"Completed")}</div></div>
 <div class="review-grid">
   <div><span>Customer</span><strong>${escapeHtml(o.company||"—")}</strong></div>
   <div><span>Contact Person</span><strong>${escapeHtml(o.contact||"—")}</strong></div>
   <div><span>Service Date</span><strong>${escapeHtml(o.serviceDate||"—")}</strong></div>
   <div><span>Technician</span><strong>${escapeHtml(o.technician||"—")}</strong></div>
   <div><span>PO Number</span><strong>${escapeHtml(o.po||"—")}</strong></div>
   <div><span>Customer Work Order</span><strong>${escapeHtml(o.workOrder||"—")}</strong></div>
 </div>
 <div class="review-section"><h3>Equipment</h3><table><thead><tr><th>Equipment / Machine</th><th>Manufacturer</th><th>Model</th><th>Serial Number</th></tr></thead><tbody>${eqRows||'<tr><td colspan="4">No equipment recorded.</td></tr>'}</tbody></table></div>
 <div class="review-section"><h3>Work Performed</h3><div class="review-text">${escapeHtml(o.work||"—")}</div></div>
 <div class="review-section"><h3>Parts / Materials Used</h3><table><thead><tr><th>Part Number</th><th>Description</th><th>Qty</th></tr></thead><tbody>${partRows||'<tr><td colspan="3">No parts or materials recorded.</td></tr>'}</tbody></table></div>
 <div class="review-grid">
   <div><span>Technician Notes</span><strong>${escapeHtml(o.techNotes||"—")}</strong></div>
   <div><span>Customer Comments</span><strong>${escapeHtml(o.customerComments||"—")}</strong></div>
   <div><span>Customer Name</span><strong>${escapeHtml(o.customerName||"—")}</strong></div>
   <div><span>Signature</span><strong class="signed">✓ Signature captured</strong></div>
 </div>
 ${acceptance}
 ${actions}
 <p class="next-report">Next Service Report: <strong>${reportNo()}</strong></p>`;

 $("#editReport").addEventListener("click",()=>{
   $("#review").classList.add("hidden");
   $("#serviceForm").style.display="";
   const legacyActions=document.querySelector(".footer-actions");
   if(legacyActions) legacyActions.style.display="flex";
   window.scrollTo({top:0,behavior:"smooth"});
 });
 if(finalized){
   $("#generateCustomerPdf").addEventListener("click",()=>generatePDF(true));
   $("#printReview").addEventListener("click",()=>window.print());
   $("#sendCustomerCopy").addEventListener("click",()=>deliverReport(o));
 }else{
   $("#submitConfirm").addEventListener("click",async()=>{
     const latest=collect();
     latest.finalizedAt=new Date().toISOString();
     localStorage.setItem("atd_last_report",JSON.stringify(latest));
     counter=Math.min(counter+1,999);
     localStorage.setItem("atd_service_counter",String(counter));
     renderReview(latest,true);
     window.scrollTo({top:0,behavior:"smooth"});
     await deliverReport(latest);
   });
 }
}

$("#serviceForm").addEventListener("submit",e=>{
 e.preventDefault();
 const form=$("#serviceForm");
 if(!form.checkValidity()){form.reportValidity();return}
 if(!hasSig){alert("Customer signature is required.");return}
 const o=collect();
 // This is a review/draft stage. Do not increment the report number or record final acceptance yet.
 localStorage.setItem("atd_pending_report",JSON.stringify(o));
 form.style.display="none";
 const legacyActions=document.querySelector(".footer-actions");
 if(legacyActions) legacyActions.style.display="none";
 $("#review").classList.remove("hidden");
 renderReview(o,false);
 window.scrollTo({top:0,behavior:"smooth"});
});
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function generatePDF(saveFile=true){
 try{
  const o=JSON.parse(localStorage.getItem("atd_last_report")||"null");
  if(!o){alert("No completed service report is available.");return}
  if(!window.jspdf || !window.jspdf.jsPDF){
    alert("PDF engine is not loaded. Please refresh the page and try again.");return;
  }
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"letter"});
  const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), M=14;
  const navy=[15,43,91], yellow=[255,223,34];
  const logo=new Image(); logo.src="atd-logo.png";
  await new Promise(resolve=>{logo.onload=resolve;logo.onerror=resolve});

  function textLines(text,w,size=8){doc.setFontSize(size);return doc.splitTextToSize(String(text||"—"),w)}
  function ensure(y,need=18){if(y+need>H-18){doc.addPage();return 16}return y}
  function section(title,y){
    y=ensure(y,14); doc.setFillColor(...yellow);doc.setDrawColor(229,207,28);doc.roundedRect(M,y,W-2*M,8,1.5,1.5,"FD");
    doc.setTextColor(25,35,50);doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(title,M+4,y+5.3);return y+12;
  }
  function field(x,y,w,label,value,fill=false,h=13){
    doc.setFillColor(fill?255:255,fill?248:255,fill?191:255);doc.setDrawColor(205,213,222);doc.roundedRect(x,y,w,h,1,1,fill?"FD":"S");
    doc.setFont("helvetica","bold");doc.setFontSize(6.8);doc.setTextColor(65,76,90);doc.text(label.toUpperCase(),x+3,y+4);
    doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(25,35,50);doc.text(textLines(value,w-6,8.5).slice(0,2),x+3,y+9);
  }
  function table(headers,rows,widths,y){
    const total=widths.reduce((a,b)=>a+b,0), rowH=7;
    y=ensure(y,20);
    doc.setFillColor(244,247,250);doc.setDrawColor(205,213,222);doc.rect(M,y,total,rowH,"FD");
    let x=M;doc.setFont("helvetica","bold");doc.setFontSize(6.5);doc.setTextColor(45,60,80);
    headers.forEach((h,i)=>{doc.text(String(h),x+2,y+4.6);x+=widths[i]});
    y+=rowH;doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.setTextColor(30,40,55);
    const safeRows=rows.length?rows:[["—"]];
    safeRows.forEach(row=>{
      const lineCounts=row.map((v,i)=>textLines(v,widths[i]-4,7.2).length);
      const rh=Math.max(7,Math.min(22,Math.max(...lineCounts)*3.8+3));
      if(y+rh>H-18){doc.addPage();y=16;doc.setFillColor(244,247,250);doc.rect(M,y,total,rowH,"FD");doc.setFont("helvetica","bold");doc.setFontSize(6.5);x=M;headers.forEach((h,i)=>{doc.text(String(h),x+2,y+4.6);x+=widths[i]});y+=rowH;doc.setFont("helvetica","normal");doc.setFontSize(7.2)}
      doc.setDrawColor(205,213,222);doc.rect(M,y,total,rh,"S");x=M;
      row.forEach((v,i)=>{doc.rect(x,y,widths[i],rh,"S");doc.text(textLines(v,widths[i]-4,7.2).slice(0,5),x+2,y+4);x+=widths[i]});
      y+=rh;
    });
    return y;
  }

  if(logo.complete && logo.naturalWidth){const ratio=logo.naturalHeight/logo.naturalWidth,lw=48,lh=Math.min(lw*ratio,18);doc.addImage(logo,"PNG",M,7,lw,lh)}
  doc.setFont("helvetica","bold");doc.setFontSize(19);doc.setTextColor(...navy);doc.text("SERVICE REPORT",W/2,15,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(80,94,112);doc.text("Field Service Report & Customer Acceptance",W/2,20,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("CUSTOMER COPY",W/2,24,{align:"center"});
  doc.setFillColor(255,248,191);doc.setDrawColor(229,207,28);doc.roundedRect(W-72,7,58,16,2,2,"FD");doc.setTextColor(50,58,68);doc.setFontSize(6.5);doc.text("SERVICE REPORT NO.",W-69,12.5);doc.setFont("courier","bold");doc.setFontSize(8);doc.text(o.reportNo,W-69,19);

  let y=29;
  y=section("1. CUSTOMER INFORMATION",y);
  field(M,y,58,"Company Name",o.company,true);field(M+61,y,58,"Contact Person",o.contact);field(M+122,y,62,"Email",o.email);y+=16;
  field(M,y,58,"Phone",o.phone);field(M+61,y,88,"Service Address",o.address);field(M+152,y,32,"City",o.city);y+=16;
  field(M,y,58,"Province",o.province);field(M+61,y,58,"Postal Code",o.postal);y+=19;

  y=section("2. SERVICE INFORMATION",y);
  field(M,y,34,"Service Date",o.serviceDate,true);field(M+37,y,28,"Start Time",o.startTime,true);field(M+68,y,28,"End Time",o.endTime,true);field(M+99,y,31,"Technician",o.technician);field(M+133,y,42,"PO Number",o.po);y+=16;
  field(M,y,48,"Work Order",o.workOrder);field(M+51,y,133,"Service Type",o.serviceType);y+=19;

  y=section("3. EQUIPMENT INFORMATION",y);
  const eqRows=(o.equipment||[]).map(e=>[e.equipment||"—",e.manufacturer||"—",e.model||"—",e.serial||"—",e.partNumber||"—",e.location||"—"]);
  y=table(["Equipment / Machine","Manufacturer","Model","Serial Number","Part Number","Location / Tag"],eqRows,[38,29,28,30,30,29],y)+7;

  y=section("4. WORK PERFORMED & MATERIALS",y);
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("WORK PERFORMED",M,y+3);
  const workLines=textLines(o.work||"—",W-2*M-6,8.5),workH=Math.max(20,Math.min(48,workLines.length*4+8));
  doc.setDrawColor(205,213,222);doc.roundedRect(M,y+6,W-2*M,workH,1,1,"S");doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(25,35,50);doc.text(workLines.slice(0,10),M+3,y+11);y+=workH+8;
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("PARTS / MATERIALS USED",M,y+3);
  const partRows=(o.parts||[]).map(p=>[p.partNo||"—",p.partDesc||"—",p.qty||"—"]);y=table(["Part Number","Description","Qty"],partRows,[48,111,25],y+6)+8;

  y=ensure(y,42);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("SERVICE RESULT / STATUS",M,y+3);
  const status=o.result||"Completed";let bg=[233,248,239],edge=[0,166,81],fg=[17,107,58];
  if(status==="Unable to Complete"){bg=[255,240,241];edge=[237,28,36];fg=[163,22,28]}
  else if(status==="Follow-up Required"){bg=[234,244,255];edge=[0,114,206];fg=[7,84,154]}
  else if(status==="Completed – Further Work Required"){bg=[240,249,223];edge=[164,210,51];fg=[79,110,11]}
  doc.setFillColor(...bg);doc.setDrawColor(...edge);doc.roundedRect(M,y+6,W-2*M,13,2,2,"FD");doc.setTextColor(...fg);doc.setFontSize(10);doc.text(status,M+5,y+14);y+=25;
  field(M,y,89,"Technician Notes",o.techNotes);field(M+95,y,89,"Customer Comments",o.customerComments);y+=29;

  y=section("5. CUSTOMER APPROVAL",y);field(M,y,62,"Customer Name",o.customerName,true);field(M+67,y,117,"Approval / Record","Customer acceptance confirmed");y+=18;
  doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(55,68,84);doc.text("CUSTOMER SIGNATURE",M,y+3);doc.setDrawColor(140,155,170);doc.roundedRect(M,y+6,90,38,1.5,1.5,"S");
  if(o.signature){try{doc.addImage(o.signature,"PNG",M+3,y+9,84,31)}catch(e){}}
  doc.setFillColor(242,246,249);doc.setDrawColor(210,218,226);doc.roundedRect(M+96,y+6,88,38,1.5,1.5,"FD");doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(65,78,95);doc.text(textLines("I acknowledge that the services described above have been performed and that this Service Report accurately records the work completed.",80,7.5),M+100,y+12);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("Approval recorded:",M+100,y+38);doc.setFont("helvetica","normal");doc.text(new Date(o.generatedAt||Date.now()).toLocaleString("en-CA"),M+123,y+38);
  doc.setDrawColor(...navy);doc.line(M,H-14,W-M,H-14);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...navy);doc.text("AUTOMATIONTODAYCA",M,H-9);doc.setFont("helvetica","normal");doc.setTextColor(100,112,128);doc.text("Customer Copy • Field Service Report",W-M,H-9,{align:"right"});
  const dataUri=doc.output("datauristring");
  if(saveFile) doc.save(`${o.reportNo}.pdf`);
  return dataUri;
 }catch(err){console.error("Customer PDF generation failed:",err);alert("Customer PDF could not be generated. Please refresh the page and try again.");return null;}
}
async function deliverReport(o){
 const status=$("#deliveryStatus");
 const button=$("#sendCustomerCopy");
 if(status) status.textContent="";
 if(!DELIVERY_CONFIG.webAppUrl || DELIVERY_CONFIG.webAppUrl.includes("PASTE_GOOGLE_APPS_SCRIPT")){
   if(status) status.textContent="Delivery is not configured yet. Add the Google Apps Script Web App URL first.";
   return false;
 }
 try{
   if(button){button.disabled=true;button.textContent="SENDING...";}
   const dataUri=await generatePDF(false);
   if(!dataUri) throw new Error("PDF generation failed");
   const pdfBase64=dataUri.split(",")[1];
   const payload={
     googleCredential,
     authorizationProof:window.__ATD_AUTH_PROOF||"",
     reportNo:o.reportNo,
     customerEmail:o.email,
     company:o.company,
     customerName:o.customerName,
     pdfBase64,
     filename:`${o.reportNo}.pdf`
   };
   // text/plain avoids a browser CORS preflight when calling Google Apps Script.
   await fetch(DELIVERY_CONFIG.webAppUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
   if(status) status.innerHTML="✓ Customer copy delivery request sent. The PDF is being saved to Google Drive and emailed.";
   localStorage.setItem("atd_last_delivery",new Date().toISOString());
   return true;
 }catch(err){
   console.error("Delivery failed:",err);
   if(status) status.textContent="Delivery could not be submitted. Use SEND CUSTOMER COPY to try again.";
   return false;
 }finally{
   if(button){button.disabled=false;button.textContent="SEND CUSTOMER COPY";}
 }
}
function downloadData(){generatePDF(true);}


/* =========================================================
   GOOGLE SIGN-IN — V13
   SERVER-AUTHORIZED / NO FRONTEND USER IDENTITY
   ========================================================= */

/*
 * SECURITY PURPOSE:
 * - The Google Client ID is public configuration.
 * - The Google ID token is sent to Apps Script.
 * - Code.gs verifies the token and makes the authorization decision.
 * - Code.gs returns a short-lived authorization proof.
 * - Private server configuration is never embedded here.
 * - The frontend does not decode, store, or log the user's Google
 *   email/name.
 *
 * TRANSPORT:
 * V13 uses the matching callback-script transport.
 * No iframe and no window.postMessage() authentication bridge.
 */

const GOOGLE_CLIENT_ID =
  "246009211153-kqkpn2d35ebrgu5osa1l12i8tt4rhd21.apps.googleusercontent.com";

let googleAuthenticated = false;
let googleCredential = null;

window.__ATD_AUTH_PROOF = "";


function loadGoogleIdentityServices(){

  return new Promise((resolve,reject)=>{

    if(
      window.google &&
      window.google.accounts
    ){

      resolve();
      return;

    }

    const existing =
      document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

    if(existing){

      existing.addEventListener(
        "load",
        resolve,
        {once:true}
      );

      existing.addEventListener(
        "error",
        reject,
        {once:true}
      );

      return;

    }

    const script =
      document.createElement("script");

    script.src =
      "https://accounts.google.com/gsi/client";

    script.async=true;
    script.defer=true;
    script.onload=resolve;
    script.onerror=reject;

    document.head.appendChild(script);

  });

}


function authorizeThroughBackend(credential){

  return new Promise(function(resolve,reject){

    if(!credential){

      reject(
        new Error(
          "Google authentication credential is missing."
        )
      );

      return;

    }

    const callbackName =
      "atdAuthCallback_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2);

    const script =
      document.createElement("script");

    let finished=false;

    function cleanup(){

      if(
        script &&
        script.parentNode
      ){

        script.parentNode.removeChild(
          script
        );

      }

      try{
        delete window[callbackName];
      }catch(_){
        window[callbackName]=undefined;
      }

    }

    function finish(result){

      if(finished) return;

      finished=true;
      cleanup();
      resolve(result);

    }

    function fail(error){

      if(finished) return;

      finished=true;
      cleanup();
      reject(error);

    }

    window[callbackName]=function(result){
      finish(result);
    };

    script.onerror=function(){

      fail(
        new Error(
          "Authorization server could not be reached."
        )
      );

    };

    const params =
      new URLSearchParams();

    params.set(
      "mode",
      "auth"
    );

    params.set(
      "callback",
      callbackName
    );

    params.set(
      "googleCredential",
      credential
    );

    script.src =
      DELIVERY_CONFIG.webAppUrl +
      "?" +
      params.toString();

    document.head.appendChild(
      script
    );

    setTimeout(function(){

      if(!finished){

        fail(
          new Error(
            "Authorization server timed out."
          )
        );

      }

    },20000);

  });

}


async function handleGoogleCredential(response){

  /*
   * Do not decode the Google JWT in the frontend.
   * The backend is the authority for access control.
   */

  const credential =
    String(
      response &&
      response.credential ||
      ""
    ).trim();

  if(!credential){

    showGoogleLoginError(
      "Google sign-in failed. Please try again."
    );

    return;

  }

  try{

    const proof =
      await authorizeThroughBackend(
        credential
      );

    if(
      !proof ||
      proof.ok!==true ||
      proof.authorized!==true ||
      !proof.proof
    ){

      throw new Error(
        "Access denied."
      );

    }

    googleAuthenticated=true;
    googleCredential=credential;
    window.__ATD_AUTH_PROOF=proof.proof;

    unlockServiceReport();

  }catch(err){

    console.error(
      "AutomationTodayCA authorization failed:",
      err
    );

    googleAuthenticated=false;
    googleCredential=null;
    window.__ATD_AUTH_PROOF="";

    showGoogleLoginError(
      "Access denied. This Google account is not authorized."
    );

  }

}


function showGoogleLoginError(message){

  const el =
    document.getElementById(
      "googleLoginError"
    );

  if(el){
    el.textContent=message;
  }

}


function createGoogleLoginScreen(){

  if(
    document.getElementById(
      "googleLoginOverlay"
    )
  ){
    return;
  }

  const overlay =
    document.createElement("div");

  overlay.id =
    "googleLoginOverlay";

  overlay.innerHTML=`
    <div class="atd-login-overlay">
      <div class="atd-login-card">
        <div class="atd-login-logo">
          <img src="atd-logo.png"
               alt="AutomationTodayCA"
               onerror="this.style.display='none'">
        </div>

        <div class="atd-login-title">
          AutomationTodayCA Service Report
        </div>

        <div class="atd-login-subtitle">
          Authorized access required
        </div>

        <div id="googleLoginButton"></div>

        <div id="googleLoginError"
             role="alert"
             aria-live="polite"></div>

        <div class="atd-login-note">
          Sign in with your authorized Google account to continue.
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(
    overlay
  );

}


function addGoogleLoginStyles(){

  if(
    document.getElementById(
      "atdGoogleLoginStyles"
    )
  ){
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "atdGoogleLoginStyles";

  style.textContent=`
    .atd-login-overlay{
      position:fixed;
      inset:0;
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(15,23,42,.96);
    }

    .atd-login-card{
      width:min(440px,calc(100vw - 40px));
      padding:34px;
      border-radius:16px;
      background:#fff;
      box-shadow:0 20px 60px rgba(0,0,0,.28);
      text-align:center;
    }

    .atd-login-logo{
      min-height:48px;
      margin-bottom:12px;
    }

    .atd-login-logo img{
      max-width:220px;
      max-height:58px;
    }

    .atd-login-title{
      color:#1f2937;
      font-size:21px;
      font-weight:700;
      margin-bottom:8px;
    }

    .atd-login-subtitle{
      color:#718096;
      font-size:14px;
      margin-bottom:28px;
    }

    #googleLoginButton{
      min-height:44px;
      display:flex;
      align-items:center;
      justify-content:center;
      margin:0 auto;
    }

    .atd-login-note{
      margin-top:20px;
      color:#8a95a5;
      font-size:12px;
      line-height:1.5;
    }

    #googleLoginError{
      color:#b42318;
      font-size:13px;
      line-height:1.45;
      margin-top:14px;
      min-height:18px;
    }
  `;

  document.head.appendChild(
    style
  );

}


function lockServiceReport(){

  googleAuthenticated=false;

  document.body.classList.add(
    "atd-auth-locked"
  );

}


function unlockServiceReport(){

  googleAuthenticated=true;

  document.body.classList.remove(
    "atd-auth-locked"
  );

  const overlay =
    document.getElementById(
      "googleLoginOverlay"
    );

  if(overlay){
    overlay.remove();
  }

}


function checkGoogleSession(){

  /*
   * SECURITY:
   * Never trust browser storage as authorization.
   * Every page load starts locked.
   */

  googleAuthenticated=false;
  googleCredential=null;
  window.__ATD_AUTH_PROOF="";

  sessionStorage.removeItem(
    "atd_google_authenticated"
  );

  sessionStorage.removeItem(
    "atd_google_email"
  );

  sessionStorage.removeItem(
    "atd_google_name"
  );

  return false;

}


async function startGoogleAuthentication(){

  createGoogleLoginScreen();
  addGoogleLoginStyles();

  try{

    await loadGoogleIdentityServices();

    google.accounts.id.initialize({

      client_id:GOOGLE_CLIENT_ID,
      callback:handleGoogleCredential,
      auto_select:false,
      cancel_on_tap_outside:false

    });

    google.accounts.id.renderButton(

      document.getElementById(
        "googleLoginButton"
      ),

      {
        type:"standard",
        theme:"outline",
        size:"large",
        text:"signin_with",
        shape:"rectangular",
        logo_alignment:"left",
        width:320
      }

    );

  }catch(err){

    console.error(
      "Google authentication initialization failed:",
      err
    );

    showGoogleLoginError(
      "Google Sign-In could not be initialized. Please refresh the page."
    );

  }

}


function googleLogout(){

  googleAuthenticated=false;
  googleCredential=null;
  window.__ATD_AUTH_PROOF="";

  sessionStorage.removeItem(
    "atd_google_authenticated"
  );

  sessionStorage.removeItem(
    "atd_google_email"
  );

  sessionStorage.removeItem(
    "atd_google_name"
  );

  location.reload();

}


/* Start authentication after the Service Report code has loaded. */
if(!checkGoogleSession()){
  startGoogleAuthentication();
}

/* =========================================================
   V14 FORM UX / VALIDATION LAYER
   ---------------------------------------------------------
   IMPORTANT:
   This block changes only form UX/data collection.
   Google authentication, authorization proof, client ID,
   delivery endpoint, and security flow above are untouched.
   ========================================================= */
(function initV14FormUX(){
  const form = document.getElementById("serviceForm");
  if(!form) return;

  function esc(value){
    return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  }

  /* ---------- CSS injected here so index.html does not need changes ---------- */
  if(!document.getElementById("atd-v14-ux-style")){
    const style=document.createElement("style");
    style.id="atd-v14-ux-style";
    style.textContent=`
      .atd-v14-section-status{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;white-space:nowrap}
      .atd-v14-section-status .dot{width:9px;height:9px;border-radius:50%;display:inline-block;background:#c8d0da}
      .atd-v14-section-status.complete{color:#177245}.atd-v14-section-status.complete .dot{background:#27ae60}
      .atd-v14-section-status.optional{color:#9a6800}.atd-v14-section-status.optional .dot{background:#f4c430}
      .atd-v14-section-status.required{color:#b42318}.atd-v14-section-status.required .dot{background:#e53935}
      .atd-v14-required-missing{background:#fff8bf !important;border-color:#f0a400 !important;box-shadow:0 0 0 1px rgba(240,164,0,.16)}
      .atd-v14-invalid{border-color:#e53935 !important}
      .atd-v14-repeat-wrap{display:flex;flex-direction:column;gap:7px;width:100%}
      .atd-v14-repeat-row{display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:7px;align-items:center}
      .atd-v14-repeat-row input{width:100%;box-sizing:border-box}
      .atd-v14-add{align-self:flex-start;border:1px solid #1769e0;background:#eef6ff;color:#1769e0;border-radius:5px;padding:5px 10px;font-weight:800;cursor:pointer}
      .atd-v14-delete{width:34px;height:34px;border:1px solid #ef4444;background:#fff;color:#dc2626;border-radius:5px;font-weight:900;cursor:pointer}
      .atd-v14-delete:disabled{opacity:.35;cursor:not-allowed}
      .atd-v14-time-row{display:contents}
      .atd-v14-time-row input{min-width:0}
      .atd-v14-legend{display:flex;justify-content:flex-end;gap:14px;align-items:center;font-size:11px;margin:4px 0 8px;color:#526173}
      .atd-v14-legend span{display:inline-flex;align-items:center;gap:5px;font-weight:700}
      .atd-v14-legend i{width:10px;height:10px;border-radius:50%;display:inline-block}
      .atd-v14-legend .g{background:#27ae60}.atd-v14-legend .y{background:#f4c430}.atd-v14-legend .r{background:#e53935}
      .atd-v14-step-complete b{background:#27ae60 !important}.atd-v14-step-optional b{background:#f4c430 !important}.atd-v14-step-required b{background:#e53935 !important}
      .atd-v14-section-complete{box-shadow:inset 4px 0 0 #27ae60}.atd-v14-section-optional{box-shadow:inset 4px 0 0 #f4c430}.atd-v14-section-required{box-shadow:inset 4px 0 0 #e53935}
      .atd-v14-time-label{font-weight:700}
      @media(max-width:760px){.atd-v14-legend{justify-content:flex-start;flex-wrap:wrap}.atd-v14-repeat-row{grid-template-columns:minmax(0,1fr) 34px}}
    `;
    document.head.appendChild(style);
  }

  /* ---------- Required start/end time ---------- */
  const serviceDate=form.querySelector('[name="serviceDate"]');
  const serviceGrid=serviceDate && serviceDate.closest(".grid");
  if(serviceGrid && !serviceGrid.querySelector('[name="startTime"]')){
    const makeTime=(name,label)=>{
      const wrap=document.createElement("label");
      wrap.className="atd-v14-time-label yellow-field";
      wrap.innerHTML=`${label} *<input type="time" name="${name}" required aria-required="true"></label>`;
      return wrap;
    };
    const start=makeTime("startTime","Start Time");
    const end=makeTime("endTime","End Time");
    serviceDate.closest("label").after(start,end);
  }

  /* ---------- Dynamic email / phone fields ---------- */
  function setupRepeatField(fieldName, labelText, type, requiredFirst){
    const source=form.querySelector(`[name="${fieldName}"]`);
    if(!source || source.dataset.v14Enhanced==="1") return;
    const label=source.closest("label");
    if(!label) return;
    const initial=source.value||"";
    label.innerHTML="";
    const title=document.createElement("span");
    title.innerHTML=labelText+(requiredFirst?" *":"");
    label.appendChild(title);
    const wrap=document.createElement("div");
    wrap.className="atd-v14-repeat-wrap";
    wrap.dataset.field=fieldName;
    label.appendChild(wrap);
    const add=document.createElement("button");
    add.type="button"; add.className="atd-v14-add";
    add.textContent=fieldName==="email"?"＋ Add Email":"＋ Add Phone";
    add.addEventListener("click",()=>addRow(fieldName));
    label.appendChild(add);

    function addRow(name,value="",focus=false){
      const row=document.createElement("div"); row.className="atd-v14-repeat-row";
      const input=document.createElement("input");
      input.type=name==="email"?"email":"tel";
      input.name=name;
      input.value=value;
      input.placeholder=name==="email"?"e.g. john@company.com":"e.g. 416-555-1234";
      if(requiredFirst && wrap.children.length===0) input.required=true;
      input.setAttribute("aria-required",input.required?"true":"false");
      input.dataset.v14Enhanced="1";
      const del=document.createElement("button");
      del.type="button"; del.className="atd-v14-delete"; del.textContent="🗑";
      del.title=`Remove ${name}`;
      del.addEventListener("click",()=>{
        if(wrap.children.length>1){row.remove(); updateAll();}
      });
      row.append(input,del); wrap.appendChild(row); updateAll();
      if(focus) input.focus();
    }
    function updateAll(){
      [...wrap.children].forEach((row,i)=>{
        const input=row.querySelector("input"), del=row.querySelector("button");
        input.required=!!(requiredFirst && i===0);
        input.setAttribute("aria-required",input.required?"true":"false");
        del.disabled=wrap.children.length===1;
      });
      updateStatuses();
    }
    addRow(fieldName,initial,false);
    source.remove();
    label.dataset.v14Repeat="1";
  }
  setupRepeatField("email","Email","email",true);
  setupRepeatField("phone","Phone","tel",false);

  /* ---------- Section/progress legend ---------- */
  if(!document.getElementById("atd-v14-legend")){
    const legend=document.createElement("div"); legend.id="atd-v14-legend"; legend.className="atd-v14-legend";
    legend.innerHTML='<span><i class="g"></i>Complete</span><span><i class="y"></i>Missing optional info</span><span><i class="r"></i>Missing required info</span>';
    const progress=document.querySelector(".progress");
    if(progress) progress.after(legend);
  }

  /* ---------- Required/optional section definitions ---------- */
  const sections=[...form.querySelectorAll("section.card")];
  const sectionRules=[
    {required:["company","contact","email"],optional:["address","city","province","postal","phone"]},
    {required:["serviceDate","startTime","endTime","technician","serviceType"],optional:["po","workOrder"]},
    {required:[],optional:["equipment","manufacturer","model","serial","partNumber","location"]},
    {required:["work","result"],optional:["partNo","partDesc","qty","techNotes","customerComments"]},
    {required:["customerName","__signature"],optional:[]}
  ];

  function getFields(name){
    if(name==="__signature") return [];
    return [...form.querySelectorAll(`[name="${name}"]`)];
  }
  function hasValue(el){return !!(el && String(el.value||"").trim());}
  function requiredComplete(name){
    if(name==="__signature") return !!hasSig;
    const fields=getFields(name);
    return fields.length>0 && fields.some(hasValue);
  }
  function anyOptionalValue(names){
    return names.some(name=>getFields(name).some(hasValue));
  }
  function optionalComplete(name){
    if(name==="equipment") return [...document.querySelectorAll(".equipment")].every(row=>{
      const fields=[...row.querySelectorAll("input")];
      return fields.length===0 || fields.every(hasValue);
    });
    if(["partNo","partDesc","qty"].includes(name)){
      const rows=[...document.querySelectorAll(".part-row")];
      return rows.every(row=>{
        const vals=[...row.querySelectorAll("input")].map(hasValue);
        return !vals.some(Boolean) || vals.every(Boolean);
      });
    }
    const fields=getFields(name);
    return fields.length===0 || fields.every(hasValue);
  }

  function sectionState(rule,index){
    const missing=rule.required.filter(n=>!requiredComplete(n));
    if(missing.length) return {state:"required",missing};
    if(index===4) return {state:"complete",missing:[]};
    const optionalMissing=rule.optional.some(name=>!optionalComplete(name));
    if(optionalMissing) return {state:"optional",missing:[]};
    return {state:"complete",missing:[]};
  }

  function markMissingFields(rule){
    rule.required.forEach(name=>{
      if(name==="__signature"){
        const sig=document.getElementById("signature");
        if(!hasSig && sig) sig.classList.add("atd-v14-required-missing");
        return;
      }
      const fields=getFields(name);
      if(!fields.some(hasValue)) fields.forEach(el=>el.classList.add("atd-v14-required-missing"));
    });
  }

  function addStatusToSection(section,state){
    section.classList.remove("atd-v14-section-complete","atd-v14-section-optional","atd-v14-section-required");
    section.classList.add(`atd-v14-section-${state}`);
    const title=section.querySelector(".section-title");
    if(!title) return;
    let badge=title.querySelector(".atd-v14-section-status");
    if(!badge){badge=document.createElement("span");badge.className="atd-v14-section-status";title.appendChild(badge)}
    const text=state==="complete"?"Complete":state==="optional"?"Missing optional info":"Missing required info";
    badge.className=`atd-v14-section-status ${state}`;
    badge.innerHTML=`<span class="dot"></span>${text}`;
  }

  function updateProgress(states){
    const steps=[...document.querySelectorAll(".progress .step")];
    steps.forEach((step,i)=>{
      step.classList.remove("atd-v14-step-complete","atd-v14-step-optional","atd-v14-step-required");
      const state=states[i]||"optional";
      step.classList.add(`atd-v14-step-${state}`);
    });
    // Step 6 = overall completion; only green after final confirmation.
    if(steps[5]){
      steps[5].classList.remove("atd-v14-step-complete","atd-v14-step-optional","atd-v14-step-required");
      const finalDone=!!localStorage.getItem("atd_last_report");
      steps[5].classList.add(`atd-v14-step-${finalDone?"complete":states.some(s=>s==="required")?"required":"optional"}`);
    }
  }

  function updateStatuses(){
    form.querySelectorAll(".atd-v14-required-missing").forEach(el=>el.classList.remove("atd-v14-required-missing"));
    const states=[];
    sections.forEach((section,i)=>{
      const rule=sectionRules[i]||{required:[],optional:[]};
      const s=sectionState(rule,i); states[i]=s.state;
      addStatusToSection(section,s.state);
      markMissingFields(rule);
    });
    updateProgress(states);
  }

  /* ---------- Replace collect() with V14-aware collection ---------- */
  const legacyCollect=collect;
  collect=function(){
    const fd=new FormData(form);
    const o=Object.fromEntries(fd.entries());
    o.reportNo=reportNo();
    const values=name=>[...form.querySelectorAll(`[name="${name}"]`)].map(x=>String(x.value||"").trim()).filter(Boolean);
    o.emails=values("email");
    o.email=o.emails[0]||"";
    o.phones=values("phone");
    o.phone=o.phones[0]||"";
    const readInputs=el=>Object.fromEntries([...el.querySelectorAll("input,select,textarea")].filter(i=>i.name).map(i=>[i.name,i.value]));
    o.equipment=[...document.querySelectorAll(".equipment")].map(readInputs);
    o.parts=[...document.querySelectorAll(".part-row")].map(readInputs).filter(x=>x.partNo||x.partDesc||x.qty);
    o.signature=hasSig?canvas.toDataURL("image/png"):"";
    o.generatedAt=new Date().toISOString();
    return o;
  };

  /* ---------- V14 delivery wrapper: preserve security proof, add multiple recipients ---------- */
  const legacyDeliverReport=deliverReport;
  deliverReport=async function(o){
    // If there is only one email, use the tested legacy path exactly.
    if(!Array.isArray(o.emails) || o.emails.length<=1) return legacyDeliverReport(o);
    const status=$("#deliveryStatus"),button=$("#sendCustomerCopy");
    if(status) status.textContent="";
    try{
      if(button){button.disabled=true;button.textContent="SENDING...";}
      const dataUri=await generatePDF(false);
      if(!dataUri) throw new Error("PDF generation failed");
      const pdfBase64=dataUri.split(",")[1];
      const payload={
        googleCredential,
        authorizationProof:window.__ATD_AUTH_PROOF||"",
        reportNo:o.reportNo,
        customerEmail:o.emails[0],
        customerEmails:o.emails,
        company:o.company,
        customerName:o.customerName,
        pdfBase64,
        filename:`${o.reportNo}.pdf`
      };
      await fetch(DELIVERY_CONFIG.webAppUrl,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
      if(status) status.innerHTML="✓ Customer copy delivery request sent to all customer email addresses.";
      localStorage.setItem("atd_last_delivery",new Date().toISOString());
      return true;
    }catch(err){
      console.error("Delivery failed:",err);
      if(status) status.textContent="Delivery could not be submitted. Use SEND CUSTOMER COPY to try again.";
      return false;
    }finally{
      if(button){button.disabled=false;button.textContent="SEND CUSTOMER COPY";}
    }
  };

  /* ---------- V14 PDF data support ---------- */
  const legacyGeneratePDF=generatePDF;
  generatePDF=async function(saveFile=true){
    const raw=JSON.parse(localStorage.getItem("atd_last_report")||"null");
    if(!raw) return legacyGeneratePDF(saveFile);
    const original={...raw};
    const transformed={...raw, email:Array.isArray(raw.emails)?raw.emails.join(", "):raw.email||"", phone:Array.isArray(raw.phones)?raw.phones.join(", "):raw.phone||""};
    if(raw.startTime) transformed.technician = transformed.technician ? `${transformed.technician} | Start: ${raw.startTime}` : `Start: ${raw.startTime}`;
    if(raw.endTime) transformed.po = transformed.po ? `${transformed.po} | End: ${raw.endTime}` : `End: ${raw.endTime}`;
    localStorage.setItem("atd_last_report",JSON.stringify(transformed));
    try{ return await legacyGeneratePDF(saveFile); }
    finally{ localStorage.setItem("atd_last_report",JSON.stringify(original)); }
  };

  /* ---------- Keep existing submit validation, but update visual state before browser validation ---------- */
  form.addEventListener("input",updateStatuses,true);
  form.addEventListener("change",updateStatuses,true);
  form.addEventListener("blur",updateStatuses,true);
  if(typeof clearSignature==="function"){
    const legacyClearSignature=clearSignature;
    clearSignature=function(){legacyClearSignature();updateStatuses();};
  }

  // Add time fields to the existing PDF by enriching generated report after collection.
  const originalRenderReview=renderReview;
  renderReview=function(o,finalized=false){
    originalRenderReview(o,finalized);
    const box=document.querySelector("#reviewContent .review-grid");
    if(box && !box.querySelector(".v14-times")){
      const t=document.createElement("div");t.className="v14-times";
      t.innerHTML=`<span>Start Time</span><strong>${esc(o.startTime||"—")}</strong><span>End Time</span><strong>${esc(o.endTime||"—")}</strong>`;
      box.appendChild(t);
    }
  };

  updateStatuses();
})();

