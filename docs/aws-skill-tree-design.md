# AWS Skill Tree Model

Design date: 2026-09-30. Canonical data: [v2/aws.json](../v2/aws.json).

## Domain and Audience

The AWS tree models service-specific resource configuration, data operations,
permissions, integration, observation, and recovery for application engineers.
It contains 86 concept-level capabilities. It is neither an exhaustive AWS
service inventory nor a certification blueprint. A skill can exist before a
practice lab exists; its presence does not establish learner mastery or runtime
support in any learning environment.

AWS is one platform domain, like the existing Cloudflare tree. Separate trees
for each AWS service would fragment credentials, permissions, and cross-service
assessment. Service prefixes distinguish capabilities within the flat model.

The initial review considered object storage, traditional web applications,
Serverless APIs, asynchronous processing, containers, and selected data and AI
integrations. These scenarios test coverage; their lesson order and delivery
status do not determine canonical skill identities.

## Granularity and Boundaries

Each record names a reusable leaf capability. For example, S3 version management
includes version IDs, delete markers, recovery, and historical deletion because
these operations share one versioned object model. Synchronization is separate:
it assesses reconciliation and deletion scope across a collection of objects.
Neither individual CLI commands nor a broad S3 management parent are added.

Important distinctions:

- Resource identity, CLI configuration, resource querying, and tagging assess
  different outcomes. Merely running an AWS command does not evidence all four.
- IAM identity policies describe permissions attached to identities; resource
  policies describe permissions attached to resources. Role assumption describes
  trust and temporary sessions. Access diagnosis assesses tracing a failed
  request, rather than another permission syntax level.
- S3 access settings describe Object Ownership, ACL behavior, and Block Public
  Access. Bucket policy authoring maps to resource policies. Presigned access
  describes signed request delegation, not a second general permission model.
- Service role integration assesses the service's attachment or permission
  mechanism: EC2 instance profiles, Lambda execution/invocation permissions, and
  ECS task/execution roles. Generic role trust and STS sessions remain IAM skills.
- ALB routing and target health are distinct. Auto Scaling capacity describes
  group membership and replacement; scaling policies describe triggered changes.
- CloudFormation templates describe resource declarations and references; stack
  lifecycle describes creation, deletion, and retention; updates describe change
  review, replacement impact, and recovery from update failures.
- Cognito configuration and authentication are separate from API Gateway JWT
  authorization. CORS governs browser access behavior and is not authentication.
- Glue catalog tables and partitions describe discovery metadata. Athena query
  execution describes service orchestration and result handling, not SQL syntax.

The JSON has only the fields permitted by the repository schema. Capability
areas in this document are review aids, not parent skills or JSON grouping fields.
Array order places related capabilities together and is not a prerequisite graph.
Identifiers use lowercase snake_case concepts and contain no course numbers,
commands, difficulty levels, runtime versions, or assessment status.

## Cross-Domain Assessment

Use additional trees only for capabilities explicitly taught or assessed:

| Capability | Appropriate tree |
| --- | --- |
| Python handlers, exceptions, and data structures | Python |
| SQL schema, joins, aggregation, and database user privileges | PostgreSQL or another applicable database tree |
| Docker image building and container mechanics | Docker |
| Shell quoting, variables, and command composition | Shell |
| Linux processes, filesystems, and host network configuration | Linux |
| General authentication, cryptography, and threat analysis | Cybersecurity |

ECR repository access and image publication are AWS capabilities; Dockerfile
authoring is a Docker capability. ElastiCache provisioning and secure connectivity
are AWS capabilities; key operations, expiration algorithms, and cache-aside
application logic require evidence in the appropriate data or programming domain.
Bedrock model invocation is AWS API integration, not generic prompt engineering,
model training, or application output validation.

## Coverage Review

The following areas cover the initial application scenarios. Each row refers to
existing leaf records; no row itself becomes a skill.

| Area | Skills | Example assessment evidence |
| --- | ---: | --- |
| Resource operation | 4 | Query the intended resource in the selected scope and preserve unrelated resources |
| S3 | 8 | Transfer bytes, organize objects, synchronize a prefix, or recover a version |
| IAM and resource policies | 5 | Required access succeeds while an out-of-scope request is denied |
| VPC | 6 | Intended paths connect and excluded traffic remains denied |
| EC2 and EBS | 5 | Workloads follow instance state and restored volumes contain expected data |
| ALB and Auto Scaling | 4 | Requests reach intended targets and capacity follows configured controls |
| RDS | 3 | Applications connect to the intended instance and recovered data is usable |
| KMS, secrets, parameters, and WAF | 5 | Authorized use succeeds without secret disclosure and prohibited requests fail |
| CloudWatch and CloudTrail | 4 | Logs, metrics, alarm transitions, or audit events correspond to actual operations |
| CloudFormation | 3 | Template operations produce expected resource changes and retention behavior |
| DynamoDB | 5 | Key queries and indexes select intended items and conditional writes protect state |
| Lambda | 6 | Deployed code executes, service permissions constrain access, and aliases select versions |
| HTTP API and Cognito | 5 | HTTP requests reach backends and authentication/authorization reject invalid access |
| SQS, SNS, EventBridge, and Step Functions | 7 | Delivery, routing, redelivery, and recovery produce observable processing outcomes |
| Route 53, CloudFront, and ACM | 4 | DNS, origin restrictions, cache behavior, or certificate integration work as configured |
| ECR and ECS | 5 | Published images run as intended tasks and service releases can be restored |
| EFS and ElastiCache | 3 | Intended clients connect under configured access boundaries |
| Glue and Athena | 3 | Cataloged files and partitions produce the expected query results |
| Bedrock | 1 | A supported runtime request invokes a model and handles service failures |
| Total | 86 | Evidence is attached to individual capabilities, not the entire area |

