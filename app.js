document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("ack-form");
  const submitBtn = document.getElementById("ack-submit");
  const statusEl = document.getElementById("ack-status");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("ack-name").value.trim();
    const email = document.getElementById("ack-email").value.trim();
    const agree = document.getElementById("ack-agree").checked;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    statusEl.textContent = "";
    statusEl.className = "";

    if (!name || !email || !emailPattern.test(email) || !agree) {
      statusEl.textContent = "Please enter your name, a valid work email, and check the agreement box.";
      statusEl.className = "status-error";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, agree }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      const formSection = form.closest(".attestation");
      if (formSection) {
        formSection.innerHTML = `
          <div class="seal-confirmation reveal is-visible">
            <svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--gold)" stroke-width="3"/>
              <path d="M32 51 L44 63 L70 35" fill="none" stroke="var(--gold)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3>Document Sealed</h3>
            <p>Thank you — your acknowledgment has been recorded.</p>
          </div>
        `;
      } else {
        statusEl.textContent = "Thank you — your acknowledgment has been recorded.";
        statusEl.className = "status-success";
        form.reset();
      }
    } catch (err) {
      statusEl.textContent = err.message || "Something went wrong. Please try again.";
      statusEl.className = "status-error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle("is-visible", entry.isIntersecting);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { observer.observe(el); });
});
