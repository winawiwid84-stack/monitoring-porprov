# Security Specification: Sistem Monitoring Kontingen KONI Kota Bandung - PORPROV XV 2026

## 1. Data Invariants
1. **User Profile & Admin Isolation**: Users can only read and update their own profile document. Roles (e.g., `admin`, `pengurus_pusat`, `tim_medis`) cannot be self-assigned; they must be verified against database records or bootstrapped admin email `winawiwid84@gmail.com`.
2. **Medical Records Confidentiality**: `medical_cases` contain sensitive athlete health data and can only be created/read/updated by verified medical personnel (`tim_medis`) or system admins (`admin`). Viewer and public cannot read sensitive health details.
3. **Match & Medal Integrity**: `medals` and `results` require verified status tracking. Non-authenticated users can read public medal standings and match schedules, while only authenticated team officials (`admin`, `pengurus_pusat`, `tim_teknis`) can publish or update match results and medals.
4. **Posko Isolation & Daily Reports**: Reports and issues created by a posko coordinator must specify the valid `post_id` and cannot be modified by coordinators from other posts.
5. **Strict Timestamps & Immutability**: All write payloads must have `createdAt == request.time` on creation and `updatedAt == request.time` on updates. The primary owner/creator ID (`authorId` / `userId`) cannot be altered post-creation.

## 2. The "Dirty Dozen" Malicious Payloads Tested
1. **Payload 1 (Privilege Escalation)**: Regular user updates their own role to `admin` in `/users/{userId}`. -> **DENIED**
2. **Payload 2 (Ghost Field Attack)**: Injected unrecognized field `__hacked: true` in `/daily_reports/{reportId}`. -> **DENIED** (`hasOnly` keys constraint)
3. **Payload 3 (Unauthorized Medical Snoop)**: Unauthenticated or non-medical user attempts to list `/medical_cases`. -> **DENIED**
4. **Payload 4 (Tampered Server Timestamp)**: User submits client-forged timestamp string or future timestamp in `createdAt`. -> **DENIED** (`request.time` enforcement)
5. **Payload 5 (ID Injection Attack)**: Target document ID with oversized malicious SQL/script chars `../../../etc/passwd` or > 128 chars. -> **DENIED** (`isValidId` regex)
6. **Payload 6 (Orphaned Match Result)**: Creating a match fixture without a valid `sport_id` or referencing non-existent parent. -> **DENIED**
7. **Payload 7 (Cross-Posko Tampering)**: Posko Bekasi coordinator attempts to modify or delete a report created by Posko Bogor. -> **DENIED**
8. **Payload 8 (Medal Fabricator)**: Viewer or anonymous user attempts to insert a gold medal count. -> **DENIED**
9. **Payload 9 (Oversized Payload / Denial of Wallet)**: Submitting a report with narrative > 10,000 characters. -> **DENIED** (size constraints)
10. **Payload 10 (Protest Document Hijack)**: Changing `submittedBy` field on an existing protest document. -> **DENIED** (immutable owner)
11. **Payload 11 (Unauthenticated Delete)**: Attempt to delete master data venue or sport without admin credentials. -> **DENIED**
12. **Payload 12 (Blanket Query Scraping)**: Attempting to query `medical_cases` with blanket where clauses without medical role. -> **DENIED**
