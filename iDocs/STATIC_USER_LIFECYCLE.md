# Static User Lifecycle

This document outlines the lifecycle of a "Static User" in the system, detailing the manual creation and management process.

---

## The Manual Workflow

This section describes how the system creates and manages static users. This is the sole and authoritative workflow.

### 1. The Flow

1.  **Manual Data Entry (Admin UI):** An admin manually enters the user's **MAC Address** and desired **Static IP Address** into the creation form. Both fields are mandatory.
2.  **Backend API and Database:** The data is saved to the `MikrotikUser` collection with an `active` status, and a `syncUser` job is queued.
3.  **Hardware Configuration (Worker):** The `mikrotikSyncWorker` picks up the job and runs commands on the MikroTik router to perform the following actions:
    *   Creates a static DHCP Lease, binding the user's IP to their MAC address.
    *   Creates a Simple Queue to enforce the user's bandwidth package.
    *   Adds the user's IP to the `ALLOWED_USERS` firewall address list, granting them internet access.

### 2. Disconnection and Suspension

-   When a user's subscription expires or is manually suspended, their `status` is changed to `suspended`.
-   The `mikrotikSyncWorker` detects this change on the next sync.
-   It then removes the user's IP address from the `ALLOWED_USERS` list, effectively blocking their internet access while leaving their lease and queue configuration in place for easy reactivation.

### 3. Deletion

-   When a user is deleted from the system, a `removeUser` job is queued.
-   The `mikrotikSyncWorker` picks up this job and runs commands to remove the static DHCP lease, the simple queue, and any firewall entries related to the user from the MikroTik router.

---

## Firewall Configuration for User Management

For the `suspend` and `disconnect` features to work correctly, a "Walled Garden" security model must be implemented on the MikroTik router's firewall. The application's role is simply to add or remove a user's IP from the `ALLOWED_USERS` address list. The router's firewall is responsible for enforcing the block.

### For Mixed (PPPoE & Static) Environments (Recommended)



This is the safest configuration if you run both PPPoE and Static IP users on the same router. It ensures the firewall rule only ever applies to the static IP users. This requires two rules, where the order is critical.



**Step 1: Define your Static IP Subnet**

Create a firewall address list that contains the entire IP block you use for static users.



```mikrotik

# IMPORTANT: Replace 10.10.10.0/24 with your actual static IP subnet.

/ip firewall address-list

add list=STATIC_IP_SUBNET address=10.10.10.0/24 comment="IP block for all Static Users"

```



**Step 2: Create the Walled Garden Rules**

First, create a rule to `accept` traffic from active users. Then, create a second rule to `drop` all other traffic from the static subnet.



```mikrotik

/ip firewall filter



# Rule 2a: ACCEPT traffic from users who are currently allowed.

add action=accept chain=forward src-address-list=ALLOWED_USERS comment="IMSys: Allow Active Users"



# Rule 2b: DROP all other traffic from the static IP subnet.

add action=drop chain=forward src-address-list=STATIC_IP_SUBNET comment="IMSys: Walled Garden Block"

```



### For Static-Only Environments



If your router *only* serves static IP clients from this system, you can use a simpler rule.



```mikrotik

/ip firewall filter

add action=drop chain=forward src-address-list=!ALLOWED_USERS comment="IMSys: Walled Garden Block"

```



**Important Rule Placement:** For the two-rule setup, you MUST ensure the `action=accept` rule is positioned directly above the `action=drop` rule in your `/ip firewall filter` list. For either setup, the rules should be placed **above** any general `action=accept` rules for your local networks, but typically **below** rules that accept `connection-state=established,related`.
