# HealthLink Hub

Build SWASTHYASETU, a polished Smart India Hackathon healthcare web application prototype.

Architecture & State:
- LocalStorage-backed centralized React state with canonical demo patient: Rahul Sharma (42M, O+, Kannada, ID: SS-10024, Conditions: Diabetes, Hypertension; Allergy: Penicillin; Medications: Metformin, Amlodipine; Surgery: Appendectomy 2023; Emergency Contact: Priya Sharma).
- All screens read and mutate this shared state.
- No backend or paid APIs needed; simulated ABDM consent flows, offline sync queue, and audit logs.

Routes & Views:
1. `/`: Role selection & platform overview (Patient, Doctor, Emergency Responder, Judge/Demo guide).
2. `/patient`: Patient health dashboard (vitals, upcoming visits, health score, quick actions).
3. `/patient/history`: Medical timeline, past diagnoses, immunization, surgical history.
4. `/patient/documents`: Lab reports, prescription records, radiology files with preview modals and upload simulator.
5. `/patient/emergency-profile`: Critical health card, downloadable/printable emergency QR summary, vital alerts.
6. `/doctor`: Doctor workspace, OPD patient queue, search by ABHA/Patient ID.
7. `/doctor/patient`: Clinical patient summary, longitudinal charts, allergies, clinical notes.
8. `/doctor/consultation`: Active consultation screen to record vitals, write digital prescriptions, add lab orders, and update diagnosis in real time.
9. `/emergency`: Emergency triage portal with 1-click critical medical lookup, allergen alerts, blood group verification, emergency contact dial/SMS simulator.
10. `/emergency/log`: Tamper-evident audit log of emergency data requests and override accesses.
11. `/consent`: ABDM-style consent manager (pending requests, active consents, revoke access, granular data-sharing controls).
12. `/offline`: Offline caching simulator, sync queue manager, network toggle simulation.
13. `/architecture`: Interactive architecture blueprint and data flow diagram for SIH presentation.
14. `/scenarios`: Step-by-step interactive 5-minute demo script switcher for hackathon judges.

Design & UI:
- Reusable professional clinical application shell: clean sidebar navigation, top header with role switch & notification center, page headers, status badges, interactive dialogs, and toast notifications.
- Professional hospital software visual theme: crisp white and cool-gray background, healthcare blue & teal accents, subtle borders and shadows, clear typography, responsive layouts.
- Every visible button and control must be interactive and functional.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d171efb2-5fcb-43ed-a664-c15ec9937c1e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
