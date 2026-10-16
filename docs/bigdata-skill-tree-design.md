# Big Data Skill Tree Model

Design date: 2026-10-16. Canonical data: [v2/bigdata.json](../v2/bigdata.json).

## Domain and Audience

The `bigdata` tree models practical data storage, batch computation, SQL analytics,
and event delivery with HDFS, MapReduce, YARN, Hive, Spark, and Kafka. It contains
40 concept-level capabilities for data engineering learners and practitioners.
It is a bounded ecosystem model, not a complete inventory of data engineering
tools or a synonym for every capability involving large datasets.

A single tree supports assessment across these closely related systems without
fragmenting the Big Data domain. Technology prefixes keep runtime-specific
semantics explicit. This is a design choice for this catalog, not a claim that
Spark or Kafka depends on Hadoop, or that learners must follow a fixed sequence.
Future additions should meet the same domain and assessability criteria rather
than following a list of popular products.

The existing 45-activity Big Data curriculum in `labex-labs/labs/bigdata` supplies
coverage scenarios: Hadoop (12 activities), Hive (10), Spark (13), and Kafka (10).
Those counts and course titles do not determine skill identities. Single-node
practice can demonstrate real APIs and data correctness, but cannot establish
distributed performance, high availability, or production fault tolerance.

## Granularity and Boundaries

Every JSON record is a leaf capability. The four areas below are review aids,
not parent records, prerequisite edges, or grouping fields in the data.

| Area | Skills | Boundary |
| --- | ---: | --- |
| Hadoop: HDFS, MapReduce, YARN | 9 | Distributed file operations, permissions, recovery, record processing, workload execution, resources, and diagnosis |
| Hive | 9 | Table metadata, serialization, relational queries, partitions, columnar storage, result writes, and data diagnosis |
| Spark | 13 | DataFrame processing, persisted datasets, execution, reusable jobs, caching, and incremental queries |
| Kafka | 9 | Topics, routing, clients, progress, groups, cleanup, delivery semantics, and transactions |
| Total | 40 | Reusable capabilities, independently assessable through practical evidence |

Important distinctions:

- HDFS file copies and block replicas are different operations. Block replication
  relates to available DataNodes, not merely the configured replication factor.
  Snapshots share filesystem infrastructure and are not independent backups.
- HDFS permissions concern Hadoop identities, traversal, permission bits, and
  ACLs. They do not establish authentication strength or general Linux privilege
  administration. Simple-authentication exercises do not evidence Kerberos.
- MapReduce record flow is the key/value computation model. Hadoop Streaming is
  the executable stdin/stdout integration, not event-stream processing. YARN
  applications concern execution state; resource allocation concerns requested
  and assigned capacity. Diagnostics requires interpreting failure evidence.
- Hive table metadata includes file ownership and lifecycle semantics, whereas
  serialization interprets bytes as rows. Storage format is separate from
  writing results. Registering a partition is distinct from creating a directory.
- Hive row queries, aggregations, and joins are separate relational capabilities.
  Group filtering is not row filtering; null keys and duplicate keys affect join
  results. These records refer to Hive execution, not PostgreSQL administration.
- Spark schemas describe typed input; nested data describes structural access;
  column expressions describe row-level computation. Data quality requires
  explicit acceptance or rejection rules, not incidental filtering alone.
- Spark SQL/views concerns query registration and object lifetime. Relational
  aggregation and join skills apply whether expressed through SQL or DataFrames;
  rewriting a query in SQL does not create a second aggregation capability.
- Spark Parquet datasets concerns durable files and directory partitioning.
  Computation partitions concerns tasks, shuffle, repartitioning, and coalescing.
  Execution plans describes observing planned and triggered work, while caching
  describes controlling reuse. Cache persistence is not durable dataset storage.
- Kafka record keys route records; they are not inherently unique event IDs.
  Ordering and offsets are partition-local. Topic administration and partition
  metadata are separate from retention and keyed compaction policy.
- Producer enqueueing is not broker acknowledgment. Consumer polling is separate
  from committing progress, and reading does not delete retained events.
- Consumer groups concern assignments, lag, and rebalances. Offsets/replay concern
  positions and committed next offsets. Delivery semantics concerns the ordering
  of processing, external effects, and commits under failure.
- Kafka transactions can coordinate Kafka records and consumer offsets, but do
  not atomically include arbitrary external file writes. Spark streaming recovery
  also depends on the source, sink, checkpoint, and query behavior; there is no
  unconditional end-to-end exactly-once promise.

## Cross-Domain Assessment

Bind additional trees only when a step explicitly teaches or assesses them:

| Capability | Appropriate tree |
| --- | --- |
| Python functions, dictionaries, exceptions, JSON encoding, file I/O | Python |
| Shell quoting, pipelines, redirection, script control flow | Shell |
| Terminal sessions, local permissions, services, host networking | Linux |
| PostgreSQL tables, transactions, joins, and query plans | PostgreSQL |
| AWS S3 objects, Glue metadata, and Athena execution | AWS |
| Docker images and containers; Kubernetes workload deployment | Docker; Kubernetes |
| General cryptography, authentication, and threat analysis | Cybersecurity |

