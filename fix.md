# IEH Platform Enterprise Technical Architecture & Security Audit
Generated: September 11, 2026
Target Build: v0.9.4-Beta.Build.202609
Total Findings Evaluated: 19 Items


### [ERR-01] Supabase Object Storage Quota Exhaustion (50MB Payload Cap)
- **Severity Tier:** Medium Severity
- **Subsystem:** Storage & Infrastructure
- **Verbatim Tester Finding:** "يتم التخزين على قيود سوبابيس 50 MegaByte."
- **System Pathology:** Rapid depletion of baseline storage quotas and client upload failures due to lack of client-side stream compression and absence of an external scalable object-store tier (such as Cloudflare R2 / AWS S3). Files exceeding quota fail with HTTP 413 Payload Too Large.
- **Reproduction Vector:** Navigate to user profile or media creation modals; attempt uploading an uncompressed asset or banner > 50MB. Network tab logs immediate HTTP 413 rejection.
- **Surgical Remediation:** Implement client-side WebP transcoding via OffscreenCanvas, enforce strict payload guards (5MB avatar, 10MB banner), and offload high-volume storage to S3/R2 with CloudFront/Cloudflare edge delivery.
---


### [ERR-02] Permissive Purely Numeric Usernames & SQL Type Coercion Vector
- **Severity Tier:** High Severity
- **Subsystem:** Database & Schemas
- **Verbatim Tester Finding:** "امكانية صنع يوزرات فقط ارقام، يجب وضع قواعد لليوزر لكي يتم تفادي مشاكل syntax في سوبابيس حتى وإن كانت مستقرة حاليا."
- **System Pathology:** Absence of schema lexical constraints permits purely numeric usernames (e.g., '992817'). This creates severe routing ambiguity in dynamic endpoints (/profile/:identifier) where route handlers cannot determine whether the parameter is an internal primary ID or a slug, risking SQL type-coercion exceptions in PostgREST queries.
- **Reproduction Vector:** Register an account specifying only numbers as the username. Account creation succeeds, but subsequent route parameter resolution collides with numeric primary key parsing.
- **Surgical Remediation:** Introduce an explicit PostgreSQL CHECK constraint with strict regex invariants requiring alphabetic prefix, length limits (3-30 chars), and reserved namespace masking.
---


### [ERR-03] Absence of Global Edge CDN & Application Load Balancer
- **Severity Tier:** High Severity
- **Subsystem:** Networking & Performance
- **Verbatim Tester Finding:** "لا يتم استخدام load Balancer، مما يؤدي الى جعل التحميل ليس مثل باقي التطبيقات العالمية، خصوصا لذوي الانترنت الضعيف."
- **System Pathology:** Direct routing of all client traffic, static bundles, and API calls to a single geographic origin without Anycast Edge acceleration or multi-zone load balancing. Results in elevated Time to First Byte (TTFB > 800ms) for remote regions, lack of HTTP/3 QUIC negotiation, and absence of Brotli asset pre-compression.
- **Reproduction Vector:** Profile network waterfall from high-latency or mobile client; latency reveals multi-RTT handshakes directly to single host without edge cache headers.
- **Surgical Remediation:** Deploy Cloudflare Enterprise or AWS CloudFront/ALB in front of the primary domain; enforce HTTP/3, Brotli level 11 compression, and strict Cache-Control for immutable hashed assets.
---


### [ERR-04] Asynchronous Promise Deadlock in Team Application Modal (45y45)
- **Severity Tier:** High Severity
- **Subsystem:** Teams & Multi-Tenancy
- **Verbatim Tester Finding:** "أثناء ارسال طلب لفريق ما والضغط على *ارسال طلب انضمام* يتم اظهار التحميل ويختفي دون اي شي، وكأنه منظر ولا يغلق حتى النافذة الخاصة بالتقديم، تمت التجربة على فريق 45y45."
- **System Pathology:** Unhandled promise rejection in team application submission handler. The mutation fails silently on server constraints, resetting isLoading=false without triggering feedback toasts, leaving modal dialog in an unresolved deadlocked visual state.
- **Reproduction Vector:** Open modal for team '45y45', click 'Send Join Request'. Loading spinner spins briefly then disappears, leaving dialog open with no confirmation.
- **Surgical Remediation:** Encapsulate mutation in robust try/catch with actionable toast notifications, programmatically dismiss modal upon 200 OK, and invalidate team membership query keys.
---


