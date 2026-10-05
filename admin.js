import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
import{enableComplaintNotifications}from"./push-notifications.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const ADMIN_USERNAME="raja";
const ADMIN_PASSWORD="246810";
const login=document.querySelector("#login"),out=document.querySelector("#loginResult"),dash=document.querySelector("#dashboard"),list=document.querySelector("#list");

// Agar pehle se login hai (session saved hai), to seedha dashboard dikhayen
if(sessionStorage.getItem("rajaAdminLoggedIn")==="true"){
  login.style.display="none";dash.style.display="block";load();
}

login.addEventListener("submit",e=>{
  e.preventDefault();
  if(email.value.trim()===ADMIN_USERNAME && password.value===ADMIN_PASSWORD){
    sessionStorage.setItem("rajaAdminLoggedIn","true");
    out.textContent="";
    login.style.display="none";dash.style.display="block";load();
  } else {
    out.textContent="Galat username ya password. Dobara try karein.";
  }
});

async function load(){
const{data,error}=await supabase.from("complaints").select("*").order("created_at",{ascending:false});
const{data:techs}=await supabase.from("technicians").select("id,name");
if(error){list.textContent=error.message;return}
const techOptions=(techs||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
list.innerHTML=data.map(x=>`<article style="margin:15px 0"><b>${x.complaint_number||x.id}</b><br>${x.customer_name}<br>${x.phone}<br>${x.service}<br>${x.problem}<p>Status: <select data-id="${x.id}"><option>Pending</option><option>Assigned</option><option>In Progress</option><option>Completed</option></select></p><p>Technician: <select data-tech="${x.id}"><option value="">-- Koi nahi --</option>${techOptions}</select></p>${x.photo_url?`<a href="${x.photo_url}" target="_blank">📷 Photo</a>`:""}<p><button type="button" class="btn" style="background:#8e44ad;padding:8px 14px;font-size:13px" data-invoice="${x.id}">🧾 Invoice Banayein</button> <a href="invoice.html?complaint=${x.complaint_number}" target="_blank" style="font-size:13px">Invoice dekhein</a></p></article>`).join("");
list.querySelectorAll("select[data-id]").forEach(s=>{const row=data.find(x=>x.id===s.dataset.id);s.value=row.status;s.onchange=async()=>{const{error}=await supabase.from("complaints").update({status:s.value}).eq("id",s.dataset.id);if(error)alert(error.message)}});
list.querySelectorAll("select[data-tech]").forEach(s=>{const row=data.find(x=>x.id===s.dataset.tech);s.value=row.technician_id||"";s.onchange=async()=>{const{error}=await supabase.from("complaints").update({technician_id:s.value||null,status:s.value?"Assigned":row.status}).eq("id",s.dataset.tech);if(error)alert(error.message);else load()}});
list.querySelectorAll("[data-invoice]").forEach(btn=>{
  btn.onclick=()=>{
    const row=data.find(x=>x.id===btn.dataset.invoice);
    openInvoiceForm(row);
  };
});
}

function openInvoiceForm(complaint){
  const serviceCharge=prompt("Service charge (₹):","0");
  if(serviceCharge===null)return;
  const partsCharge=prompt("Parts charge (₹):","0");
  if(partsCharge===null)return;
  const labourCharge=prompt("Labour charge (₹):","0");
  if(labourCharge===null)return;
  const discount=prompt("Discount (₹, agar koi nahi to 0):","0");
  if(discount===null)return;
  const gst=prompt("GST % (agar nahi lagana to 0):","0");
  if(gst===null)return;
  saveInvoice(complaint,{
    service_charge:parseFloat(serviceCharge)||0,
    parts_charge:parseFloat(partsCharge)||0,
    labour_charge:parseFloat(labourCharge)||0,
    discount:parseFloat(discount)||0,
    gst_percent:parseFloat(gst)||0
  });
}

async function saveInvoice(complaint,charges){
  const subtotal=charges.service_charge+charges.parts_charge+charges.labour_charge-charges.discount;
  const total=subtotal+(subtotal*charges.gst_percent/100);
  const invoiceNumber="INV-"+complaint.complaint_number.replace("RR-","");
  const{error}=await supabase.from("invoices").upsert({
    complaint_id:complaint.id,
    invoice_number:invoiceNumber,
    ...charges,
    total:Math.round(total*100)/100
  },{onConflict:"invoice_number"});
  if(error){alert("❌ "+error.message);return}
  alert("✅ Invoice ban gaya! 'Invoice dekhein' link se check karein.");
}
document.querySelector("#refresh").onclick=()=>{load();loadDashboard();};

const notifBtn=document.querySelector("#enableNotif"),notifStatus=document.querySelector("#notifStatus");
if("Notification"in window && Notification.permission==="granted"){
  notifStatus.textContent="✅ Notifications already ON hain.";
}
notifBtn.onclick=async()=>{
  notifStatus.textContent="Setup ho raha hai...";
  const result=await enableComplaintNotifications();
  notifStatus.textContent=(result===true)?"✅ Notifications ON ho gaye!":("❌ "+result);
};

// ---- Catalogue / Rate List management ----
const catForm=document.querySelector("#catForm"),catResult=document.querySelector("#catResult"),catListEl=document.querySelector("#catList");

async function loadCatalogue(){
  const{data,error}=await supabase.from("catalogue").select("*").order("display_order",{ascending:true}).order("created_at",{ascending:true});
  if(error){catListEl.textContent=error.message;return}
  catListEl.innerHTML=data.map(x=>`<article style="margin:12px 0;border-top:1px solid #ddd;padding-top:10px">
    ${x.image_url?`<img src="${x.image_url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;display:block;margin-bottom:6px">`:""}
    <b>${x.name}</b> (${x.category})<br>${x.price}
    <br><button type="button" class="btn" style="background:#c0392b;padding:6px 14px;font-size:13px;margin-top:6px" data-del="${x.id}" data-img="${x.image_url||''}">Delete</button>
  </article>`).join("")||"<p>Abhi koi item nahi hai.</p>";
  catListEl.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick=async()=>{
      if(!confirm("Delete karein?"))return;
      await supabase.from("catalogue").delete().eq("id",btn.dataset.del);
      const img=btn.dataset.img;
      if(img){const path=img.split("/catalogue-images/")[1];if(path)await supabase.storage.from("catalogue-images").remove([path]);}
      loadCatalogue();
    };
  });
}
loadCatalogue();

