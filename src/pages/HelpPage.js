export class HelpPage {
  constructor(container) {
    this.container = container;
  }

  render() {
    this.container.innerHTML = `
      <div class="help-page">
        <h2>Help & Support</h2>
        <div class="faq-list">
          <div class="faq-item">
            <div class="faq-question">How do I track my order?</div>
            <div class="faq-answer">Go to Profile → My Orders. Click on the order to see real-time tracking status.</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">What is Cash on Delivery?</div>
            <div class="faq-answer">You pay in cash when the order arrives at your doorstep. No extra charges.</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">How do I earn ApyCoins?</div>
            <div class="faq-answer">Place orders, refer friends, rate the app, or get birthday bonuses.</div>
          </div>
          <div class="faq-item">
            <div class="faq-question">How to become a seller?</div>
            <div class="faq-answer">Go to Profile → Seller Dashboard and submit your verification documents.</div>
          </div>
        </div>
        <div class="contact-support">
          <h3>Still need help?</h3>
          <p>Email us at <a href="mailto:support@apykart.in">support@apykart.in</a></p>
          <p>WhatsApp: <a href="https://wa.me/919999999999">+91 9999999999</a></p>
        </div>
      </div>
    `;
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const answer = q.nextElementSibling;
        answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
      });
    });
  }
}
