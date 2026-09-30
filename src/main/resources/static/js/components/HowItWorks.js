// components/HowItWorks.js

export function renderHowItWorks(root) {
    root.innerHTML = `
        <div class="page-header">
            <div>
                <h1>How It Works</h1>
                <div class="subtitle">Bidding on FundFoundEasy in three simple steps</div>
            </div>
        </div>

        <div class="auction-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))">
            <div class="card">
                <div style="font-size:2.5rem;margin-bottom:0.5rem">1</div>
                <h2>Create an account</h2>
                <p class="hint">Sign up with an email address. Verify your account via the link we send you, then log in.</p>
            </div>

            <div class="card">
                <div style="font-size:2.5rem;margin-bottom:0.5rem">2</div>
                <h2>Browse &amp; bid</h2>
                <p class="hint">Browse live auctions, click on any item to see details and bid history. Enter your maximum bid — we'll bid on your behalf up to that amount.</p>
            </div>

            <div class="card">
                <div style="font-size:2.5rem;margin-bottom:0.5rem">3</div>
                <h2>Win &amp; pay</h2>
                <p class="hint">When the timer ends, the highest bidder wins. We'll notify you and (in the full version) you'll pay securely via M-Pesa.</p>
            </div>
        </div>

        <div class="card mt-3">
            <h2>Frequently asked questions</h2>

            <div class="mt-2">
                <strong>What is a proxy bid?</strong>
                <p class="hint">You enter the maximum you're willing to pay. The system bids incrementally on your behalf against other bidders, only going as high as needed to keep you winning.</p>
            </div>

            <div class="mt-2">
                <strong>What happens in the final minutes?</strong>
                <p class="hint">To prevent last-second sniping, if a bid is placed within the last 2 minutes, the auction is automatically extended by 3 minutes.</p>
            </div>

            <div class="mt-2">
                <strong>How do I pay?</strong>
                <p class="hint">After winning, you'll see a "Pay with M-Pesa" button on the auction detail page. You'll receive an STK prompt on your phone to complete the payment.</p>
            </div>

            <div class="mt-2">
                <strong>Can I cancel a bid?</strong>
                <p class="hint">No — bids are binding. Please bid carefully.</p>
            </div>
        </div>
    `;
}