### [ERR-05] Client Runtime Crash: 'import_https.default.Agent is not constructor'
- **Severity Tier:** Critical (P0)
- **Subsystem:** Runtime & Realtime Chat
- **Verbatim Tester Finding:** "عند ضغط زر (مراسلة الفريق) او حتى (ايقونة المراسلة لمراسلة اي شخص) يظهر تحميل في واجهة المراسلة ثم (تعذر الاتصال بالمحادثة) مع شرح قصير (import_https.default.Agent is not constructor)، يُفضل التحقق من الأمور المتعلقة بخدمة المراسلة، ويمنع تقنيا جعل المحادثات تخزن على supabase."
- **System Pathology:** Isomorphic bundling collision where Node.js-only modules (https.Agent) leaked into the browser client bundle through an un-polyfilled transport client. The browser execution environment lacks native https.Agent, raising an immediate fatal TypeError. Furthermore, persisting high-frequency live chat directly on primary Supabase Postgres threatens connection pool exhaustion.
- **Reproduction Vector:** Click 'Message Team' or direct messaging icons. The chat interface freezes with runtime exception: 'import_https.default.Agent is not a constructor'.
- **Surgical Remediation:** Purge Node.js https dependencies from client bundles in favor of native Fetch/WebSocket APIs. Architecturally decouple live chat from relational Postgres onto an independent real-time broker (Centrifugo / Redis PubSub).
---


### [ERR-06] Profile Route Hydration Desynchronization (HTTP 404 on User Profile)
- **Severity Tier:** Critical (P0)
- **Subsystem:** Identity & Session Auth
- **Verbatim Tester Finding:** "عند الضغط على صورة الحساب، ثم (الملف الشخصي) يظهر تحميل ثم (لم يتم العثور على هذا الحساب)."
- **System Pathology:** Client-side route generator accesses user.username before post-authentication profile hydration completes. The link renders as '/profile/undefined', which queries the backend for slug 'undefined' and returns a 404 Account Not Found.
- **Reproduction Vector:** Log into account; immediately click profile avatar dropdown -> 'My Profile'. Navigation triggers before profile cache populates, resulting in 404.
- **Surgical Remediation:** Fallback to immutable session ID (auth.uid()) during initial hydration, guard navigation links until profile readiness is confirmed, and enable dual-slug server resolvers.
---


### [ERR-07] W3C WebAuthn Passkey API Invocation Failure
- **Severity Tier:** High Severity
- **Subsystem:** Access Control & Security
- **Verbatim Tester Finding:** "تعطل خدمة Passkey Services، وحتى الخدمة الفرعية الخاصة بها (WebAuthn) الخاصة بإظهار Passkey popup من خلال اوامر مثل request.Passkey."
- **System Pathology:** Attempt to invoke non-standard proprietary methods like request.Passkey rather than the standardized W3C Web Authentication API (navigator.credentials.create / get). Additionally, absence of strict Relying Party ID (rpId) matching and secure context assertions causes browser security rejection.
- **Reproduction Vector:** Attempt Passkey registration or sign-in; browser console throws 'request.Passkey is not a function' and halts authentication.
- **Surgical Remediation:** Refactor to standard @simplewebauthn client implementation, ensure base64url challenge decoding, and guarantee TLS context validity with matching rpId.
---


### [ERR-08] Session Multi-Device Invisibility & Electron User-Agent Misclassification
- **Severity Tier:** Medium Severity
- **Subsystem:** Identity & Session Auth
- **Verbatim Tester Finding:** "تعطل جزئي في نظام الجلسات؛ يتم اظهار فقط جلسة الجهاز الحالي مع نظام التشغيل والخ، وعند فتح التطبيق من خلال Electron Web App as .exe يتم اعتبار الجلسة ايضا Google Chrome)."
- **System Pathology:** User-Agent parsing regex evaluates Chrome tokens before Electron tokens. Because Electron's UA string inherently incorporates Chromium strings, desktop clients are misidentified as Google Chrome. Furthermore, session management UI queries only local storage tokens rather than querying the active refresh token table in auth.sessions.
- **Reproduction Vector:** Launch native Electron desktop .exe, authenticate, and navigate to Device Sessions. The desktop instance is tagged as Google Chrome, and concurrent mobile sessions are omitted.
- **Surgical Remediation:** Reorder heuristic regex prioritizing Electron tokens, inject custom client headers (X-Client-Platform: IEH-Desktop-Electron), and query active refresh tokens from Supabase Auth admin schema.
---


### [ERR-09] Redundant Password Reset Interface for Federated Google OAuth Accounts
- **Severity Tier:** Medium Severity
- **Subsystem:** Identity & Session Auth
- **Verbatim Tester Finding:** "تعطل خدمة لا فائدة لها؛ وجود واجهة تغيير كلمة المرور، وهي عديمة الفائدة لوجود Google OAuth 2.0 وكونها لا تعمل اساساً."
- **System Pathology:** Absence of Identity Provider discriminator logic. Users authenticated via Google OAuth 2.0 do not maintain encrypted passwords in auth.users, rendering password change forms structurally non-functional and confusing.
- **Reproduction Vector:** Log in via Google OAuth, navigate to Account Security. The password modification form is visible; submitting yields an error or no-op response.
- **Surgical Remediation:** Evaluate user.identities to conditionally suppress the password form for OAuth-only users, replacing it with an enterprise identity badge.
---


