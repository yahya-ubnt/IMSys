# Architectural Audit: Fat Controllers vs. Service Layer
Date: 2026-02-04
Status: 🟠 Refactoring Recommended

## 1. The Problem: "The Fat Controller"
A "Fat Controller" is an anti-pattern where the API routing layer handles business logic, hardware communication, and database state simultaneously. 

**Code Audit Results:**
- **`mikrotikUserController.js`**: A single file handles PPPoE secret generation, Static Queue management, Wallet Balance calculations, SMS sending, and Encryption/Decryption. 
- **`hotspotUserController.js`**: Contains its own logic for Hotspot user lifecycle.
- **`voucherController.js`**: Contains its own loop-based logic for hardware provisioning.

## 2. Identified Code Duplication (The "Red" Zones)
| Logic Type | Duplicated In... | Consequence |
| :--- | :--- | :--- |
| **Router Connection** | `mikrotikUserController`, `mikrotikRouterController`, `diagnosticController`, `scripts/` | If the `node-routeros` library is updated, you must change code in **12+ files**. |
| **User Disconnection** | `mikrotikUserController`, `scripts/disconnectExpiredClients.js` | Changes to "Disconnect Profile" names must be manually synced across files. |
| **Wallet/Accounting** | `mikrotikUserController`, `paymentController`, `invoiceController` | Risk of calculating balances differently in the onboarding flow vs. the payment flow. |

## 3. The Solution: Service Layer Separation
We must move from **Controller-Centric** to **Service-Centric** architecture.

### Recommended File Structure
```text
backend/
├── controllers/ (The Waiter: Validates input, returns HTTP codes)
│   └── mikrotikUserController.js -> calls SyncService
├── services/ (The Chef: Executes the logic)
│   ├── MikrotikSyncService.js (Handles all RouterOS logic)
│   ├── AccountingService.js (Handles all financial/wallet logic)
│   └── NotificationService.js (Handles all SMS/Email logic)
└── workers/ (The Delivery: BullMQ background execution)
    └── syncWorker.js -> calls MikrotikSyncService
```

## 5. System Dissection: The Master Scheduler (`scripts/masterScheduler.js`)
The current scheduling engine uses a `node-cron` + `child_process.spawn` model. While functional for small scales, it contains several "Architectural Time Bombs":

### Identified Bottlenecks:
- **The "Double Node" Problem**: Every task starts an entirely new Node.js instance. Scaling to 50+ tasks will exhaust server RAM.
- **The "Silent Overlap"**: If a script takes 2 minutes but runs every 1 minute, two processes will fight over the same MikroTik API connection.
- **The "State Blindness"**: Child processes are ephemeral. If a script fails to talk to a router, it dies without notifying the database to retry.

### The Transition:
We will shift from **Scripts-as-Processes** to **Jobs-as-State**:
1. **The Trigger**: The `masterScheduler` remains as a "Task Dispatcher."
2. **The Change**: Instead of `spawn('node script.js')`, it will call `Queue.add('jobName')`.
3. **The Result**: 
    - **Resource Efficiency**: Workers stay alive, removing the overhead of spawning new Node instances.
    - **Concurrency Control**: BullMQ ensures only one sync job runs per user/router at a time.
    - **Durability**: If the server reboots, the "Jobs" are still in Redis, ready to be processed.
