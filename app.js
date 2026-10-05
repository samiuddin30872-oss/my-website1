import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const form=document.querySelector("#complaintForm"),result=document.querySelector("#result");
const complaintNo=()=>"RR-"+Math.floor(100000+Math.random()*900000);
form.addEventListener("submit",async e=>{e.preventDefault();result.textContent="Submitting...";
const no=complaintNo(),photo=document.querySelector("#photo").files[0];let photo_url=null;
if(photo){const safe=photo.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`${no}/${Date.now()}-${safe}`;
const up=await supabase.storage.from("complaint-photos").upload(path,photo);
if(up.error){result.textContent="Photo upload error: "+up.error.message;return}
photo_url=supabase.storage.from("complaint-photos").getPublicUrl(path).data.publicUrl}
const row={complaint_number:no,customer_name:document.querySelector("#name").value,phone:document.querySelector("#phone").value,
service:document.querySelector("#service").value,problem:document.querySelector("#problem").value,photo_url,address:document.querySelector("#address").value,status:"Pending"};
const{error}=await supabase.from("complaints").insert(row);
if(error){result.textContent="Complaint error: "+error.message;return}
result.innerHTML=`✅ Complaint Number: <b>${no}</b><br>इसे सुरक्षित रखें।`;form.reset()});
document.querySelector("#bookingForm").addEventListener("submit",async e=>{e.preventDefault();
const bResult=document.querySelector("#bookingResult");
bResult.textContent="Book ho raha hai...";
const row={
  customer_name:document.querySelector("#bName").value,
  phone:document.querySelector("#bPhone").value,
  service:document.querySelector("#bService").value,
  address:document.querySelector("#bAddress").value,
  booking_date:document.querySelector("#bDate").value,
  booking_time:document.querySelector("#bTime").value,
  status:"Confirmed"
};
const{error}=await supabase.from("bookings").insert(row);
if(error){bResult.textContent="❌ "+error.message;return}
bResult.innerHTML=`✅ Appointment book ho gaya!<br>${row.booking_date} — ${row.booking_time}`;
document.querySelector("#bookingForm").reset();
});

document.querySelector("#statusForm").addEventListener("submit",async e=>{e.preventDefault();
const no=document.querySelector("#statusNo").value.trim().toUpperCase();
const{data,error}=await supabase.from("complaints").select("id,complaint_number,status,service,created_at,customer_name").eq("complaint_number",no).maybeSingle();
const statusEl=document.querySelector("#statusResult");
if(error){statusEl.innerHTML=`❌ ${error.message}`;return}
if(!data){statusEl.innerHTML="❌ Complaint नहीं मिली।";return}
statusEl.innerHTML=`✅ ${data.complaint_number}<br>Status: <b>${data.status}</b><br>Service: ${data.service}${data.status==="Completed"?`<br><a href="invoice.html?complaint=${data.complaint_number}" target="_blank">🧾 Invoice देखें</a>`:""}`;
if(data.status==="Completed"){
  const{data:existingReview}=await supabase.from("reviews").select("id").eq("complaint_id",data.id).maybeSingle();
  if(existingReview){
    statusEl.innerHTML+=`<p style="margin-top:14px;color:var(--muted)">✅ आपने पहले ही rating दे दी है। धन्यवाद! 🙏</p>`;
  } else {
    statusEl.innerHTML+=`
      <div class="panel" style="margin-top:18px;padding:18px;max-width:100%">
        <p style="font-weight:600;margin:0 0 10px">⭐ हमारी service कैसी लगी?</p>
        <div id="starPicker" style="font-size:30px;letter-spacing:6px;cursor:pointer">☆☆☆☆☆</div>
        <textarea id="reviewText" placeholder="कुछ लिखें (वैकल्पिक)" style="margin-top:10px"></textarea>
        <button class="btn" id="submitReview" style="margin-top:10px">Rating जमा करें</button>
        <div id="reviewMsg" style="margin-top:8px"></div>
      </div>`;
    let selectedRating=0;
    const starPicker=document.querySelector("#starPicker");
    starPicker.onclick=(ev)=>{
      const rect=starPicker.getBoundingClientRect();
      const pos=(ev.clientX-rect.left)/rect.width;
      selectedRating=Math.max(1,Math.min(5,Math.ceil(pos*5)));
      starPicker.textContent="★".repeat(selectedRating)+"☆".repeat(5-selectedRating);
    };
    document.querySelector("#submitReview").onclick=async()=>{
      if(selectedRating===0){document.querySelector("#reviewMsg").textContent="कृपया पहले स्टार चुनें।";return}
      const{error:revErr}=await supabase.from("reviews").insert({
        complaint_id:data.id,
        rating:selectedRating,
        review_text:document.querySelector("#reviewText").value,
        customer_name:data.customer_name
      });
      document.querySelector("#reviewMsg").textContent=revErr?"❌ "+revErr.message:"✅ धन्यवाद! आपकी rating मिल गई।";
    };
  }
}
});

// ---- Reviews display ----
(async function loadReviewsDisplay(){
  const el=document.querySelector("#reviewsDisplay");
  if(!el)return;
  const{data,error}=await supabase.from("reviews").select("*").order("created_at",{ascending:false}).limit(9);
  if(error||!data||data.length===0){
    document.querySelector("#reviews").style.display="none";
    return;
  }
  const avg=(data.reduce((s,r)=>s+r.rating,0)/data.length).toFixed(1);
  document.querySelector("#avgRatingLine").textContent=`औसत रेटिंग: ${"★".repeat(Math.round(avg))}${"☆".repeat(5-Math.round(avg))} (${avg} / 5, ${data.length} reviews)`;
  el.innerHTML=data.map(r=>`<div class="cat-card">
    <div class="cat-body">
      <div style="color:#f5a623;font-size:18px">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
      ${r.review_text?`<p style="margin:8px 0;font-size:14px">"${r.review_text}"</p>`:""}
      <p style="margin:0;font-size:13px;color:var(--muted)">— ${r.customer_name||"Customer"}</p>
    </div>
  </div>`).join("");
})();

// ---- Catalogue / Rate list display ----
(async function loadCatalogueDisplay(){
  const el=document.querySelector("#catalogueDisplay");
  if(!el)return;
  const{data,error}=await supabase.from("catalogue").select("*").order("display_order",{ascending:true}).order("created_at",{ascending:true});
  if(error){el.innerHTML=`<p style="text-align:center;color:var(--muted)">Abhi list load nahi ho payi.</p>`;return}
  if(!data||data.length===0){el.innerHTML=`<p style="text-align:center;color:var(--muted)">Jald hi rate list update hogi.</p>`;return}
  el.innerHTML=data.map(x=>`<div class="cat-card">
    ${x.image_url?`<img src="${x.image_url}" alt="${x.name}">`:""}
    <div class="cat-body">
      <span class="cat-tag">${x.category==="Vehicle"?"🚘 Vehicle AC":"🏠 Home Appliance"}</span>
      <h4>${x.name}</h4>
      <div class="cat-price">${x.price}</div>
    </div>
  </div>`).join("");
})();