catForm.addEventListener("submit",async e=>{
  e.preventDefault();
  catResult.textContent="Save ho raha hai...";
  const category=document.querySelector("#catCategory").value;
  const name=document.querySelector("#catName").value.trim();
  const price=document.querySelector("#catPrice").value.trim();
  const photoInput=document.querySelector("#catPhoto");
  let image_url=null;
  try{
    if(photoInput.files[0]){
      const file=photoInput.files[0];
      const path=`${Date.now()}-${file.name}`;
      const{error:upErr}=await supabase.storage.from("catalogue-images").upload(path,file);
      if(upErr)throw upErr;
      image_url=supabase.storage.from("catalogue-images").getPublicUrl(path).data.publicUrl;
    }
    const{error}=await supabase.from("catalogue").insert({category,name,price,image_url});
    if(error)throw error;
    catResult.textContent="✅ Add ho gaya!";
    catForm.reset();
    loadCatalogue();
  }catch(err){
    catResult.textContent="❌ "+(err.message||err);
  }
});

// ---- Technician management + location ----
const techForm=document.querySelector("#techForm"),techResult=document.querySelector("#techResult"),techListEl=document.querySelector("#techList");
const SITE_BASE="https://my-website1.samiuddin30872.workers.dev";

function timeAgo(iso){
  if(!iso)return"Kabhi nahi";
  const diffMs=Date.now()-new Date(iso).getTime();
  const mins=Math.floor(diffMs/60000);
  if(mins<1)return"Abhi-abhi";
  if(mins<60)return mins+" min pehle";
  const hrs=Math.floor(mins/60);
  if(hrs<24)return hrs+" ghante pehle";
  return Math.floor(hrs/24)+" din pehle";
}

