const form = document.querySelector('.waitlist');
const interest = document.querySelector('#interest-value');
const chips = [...document.querySelectorAll('[data-interest]')];
const errorMessage = document.querySelector('#form-error');
const submit = form.querySelector('button[type=submit]');
let pending = false;
interest.disabled = false;
document.documentElement.classList.add('has-waitlist');
chips.forEach(chip => chip.addEventListener('click', () => {
  if (pending) return;
  interest.value = interest.value === chip.dataset.interest ? '' : chip.dataset.interest;
  chips.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.interest === interest.value)));
}));

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || !form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form));
  pending = true;
  document.querySelector('#detail-inquire').disabled = true;
  errorMessage.hidden = true;
  const controls = [...form.elements].map(control => [control, control.disabled]);
  controls.forEach(([control]) => { control.disabled = true; });
  form.setAttribute('aria-busy', 'true');
  const originalButton = submit.innerHTML;
  submit.textContent = 'Sending…';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('https://formsubmit.co/ajax/steve.d.pennington@gmail.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload), signal: controller.signal,
    });
    if (!response.ok) throw new Error('response');
    const result = await response.json();
    if (result.success !== true && result.success !== 'true') throw new Error('unconfirmed');
    form.hidden = true;
    const thanks = document.querySelector('#thank-you');
    thanks.hidden = false;
    thanks.focus({ preventScroll: true });
  } catch {
    // Never imply success after a timeout, an activation response or a network failure.
    // Keep all values so a visitor can retry without retyping their message.
    errorMessage.textContent = 'We couldn’t confirm your signup. Your details are still here. Please try again in a moment.';
    errorMessage.hidden = false;
    errorMessage.focus({ preventScroll: true });
  } finally {
    clearTimeout(timeout);
    pending = false;
    document.querySelector('#detail-inquire').disabled = false;
    controls.forEach(([control, disabled]) => { control.disabled = disabled; });
    form.removeAttribute('aria-busy');
    submit.innerHTML = originalButton;
  }
});
