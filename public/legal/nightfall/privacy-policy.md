# Privacy Policy

**Nightfall Security**  
Effective Date: July 20, 2026  
Last Updated: July 20, 2026

---

## 1. Introduction

This Privacy Policy explains what data Nightfall Security ("the Bot," "we," "us") collects, why we collect it, how it is stored, and your rights regarding that data.

By adding the Bot to your Discord server or interacting with it, you agree to the data practices described in this Policy. If you operate a self-hosted instance of Nightfall Security, you are the data controller for your users and should publish your own privacy policy.

---

## 2. What Data We Collect

### 2.1 Server (Guild) Data

| Data | Purpose | Stored |
|------|---------|--------|
| Guild ID | Identify your server for per-guild settings | Yes, permanently |
| Guild name | Referenced in logs and DM notifications | No — fetched at runtime only |
| Owner ID | Subscription and reminder DMs | Yes, in `premium_subscriptions` |
| Alert channel ID | Post security alerts | Yes, in `guild_settings` |
| Security thresholds | Custom detection configuration | Yes, in `guild_settings` |
| Audit log entries | Actor detection for security events | No — fetched at runtime, not stored |

### 2.2 Member / User Data

| Data | Purpose | Stored |
|------|---------|--------|
| User ID | Moderation history, warnings, ownership, affiliate records | Yes |
| Username / display name | Referenced in log messages | No — fetched at runtime only |
| Message content | AutoMod rule evaluation | No — evaluated in memory, never persisted |
| Message length | Statistical spam detection | Yes (length only, not content) in `message_stats` |
| Account creation date | New-account raid detection | No — fetched at runtime only |
| Verification answers | Math captcha comparison | Temporarily — deleted after verification (max 10 minutes) |

### 2.3 Moderation Data

| Data | Purpose | Stored |
|------|---------|--------|
| Warning records (guild_id, user_id, moderator_id, reason, timestamp) | Moderation history and audit trail | Yes, permanently |
| Security event records (threat type, severity, actor ID, detail) | Security audit log | Yes, for 90 days |

### 2.4 Payment Data

Nightfall Security does **not** process payments directly. Payments are handled by OxaPay, a third-party provider. We store:

| Data | Purpose | Stored |
|------|---------|--------|
| OxaPay invoice track ID | Link payment to subscription | Yes, in `premium_subscriptions` |
| Subscription expiry | Feature access control | Yes, in `premium_subscriptions` |

