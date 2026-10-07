# Deer Planner API

Deer Planner is  an event planner software, built with Spring Boot 4 and
organized as a modular monolith (Spring Modulith) using hexagonal architecture per module.

## Tech stack

- **Java 21** + **Spring Boot 4.1.1**
- **Spring Modulith** — business modules with explicit boundaries
- **Spring Data JPA** + **PostgreSQL** + **Liquibase** (migrations)
- **Spring Security** + **OAuth2 Resource Server** (JWT, RSA)
- **springdoc-openapi** — OpenAPI/Swagger UI documentation
- **MapStruct** + **Lombok**
- **Spotless** (Google Java Format) — automatic formatting during the build
- **ArchUnit** + **jMolecules** — hexagonal architecture rule verification
- Optional native build via **GraalVM native-maven-plugin**

## Prerequisites

- JDK 21
- Maven (or use the included wrapper `./mvnw` / `mvnw.cmd`)
- Docker (to run PostgreSQL locally)
- **Node.js** (npm/npx) — required as the runtime to run the API test suite via the Bruno CLI
- **Bruno CLI** (`@usebruno/cli`) — used to execute the end-to-end API tests

## Running locally

1. Start the database:
   ```bash
   docker compose up -d postgres
   ```
   (see `docker-compose.yml` at the repo root — exposes Postgres 17 on `localhost:5432`,
   with DB/user/password `deer_planner`).

2. Run the application with the `local` profile:
   ```bash
   ./mvnw spring-boot:run -Dspring-boot.run.profiles=local
   ```
   The API is available at `http://localhost:8080`.

3. On first boot, an `admin@deer` user is created with a random temporary password, printed
   once to the `WARN` log. Change it as soon as possible via `PUT /oauth/user/password`.

The local configuration (`application-local.properties`) includes DB connection data and the
JWT (RSA) keys used only for development. **Do not reuse these keys in production.**

## Testing

The test strategy has four levels:

1. **Architecture tests** — ArchUnit / jMolecules rules that validate the hexagonal layer
   boundaries between modules. They run first and act as a guardrail to preserve good practices
   and code organization, preventing highly coupled or spaghetti code.
2. **Unit tests** — verify the correctness of application/domain services in isolation
   (JUnit 5, Mockito), without a Spring context.
3. **Integration tests (slice tests)** — verify inbound/outbound adapters using Spring Boot's
   slicing annotations: `@WebMvcTest` for REST controllers (`inbound/`) and `@DataJpaTest` for
   JPA repositories (`outbound/`), plus in-memory H2 for the persistence slices.
4. **End-to-end API tests** — exercise the fully running service against real infrastructure
   dependencies (PostgreSQL) started with Docker locally, driven by the **Bruno** REST client.

### Java architecture / unit / integration tests

```bash
./mvnw test
```

Runs the ArchUnit architecture tests, unit tests, and slice tests (`@WebMvcTest`,
`@DataJpaTest`) together.

### End-to-end API tests (Bruno)

`src/requests/` contains a **Bruno** collection with end-to-end tests covering the whole REST
surface (auth, users, events, guests, RSVP, etc.), run against the live service with its
infrastructure dependencies (PostgreSQL) up in Docker. Running it requires **Node.js** as the
supporting runtime and the **Bruno CLI** to execute the requests.

Install the Bruno CLI (once), or run it on demand via `npx` without a global install:
```bash
npm install -g @usebruno/cli
```

Make sure the Java backend is running locally on `http://localhost:8080` (see "Running locally"
above), then from the `apps/java-api` directory:

```bash
# Run the whole collection against the "local" environment
bru run src/requests --env local

# Run a single folder
bru run src/requests/auth --env local
bru run src/requests/events --env local

# Run a single request
bru run src/requests/auth/00-login.bru --env local

# CI-friendly output (JUnit XML report)
bru run src/requests --env local --output results.xml --format junit

# Without a global install, using npx
npx @usebruno/cli run src/requests --env local
```

See `src/requests/README.md` for full details on collection structure, variable sharing between
requests, and conventions.

## Build and code formatting

```bash
./mvnw clean package
```

Spotless (Google Java Format) is applied automatically during the `compile` phase; run
`./mvnw spotless:apply` if you need to format manually before compiling.

A native executable can also be generated with GraalVM:
```bash
./mvnw -Pnative native:compile
```
## Architecture

The API is organized as a modular monolith with explicit module boundaries, each following a hexagonal architecture. The main modules are:

- `events` — events/weddings
- `guests` — guests and guest groups
- `identity` — users, authentication
- `invitation` — invitation configuration (RSVP)
- `shared` — cross-cutting configuration (security, persistence, exceptions, properties, web)

Each module follows the same hexagonal layout:

```
<module>/
├── domain/       # model and business rules
├── application/  # use cases / application services
├── inbound/      # inbound adapters (REST controllers)
├── outbound/     # outbound adapters (repositories, clients)
└── facade/       # public ports exposed to other modules
```