### [ERR-10] Storage Row-Level Security (RLS) Denial on Avatar & Banner Uploads
- **Severity Tier:** High Severity
- **Subsystem:** Storage & Infrastructure
- **Verbatim Tester Finding:** "في الاعدادات وتحديدا (الملف الشخصي) لا يمكن تغيير الصورة، ولا صورة البانر."
- **System Pathology:** Misconfigured storage.objects RLS policies reject INSERT and UPDATE operations because path validation requires folder names to match auth.uid() exactly, while client upload routines write to root or un-namespaced keys.
- **Reproduction Vector:** Go to Profile Settings, upload a new avatar or banner, and click Save. Network inspect reveals 403 Forbidden on storage upload.
- **Surgical Remediation:** Harden and align Storage bucket RLS policies for authenticated users, namespacing uploads by auth.uid() with strict size enforcement.
---


### [ERR-11] Schema Isolation Defect: Inability to Modify or Mask Public Contact Email
- **Severity Tier:** Medium Severity
- **Subsystem:** Database & Schemas
- **Verbatim Tester Finding:** "في نفس القسم، لايمكن تغيير او اخفاء بريد الالكتروني للتواصل او الخ."
- **System Pathology:** Confusion between primary authentication email (auth.users.email) and public contact email. The public.profiles schema lacks dedicated contact_email and is_email_public columns, leaving privacy toggles disconnected from persistence.
- **Reproduction Vector:** Toggle 'Hide Email' in user profile settings; refreshing the page restores the previous state without writing to database.
- **Surgical Remediation:** Add dedicated schema columns to public.profiles with an optimistic UI state updater.
---


### [ERR-12] Database Collation Mismatch & Stale Cache Invalidation (Zoki -> Zoki1)
- **Severity Tier:** High Severity
- **Subsystem:** Database & Schemas
- **Verbatim Tester Finding:** "بعد تغيير اليوزر من Zoki الى Zoki1 تم الغاء خلل (لم يتم العثور على هذا الحساب)."
- **System Pathology:** Profile lookup queries utilize exact case equality (username = :param) on a standard varchar column without CITEXT collation, causing lookups for 'zoki' to miss 'Zoki'. Alternatively, changing to Zoki1 bypassed an uncleared stale cache key.
- **Reproduction Vector:** Search or navigate to profile using lowercase 'zoki'. The query returns 404 until the user modifies their username to 'Zoki1', triggering a fresh database index entry.
- **Surgical Remediation:** Migrate username column to PostgreSQL CITEXT (case-insensitive text extension) and hook cache purge signals on profile update events.
---


### [ERR-13] Transaction Decoupling: Store Purchases Fail to Equip Cosmetics
- **Severity Tier:** High Severity
- **Subsystem:** Database & Schemas
- **Verbatim Tester Finding:** "تعطل خدمات (اطار النيون، التوثيق، ) في المتجر عند شراءها وعدم رصد فاعلية من الفاحص."
- **System Pathology:** The digital store purchase procedure debits eBits currency in ledger transactions, but fails to atomically mutate user_inventory or trigger the profile equip flag. Furthermore, frontend avatar components lack CSS classes for rendered cosmetics.
- **Reproduction Vector:** Purchase 'Prestige Neon Frame' or 'Verification Badge' in store. The balance decreases, but the avatar renders unadorned with no active equipment reflected in profile.
- **Surgical Remediation:** Wrap purchase, inventory insertion, and active equipment in an atomic ACID PostgreSQL stored procedure (RPC), updating avatar components with cosmetic rendering classes.
---


