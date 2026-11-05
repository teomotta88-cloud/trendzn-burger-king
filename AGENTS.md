# Project rules

- Use the router's exported props for route error boundaries so upgrades preserve compatibility.
- Manage application schema through Cloud migrations and regenerate client types rather than manually declaring missing tables.
- Define leaf-page metadata through the shared pageMetadata helper to keep each page's title and social preview consistent.