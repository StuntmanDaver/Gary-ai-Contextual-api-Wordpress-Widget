# Contextual AI API Endpoints

> **All Contextual AI REST endpoints supported by Gary AI.
> Each wrapper lives in `class-contextual-ai-client.php` as a public method matching the *Operation Name* column.**

| Section                          | HTTP Verb | Path                                              | Operation Name                             | Description                     |
| -------------------------------- | --------- | ------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| **Datastores**                   |           |                                                   |                                            |                                 |
|                                  | GET       | `/datastores`                                     | `listDatastores()`                         | List all datastores             |
|                                  | POST      | `/datastores`                                     | `createDatastore($body)`                   | Create new datastore            |
|                                  | PUT       | `/datastores/{datastore_id}/reset`                | `resetDatastore($id)`                      | Clear all documents & metadata  |
|                                  | PUT       | `/datastores/{datastore_id}`                      | `updateDatastore($id,$body)`               | Update datastore attributes     |
|                                  | DELETE    | `/datastores/{datastore_id}`                      | `deleteDatastore($id)`                     | Remove datastore                |
|                                  | GET       | `/datastores/{datastore_id}`                      | `getDatastore($id)`                        | Retrieve datastore              |
| **Datastore → Documents**        |           |                                                   |                                            |                                 |
|                                  | GET       | `/datastores/{id}/documents`                      | `listDocuments($datastoreId,$params)`      | List documents                  |
|                                  | POST      | `/datastores/{id}/documents`                      | `ingestDocument($datastoreId,$file,$meta)` | Upload/ingest                   |
|                                  | GET       | `/datastores/{id}/documents/{doc_id}/metadata`    | `getDocumentMeta($ds,$doc)`                | Fetch metadata                  |
|                                  | POST      | `/datastores/{id}/documents/{doc_id}/metadata`    | `updateDocumentMeta($ds,$doc,$meta)`       | Edit metadata                   |
|                                  | DELETE    | `/datastores/{id}/documents/{doc_id}`             | `deleteDocument($ds,$doc)`                 | Delete document                 |
| **Agents**                       |           |                                                   |                                            |                                 |
|                                  | GET       | `/agents`                                         | `listAgents()`                             | List agents                     |
|                                  | POST      | `/agents`                                         | `createAgent($body)`                       | New agent                       |
|                                  | PUT       | `/agents/{agent_id}`                              | `updateAgent($id,$body)`                   | Update agent                    |
|                                  | DELETE    | `/agents/{agent_id}`                              | `deleteAgent($id)`                         | Delete agent                    |
|                                  | GET       | `/agents/{agent_id}`                              | `getAgent($id)`                            | Retrieve agent                  |
|                                  | PUT       | `/agents/{agent_id}/reset`                        | `resetAgent($id)`                          | Wipe conversation context       |
| **Agents → Query**               |           |                                                   |                                            |                                 |
|                                  | POST      | `/agents/{agent_id}/query`                        | `queryAgent($id,$prompt,$opts)`            | Send prompt                     |
|                                  | GET       | `/agents/{id}/query/{msg_id}/retrieval/info`      | `getRetrievalInfo($id,$msg)`               | Inspect RAG retrieval           |
|                                  | POST      | `/agents/{id}/feedback`                           | `feedback($id,$payload)`                   | Provide thumbs-up/down etc.     |
|                                  | GET       | `/agents/{id}/metrics`                            | `getAgentMetrics($id)`                     | Usage metrics                   |
| **Agents → Evaluate**            |           |                                                   |                                            |                                 |
|                                  | POST      | `/agents/{id}/evaluate`                           | `createEvaluation($id,$body)`              | Start eval job                  |
|                                  | GET       | `/agents/{id}/evaluate`                           | `listEvaluations($id)`                     | List jobs                       |
|                                  | GET       | `/agents/{id}/evaluate/{eval_id}`                 | `getEvaluation($id,$eval)`                 | Job metadata                    |
|                                  | POST      | `/agents/{id}/evaluate/{eval_id}/cancel`          | `cancelEvaluation($id,$eval)`              | Cancel job                      |
| **Agents → Datasets (Evaluate)** |           |                                                   |                                            |                                 |
|                                  | GET       | `/agents/{id}/datasets/evaluate`                  | `listEvalDatasets($id)`                    |                                 |
|                                  | POST      | `/agents/{id}/datasets/evaluate`                  | `createEvalDataset($id,$body)`             |                                 |
|                                  | GET       | `/agents/{id}/datasets/evaluate/{ds_id}`          | `getEvalDataset($id,$ds)`                  |                                 |
|                                  | PUT       | `/agents/{id}/datasets/evaluate/{ds_id}`          | `updateEvalDataset($id,$ds,$body)`         |                                 |
|                                  | DELETE    | `/agents/{id}/datasets/evaluate/{ds_id}`          | `deleteEvalDataset($id,$ds)`               |                                 |
|                                  | GET       | `/agents/{id}/datasets/evaluate/{ds_id}/metadata` | `getEvalDatasetMeta($id,$ds)`              |                                 |
| **Agents → Datasets (Tune)**     |           |                                                   |                                            |                                 |
|                                  | GET       | `/agents/{id}/datasets/tune`                      | `listTuneDatasets($id)`                    |                                 |
|                                  | POST      | `/agents/{id}/datasets/tune`                      | `createTuneDataset($id,$body)`             |                                 |
|                                  | GET       | `/agents/{id}/datasets/tune/{ds_id}`              | `getTuneDataset($id,$ds)`                  |                                 |
|                                  | PUT       | `/agents/{id}/datasets/tune/{ds_id}`              | `updateTuneDataset($id,$ds,$body)`         |                                 |
|                                  | DELETE    | `/agents/{id}/datasets/tune/{ds_id}`              | `deleteTuneDataset($id,$ds)`               |                                 |
|                                  | GET       | `/agents/{id}/datasets/tune/{ds_id}/metadata`     | `getTuneDatasetMeta($id,$ds)`              |                                 |
| **Agents → Tune**                |           |                                                   |                                            |                                 |
|                                  | POST      | `/agents/{id}/tune`                               | `submitTuneJob($id,$body)`                 |                                 |
|                                  | GET       | `/agents/{id}/tune`                               | `listTuneJobs($id)`                        |                                 |
|                                  | GET       | `/agents/{id}/tune/{job_id}`                      | `getTuneJob($id,$job)`                     |                                 |
|                                  | DELETE    | `/agents/{id}/tune/{job_id}`                      | `cancelTuneJob($id,$job)`                  |                                 |
|                                  | GET       | `/agents/{id}/tune/models`                        | `listTunedModels($id)`                     |                                 |
| **LMUnit**                       |           |                                                   |                                            |                                 |
|                                  | POST      | `/lmunit`                                         | `runLMUnit($body)`                         | Execute LM‐unit tests           |
| **Users**                        |           |                                                   |                                            |                                 |
|                                  | GET       | `/users`                                          | `getUsers($params)`                        |                                 |
|                                  | PUT       | `/users`                                          | `updateUser($body)`                        |                                 |
|                                  | POST      | `/users`                                          | `inviteUsers($body)`                       |                                 |
|                                  | DELETE    | `/users`                                          | `removeUsers($body)`                       |                                 |
| **Generate**                     | POST      | `/generate`                                       | `generate($body)`                          | Free-form text/image generation |
| **Rerank**                       | POST      | `/rerank`                                         | `rerank($body)`                            | Semantic reranking              |
| **Parse**                        |           |                                                   |                                            |                                 |
|                                  | POST      | `/parse`                                          | `parseFile($body)`                         |                                 |
|                                  | GET       | `/parse/jobs/{job_id}/status`                     | `getParseStatus($job)`                     |                                 |
|                                  | GET       | `/parse/jobs/{job_id}/results`                    | `getParseResults($job)`                    |                                 |
|                                  | GET       | `/parse/jobs`                                     | `listParseJobs()`                          |                                 |

---

## Implementation Notes

All endpoint methods will be implemented in the `GaryAI\ContextualAIClient` class with proper error handling, retry logic, and response validation.

### Authentication
All requests use Bearer token authentication with the Contextual AI API key.

### Error Handling
- HTTP 4xx/5xx responses are logged and re-thrown as appropriate exceptions
- Network timeouts trigger exponential backoff retry logic
- Rate limiting responses (429) are handled with appropriate delays

### Response Caching
Frequently accessed endpoints (like `listDatastores`, `getAgent`) implement intelligent caching to reduce API calls and improve performance.