Integrated web, API, asynchronous, and container projects reuse these skills.
There are no project completion skills. Cloud economics, shared responsibility,
support plans, and broad service selection remain curriculum topics unless a
future addition defines a specific reusable capability with practical assessment.
Specialist account governance, enterprise networking, Kubernetes, full data
platforms, and model training are outside this initial tree's application scope.

## Evidence Limits and Semantic Review

Descriptions express AWS capabilities, independently of lab infrastructure.
An environment that supports only a subset can provide evidence only for that
subset. Setup-only actions, incidental tools, and stored configuration do not
establish functional mastery. Configuration-focused steps can evidence a skill's
configuration component without demonstrating its execution or recovery aspects.

Review examples for the existing S3 scenarios:

- File transfer exercises provide S3 object management evidence.
- Keys, prefixes, content types, and metadata provide S3 object organization evidence.
- Directory publication and scoped mirroring provide S3 synchronization evidence.
- Version recovery and historical cleanup provide S3 version management evidence.

These are coverage examples, not final step bindings. Final bindings require
reading each step and assessment. The binding tool has a separate offline catalog;
adding this file does not update that snapshot or existing lab metadata.

Semantic checks used AWS primary documentation:

- [IAM policy evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html): explicit denial and policy interactions must not be reduced to a universal union of allows.
- [HTTP API JWT authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html): issuer, audience or client identifier, validity claims, and route scopes have distinct checks; valid identity alone does not establish business-record ownership.
- [DynamoDB TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html): application expiration handling must account for asynchronous deletion.
- [EFS access points](https://docs.aws.amazon.com/efs/latest/ug/efs-access-points.html): path and POSIX identity settings operate with file system and IAM controls, rather than replacing all access policy.

## Maintenance and Integration

English names and complete-sentence descriptions are canonical. Every skill has
localized names and descriptions for `zh`, `es`, `fr`, `de`, `ja`, `ru`, `ko`, and
`pt`. English is not duplicated inside `i18n`; the existing fallback behavior
remains available for future missing translations. Existing badge rendering uses
the LabEx icon fallback when a tree-specific icon is absent.

Catalog discovery reads `v2/*.json`; no API registry change is needed. Generated
catalogs remain generated artifacts. Before release, run `npm run validate` and
`npm run build`, check the actual catalog totals, and inspect the diff for
identifier mismatches and unintended changes.

Future edits should improve names or descriptions without renaming identifiers
when the capability boundary is unchanged. New services need the same evidence,
granularity, and cross-domain review. Splitting or merging a published capability
requires an explicit downstream binding and progress migration plan.

## Initial Validation Record

On 2026-09-30, the final data passed repository validation, catalog and icon
generation, TypeScript checking through `npm run build`, and `git diff --check`.
Additional checks confirmed unique names, lowercase identifiers, sentence-form
descriptions, local document links, and 28 trees with 1,302 skills in the catalog.

An in-memory bundle of the actual Worker handler passed requests for the summary,
AWS detail, all nine locale routes with English fallback, conditional ETag
responses, the tree badge, all 86 generated skill badge paths, and a badge HEAD
request. These are local handler checks, not a deployed Worker or public API test.

The validation environment used Node.js 26.10.0, TypeScript 5.5.4, Wrangler
4.104.0, and workers-types 4.20260702.1. Dependencies were installed locally
without changing package declarations or adding a lockfile. Unconstrained
installation encountered an existing dependency-range conflict between newer
Wrangler releases and the declared workers-types major. The compatible local
toolchain also reported four high-severity dependency audit entries through
Wrangler/Miniflare, sharp, and undici. Toolchain dependency maintenance remains a
separate release concern; passing model checks does not establish deployment
security. This change does not publish the API or refresh downstream lab bindings.

## Follow-up Review and Localization

On 2026-09-30, a further review retained all 86 identifiers and their order and
refined five English records before translation:

- S3 object management names multipart uploads explicitly.
- Both Auto Scaling records identify EC2 as their service boundary.
- CloudFront origins specifies path-based origin selection, separating origin
  routing from the cache policy capability.
- DynamoDB TTL specifies Unix timestamps in seconds while retaining asynchronous
  deletion and application-side expiration handling.

All eight supported locales now have both fields for every skill: 688 localized
records. Descriptions were authored against the revised English definitions and
reviewed for scope, service terminology, and natural expression. Product names,
API type identifiers such as `String` and `SecureString`, and technical acronyms
remain recognizable. Translations do not add lesson instructions, difficulty,
completion claims, or new capability boundaries.

The terminology review specifically distinguishes identities from credentials,
authentication from authorization, role assumption from session permissions,
volume attachment from filesystem mounting, instance stop/start from termination,
task roles from execution roles, and lifecycle rules from executed actions.
TTL retains seconds and asynchronous deletion in every locale. Prefixes remain
distinct from directories, and CORS remains distinct from authorization.

Structural checks cover locale completeness, allowed fields, unique localized
names, sentence punctuation, encoding, stable key/order preservation, and retained
technical identifiers. API and badge checks compare localized output against the
source data; build validation cannot by itself judge linguistic quality.

The localized data passed `npm run build` and `git diff --check`. Local Worker
handler checks exercised every skill in English and all eight translations:
774 name/description comparisons and corresponding skill badge responses. All
nine language routes passed ETag and HEAD checks; 16 translated light/dark earned
badge variants, the summary count, and the AWS tree badge also passed. These
checks cover local response generation, not public deployment or font rendering
in every browser.
