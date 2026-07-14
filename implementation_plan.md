# EDL Games Platform — Full Security Remediation Plan

Comprehensive execution of all 12 structural vulnerabilities identified in [edl_games_global_audit.md](file:///c:/Users/mikil/Downloads/edl_games_global_audit.md), targeting the `bingo-backend` at `c:\Users\mikil\OneDrive\Desktop\bingo-new\bingo-backend`.

---

## Proposed Changes

### Module 1 — Crypto RNG Upgrade

#### [MODIFY] [cardLogic.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/utils/cardLogic.js)
- Add `const crypto = require('crypto');` at top
- Replace `Math.floor(Math.random() * (i + 1))` in Fisher-Yates shuffle with `crypto.randomInt(0, i + 1)`

#### [MODIFY] [aviatorSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/aviatorSocket.js)
- Line 215: Replace `Math.random()` roll in `applyDynamicRTP()` bias dice with `crypto.randomInt(0, 1e9) / 1e9`
- Line 225: Replace `1.00 + Math.random() * (rec.maxCrash - 1.00)` biased crash float with `crypto.randomInt(0, 1e9) / 1e9` equivalent

#### [MODIFY] [kenoSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/kenoSocket.js)
- Line 117: Replace `Math.floor(Math.random() * (i + 1))` in Fish-Yates shuffle with `crypto.randomInt(0, i + 1)`
- Add `const crypto = require('crypto');` at top

#### [MODIFY] [bingoSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/bingoSocket.js)
- Line 28: Replace `.sort(() => Math.random() - 0.5)` with a proper Fisher-Yates using `crypto.randomInt()`
- Add `const crypto = require('crypto');` at top

#### [MODIFY] [bankerSocketV2.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/bankerSocketV2.js)
- Line 26: Replace `Math.floor(Math.random() * (DEAL_MAX_CARD - DEAL_MIN_CARD + 1)) + DEAL_MIN_CARD` with `crypto.randomInt(DEAL_MIN_CARD, DEAL_MAX_CARD + 1)`
- Add `const crypto = require('crypto');` at top

---

### Module 2 — Global Concurrency & Wallet Locks (Anti-Spam Bot)

**Pattern applied to all wager endpoints:**
```javascript
const activeLocks = new Set(); // declared at module scope
// Inside socket event handler:
const lockKey = `${userId}:action_name`;
if (activeLocks.has(lockKey)) return socket.emit('betError', 'Request already in progress');
activeLocks.add(lockKey);
try {
  await /* DB deduction */;
} finally {
  activeLocks.delete(lockKey);
}
```

#### [MODIFY] [aviatorSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/aviatorSocket.js)
- Declare `const activeLocks = new Set();` at module scope (after rate limiter)
- Wrap `place_bet` handler's DB region: lock key = `${userId}:place_bet_${panel}`
- Wrap `place_next_bet` handler's DB region: lock key = `${userId}:next_bet_${panel}`

#### [MODIFY] [kenoSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/kenoSocket.js)
- Declare `const activeLocks = new Set();` at module scope
- Wrap `placeBet` entire try block: lock key = `${userId}:keno_bet`

#### [MODIFY] [bingoSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/bingoSocket.js)
- Declare `const activeLocks = new Set();` at module scope
- Wrap `selectCard` try block: lock key = `${player.userId}:card_${cardId}`

#### [MODIFY] [bankerSocketV2.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/bankerSocketV2.js)
- `isProcessingAction` boolean per-player already exists and correctly uses try/finally — **harden** by adding an additional module-scope `const activeLocks = new Set()` wrapping `find_match` queue-entry deduction

#### [MODIFY] [cardGameSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/cardGameSocket.js)
- Declare `const activeLocks = new Set();` at module scope
- Wrap `pickSeatAndPay` try block: lock key = `${verifiedId}:macao_seat_${selectedNumber}`

---

### Module 3 — Admin Dashboard Sync & MAX_WIN_PER_USER Cap

#### [MODIFY] [GameConfig.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/models/GameConfig.js)
- Add `maxWinPerUser: 50000` to `aviator` extraParams defaults
- Add `maxWinPerUser: 25000` to `keno` extraParams defaults

#### [MODIFY] [aviatorSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/aviatorSocket.js)
- Add `MAX_WIN_PER_USER: 50_000` to local `CONFIG` object
- In `reloadBettingConfig()`: sync `MAX_WIN_PER_USER` from `dbCfg.extraParams.maxWinPerUser`
- In `processCashout()`: after computing `payout`, add guard: `const cappedPayout = Math.min(payout, CONFIG.MAX_WIN_PER_USER);`
- The existing `profitTracker` state (totalBet, totalPayout, profit) is already recorded into `AviatorRound` via `saveRound()` → `houseProfit`. Admin routes can query this at `/api/admin/games` (existing `getGameStats` in admin.js).

#### [MODIFY] [kenoSocket.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/sockets/kenoSocket.js)
- Load `GameConfig` at startup: `const GameConfig = require('../models/GameConfig');`
- Add module-level `let KENO_CFG = { MAX_WIN_PER_USER: 25000 };`
- Add `async function loadKenoConfig()` that fetches from DB
- In `processPayouts()`: cap `totalWon` per player: `const cappedWon = Math.min(totalWon, KENO_CFG.MAX_WIN_PER_USER);`

---

### Module 4 — High/Medium Vulnerability Purge

#### [MODIFY] [auth.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/routes/auth.js)
- Add `const crypto = require('crypto');` at top (if not already present)
- Line 112: Replace `'BNGO-' + Math.random().toString(36).substring(2, 7).toUpperCase()` with `'BNGO-' + crypto.randomBytes(4).toString('hex').toUpperCase()`
- Line 534: Replace `String(Math.floor(100000 + Math.random() * 900000))` with `String(crypto.randomInt(100000, 1000000))`

#### [MODIFY] [telegramBot.js](file:///c:/Users/mikil/OneDrive/Desktop/bingo-new/bingo-backend/utils/telegramBot.js)
- Add `const crypto = require('crypto');` at top
- Line 127: Replace `String(Math.floor(100000 + Math.random() * 900000))` with `String(crypto.randomInt(100000, 1000000))`

---

## Verification Plan

### Automated — Grep Validation (run after all changes)
Confirm zero remaining `Math.random()` instances in game-critical files:
```powershell
# Run from bingo-backend directory
grep -rn "Math.random()" sockets/ utils/cardLogic.js routes/auth.js utils/telegramBot.js
# Expected output: zero lines (empty)
```

### Automated — Server Boot Test
Confirm server starts cleanly (no syntax errors introduced):
```powershell
cd "c:\Users\mikil\OneDrive\Desktop\bingo-new\bingo-backend"
node -e "require('./server.js')" 2>&1 | head -20
# OR
node --check sockets/aviatorSocket.js sockets/kenoSocket.js sockets/bingoSocket.js sockets/bankerSocketV2.js sockets/cardGameSocket.js utils/cardLogic.js routes/auth.js utils/telegramBot.js
# Expected: no syntax errors printed
```

### Manual Verification (request user to validate on staging)
1. **RNG upgrade**: Start server, connect to Aviator, place a bet, confirm crash point is generated (console shows `[Aviator] Round X FLYING — crashAt=Y.YYx`). Check no `Math.random` in logs.
2. **Lock guard test**: Open two browser tabs simultaneously, both try to place a bet on the same Keno round at the exact same moment. Only one should succeed; the second should receive `betError: Request already in progress`.
3. **MAX_WIN_PER_USER**: Place a Keno bet with maximum picks (10) and maximum bet amount (1000 ETB) in a scenario targeting the 10-pick jackpot (5000x). Verify the credited amount is **capped** at `MAX_WIN_PER_USER` (25,000 ETB by default), not the raw 5,000,000 ETB theoretical max.
4. **OTP security**: Trigger `/forgot-password` endpoint with a linked phone. OTP received in Telegram should now always be exactly 6 digits and not predictable across consecutive calls.
5. **Referral code**: Register a new user, check the assigned `referralCode` is now 8-char hex (`BNGO-XXXXXXXX`) instead of base-36 alphanumeric.