### [ERR-14] Administrative Route Privilege Escalation & Unverified Google Claims (OWASP A01)
- **Severity Tier:** Critical (P0)
- **Subsystem:** Access Control & Security
- **Verbatim Tester Finding:** "لا تحتوي الصفحة الادارية على تحقق من صلاحية حساب Google."
- **System Pathology:** Administrative routes (/admin/*) rely solely on superficial authentication checks (isUserLoggedIn) without validating cryptographic JWT claims (app_metadata.role === 'system_super_admin') or verified Google email whitelist. Any standard user authenticating via Google can access admin dashboard endpoints.
- **Reproduction Vector:** Authenticate with an arbitrary Google email, then enter '/admin' in browser URL bar. The administrative dashboard renders without RBAC enforcement.
- **Surgical Remediation:** Deploy edge-level RBAC middleware enforcing strict JWT role verification and verified Google identity domain match.
---


### [ERR-15] Unthrottled Moderation Dispatch & Omission of Standardized Violation Categorization
- **Severity Tier:** High Severity
- **Subsystem:** Administration & Moderation
- **Verbatim Tester Finding:** "يمكن لزر (تحذير اول) ارسال اكثر من تحذير، ودون ان يسأل عن الاسباب حتى، يرجى اضافة اسباب جاهزة واسعة النطاق لكي تكون البلاغات موحدة الهوية."
- **System Pathology:** The 'First Warning' button lacks client-side debouncing and lacks database strike state constraints, permitting unbounded repeated first-strike dispatches. It dispatches without prompting the moderator for standardized violation grounds.
- **Reproduction Vector:** Click 'First Warning' repeatedly on an offending user. Multiple warnings are issued in seconds without violation category selection.
- **Surgical Remediation:** Introduce a standardized moderation taxonomy modal (Harassment, Impersonation, Spam, TOS Abuse) and enforce progressive strike sequencing (Strike 1 -> Strike 2 -> Suspension).
---


### [ERR-16] Property Deserialization Drift & Forced DiceBear Avatar Fallback
- **Severity Tier:** Medium Severity
- **Subsystem:** Frontend State & UI
- **Verbatim Tester Finding:** "عند فتح تعليقات لمنشور ما، والشهوة في كتابة منشور، لم تظهر صورة الحساب، وتم استخدام صورة من منصة DiceBear، وذلك بسبب عدم توحيد المتغيرات مثل “ProfileImg =" واستخدام اكثر من متغير."
- **System Pathology:** Contract drift across frontend components. Comment creation component evaluates user.ProfileImg, whereas backend API payloads serialize avatar_url. Evaluating to undefined, the component falls back to a generated DiceBear robot avatar despite the user having an uploaded photo.
- **Reproduction Vector:** With an authenticated user having a custom avatar, open post comments and initiate a reply. The input avatar defaults to a DiceBear illustration.
- **Surgical Remediation:** Enforce a unified TypeScript interface and implement a single source of truth resolveUserAvatar helper that checks all legacy keys.
---


### [ERR-17] Multi-Team Ownership Anomaly & Static Navigation Menu State
- **Severity Tier:** High Severity
- **Subsystem:** Teams & Multi-Tenancy
- **Verbatim Tester Finding:** "يمكن للشخص انشاء اكثر من فريق، وكذلك عند الضغط على صورته الشخصية سيرى انه يظهر (تاسيس فريق جديد) وهو يمكن بالفعل فريق موجود."
- **System Pathology:** Missing database uniqueness constraint on active team leadership (leader_id) permits a single user to instantiate multiple teams. Furthermore, profile dropdowns hardcode 'Create New Team' regardless of whether the user already leads an active team.
- **Reproduction Vector:** A user who is already a team captain opens profile dropdown; 'Create New Team' is shown and successfully permits registering duplicate teams.
- **Surgical Remediation:** Add UNIQUE (leader_id) constraint on active teams table, dynamically switching the menu item to 'Manage My Team: [Team Name]'.
---


### [ERR-18] Unindexed Sequential Scan & Timeout on Leaderboards Route (/leaderboards)
- **Severity Tier:** Medium Severity
- **Subsystem:** Database & Schemas
- **Verbatim Tester Finding:** "يرجى التحقق من امكانية عمل /leaderboards لعدم قدرة الفاحص على التحقق من عملها."
- **System Pathology:** Real-time query execution performs full sequential table scans and heavy aggregation (ORDER BY points DESC with multi-table joins) without index coverage, leading to statement timeouts and blank hydration states.
- **Reproduction Vector:** Request /leaderboards under load; request hangs for seconds before returning 504 Gateway Timeout or an empty dataset.
- **Surgical Remediation:** Establish an indexed Materialized View refreshed asynchronously every 5 minutes, paired with edge caching.
---


### [ERR-19] Domain Boundary Leakage: Individual eBits Currency Rendered in Team Grid
- **Severity Tier:** Medium Severity
- **Subsystem:** Administration & Moderation
- **Verbatim Tester Finding:** "وجود عملة eBits كذلك للفرق في لوحة الادمن، وهذا خلل لأن هذه العملة تكون للحسابات الشخصية."
- **System Pathology:** Domain boundary violation in admin dashboard grids. Reusable table component erroneously maps individual personal currency (eBits) into the Team entity view, conflating individual user wallets with team reputation metrics.
- **Reproduction Vector:** Navigate to Admin Portal -> Team Management. The data grid renders an 'eBits Balance' column for team entities.
- **Surgical Remediation:** Sanitize team data models in administrative views, removing personal currency columns and substituting with Team XP and Tier attributes.
---