We do not store credit card numbers, crypto wallet addresses, or any payment credentials. Refer to [OxaPay's Privacy Policy](https://oxapay.com/privacy) for details on their data practices.

### 2.5 Affiliate Data

| Data | Purpose | Stored |
|------|---------|--------|
| Affiliate user ID | Credit referrals and tier tracking | Yes, in `premium_codes` and `affiliate_trials` |
| Trial start / expiry | Trial lifecycle management | Yes, in `affiliate_trials` |
| Conversion status | Affiliate analytics | Yes, in `affiliate_trials` |
| Discount DM sent status | Prevent duplicate DMs | Yes, in `affiliate_trials` |

---

## 3. What We Do NOT Collect

- ❌ **Message content** — messages are evaluated in memory for AutoMod rules and immediately discarded. No message text is stored in the database.
- ❌ **Voice data** — we log voice state change events (join/leave/mute) for audit purposes but do not record audio.
- ❌ **Direct messages** — the Bot may send DMs (reminders, checkout cards, discount offers) but does not read or store incoming DMs.
- ❌ **Email addresses** — we have no account system; identity is based entirely on Discord user IDs.
- ❌ **Real names or addresses** — we do not collect any personally identifiable information beyond Discord user IDs and guild IDs.
- ❌ **Financial information** — payment data is handled exclusively by OxaPay.

---

## 4. How We Use Data

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Detecting and alerting on security threats | Guild settings, event counters (in memory) | Legitimate interest (server security) |
| Moderation history and warnings | User ID, moderator ID, reason, timestamp | Legitimate interest (server safety) |
| Delivering premium features | Guild ID, subscription expiry | Contract performance |
| Sending expiry reminder DMs | Owner ID, subscription expiry | Contract performance |
| Affiliate programme tracking | Affiliate code, guild ID, conversion status | Legitimate interest (programme operation) |
| Sending post-trial discount DMs | Guild owner ID | Legitimate interest (commercial communication) |
| Spam / message rate detection | Message length, author ID, timestamp | Legitimate interest (server security) |

---

## 5. Data Retention

| Data | Retention Period |
|------|----------------|
| Guild settings | Until the server removes the Bot or requests deletion |
| Warnings | Permanent (for audit integrity) |
| Security events | 90 days (auto-purged by scheduler) |
| Message stats | 30 days (auto-purged by scheduler) |
| Premium subscriptions | Until 7 days after expiry (auto-purged by scheduler) |
| Premium codes | Until deleted by a bot owner |
| Affiliate trials | Permanent (enforces one-trial-per-guild rule) |
| Verification sessions | 10 minutes (auto-expired) |
| Automod events | 30 days (auto-purged with message stats) |

---

## 6. Data Sharing

We do not sell, rent, or share your data with third parties, except:

6.1 **Discord Inc.** — The Bot communicates with Discord's API to function. Discord's [Privacy Policy](https://discord.com/privacy) applies to all data transmitted through their platform.

6.2 **OxaPay** — When you initiate a premium purchase, your payment information is sent to OxaPay. We share only the invoice amount, description, and an internal order ID.

6.3 **Legal Requirements** — We may disclose data if required by law, court order, or to protect the rights and safety of the Bot operators or others.

---

## 7. Data Security

All data is stored in a **SQLite database** with:

- WAL (Write-Ahead Logging) mode for concurrent-access safety
- Application-level access control (all writes go through a single queue-based worker)
- File system permissions limiting access to the process user

The Bot does not expose a public API. The status dashboard (`http://127.0.0.1:5000`) is bound to localhost by default.

We implement reasonable technical measures to protect data. However, no system is perfectly secure. You should ensure your hosting environment has appropriate access controls and disk encryption if handling sensitive server data.

---

## 8. Your Rights

### For Server Administrators

As the administrator who invited the Bot, you can:

- **Access** your guild's stored settings via `/security overview`, `/automod status`, and `/logging status`
- **Modify** settings at any time via the respective commands
- **Delete** your guild's data by removing the Bot from your server and contacting us for a manual data deletion request

### For Server Members

As a server member whose data may be stored (e.g. a warning record):

- You can request access to, correction of, or deletion of your personal data by contacting the server administrator, who can submit a deletion request on your behalf
- Discord user IDs are considered pseudonymous identifiers, not directly identifiable personal data under most frameworks, but we respect reasonable deletion requests

### Exercising Rights

To exercise any data rights, contact us through the official project repository or support channel. We will respond within 30 days.

---

## 9. Children's Privacy

The Bot is not intended for use by individuals under the age of 13, consistent with Discord's minimum age requirement. If you believe a child under 13 has interacted with the Bot in a way that resulted in data collection, contact us for immediate removal.

---

## 10. Self-Hosted Instances

If you operate a self-hosted instance of Nightfall Security:

- You are the data controller for any data collected by your instance
- You are responsible for complying with applicable data protection laws (GDPR, CCPA, etc.)
- You should publish your own privacy policy and obtain any necessary consents from your users
- The original project contributors are not responsible for the data practices of self-hosted operators

---

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will be communicated via the project's official channels. The "Last Updated" date at the top reflects the most recent revision. Continued use of the Bot after changes take effect constitutes acceptance of the revised Policy.

---

## 12. Cookies and Tracking

The Bot's live status dashboard (`http://127.0.0.1:5000`) does not use cookies, tracking pixels, or analytics services. It displays only data from the local process memory.

---

## 13. Contact

For privacy-related questions, data access requests, or to report a data concern:

- Open an issue on the project repository marked `[Privacy]`
- Contact the Bot operators through the official support channel

We take privacy concerns seriously and will respond within 30 days.

---

*Nightfall Security · MIT Licensed*  
*This policy applies to the official hosted service. Self-hosted operators are independently responsible for their data practices.*
