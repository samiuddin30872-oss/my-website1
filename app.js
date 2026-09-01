import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
} from "./supabase.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const form = document.querySelector("#complaintForm");
const result = document.querySelector("#result");

const statusForm = document.querySelector("#statusForm");
const statusResult = document.querySelector("#statusResult");


/* =========================
   GENERATE COMPLAINT NUMBER
========================= */

function generateComplaintNumber() {
  return "RR-" + Math.floor(100000 + Math.random() * 900000);
}


/* =========================
   COMPLAINT SUBMIT
========================= */

if (form) {

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    result.innerHTML = "⏳ Complaint submit हो रही है...";

    try {

      const complaintNumber = generateComplaintNumber();

      const name =
        document.querySelector("#name")?.value.trim() || "";

      const phone =
        document.querySelector("#phone")?.value.trim() || "";

      const service =
        document.querySelector("#service")?.value || "";

      const problem =
        document.querySelector("#problem")?.value.trim() || "";

      const address =
        document.querySelector("#address")?.value.trim() || "";

      const photoInput =
        document.querySelector("#photo");

      const photo =
        photoInput?.files?.[0] || null;


      /* =========================
         VALIDATION
      ========================= */

      if (!name || !phone || !service || !problem) {

        result.innerHTML =
          "⚠️ कृपया नाम, मोबाइल नंबर, Service और समस्या भरें।";

        return;
      }


      /* =========================
         PHOTO OPTIONAL
      ========================= */

      let photoUrl = null;

      if (photo) {

        try {

          const safeName =
            photo.name.replace(
              /[^a-zA-Z0-9._-]/g,
              "_"
            );

          const filePath =
            `${complaintNumber}/${Date.now()}-${safeName}`;


          const {
            error: uploadError
          } = await supabase.storage
            .from("complaint-photos")
            .upload(filePath, photo);


          if (!uploadError) {

            const {
              data: publicData
            } = supabase.storage
              .from("complaint-photos")
              .getPublicUrl(filePath);

            photoUrl =
              publicData?.publicUrl || null;

          } else {

            console.warn(
              "Photo upload failed:",
              uploadError.message
            );

          }

        } catch (photoError) {

          console.warn(
            "Photo upload error:",
            photoError
          );

          /*
             Photo upload fail होने पर
             complaint फिर भी submit होगी.
          */

        }

      }


      /* =========================
         COMPLAINT DATABASE ROW
      ========================= */

      const row = {

        complaint_number:
          complaintNumber,

        customer_name:
          name,

        phone:
          phone,

        service:
          service,

        problem:
          problem,

        photo_url:
          photoUrl,

        address:
          address,

        status:
          "Pending"

      };


      /* =========================
         SAVE COMPLAINT
      ========================= */

      const {
        data,
        error: insertError
      } = await supabase
        .from("complaints")
        .insert([row])
        .select()
        .single();


      /* =========================
         DATABASE ERROR
      ========================= */

      if (insertError) {

        console.error(
          "Supabase insert error:",
          insertError
        );

        result.innerHTML = `
          <div>
            ❌ <strong>Complaint submit नहीं हुई</strong>
            <p>${insertError.message}</p>
            <small>
              कृपया कुछ देर बाद फिर कोशिश करें।
            </small>
          </div>
        `;

        return;
      }


      /* =========================
         SUCCESS
      ========================= */

      result.innerHTML = `
        <div>
          <h3>✅ Complaint Successfully Registered!</h3>

          <p>
            Complaint Number:
            <strong>${complaintNumber}</strong>
          </p>

          <p>
            Status:
            <strong>Pending</strong>
          </p>

          <p>
            कृपया Complaint Number सुरक्षित रखें।
          </p>
        </div>
      `;


      form.reset();


    } catch (error) {

      console.error(
        "Complaint error:",
        error
      );

      result.innerHTML = `
        <div>
          ❌ <strong>Complaint submit में समस्या</strong>

          <p>
            ${error?.message || "Unknown error"}
          </p>

          <p>
            Internet connection और Supabase configuration check करें।
          </p>
        </div>
      `;

    }

  });

}


/* =========================
   COMPLAINT STATUS
========================= */

if (statusForm) {

  statusForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();

      statusResult.innerHTML =
        "⏳ Status check हो रहा है...";


      try {

        const complaintNumber =
          document
            .querySelector("#statusNo")
            ?.value
            .trim()
            .toUpperCase();


        if (!complaintNumber) {

          statusResult.innerHTML =
            "⚠️ Complaint Number डालें।";

          return;
        }


        const {
          data,
          error
        } = await supabase
          .from("complaints")
          .select(
            "complaint_number, customer_name, service, problem, status, created_at"
          )
          .eq(
            "complaint_number",
            complaintNumber
          )
          .maybeSingle();


        if (error) {

          console.error(
            "Status error:",
            error
          );

          statusResult.innerHTML = `
            ❌ Status check नहीं हो पाया।
            <p>${error.message}</p>
          `;

          return;
        }


        if (!data) {

          statusResult.innerHTML = `
            <p>❌ Complaint नहीं मिली।</p>
            <p>कृपया Complaint Number सही डालें।</p>
          `;

          return;
        }


        statusResult.innerHTML = `
          <div>

            <h3>📋 Complaint Details</h3>

            <p>
              Complaint Number:
              <strong>${data.complaint_number}</strong>
            </p>

            <p>
              Name:
              <strong>${data.customer_name}</strong>
            </p>

            <p>
              Service:
              <strong>${data.service}</strong>
            </p>

            <p>
              Problem:
              <strong>${data.problem}</strong>
            </p>

            <p>
              Status:
              <strong>${data.status}</strong>
            </p>

          </div>
        `;


      } catch (error) {

        console.error(
          "Status error:",
          error
        );

        statusResult.innerHTML = `
          ❌ Status error:
          ${error?.message || "Unknown error"}
        `;

      }

    }
  );

                  }
