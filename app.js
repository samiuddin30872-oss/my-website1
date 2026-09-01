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
