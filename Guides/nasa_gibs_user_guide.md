# AetherGIS: NASA GIBS Pipeline Guide
**Platform Version:** Production phase  
**Current Driver:** `nasa_gibs` / `film`

The AetherGIS frontend UI now structurally and physically isolates data sources, interpolation mechanisms, and sessions. This document offers a practical guide to utilizing the NASA GIBS capabilities currently live in the system.

---

## 1. Select the Data Source
Use the **Global Menu Bar** to select your incoming observation network:
*   NASA GIBS: **(Currently Active / Live)** 
*   MOSDAC / ISRO Bhuvan: *(Backend staged, Frontend scaffolding present)*

**Note on swapping sources:** If you decide to toggle your data source from NASA GIBS to MOSDAC while an active pipeline is generating data, the system will now intercept your decision. A strict confirmation UI (`<ConfirmDialog/>`) will force you to forfeit your current computation so that system resources do not spin up orphaned background nodes.

## 2. Using the DOM (Domain) Entries Selector 
Domain preset regions (the bounding box constraints) are **not hardcoded**. They are dynamically fetched from the Python pipeline layer catalogs based on the specific satellite layer:
1. Under **NASA GIBS**, choose a layer (e.g., MODIS Terra True-color). 
2. Wait for the `layerCapabilities` API sync to complete. 
3. The **Monitoring Domain** (DOM Entries) element will appear and offer the appropriate regions automatically.
4. If you stray outside of the catalog capabilities, the UI alerts you to be within safe boundaries. 

## 3. Configuring the "Theme" / AI Interpolation Model
You can toggle between different deep learning engines depending on hardware context:
*   **FILM (Frame Interpolation for Large Motion) - Primary:** Default engine utilizing Google Research technology. Relies on CUDA.
*   **RIFE 4.x:** Alternative real-time interpolation optimized for smoother fluid mechanics.
*   **Optical Flow Baseline (lk_fallback):** Hardware-agnostic fallback for machines missing Nvidia GPU architectures.
*(Note: 'DAIN' has been scrubbed from production builds as its behavior natively reverts to RIFE).*

## 4. Time Parameters & Smart Temporal Sampling
You can determine exactly how closely the AI should fill gaps.
*   The **Frames/frame** slider controls exactly how many hallucinated frames divide every two raw observation files (maximum of 8).
*   **Smart Temporal Sampling:** Automatically clamps intervals down if gap density breaches stability points (meaning `15 mins -> 30 mins -> 60 mins` steps are actively calculated to prevent extreme extrapolation).

## 5. Job Locking & Session History
Once you click **Run Pipeline**, the interface engages a safety-lock wrapper (`<fieldset disabled>`). 
*   **NO hardcoded DOM modifications exist mid-flight.**
*   All left-hand configuration layers become read-only while the progress bar handles the feedback.
*   After the progress successfully completes, the job joins your **Session Manager** cache.
*   You can utilize the unified `SessionManager.tsx` UI to switch across your previous runs, rename sessions, and batch-garbage-collect them from persistence. 

## 6. Advanced Overlays (Evaluation UI)
Upon an interpolation successfully solving, the **Advanced Overlays** panel unlocks.
*   Toggle computational artifacts directly over the video stream (Trajectories, Change Map).
*   Toggle confidence mapping overlays independently.
*   Change alpha logic on the fly without refreshing the session.
*(Note: Visual "NEW" debugging badges have been stripped for production cleanliness).*
