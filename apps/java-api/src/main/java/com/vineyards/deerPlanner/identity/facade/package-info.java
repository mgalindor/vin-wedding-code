// The package is the public surface of the identity module — what other Spring Modulith
// modules are allowed to import. The directory is `facade/` (deliberately not `public/`:
// `public` is a Java reserved word) but the Modulith named interface below keeps the
// logical name as "public" so cross-module references and the `moduliths.verify()` rules
// read the same as in `backend-java-blueprint.md` §3 / §4.
@org.springframework.modulith.NamedInterface("public")
package com.vineyards.deerPlanner.identity.facade;
