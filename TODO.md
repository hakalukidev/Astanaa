- [x] Confirm data flow: admin create (addDoc) generates Firestore doc id; public uses params.slug as doc id.
- [x] Implement fix: align admin create slug/id with public route expectation.
  - [x] Option chosen: Make admin POST use title-slug as Firestore document id (setDoc/doc), not addDoc.
  - [x] POST response id updated to returned `id`.
- [ ] (Optional) Handle collisions/duplicate slugs safely.
- [ ] Run build/typecheck and manually verify:
  - [ ] Create new post in /admin/blog/new
  - [ ] Immediately check it appears in /blog list and detail page works.