async function loadTechnicians(){
  const{data,error}=await supabase.from("technicians").select("*").order("created_at",{ascending:true});
  if(error){techListEl.textContent=error.message;return}
  techListEl.innerHTML=(data||[]).map(t=>{
    const link=`${SITE_BASE}/technician.html?code=${t.access_code}`;
    const hasLoc=t.latitude&&t.longitude;
    const mapLink=hasLoc?`https://www.google.com/maps?q=${t.latitude},${t.longitude}`:null;
    return `<article style="margin:14px 0;border-top:1px solid #ddd;padding-top:10px">
      <b>${t.name}</b> — ${t.phone} ${t.area?`(${t.area})`:""}<br>
      <span style="font-size:13px;color:#4d5f7a">Location: ${hasLoc?`<a href="${mapLink}" target="_blank">📍 Map par dekhein</a> (${timeAgo(t.location_updated_at)})`:"Abhi share nahi hui"}</span><br>
      <span style="font-size:13px;color:#4d5f7a">Sharing link: <a href="${link}" target="_blank">${link}</a></span><br>
      <button type="button" class="btn" style="background:#c0392b;padding:6px 14px;font-size:13px;margin-top:6px" data-del="${t.id}">Delete</button>
    </article>`;
  }).join("")||"<p>Abhi koi technician add nahi hua.</p>";
  techListEl.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick=async()=>{
      if(!confirm("Technician delete karein?"))return;
      await supabase.from("technicians").delete().eq("id",btn.dataset.del);
      loadTechnicians();
    };
  });
}
loadTechnicians();

techForm.addEventListener("submit",async e=>{
  e.preventDefault();
  techResult.textContent="Save ho raha hai...";
  const name=document.querySelector("#techName").value.trim();
  const phone=document.querySelector("#techPhone").value.trim();
  const area=document.querySelector("#techArea").value.trim();
  const{error}=await supabase.from("technicians").insert({name,phone,area,status:"Active"});
  if(error){techResult.textContent="❌ "+error.message;return}
  techResult.textContent="✅ Add ho gaya!";
  techForm.reset();
  loadTechnicians();
});

// ---- Dashboard analytics ----
async function loadDashboard(){
  const{data:complaints}=await supabase.from("complaints").select("created_at,status,service");
  const{data:invoices}=await supabase.from("invoices").select("total,created_at");
  if(!complaints)return;

  const now=new Date();
  const todayStr=now.toDateString();
  const thisMonth=now.getMonth(),thisYear=now.getFullYear();

  const todayCount=complaints.filter(c=>new Date(c.created_at).toDateString()===todayStr).length;
  const monthComplaints=complaints.filter(c=>{const d=new Date(c.created_at);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear});
  const pendingCount=complaints.filter(c=>c.status==="Pending"||c.status==="In Progress"||c.status==="Assigned").length;
  const completedCount=complaints.filter(c=>c.status==="Completed").length;

  const monthEarning=(invoices||[]).filter(inv=>{const d=new Date(inv.created_at);return d.getMonth()===thisMonth&&d.getFullYear()===thisYear}).reduce((sum,inv)=>sum+Number(inv.total||0),0);

  const serviceCounts={};
  complaints.forEach(c=>{if(c.service)serviceCounts[c.service]=(serviceCounts[c.service]||0)+1});
  const topService=Object.entries(serviceCounts).sort((a,b)=>b[1]-a[1])[0];

  document.querySelector("#statToday").textContent=todayCount;
  document.querySelector("#statMonth").textContent=monthComplaints.length;
  document.querySelector("#statPending").textContent=pendingCount;
  document.querySelector("#statCompleted").textContent=completedCount;
  document.querySelector("#statEarning").textContent="₹"+monthEarning.toLocaleString("en-IN");
  document.querySelector("#statTopService").textContent=topService?topService[0]:"-";
}
loadDashboard();
