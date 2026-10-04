import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import{SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY}from"./supabase.js";
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

const params=new URLSearchParams(window.location.search);
const complaintNo=params.get("complaint");
const el=document.querySelector("#invContent");

(async function(){
  if(!complaintNo){el.innerHTML="<p>Invoice link galat hai.</p>";return}
  const{data:complaint,error:cErr}=await supabase.from("complaints").select("*").eq("complaint_number",complaintNo).maybeSingle();
  if(cErr||!complaint){el.innerHTML="<p>Complaint nahi mili.</p>";return}
  const{data:invoice,error:iErr}=await supabase.from("invoices").select("*").eq("complaint_id",complaint.id).maybeSingle();
  if(iErr||!invoice){el.innerHTML="<p>Is complaint ka invoice abhi nahi bana hai.</p>";return}

  const subtotal=invoice.service_charge+invoice.parts_charge+invoice.labour_charge-invoice.discount;
  const gstAmount=subtotal*invoice.gst_percent/100;

  el.innerHTML=`<div class="inv-box">
    <div class="inv-head">
      <img src="icon-192.png" alt="logo">
      <h2 style="margin:4px 0">राजा रेफ्रिजरेशन</h2>
      <p style="margin:0;color:var(--muted);font-size:13px">नायरा पेट्रोल पंप के सामने, B.S.N.L. बिल्डिंग, बायपास रोड़<br>📞 7017672535</p>
    </div>
    <div class="inv-row"><b>Invoice No:</b><span>${invoice.invoice_number}</span></div>
    <div class="inv-row"><b>Complaint No:</b><span>${complaint.complaint_number}</span></div>
    <div class="inv-row"><b>Customer:</b><span>${complaint.customer_name}</span></div>
    <div class="inv-row"><b>Mobile:</b><span>${complaint.phone}</span></div>
    <div class="inv-row"><b>Service:</b><span>${complaint.service}</span></div>
    <div class="inv-row"><b>Date:</b><span>${new Date(invoice.created_at).toLocaleDateString("hi-IN")}</span></div>
    <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
    <div class="inv-row"><span>Service Charge</span><span>₹${invoice.service_charge}</span></div>
    <div class="inv-row"><span>Parts Charge</span><span>₹${invoice.parts_charge}</span></div>
    <div class="inv-row"><span>Labour Charge</span><span>₹${invoice.labour_charge}</span></div>
    ${invoice.discount>0?`<div class="inv-row"><span>Discount</span><span>- ₹${invoice.discount}</span></div>`:""}
    ${invoice.gst_percent>0?`<div class="inv-row"><span>GST (${invoice.gst_percent}%)</span><span>₹${gstAmount.toFixed(2)}</span></div>`:""}
    <div class="inv-row inv-total"><span>Total</span><span>₹${invoice.total}</span></div>
  </div>`;
})();