Python JSON parsing does not by itself demonstrate Kafka consumption. Running
`spark-submit` does not by itself demonstrate DataFrame joins or SQL views.
HDFS permissions must not be inferred from a local `chmod`. SQL written for Hive
does not establish competence in another database's dialect and runtime.

Cluster provisioning, HA, Kerberos, enterprise governance, orchestration systems,
ML training, and unrelated specialist storage systems are outside this initial
application-focused model. Broader coverage can be added later with explicit
capability boundaries and assessment scenarios.

## Curriculum Evidence and Extension Scenarios

The current curriculum offers candidate evidence for 33 skills. This does not
mean full mastery of every component of their descriptions. Seven additional
capabilities are deliberately independent of the current course inventory:

| Additional skill | Example future assessment |
| --- | --- |
| `hdfs_snapshots` | Restore selected files from a snapshot and verify unrelated current files remain intact |
| `hadoop_streaming` | Connect executable mapper/reducer programs, distribute their dependencies, and verify grouped output |
| `yarn_resource_allocation` | Explain a pending allocation using queue capacity and requests, then correct the request and verify execution |
| `spark_computation_partitions` | Compare repartition/coalesce plans and task behavior while preserving logical records |
| `spark_caching` | Materialize and reuse a dataset, verify reuse, release it, and observe recomputation |
| `spark_structured_streaming` | Process incremental inputs, test late-event handling, and resume the same query from a compatible checkpoint |
| `kafka_transactions` | Abort and commit Kafka output with offsets and verify isolation through a consumer |

Current-course evidence has narrower limits in several places:

- The Map/Shuffle/Reduce activity traces records through a supplied teaching tool;
  it does not prove that the learner implemented a mapper or reducer.
- The YARN course submits a supplied WordCount JAR. It does not demonstrate
  Hadoop Streaming, application authoring, scheduler administration, or capacity
  tuning. Completed job state also does not establish correct business results.
- The HDFS course practices permission bits and traversal, not ACL authoring or
  snapshot recovery. A single DataNode cannot demonstrate replica failover.
- Hive practices external tables and ORC results. Managed-table lifecycle,
  Parquet behavior, or compression tuning require their own evidence.
- The Spark course uses local execution and batch DataFrames. Merely mentioning
  computation partitions does not demonstrate repartitioning or coalescing.
- Kafka retention configuration is not evidence of executing compaction or
  tombstone cleanup. Inspecting replica metadata does not test replicated failover.
- The Kafka file-sink failure exercise demonstrates redelivery around separate
  writes and commits, not transactional or idempotent external recovery. A file
  flush is not a power-loss durability guarantee.

These are review constraints, not final step bindings. This change does not edit
lab `skills_v2` metadata, the binding skill's offline catalog snapshot, or course
configuration. Binding requires reading each step and its verification evidence.

## Semantic Sources

Definitions were checked against Apache primary documentation:

- [HDFS architecture](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsDesign.html): namespace, block placement, and replication.
- [HDFS snapshots](https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-hdfs/HdfsSnapshots.html): read-only filesystem views and recovery operations.
- [YARN architecture](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html): applications, containers, and resource management.
- [Hive user manual](https://hive.apache.org/docs/latest/user/): tables, serialization, queries, partitions, and storage formats.
- [Spark SQL and DataFrames](https://spark.apache.org/docs/latest/sql-programming-guide.html): structured processing and SQL/DataFrame integration.
- [Spark Structured Streaming](https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html): incremental queries, output modes, watermarks, and recovery limits.
- [Kafka design](https://kafka.apache.org/43/design/design/): partition-local ordering, offsets, delivery semantics, transactions, and compaction.

Identifiers contain no software versions, course numbers, exercise names, or
difficulty levels. Documentation versions clarify semantics rather than pinning
the skill model to the teaching VM's installed versions.

## Localization and Integration

English names and descriptions are canonical. Every skill includes manually
authored names and descriptions for `zh`, `es`, `fr`, `de`, `ja`, `ru`, `ko`, and
`pt`: 320 localized records. Product identifiers remain recognizable, and each
translation retains the English capability boundary. No translation API or
translation tool is used.

The catalog discovers `v2/*.json`, so no API registry change is needed. Existing
badge rendering supplies the LabEx fallback icon when a dedicated icon is absent.
Generated catalog files remain ignored build artifacts. The legacy `v1` dataset
and all existing skill identifiers remain unchanged.

Before release, run `npm run validate` and `npm run build`, verify locale
completeness and unique identifiers, and exercise local API discovery, detail,
localized responses, and badge generation. The resulting catalog should contain
29 trees and 1,342 skills. Local checks do not publish or deploy the API.

## Initial Validation Record

On 2026-10-16, repository validation, catalog and icon generation, and TypeScript
checking passed through `npm run build`. Separate checks passed the Draft 2020-12
JSON Schema, unique skill and localized names, complete eight-locale coverage,
sentence endings, encoding, and local documentation links.

An in-memory bundle of the actual Worker handler passed summary discovery,
canonical detail, and all nine language detail routes. All 360 skill-language
pairs matched their source names and descriptions and returned SVG badges with
the expected labels. Each language route passed conditional ETag and HEAD checks;
the tree badge passed light and dark theme checks using the existing icon fallback.
These are local response-generation checks, not a deployed API or browser font
rendering test. No lab bindings or offline skill catalogs were changed.
