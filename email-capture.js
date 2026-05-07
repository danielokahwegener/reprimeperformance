/* =============================================
   EMAIL-CAPTURE.JS — Worker-backed MailerLite integration
   After success: show archetype reveal, then redirect to anmeldung.html with token
   ============================================= */

window.FDA = window.FDA || {};

/* Worker URL — update this after deploying the Cloudflare Worker */
window.FDA.WORKER_URL = 'https://reprime-api.reprimecoaching.com';

window.FDA.sendeAnMailerLite = function(vorname, email, archetypKey) {
  var gespeichert = window.FDA.ladeErgebnis();
  var profil = (gespeichert && gespeichert.profil) ? gespeichert.profil : {};

  return fetch(window.FDA.WORKER_URL + '/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vorname: vorname, email: email, archetypKey: archetypKey, profil: profil })
  }).then(function(res) {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
    /* Returns { token: "uuid" } */
  });
};

window.FDA.initEmailCapture = function(archetypKey) {
  var form      = document.getElementById('email-form');
  var statusEl  = document.getElementById('form-status');
  var submitBtn = document.getElementById('btn-submit');
  var gateWrap  = document.getElementById('email-gate-wrap');
  var reveal    = document.getElementById('ergebnis-reveal');

  if (!form) return;

  var emailInput = document.getElementById('email');
  emailInput.addEventListener('blur', function() {
    var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    if (emailInput.value.length > 0 && !valid) {
      emailInput.classList.add('is-error');
    } else {
      emailInput.classList.remove('is-error');
    }
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var vorname = document.getElementById('vorname').value.trim();
    var email   = emailInput.value.trim();
    if (!vorname || !email) return;

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Wird gesendet…';
    statusEl.textContent  = '';

    window.FDA.sendeAnMailerLite(vorname, email, archetypKey)
      .then(function(data) {
        var token = (data && data.token) ? data.token : '';

        var dest = 'anmeldung.html'
          + '?typ='   + encodeURIComponent(archetypKey)
          + '&name='  + encodeURIComponent(vorname)
          + '&token=' + encodeURIComponent(token);

        /* Show archetype reveal before redirecting */
        if (gateWrap) gateWrap.style.display = 'none';
        if (reveal) {
          reveal.classList.remove('hidden');
          var ctaBtn = document.getElementById('cta-termin-btn');
          if (ctaBtn) ctaBtn.href = dest;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.location.href = dest;
        }
      })
      .catch(function(err) {
        console.error('Worker-Fehler:', err);
        statusEl.textContent  = 'Etwas ist schiefgelaufen. Bitte versuche es noch einmal.';
        statusEl.style.color  = 'var(--error)';
        statusEl.style.fontSize  = '0.8rem';
        statusEl.style.marginTop = '0.5rem';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Mein Ergebnis anzeigen';
      });
  });
};
