# Change Summary

This document summarizes modifications introduced in the latest update.

- **Metric Flags**: Metric registry now uses `useInPlanning` and `minOnly` flags loaded from the backend.
- **Admin Metric Management**: Added `AdminMetricCatalogScreen` for editing metric details and flags, linked from the admin catalog.
- **Metric CRUD Relocation**: Metric creation and deletion moved from the exercise catalog to the dedicated metric catalog screen.
- **GraphQL Updates**: Queries and mutations include `useInPlanning` and `minOnly` fields.
- **Target Metric Inputs**: Max field is hidden when the metric is `minOnly`.
- **State Reset Fix**: New metric form resets with default values for the flags.