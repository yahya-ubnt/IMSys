# Revised Single-User Diagnostic Check Specification

## 1. Overview

This document outlines the revised workflow for the single-user diagnostic check. The new implementation provides a more comprehensive and multi-faceted analysis by incorporating checks based on both network hardware (CPE/AP) and physical location (Apartment/House). The goal is to provide the administrator with detailed, raw data from multiple perspectives, allowing them to make a more accurate conclusion about the root cause of a user's connectivity issue.

## 2. Trigger

The diagnostic is initiated by clicking the **"Run Diagnostic"** button on the "View Details" page for a specific Mikrotik user.

## 3. API Endpoint

- **URL:** `/api/v1/users/:userId/diagnostics`
- **Method:** `POST`
- **Authentication:** `protect` middleware (admin token required)

## 4. High-Level Diagnostic Flow

The diagnostic process is executed sequentially. After the initial checks, the logic branches based on the data available for the user.

1.  **Billing Check:**
    - **Action:** Checks the `expiryDate` on the `MikrotikUser` model.
    - **Output:** A step indicating if the user's account is `Active` or `Expired`.

2.  **Mikrotik Router Check:**
    - **Action:** Pings the IP address of the core Mikrotik router associated with the user.
    - **Output:** A step indicating if the router is `Online` or `Offline`.

3.  **Branching Logic:**
    - The system checks the `MikrotikUser` model for the presence of two fields:
        - `station`: A reference to a `Device` (the user's CPE).
        - `apartment_house_number`: A string indicating the user's physical unit.
    - The flow then proceeds down one of three paths based on which of these fields are present.

---

## 5. Scenario A: CPE-Based Diagnostic

This path is executed if the user has a `station` linked, but no `apartment_house_number`.

1.  **CPE (Station) Check:**
    - **Action:** Pings the IP address of the user's linked Station device.
    - **Output:** A step indicating if the CPE is `Online` or `Offline`.

2.  **AP (Access Point) Check:**
    - **Action:** Finds the Access Point device that shares the same `ssid` as the user's Station. Pings the AP's IP address.
    - **Output:** A step indicating if the AP is `Online` or `Offline`.

3.  **Neighbor Analysis (Station-Based):**
    - **Action:** Finds all other `MikrotikUser`s who are linked to the same `station`. It checks the live status and account status for each neighbor.
    - **Output:** A step containing a table of all users on the same CPE.

---

## 6. Scenario B: Apartment-Based Diagnostic

This path is executed if the user has an `apartment_house_number`, but no `station` linked.

1.  **Neighbor Analysis (Apartment-Based):**
    - **Action:** Finds all other `MikrotikUser`s who have the exact same `apartment_house_number`. It checks the live status and account status for each neighbor.
    - **Output:** A step containing a table of all users in the same apartment/house.

---

## 7. Scenario C: Hybrid Diagnostic (CPE + Apartment)

This is the default and most comprehensive path, executed if the user has **both** a `station` and an `apartment_house_number`.

1.  **CPE & AP Checks:**
    - **Action:** Executes the **CPE Check** and **AP Check** steps from Scenario A.

2.  **Dual Neighbor Analysis:**
    - **Action:** Performs **both** the Station-Based Neighbor Analysis (from Scenario A) and the Apartment-Based Neighbor Analysis (from Scenario B).
    - **Output:** Two separate steps are added to the log, one with the CPE neighbor table and one with the apartment neighbor table.

---

## 8. Neighbor Analysis Table Format

The neighbor analysis results will be presented in a table with the following structure:

| User (Official Name) | Live Status | Account Status | Reason for Offline |
| :--- | :--- | :--- | :--- |
| Jane Doe | `Online` | `Active` | N/A |
| John Smith | `Offline` | `Expired` | Account expired on 2025-10-01 |
| Peter Jones | `Offline` | `Active` | Network/Hardware Issue |

- **Reason for Offline:** This column provides immediate context. If a user is offline, it will first check their account status. If the account is expired, that is listed as the reason. Otherwise, it is assumed to be a technical issue.

## 9. API Response

The API will return a `DiagnosticLog` object. The `finalConclusion` field will **no longer be generated**. Instead, the frontend will display the detailed `steps` array, allowing the administrator to interpret the results.

```json
{
  "_id": "635f...",
  "user": "635f... (Admin User ID)",
  "mikrotikUser": "635f... (Target User ID)",
  "createdAt": "2025-10-08T12:00:00.000Z",
  "steps": [
    {
      "stepName": "Billing Check",
      "status": "Success",
      "summary": "Client account is active."
    },
    {
      "stepName": "Mikrotik Router Check",
      "status": "Success",
      "summary": "Router "Core-Router-1" (192.168.1.1) is online."
    },
    {
      "stepName": "CPE Check",
      "status": "Success",
      "summary": "The client's CPE "CPE-Jane-Doe" (10.10.10.5) is online."
    },
    {
      "stepName": "Neighbor Analysis (Apartment-Based)",
      "status": "Success",
      "summary": "Found 3 other users in the same apartment.",
      "details": {
        "neighbors": [
          { "name": "John Smith", "isOnline": false, "accountStatus": "Expired", "reason": "Account expired on..." },
          { "name": "Peter Jones", "isOnline": true, "accountStatus": "Active", "reason": "N/A" }
        ]
      }
    }
  ]
}
```
